const { chromium } = require("playwright-core");
const assert = require("node:assert/strict");
const guide = require("../learning-guide.json");
const dataDiagnosis = require("../challenges/data-diagnosis.json");
const businessEnglish = require("../challenges/business-english.json");
const lifecycleGrowth = require("../challenges/lifecycle-growth.json");
const projectDelivery = require("../challenges/project-delivery.json");
const paymentsFintech = require("../challenges/payments-fintech.json");
const internationalCollaboration = require("../challenges/international-collaboration.json");

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
const newP0ChallengePacks = [lifecycleGrowth, projectDelivery, paymentsFintech, internationalCollaboration];
const challengePackBySkill = new Map([
  [dataDiagnosis.skillId, dataDiagnosis],
  [lifecycleGrowth.skillId, lifecycleGrowth],
  [projectDelivery.skillId, projectDelivery],
  [paymentsFintech.skillId, paymentsFintech],
  [businessEnglish.skillId, businessEnglish],
  [internationalCollaboration.skillId, internationalCollaboration],
]);
newP0ChallengePacks.forEach((pack) => {
  checkChallengePackData(pack, 6, 30);
  assert.equal(pack.ui?.compact, true);
  assert.ok(pack.levels.every((level) => level.questions.length === 5 && level.reward?.items?.length >= 3));
  const difficulties = pack.levels.flatMap((level) => level.questions.map(() => level.difficulty));
  assert.deepEqual(difficulties, [...difficulties].sort((left, right) => left - right));
  assert.ok(difficulties.every((difficulty) => difficulty >= 1 && difficulty <= 5));
  const questions = pack.levels.flatMap((level) => level.questions);
  assert.ok(questions.every((question) => (
    question.activity?.mode
    && question.prompt.length >= 25
    && question.task.length >= 12
    && question.hint.length >= 8
    && question.answer.sample.length >= 35
    && question.answer.notes.length >= 2
    && question.answer.keywords.length >= 3
  )));
  questions.filter((question) => question.activity.mode === "arrange").forEach((question) => {
    assert.ok(question.answer.sample.match(/[^.!?。！？；;]+[.!?。！？；;]+/g)?.length >= 2);
  });
  questions.filter((question) => question.activity.mode === "choice").forEach((question) => {
    assert.ok(question.activity.choices.length >= 3);
    assert.ok(question.activity.correctChoice >= 0 && question.activity.correctChoice < question.activity.choices.length);
    assert.ok(question.activity.feedback);
  });
});
assert.deepEqual(
  guide.skills.filter((skill) => skill.priority === "P0").map((skill) => skill.id),
  [...challengePackBySkill.keys()],
);
assert.equal(Object.keys(businessEnglish.translations).length, 30);
assert.ok(businessEnglish.levels.flatMap((level) => level.questions)
  .every((question) => businessEnglish.translations[question.id]?.length >= 20));
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
  challengePackBySkill.forEach((pack) => {
    assert.equal(requestedURLs.filter((url) => url.includes(`challenges/${pack.skillId}.json`)).length, 0);
  });
  assert.equal(await page.locator(".skill-overview-card").count(), guide.skills.length);
  assert.equal(await page.locator(".skill-overview-group").count(), guide.groups.length);
  assert.equal(await page.locator(".skill-overview-group").nth(0).locator(".skill-overview-card").count(), 6);
  assert.equal(await page.locator(".skill-overview-group").nth(1).locator(".skill-overview-card").count(), 3);
  assert.equal(await page.locator("#learning-skill-nav button").count(), guide.skills.length);
  assert.match(await page.locator("#ability-panel h2").textContent(), /九项技能/);
  assert.equal(await page.locator("#learning-view-nav").count(), 0);
  assert.equal(await page.locator("#roadmap-panel").count(), 0);
  assert.equal(await page.locator("#portfolio-panel").count(), 0);
  assert.equal(await page.locator(".skill-detail-page").count(), 0);
  assert.equal(await page.locator(".week-row").count(), 0);
  assert.equal(await page.locator("#portfolio-list .checklist-item").count(), 0);
  assert.equal(await page.locator("#skill-job-count").textContent(), String(guide.sample.totalJobs));
  assert.match(await page.locator("#skills-view").textContent(), new RegExp(guide.skills[0].title));
  assert.equal(await page.locator(".skill-overview-card.challenge-enabled").count(), 6);

  await page.locator(".skill-overview-card").first().click();
  await page.locator(".challenge-level-card").first().waitFor();
  assert.equal(requestedURLs.filter((url) => url.includes("challenges/data-diagnosis.json")).length, 1);
  [...challengePackBySkill.values()].filter((pack) => pack.skillId !== dataDiagnosis.skillId).forEach((pack) => {
    assert.equal(requestedURLs.filter((url) => url.includes(`challenges/${pack.skillId}.json`)).length, 0);
  });
  assert.equal(await page.locator(".challenge-level-card").count(), dataDiagnosis.levels.length);
  assert.equal(await page.locator(".challenge-level-card:disabled").count(), 0);
  assert.match(await page.locator(".challenge-hero").textContent(), /48/);
  assert.equal(await page.locator(".daily-mission-step").count(), 3);
  assert.equal(await page.locator(".challenge-reference").count(), 1);
  assert.equal(await page.locator(".challenge-level-difficulty").count(), dataDiagnosis.levels.length);
  assert.equal(await page.locator(".challenge-level-story").count(), 0);

  await page.locator(".challenge-level-card").first().click();
  assert.equal(await page.locator(".challenge-question-row").count(), dataDiagnosis.levels[0].questions.length);
  assert.equal(await page.locator(".challenge-question-row:disabled").count(), 0);
  await page.locator(".challenge-question-row").first().click();
  assert.match(page.url(), /#challenge\/data-diagnosis\/grain-quality\/grain-before-query$/);
  assert.equal(await page.locator(".challenge-answer").isHidden(), true);
  assert.equal(await page.locator(".challenge-primary-button").isEnabled(), true);
  assert.equal(await page.locator(".challenge-question-navigation button").last().isEnabled(), true);
  await page.locator(".challenge-choice").nth(dataDiagnosis.levels[0].questions[0].activity.correctChoice).click();
  await page.locator(".challenge-primary-button").click();
  assert.match(await page.locator(".challenge-answer-sample").textContent(), /payments 的粒度/);
  assert.equal(await page.locator(".challenge-self-review").count(), 0);
  assert.equal(await page.locator(".challenge-question-navigation button").last().isEnabled(), true);
  assert.deepEqual(
    await page.evaluate(() => JSON.parse(localStorage.getItem("recruitment-challenge-data-diagnosis"))),
    ["grain-quality/grain-before-query"],
  );
  await page.locator(".challenge-question-navigation button").last().click();
  assert.match(await page.locator(".challenge-response-heading").textContent(), /单选学习/);
  assert.match(await page.locator(".challenge-question-meta").textContent(), /难度 1 \/ 5/);
  assert.equal(await page.locator(".challenge-sql-spec").count(), 1);
  assert.equal(await page.locator(".challenge-sql-spec .challenge-sql-spec-tables pre").textContent(), dataDiagnosis.reference.tables.merchants);
  assert.ok(await page.locator(".challenge-sql-spec ol li").count() >= 4);
  assert.match(await page.locator(".challenge-sql-output").textContent(), /onboard_day/);
  assert.equal(await page.locator(".challenge-reference").count(), 0);
  assert.equal(await page.locator(".challenge-answer-gate").isHidden(), true);
  assert.equal(await page.locator(".challenge-draft-input").count(), 0);
  assert.equal(await page.locator(".challenge-choice").count(), 3);
  assert.equal(await page.locator(".challenge-primary-button").isEnabled(), true);
  await page.locator(".challenge-primary-button").click();
  assert.equal(await page.locator(".challenge-choice.correct").count(), 1);
  assert.equal(await page.locator(".challenge-answer.is-code").isVisible(), true);
  assert.match(await page.locator(".challenge-answer-sample").textContent(), /AT TIME ZONE/);
  const sqlOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(sqlOverflow <= 1, `SQL challenge horizontal overflow: ${sqlOverflow}px`);
  assert.match(await page.locator("#learning-skill-nav button").filter({ hasText: dataDiagnosis.title.replace("闯关", "") }).textContent(), /2\/48/);

  const standardSkill = guide.skills.find((skill) => skill.id === "ecommerce-merchants");
  await page.locator("#learning-skill-nav button").filter({ hasText: standardSkill.title }).click();
  assert.equal(await page.locator(".skill-detail-page").count(), 1);
  assert.match(await page.locator(".skill-boundary").textContent(), /能力边界/);
  assert.equal(await page.locator(".skill-detail-page h2").textContent(), standardSkill.title);
  assert.ok(await page.locator(".skill-detail-page .exercise-list li").count() >= 4);
  await page.locator(".skill-detail-page .skill-level").selectOption("3");
  assert.match(await page.locator("#learning-skill-nav button").filter({ hasText: standardSkill.title }).textContent(), /3级/);

  for (const pack of newP0ChallengePacks) {
    const skill = guide.skills.find((item) => item.id === pack.skillId);
    await page.locator("#learning-skill-nav button").filter({ hasText: skill.title }).click();
    await page.locator(".challenge-level-card").first().waitFor();
    assert.equal(requestedURLs.filter((url) => url.includes(`challenges/${pack.skillId}.json`)).length, 1);
    assert.equal(await page.locator(".challenge-level-card").count(), pack.levels.length);
    assert.equal(await page.locator(".challenge-level-card:disabled").count(), 0);
    assert.equal(await page.locator(".challenge-level-difficulty").count(), pack.levels.length);
    await page.locator(".challenge-level-card").last().click();
    assert.equal(await page.locator(".challenge-question-row").count(), 5);
    assert.equal(await page.locator(".challenge-question-row:disabled").count(), 0);
    await page.locator(".challenge-question-row").first().click();
    assert.equal(await page.locator(".challenge-draft-input").count(), 0);
    assert.equal(await page.locator(".challenge-choice").count(), 3);
    assert.equal(await page.locator(".challenge-primary-button").isEnabled(), true);
    assert.equal(await page.locator(".challenge-question-navigation button").last().isEnabled(), true);
    await page.locator(".challenge-primary-button").click();
    assert.equal(await page.locator(".challenge-answer").isVisible(), true);
    await page.locator(".challenge-question-navigation button").last().click();
    assert.ok(await page.locator(".challenge-chunk").count() >= 2);
    assert.equal(await page.locator(".challenge-draft-input").count(), 0);
    assert.equal(await page.locator(".challenge-primary-button").isEnabled(), true);
  }

  await page.locator("#learning-skill-nav button").filter({ hasText: "业务英语" }).click();
  await page.locator(".challenge-level-card").first().waitFor();
  assert.equal(requestedURLs.filter((url) => url.includes("challenges/business-english.json")).length, 1);
  assert.equal(await page.locator(".challenge-level-card").count(), businessEnglish.levels.length);
  assert.equal(await page.locator(".challenge-level-card:disabled").count(), 0);
  assert.match(await page.locator(".challenge-hero").textContent(), /30/);
  assert.equal(await page.locator(".daily-mission-step").count(), 3);
  assert.match(await page.locator(".weekly-practice").textContent(), /0 \/ 3 天/);

  await page.locator(".challenge-level-card").first().click();
  assert.equal(await page.locator(".challenge-question-row").count(), businessEnglish.levels[0].questions.length);
  assert.equal(await page.locator(".challenge-question-row:disabled").count(), 0);
  await page.locator(".challenge-question-row").first().click();
  assert.equal(await page.locator(".challenge-answer").isHidden(), true);
  assert.equal(await page.locator(".challenge-self-review").count(), 0);
  assert.equal(await page.locator(".challenge-primary-button").isEnabled(), true);
  assert.equal(await page.locator(".challenge-question-navigation button").last().isEnabled(), true);
  assert.match(page.url(), /#challenge\/business-english\/payment-basics\/authorization-capture-settlement$/);
  await page.locator(".challenge-choice").nth(businessEnglish.levels[0].questions[0].activity.correctChoice).click();
  await page.locator(".challenge-primary-button").click();
  assert.equal(await page.locator(".challenge-answer").isVisible(), true);
  assert.match(await page.locator(".challenge-answer-sample").textContent(), /Authorization checks/);
  assert.match(await page.locator(".challenge-answer-translation").textContent(), /授权用于检查客户/);
  assert.equal(await page.locator(".challenge-choice.correct").count(), 1);
  assert.equal(await page.locator(".challenge-self-review").count(), 0);
  assert.equal(await page.locator(".challenge-question-navigation button").last().isEnabled(), true);
  assert.deepEqual(
    await page.evaluate(() => JSON.parse(localStorage.getItem("recruitment-challenge-business-english"))),
    ["payment-basics/authorization-capture-settlement"],
  );
  await page.locator(".challenge-question-navigation button").last().click();
  assert.equal(await page.locator(".challenge-answer").isHidden(), true);
  assert.match(await page.locator(".challenge-question-header h2").textContent(), /退款与拒付/);
  assert.match(await page.locator(".challenge-response-heading").textContent(), /句子排序/);
  assert.equal(await page.locator(".challenge-primary-button").isEnabled(), true);
  await page.locator(".challenge-primary-button").click();
  assert.equal(await page.locator(".challenge-answer").isVisible(), true);
  assert.match(await page.locator(".challenge-answer-translation").textContent(), /退款由商户发起/);
  assert.equal(await page.locator(".challenge-question-navigation button").last().isEnabled(), true);
  await page.locator(".challenge-question-navigation button").last().click();
  assert.match(await page.locator(".challenge-question-header h2").textContent(), /支付链路参与方/);
  assert.equal(await page.locator(".challenge-draft-input").count(), 0);
  assert.equal(await page.locator(".challenge-choice").count(), 3);
  assert.equal(await page.locator(".challenge-primary-button").isEnabled(), true);
  assert.equal(await page.locator(".challenge-question-navigation button").last().isEnabled(), true);
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
  await page.locator(".challenge-choice").first().waitFor();
  assert.match(await page.locator(".challenge-response-heading").textContent(), /单选题/);
  assert.equal(await page.locator(".challenge-draft-input").count(), 0);
  await page.locator(".challenge-primary-button").click();
  assert.equal(await page.locator(".challenge-reward").isVisible(), true);
  assert.match(await page.locator(".challenge-reward h3").textContent(), /支付术语速查卡/);
  assert.match(await page.locator(".challenge-answer-translation").textContent(), /费率等于支付总收入/);

  await page.locator('.primary-nav button[data-view="skills"]').click();
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
