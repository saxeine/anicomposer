const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
);

const baseURL = process.env.STUDIO_TEST_URL || "http://127.0.0.1:3000";
const artifacts =
  process.env.STUDIO_TEST_ARTIFACTS || "/tmp/letterform-browser-artifacts";

async function waitForTheme(page, theme) {
  await page.waitForFunction(
    (expected) =>
      document.querySelector(".studio-app")?.getAttribute("data-theme") ===
      expected,
    theme,
  );
}

(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [];
  let cleanupId;
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    colorScheme: "light",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await waitForTheme(page, "light");
    const originalStage = await page
      .locator(".stage-surface")
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    await page.getByRole("switch", { name: "Switch to dark mode" }).click();
    await waitForTheme(page, "dark");
    assert.equal(
      await page
        .locator(".left-panel")
        .evaluate((element) => getComputedStyle(element).backgroundColor),
      "rgb(29, 36, 31)",
    );
    assert.equal(
      await page
        .locator(".stage-surface")
        .evaluate((element) => getComputedStyle(element).backgroundColor),
      originalStage,
    );
    assert.equal(
      await page.evaluate(() => localStorage.getItem("letterform-theme")),
      "dark",
    );
    await page.screenshot({
      path: `${artifacts}/dark-desktop.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.reload({ waitUntil: "networkidle" });
    await waitForTheme(page, "dark");
    console.log(
      "PASS: desktop theme switch, stage-palette isolation, and reload persistence",
    );

    await page.getByRole("button", { name: "Export", exact: true }).click();
    const exportDialog = page.getByRole("dialog", {
      name: "Take your words with you.",
    });
    await exportDialog.waitFor();
    assert.equal(
      await exportDialog.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
      "rgb(29, 36, 31)",
    );
    await page.keyboard.press("Tab");
    assert.ok(
      await exportDialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    );
    await page.keyboard.press("Escape");
    await exportDialog.waitFor({ state: "hidden" });
    console.log(
      "PASS: themed export portal, focus containment, and Escape dismissal",
    );

    const title = `Studio theme smoke ${Date.now()}`;
    await page.getByLabel("Submission title", { exact: true }).fill(title);
    await page
      .getByLabel("Edit submission text", { exact: true })
      .fill("Theme-safe submitted words.");
    const saveResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/submissions") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    const response = await saveResponse;
    assert.equal(response.status(), 200);
    const saved = (await response.json()).submission;
    cleanupId = saved.id;
    assert.equal(saved.title, title);
    assert.equal(saved.content, "Theme-safe submitted words.");
    assert.equal(saved.settings.themeId, "paper");
    assert.equal(Object.hasOwn(saved.settings, "colorMode"), false);
    await page.locator(".nav-library").click();
    const library = page.getByRole("dialog", { name: "Submission library" });
    await library.waitFor();
    await library.getByRole("button", { name: new RegExp(`^${title}`) }).waitFor();
    assert.equal(
      await library.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
      "rgb(29, 36, 31)",
    );
    await page.keyboard.press("Escape");
    console.log("PASS: PostgreSQL save and themed submission library");

    await page.goto(`${baseURL}/examples/embedded`, {
      waitUntil: "networkidle",
    });
    await waitForTheme(page, "dark");
    assert.equal(await page.locator(".studio-embedded").count(), 1);
    assert.equal(await page.locator(".workspace-intro").count(), 0);
    await page
      .getByLabel("Submission title", { exact: true })
      .fill("My embedded piece");
    await page
      .getByLabel("Edit submission text", { exact: true })
      .fill("One two three.");
    const parentState = page.getByRole("region", {
      name: "Parent component state",
    });
    assert.match(await parentState.innerText(), /My embedded piece/);
    assert.match(await parentState.innerText(), /3\s+words/);
    assert.equal(
      await parentState.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
      "rgb(255, 254, 250)",
    );
    await page.getByRole("switch", { name: "Switch to light mode" }).click();
    await waitForTheme(page, "light");
    assert.equal(
      await page.evaluate(() => localStorage.getItem("letterform-theme")),
      "dark",
    );
    assert.equal(
      await page.evaluate(() =>
        localStorage.getItem("letterform-example-theme"),
      ),
      "light",
    );
    await page.screenshot({
      path: `${artifacts}/embedded-host.png`,
      fullPage: true,
      animations: "disabled",
    });
    console.log(
      "PASS: reusable embedded component, parent callbacks, scoped styles, and independent theme storage",
    );

    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 900 },
      colorScheme: "dark",
      isMobile: true,
      hasTouch: true,
    });
    const mobile = await mobileContext.newPage();
    mobile.on("pageerror", (error) => errors.push(error.message));
    await mobile.goto(baseURL, { waitUntil: "networkidle" });
    await waitForTheme(mobile, "dark");
    assert.ok(
      await mobile.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    await mobile.screenshot({
      path: `${artifacts}/dark-mobile.png`,
      fullPage: true,
      animations: "disabled",
    });
    await mobile.getByRole("switch", { name: "Switch to light mode" }).click();
    await waitForTheme(mobile, "light");
    await mobileContext.close();
    console.log(
      "PASS: system dark preference and responsive mobile layout without horizontal overflow",
    );

    const blockedContext = await browser.newContext({ colorScheme: "light" });
    await blockedContext.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("Storage blocked", "SecurityError");
        },
      });
    });
    const blockedPage = await blockedContext.newPage();
    blockedPage.on("pageerror", (error) => errors.push(error.message));
    await blockedPage.goto(baseURL, { waitUntil: "networkidle" });
    await waitForTheme(blockedPage, "light");
    await blockedPage
      .getByRole("switch", { name: "Switch to dark mode" })
      .click();
    await waitForTheme(blockedPage, "dark");
    await blockedContext.close();
    console.log("PASS: theme switching with browser storage disabled");
    assert.deepEqual(errors, []);
    console.log(
      "All studio browser smoke checks passed; no client-side exceptions.",
    );
  } finally {
    if (cleanupId)
      await context.request.delete(`${baseURL}/api/submissions/${cleanupId}`);
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
