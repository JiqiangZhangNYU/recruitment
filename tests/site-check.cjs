const { chromium } = require("playwright-core");
const assert = require("node:assert/strict");
const guide = require("../learning-guide.json");
const dataDiagnosis = require("../challenges/data-diagnosis.json");
const businessEnglish = require("../challenges/business-english.json");

const executablePath = "/home/zjq/.cache/ms-playwright/chromium-1187/chrome-linux/chrome";
const baseURL = process.env.SITE_URL || "http://127.0.0.1:4173";

function checkChallengePackData(pack, expectedLevels, expectedQuestions) {
  assert.equal(pack.levels.length, expectedLevels);
  const questions = pack.levels.flatMap((level) => level.questions.map((question) => ({ level, question })));
  assert.equal(questions.length, expectedQuestions);
  assert.equal(new Set(questions.map(({ level, question }) => `${level.id}/${question.id}`)).size, expectedQuestions);
  assert.ok(questions.every(({ question }) => (
    question.title
    && question.prompt
    && question.task
    && question.answer?.sample
    && question.answer?.notes?.length
    && question.answer?.keywords?.length
  )));
}

checkChallengePackData(dataDiagnosis, 8, 48);
checkChallengePackData(businessEnglish, 6, 30);
assert.equal(
  dataDiagnosis.levels.flatMap((level) => level.questions)
    .filter((question) => question.activity?.mode === "sql" || question.activity?.input === "sql").length,
  34,
);
const dataDifficulties = dataDiagnosis.levels.flatMap((level) => (
  level.questions.map((question) => question.difficulty || level.difficulty)
));
assert.deepEqual(dataDifficulties, [...dataDifficulties].sort((left, right) => left - right));
assert.ok(dataDiagnosis.levels.flatMap((level) => level.questions)
  .filter((question) => question.activity?.mode === "sql" || question.activity?.input === "sql")
  .every((question) => (
    question.sqlSpec?.tables?.length
    && question.sqlSpec.requirements?.length >= 4
    && question.sqlSpec.output?.length
    && question.sqlSpec.boundaries?.length >= 2
  )));

