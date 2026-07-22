const { chromium } = require("playwright-core");
const assert = require("node:assert/strict");

const executablePath = "/home/zjq/.cache/ms-playwright/chromium-1187/chrome-linux/chrome";
const baseURL = process.env.SITE_URL || "http://127.0.0.1:4173";

async function checkPage(browser, viewport, screenshotPath) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.locator(".job-card").first().waitFor();
  assert.equal(await page.locator(".job-card").count(), 30);
  assert.equal(await page.locator("#displayed-stat").textContent(), "30");

  await page.locator("#tier-segments button").filter({ hasText: "A ·" }).click();
  assert.equal(await page.locator(".job-card").count(), 9);
  await page.locator("#reset-button").click();

  await page.locator("#search-input").fill("淘宝闪购");
  assert.equal(await page.locator(".job-card").count(), 1);
  await page.locator(".detail-toggle").click();
  assert.equal(await page.locator(".job-detail").isVisible(), true);
  await page.locator(".save-button").click();
  assert.equal(await page.locator(".save-button").getAttribute("aria-label"), "取消收藏");
  await page.locator("#theme-button").click();

  const layout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    offenders: [...document.querySelectorAll("body *")]
      .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .slice(0, 8)
      .map((element) => `${element.tagName.toLowerCase()}.${element.className}`),
  }));
  assert.ok(layout.overflow <= 1, `horizontal overflow: ${layout.overflow}px (${layout.offenders.join(", ")})`);
  assert.deepEqual(errors, []);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await page.close();
}

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    await checkPage(browser, { width: 1440, height: 1000 }, "/tmp/recruitment-desktop.png");
    await checkPage(browser, { width: 390, height: 844 }, "/tmp/recruitment-mobile.png");
    console.log("Site checks passed for desktop and mobile viewports.");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
