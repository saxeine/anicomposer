const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const postcss = require("postcss");

// Test the actual TypeScript modules using the project's installed compiler.
// No extra test framework, browser, or application server is required.
const componentRoot = path.resolve(__dirname, "../src/components/text-studio");
const compile = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  module._compile(outputText, filename);
};
require.extensions[".ts"] = compile;
require.extensions[".tsx"] = compile;
require.extensions[".css"] = () => {};

const {
  makeInitialEditor,
  poseAt,
  easeProgress,
  revealProgress,
  makeLayerKeyframe,
  restoreEditorSettings,
} = require(path.join(componentRoot, "animation.ts"));
const { createHttpSubmissionAdapter } = require(
  path.join(componentRoot, "submission-service.ts"),
);
const { TextSubmissionStudio, TextStudioProvider, useTextStudio } = require(
  path.join(componentRoot, "index.ts"),
);

function renderStudio(props = {}) {
  return renderToStaticMarkup(
    React.createElement(TextSubmissionStudio, { embedded: true, ...props }),
  );
}

test("the public module renders the complete studio independently of app routes", () => {
  const html = renderStudio({ defaultTheme: "dark" });
  assert.match(html, /data-theme="dark"/);
  assert.match(html, /studio-embedded/);
  assert.match(html, /aria-label="Switch to light mode"/);
  assert.match(html, /aria-checked="true"/);
  assert.match(html, /Your submission/);
  assert.match(html, /Text animation timeline/);
  assert.match(html, /Inspector/);
  assert.doesNotMatch(html, /Give your words a little/);
});

test("the full-page component includes its intro while embedded mode omits it", () => {
  const html = renderToStaticMarkup(
    React.createElement(TextSubmissionStudio, { theme: "light" }),
  );
  assert.match(html, /Give your words a little/);
  assert.match(html, /data-theme="light"/);
  assert.match(html, /Switch to dark mode/);
});

test("controlled and system themes render without browser globals or hydration-only state", () => {
  assert.match(
    renderStudio({ defaultTheme: "dark", theme: "light" }),
    /data-theme="light"/,
  );
  assert.match(renderStudio({ defaultTheme: "system" }), /data-theme="light"/);
});

test("multiple embedded studios have independent themes and unique input IDs", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(TextSubmissionStudio, {
        embedded: true,
        theme: "dark",
      }),
      React.createElement(TextSubmissionStudio, {
        embedded: true,
        theme: "light",
      }),
    ),
  );
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(ids.length >= 14);
  assert.equal(ids.length, new Set(ids).size);
  assert.equal((html.match(/data-theme="dark"/g) || []).length, 1);
  assert.equal((html.match(/data-theme="light"/g) || []).length, 1);
});

test("custom controls can access seeded text through the exported provider and hook", () => {
  function CustomControl() {
    const { project, colorMode } = useTextStudio();
    return React.createElement(
      "output",
      null,
      `${project.title} / ${project.content} / ${colorMode}`,
    );
  }
  const html = renderToStaticMarkup(
    React.createElement(
      TextStudioProvider,
      {
        embedded: true,
        theme: "dark",
        initialSubmission: {
          title: "Parent piece",
          content: "Text from another component.",
          author: "",
        },
      },
      React.createElement(CustomControl),
    ),
  );
  assert.match(html, /Parent piece \/ Text from another component\. \/ dark/);
});

test("all component styles are scoped and both themes define readable surface tokens", () => {
  const root = postcss.parse(
    fs.readFileSync(path.join(componentRoot, "studio.css"), "utf8"),
  );
  root.walkRules((rule) => {
    let parent = rule.parent;
    while (parent) {
      if (parent.type === "atrule" && parent.name.endsWith("keyframes")) return;
      parent = parent.parent;
    }
    for (const selector of rule.selectors)
      assert.ok(selector.startsWith(".text-submission-studio"), selector);
  });
  const darkRule = root.nodes.find(
    (rule) => rule.selector === '.text-submission-studio[data-theme="dark"]',
  );
  assert.ok(darkRule);
  const tokens = Object.fromEntries(
    darkRule.nodes
      .filter((node) => node.type === "decl")
      .map((node) => [node.prop, node.value]),
  );
  assert.equal(tokens["color-scheme"], "dark");
  assert.equal(tokens["--paper"], "#151a17");
  assert.equal(tokens["--panel"], "#1d241f");
  assert.equal(tokens["--ink"], "#eeeadd");
  assert.ok(
    root.nodes.some(
      (node) => node.type === "atrule" && node.name === "container",
    ),
  );
});