async function checkPage(browser, viewport, screenshotPath) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  const requestedURLs = [];
  page.on("request", (request) => requestedURLs.push(request.url()));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator(".job-card").first().waitFor();
  assert.equal(requestedURLs.filter((url) => url.includes("learning-guide.json")).length, 0);
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
  await page.locator(".skill-overview-card").first().waitFor();
  assert.equal(requestedURLs.filter((url) => url.includes("learning-guide.json")).length, 1);
  assert.equal(requestedURLs.filter((url) => url.includes("challenges/data-diagnosis.json")).length, 0);
  assert.equal(requestedURLs.filter((url) => url.includes("challenges/business-english.json")).length, 0);
  assert.equal(await page.locator(".skill-overview-card").count(), guide.skills.length);
  assert.equal(await page.locator(".skill-overview-group").count(), guide.groups.length);
  assert.equal(await page.locator(".skill-overview-group").nth(0).locator(".skill-overview-card").count(), 6);
  assert.equal(await page.locator(".skill-overview-group").nth(1).locator(".skill-overview-card").count(), 3);
  assert.equal(await page.locator(".skill-detail-page").count(), 0);
  assert.equal(await page.locator(".week-row").count(), 0);
  assert.equal(await page.locator("#portfolio-list .checklist-item").count(), 0);
  assert.equal(await page.locator("#skill-job-count").textContent(), String(guide.sample.totalJobs));
  assert.match(await page.locator("#skills-view").textContent(), new RegExp(guide.skills[0].title));
  assert.match(await page.locator("#learning-view-nav button").first().textContent(), /9/);
  assert.equal(await page.locator(".skill-overview-card.challenge-enabled").count(), 2);

  await page.locator(".skill-overview-card").first().click();
  await page.locator(".challenge-level-card").first().waitFor();
  assert.equal(requestedURLs.filter((url) => url.includes("challenges/data-diagnosis.json")).length, 1);
  assert.equal(requestedURLs.filter((url) => url.includes("challenges/business-english.json")).length, 0);
  assert.equal(await page.locator(".challenge-level-card").count(), dataDiagnosis.levels.length);
  assert.equal(await page.locator(".challenge-level-card:disabled").count(), dataDiagnosis.levels.length - 1);
  assert.match(await page.locator(".challenge-hero").textContent(), /48/);
  assert.equal(await page.locator(".daily-mission-step").count(), 3);
  assert.equal(await page.locator(".challenge-reference").count(), 1);
  assert.equal(await page.locator(".challenge-level-difficulty").count(), dataDiagnosis.levels.length);
  assert.equal(await page.locator(".challenge-level-story").count(), 0);

  await page.locator(".challenge-level-card").first().click();
  assert.equal(await page.locator(".challenge-question-row").count(), dataDiagnosis.levels[0].questions.length);
  assert.equal(await page.locator(".challenge-question-row:disabled").count(), dataDiagnosis.levels[0].questions.length - 1);
  await page.locator(".challenge-question-row").first().click();
  assert.match(page.url(), /#challenge\/data-diagnosis\/grain-quality\/grain-before-query$/);
  assert.equal(await page.locator(".challenge-answer").isHidden(), true);
  await page.locator(".challenge-choice").nth(dataDiagnosis.levels[0].questions[0].activity.correctChoice).click();
  await page.locator(".challenge-primary-button").click();
  assert.match(await page.locator(".challenge-answer-sample").textContent(), /payments 的粒度/);
  for (let index = 0; index < 3; index += 1) await page.locator(".challenge-review-grid label").nth(index).click();
  await page.locator(".challenge-complete-button").click();
  assert.deepEqual(
    await page.evaluate(() => JSON.parse(localStorage.getItem("recruitment-challenge-data-diagnosis"))),
    ["grain-quality/grain-before-query"],
  );
  await page.locator(".challenge-question-navigation button").last().click();
  assert.match(await page.locator(".challenge-response-heading").textContent(), /SQL 实战/);
  assert.match(await page.locator(".challenge-question-meta").textContent(), /难度 1 \/ 5/);
  assert.equal(await page.locator(".challenge-sql-spec").count(), 1);
  assert.equal(await page.locator(".challenge-sql-spec .challenge-sql-spec-tables pre").textContent(), dataDiagnosis.reference.tables.merchants);
  assert.ok(await page.locator(".challenge-sql-spec ol li").count() >= 4);
  assert.match(await page.locator(".challenge-sql-output").textContent(), /onboard_day/);
  assert.equal(await page.locator(".challenge-reference").count(), 0);
  assert.equal(await page.locator(".challenge-answer-gate").isHidden(), true);
  assert.equal(await page.locator(".challenge-response.is-code").count(), 1);
  assert.equal(await page.locator(".challenge-primary-button").isDisabled(), true);
  await page.locator(".challenge-draft-input").fill("SELECT onboard_date::date, COUNT(*) FROM merchants GROUP BY 1;");
  assert.equal(await page.locator(".challenge-primary-button").isEnabled(), true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".challenge-draft-input").waitFor();
  assert.match(await page.locator(".challenge-draft-input").inputValue(), /COUNT\(\*\)/);
  await page.locator(".challenge-primary-button").click();
  assert.equal(await page.locator(".challenge-answer.is-code").isVisible(), true);
  assert.match(await page.locator(".challenge-answer-sample").textContent(), /AT TIME ZONE/);
  const sqlOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(sqlOverflow <= 1, `SQL challenge horizontal overflow: ${sqlOverflow}px`);
  assert.match(await page.locator("#learning-skill-nav button").filter({ hasText: dataDiagnosis.title.replace("闯关", "") }).textContent(), /1\/48/);

  await page.locator("#learning-skill-nav button").filter({ hasText: guide.skills[1].title }).click();
  assert.equal(await page.locator(".skill-detail-page").count(), 1);
  assert.match(await page.locator(".skill-boundary").textContent(), /能力边界/);
  assert.equal(await page.locator(".skill-detail-page h2").textContent(), guide.skills[1].title);
  assert.ok(await page.locator(".skill-detail-page .exercise-list li").count() >= 4);
  await page.locator(".skill-detail-page .skill-level").selectOption("3");
  assert.equal(
    await page.locator("#skill-progress-count").textContent(),
    `1 / ${guide.skills.length} 达到 ${guide.targetLevel} 级`,
  );

  await page.locator("#learning-skill-nav button").filter({ hasText: "业务英语" }).click();
  await page.locator(".challenge-level-card").first().waitFor();
  assert.equal(requestedURLs.filter((url) => url.includes("challenges/business-english.json")).length, 1);
  assert.equal(await page.locator(".challenge-level-card").count(), businessEnglish.levels.length);
  assert.equal(await page.locator(".challenge-level-card:disabled").count(), businessEnglish.levels.length - 1);
  assert.match(await page.locator(".challenge-hero").textContent(), /30/);
  assert.equal(await page.locator(".daily-mission-step").count(), 3);
  assert.match(await page.locator(".weekly-practice").textContent(), /0 \/ 3 天/);

  await page.locator(".challenge-level-card").first().click();
  assert.equal(await page.locator(".challenge-question-row").count(), businessEnglish.levels[0].questions.length);
  assert.equal(await page.locator(".challenge-question-row:disabled").count(), businessEnglish.levels[0].questions.length - 1);
  await page.locator(".challenge-question-row").first().click();
  assert.equal(await page.locator(".challenge-answer").isHidden(), true);
  assert.equal(await page.locator(".challenge-complete-button").isDisabled(), true);
  assert.equal(await page.locator(".challenge-primary-button").isDisabled(), true);
  assert.match(page.url(), /#challenge\/business-english\/payment-basics\/authorization-capture-settlement$/);
  await page.locator(".challenge-choice").nth(businessEnglish.levels[0].questions[0].activity.correctChoice).click();
  assert.equal(await page.locator(".challenge-primary-button").isEnabled(), true);
  await page.locator(".challenge-primary-button").click();
  assert.equal(await page.locator(".challenge-answer").isVisible(), true);
  assert.match(await page.locator(".challenge-answer-sample").textContent(), /Authorization checks/);
  assert.equal(await page.locator(".challenge-choice.correct").count(), 1);
  assert.equal(await page.locator(".challenge-self-review").isVisible(), true);
  for (let index = 0; index < 3; index += 1) await page.locator(".challenge-review-grid label").nth(index).click();
  assert.equal(await page.locator(".challenge-complete-button").isEnabled(), true);
  await page.locator(".challenge-complete-button").click();
  assert.equal(await page.locator(".challenge-question-navigation button").last().isEnabled(), true);
  assert.deepEqual(
    await page.evaluate(() => JSON.parse(localStorage.getItem("recruitment-challenge-business-english"))),
    ["payment-basics/authorization-capture-settlement"],
  );
  await page.locator(".challenge-question-navigation button").last().click();
  assert.equal(await page.locator(".challenge-answer").isHidden(), true);
  assert.match(await page.locator(".challenge-question-header h2").textContent(), /退款与拒付/);
  assert.match(await page.locator(".challenge-response-heading").textContent(), /句子排序/);
  while (await page.locator(".challenge-chunk").count()) await page.locator(".challenge-chunk").first().click();
  assert.equal(await page.locator(".challenge-primary-button").isEnabled(), true);
  await page.locator(".challenge-primary-button").click();
  assert.equal(await page.locator(".challenge-answer").isVisible(), true);
  for (let index = 0; index < 3; index += 1) await page.locator(".challenge-review-grid label").nth(index).click();
  await page.locator(".challenge-complete-button").click();
  await page.locator(".challenge-question-navigation button").last().click();
  assert.match(await page.locator(".challenge-question-header h2").textContent(), /支付链路参与方/);
  assert.equal(await page.locator(".challenge-primary-button").isDisabled(), true);
  await page.locator(".challenge-draft-input").fill("The issuer serves the customer, while the acquirer serves the merchant.");
  assert.equal(await page.locator(".challenge-primary-button").isEnabled(), true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".challenge-question-header h2").waitFor();
  assert.match(await page.locator(".challenge-question-header h2").textContent(), /支付链路参与方/);
  assert.equal(await page.locator(".challenge-answer").isHidden(), true);
  assert.match(await page.locator(".challenge-draft-input").inputValue(), /issuer serves the customer/);
  assert.deepEqual(
    await page.evaluate(() => JSON.parse(localStorage.getItem("recruitment-challenge-business-english"))),
    ["payment-basics/authorization-capture-settlement", "payment-basics/refund-chargeback"],
  );
  await page.locator(".challenge-home-button").click();
  assert.equal(await page.locator(".challenge-level-card").count(), businessEnglish.levels.length);
  assert.match(await page.locator("#learning-skill-nav button").filter({ hasText: "业务英语" }).textContent(), /2\/30/);
  assert.equal(await page.locator(".daily-mission-step.completed").count(), 2);
  assert.match(await page.locator(".weekly-practice").textContent(), /1 \/ 3 天/);

  const firstLevelKeys = businessEnglish.levels[0].questions.slice(0, 4)
    .map((question) => `payment-basics/${question.id}`);
  await page.evaluate((keys) => {
    localStorage.setItem("recruitment-challenge-business-english", JSON.stringify(keys));
  }, firstLevelKeys);
  const rewardURL = new URL(baseURL);
  rewardURL.searchParams.set("test", "reward");
  rewardURL.hash = "challenge/business-english/payment-basics/take-rate-net-revenue";
  await page.goto(rewardURL.href, { waitUntil: "domcontentloaded" });
  await page.locator(".challenge-draft-input").waitFor();
  assert.match(await page.locator(".challenge-response-heading").textContent(), /Boss 挑战/);
  await page.locator(".challenge-draft-input").fill("Take rate explains gross pricing, while net revenue also depends on processing costs and losses.");
  await page.locator(".challenge-primary-button").click();
  for (let index = 0; index < 3; index += 1) await page.locator(".challenge-review-grid label").nth(index).click();
  await page.locator(".challenge-complete-button").click();
  assert.equal(await page.locator(".challenge-reward").isVisible(), true);
  assert.match(await page.locator(".challenge-reward h3").textContent(), /支付术语速查卡/);

  await page.locator("#learning-view-nav button").filter({ hasText: "16 周路线" }).click();
  assert.equal(await page.locator(".week-row").count(), guide.weeks.length);
  await page.locator(".week-row").first().locator('input[type="checkbox"]').check();
  assert.match(await page.locator("#week-progress-count").textContent(), /^1 \/ 17/);

  await page.locator("#learning-view-nav button").filter({ hasText: "作品与验收" }).click();
  assert.equal(await page.locator("#portfolio-list .checklist-item").count(), guide.portfolio.length);
  assert.equal(await page.locator("#readiness-groups .checklist-item").count(), guide.readiness.length);
  await page.locator("#portfolio-list .checklist-item").first().click();
  assert.equal(await page.locator("#portfolio-progress").textContent(), `1 / ${guide.portfolio.length}`);

  await page.locator("#learning-view-nav button").filter({ hasText: "能力体系" }).click();
  assert.equal(await page.locator(".skill-overview-card").count(), guide.skills.length);
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

async function checkSkillLevelMigration(browser) {
  const page = await browser.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("recruitment-skill-levels", JSON.stringify({
      "data-diagnosis": 1,
      "metrics-results": 3,
      "lifecycle-growth": 2,
      "strategy-design": 4,
      "project-delivery": 3,
      "product-data-ml": 2,
      "experience-assets": 4,
    }));
  });
  await page.goto(`${baseURL}/#skills`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator(".skill-overview-card").first().waitFor();
  const levels = await page.evaluate(() => JSON.parse(localStorage.getItem("recruitment-skill-levels")));
  assert.equal(levels["data-diagnosis"], 3);
  assert.equal(levels["lifecycle-growth"], 4);
  assert.equal(levels["project-delivery"], 3);
  assert.equal(levels["metrics-results"], undefined);
  assert.equal(levels["strategy-design"], undefined);
  assert.equal(levels["product-data-ml"], undefined);
  assert.equal(levels["experience-assets"], undefined);
  await page.close();
}

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    await checkSkillLevelMigration(browser);
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
