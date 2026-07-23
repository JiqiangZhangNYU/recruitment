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
  const dataset = await page.evaluate(async () => (await fetch("./jobs.json")).json());
  assert.equal(await page.locator(".job-card").count(), dataset.displayedSize);
  assert.equal(await page.locator("#displayed-stat").textContent(), String(dataset.displayedSize));
  const aPlusJobs = dataset.jobs.filter((job) => job.tier === "A+");
  const aMinusJobs = dataset.jobs.filter((job) => job.tier === "A-");
  const bJobs = dataset.jobs.filter((job) => job.tier === "B");
  const cJobs = dataset.jobs.filter((job) => job.tier === "C");
  assert.ok(aPlusJobs.length > 0);
  assert.ok(aPlusJobs.every((job) => (
    job.city === "上海"
    && job.paymentBonus
    && job.majorCompany
    && !job.frequentTravel
    && job.applicationRecommended
  )));
  assert.ok(aMinusJobs.length > 0);
  assert.ok(aMinusJobs.every((job) => (
    job.city === "上海"
    && job.strategyRelevant
    && (job.paymentBonus || job.majorCompany)
    && !job.frequentTravel
    && !job.agency
    && !job.sensitive
    && job.applicationRecommended
  )));
  assert.ok(bJobs.every((job) => job.strategyRelevant && job.applicationRecommended));
  assert.ok(cJobs.length <= 10);
  assert.ok(cJobs.every((job) => !job.applicationRecommended && (job.closed || job.isReference)));

  await page.locator('.primary-nav button[data-view="skills"]').click();
  const guide = await page.evaluate(async () => (await fetch("./learning-guide.json")).json());
  assert.equal(await page.locator(".skill-card").count(), guide.skills.length);
  assert.equal(await page.locator("#skill-job-count").textContent(), String(guide.sample.totalJobs));
  assert.match(await page.locator("#skills-view").textContent(), /数据分析与业务诊断/);
  await page.locator(".skill-card").first().locator(".skill-level").selectOption("3");
  assert.equal(
    await page.locator("#skill-progress-count").textContent(),
    `1 / ${guide.skills.length} 达到 ${guide.targetLevel} 级`,
  );
  await page.locator("#hide-mastered").check();
  assert.equal(await page.locator(".skill-card").count(), guide.skills.length - 1);
  await page.locator("#hide-mastered").uncheck();
  assert.equal(await page.locator(".skill-card").count(), guide.skills.length);
  await page.locator(".skill-toggle").first().click();
  assert.equal(await page.locator(".skill-detail").first().isVisible(), true);
  assert.ok(await page.locator(".skill-detail").first().locator(".exercise-list li").count() >= 4);

  await page.locator('[data-learning-tab="roadmap"]').click();
  assert.equal(await page.locator(".week-row").count(), guide.weeks.length);
  await page.locator(".week-row").first().locator('input[type="checkbox"]').check();
  assert.match(await page.locator("#week-progress-count").textContent(), /^1 \/ 17/);

  await page.locator('[data-learning-tab="portfolio"]').click();
  assert.equal(await page.locator("#portfolio-list .checklist-item").count(), guide.portfolio.length);
  assert.equal(await page.locator("#readiness-groups .checklist-item").count(), guide.readiness.length);
  await page.locator("#portfolio-list .checklist-item").first().click();
  assert.equal(await page.locator("#portfolio-progress").textContent(), `1 / ${guide.portfolio.length}`);

  await page.locator('[data-learning-tab="map"]').click();
  const skillOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(skillOverflow <= 1, `skills horizontal overflow: ${skillOverflow}px`);
  await page.screenshot({ path: screenshotPath.replace(".png", "-skills.png"), fullPage: true });
  await page.locator('.primary-nav button[data-view="jobs"]').click();

  await page.locator("#tier-segments button").filter({ hasText: "A+ ·" }).click();
  assert.equal(await page.locator(".job-card").count(), dataset.counts["A+"]);
  await page.locator("#reset-button").click();

  await page.locator("#tier-segments button").filter({ hasText: "A- ·" }).click();
  assert.equal(await page.locator(".job-card").count(), dataset.counts["A-"]);
  await page.locator("#reset-button").click();

  await page.locator("#tier-segments button").filter({ hasText: "C ·" }).click();
  assert.equal(await page.locator(".job-card").count(), dataset.counts.C);
  if (dataset.counts.C) {
    assert.match(await page.locator(".job-card").first().textContent(), /不建议投递/);
    assert.equal(await page.locator(".job-card").first().locator(".save-button").isHidden(), true);
  }
  await page.locator("#reset-button").click();

  await page.locator("#bonus-select").selectOption("reference");
  const references = dataset.jobs.filter((job) => job.isReference);
  assert.equal(await page.locator(".job-card").count(), references.length);
  assert.equal(
    await page.locator(".job-card.closed").count(),
    references.filter((job) => job.closed).length,
  );
  if (references.some((job) => job.closed)) {
    assert.match(await page.locator(".job-card.closed").first().textContent(), /职位已关闭/);
  }
  await page.locator("#reset-button").click();

  await page.locator("#search-input").fill("淘宝闪购-商家供给策略运营-运营中心");
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
  await page.screenshot({ path: screenshotPath, fullPage: false });
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