test("animation interpolation and onion-frame reveal retain their behavior", () => {
  const editor = makeInitialEditor();
  assert.equal(editor.layers.length, 3);
  for (const layer of editor.layers) {
    assert.equal(poseAt(layer, 1).opacity, 0);
    assert.equal(poseAt(layer, editor.duration).opacity, 1);
    assert.equal(poseAt(layer, editor.duration).y, layer.baseY);
  }
  const text = editor.layers[1];
  assert.equal(revealProgress(text, 1), 0);
  assert.equal(revealProgress(text, 54), 1);
  assert.equal(easeProgress(0.5, "linear"), 0.5);
  assert.equal(easeProgress(0.5, "ease-in"), 0.25);
  assert.equal(easeProgress(0.5, "ease-out"), 0.75);
  assert.equal(easeProgress(0.5, "hold"), 0);
  assert.equal(easeProgress(1, "bounce"), 1);
});

test("inserting a keyframe replaces an existing moment instead of duplicating it", () => {
  const layer = makeInitialEditor().layers[0];
  const keys = makeLayerKeyframe(layer, 24, {
    x: 62,
    y: 40,
    opacity: 1,
    scale: 1.2,
  });
  assert.equal(keys.filter((key) => key.frame === 24).length, 1);
  assert.equal(keys.find((key) => key.frame === 24).x, 62);
});

test("saved text and stage palettes are independent of workspace themes", () => {
  const editor = makeInitialEditor();
  editor.themeId = "night";
  const restored = restoreEditorSettings(editor, "Content", "Author");
  assert.equal(restored.themeId, "night");
  assert.equal(restored.layers[1].text, editor.layers[1].text);
  assert.deepEqual(restored.layers[0].keyframes, editor.layers[0].keyframes);
  assert.equal(Object.hasOwn(restored, "colorMode"), false);
});

test("the HTTP adapter respects an alternate endpoint for list, save, and remove", async () => {
  const previousFetch = global.fetch;
  const requests = [];
  const saved = {
    id: "test-id",
    title: "Test",
    content: "Words",
    author: "",
    status: "draft",
    preset: "fade-up",
    settings: makeInitialEditor(),
    createdAt: "2026-10-09",
    updatedAt: "2026-10-09",
  };
  global.fetch = async (url, init = {}) => {
    requests.push({ url, init });
    return new Response(
      JSON.stringify(
        init.method === "POST"
          ? { submission: saved }
          : init.method === "DELETE"
            ? { id: "test-id" }
            : { submissions: [saved] },
      ),
      { status: 200 },
    );
  };
  try {
    const adapter = createHttpSubmissionAdapter("/host/texts/");
    assert.equal((await adapter.list())[0].title, "Test");
    assert.equal(
      (
        await adapter.save({
          title: "Test",
          content: "Words",
          author: "",
          status: "draft",
          preset: "fade-up",
          settings: makeInitialEditor(),
        })
      ).id,
      "test-id",
    );
    await adapter.remove("text/one");
    assert.deepEqual(
      requests.map((request) => request.url),
      ["/host/texts", "/host/texts", "/host/texts/text%2Fone"],
    );
    assert.equal(requests[1].init.method, "POST");
    assert.equal(requests[2].init.method, "DELETE");
  } finally {
    global.fetch = previousFetch;
  }
});

test("the HTTP adapter exposes service validation errors to the studio", async () => {
  const previousFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify({ error: "Text is required." }), {
      status: 400,
    });
  try {
    await assert.rejects(
      createHttpSubmissionAdapter().save({}),
      /Text is required/,
    );
  } finally {
    global.fetch = previousFetch;
  }
});
