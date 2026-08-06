const { chromium } = require("playwright-core");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const guide = require("../learning-guide.json");
const interviewPlan = require("../interview-plan.json");
const interviewQuestionBank = require("../interview-question-bank.json");
const jobsData = require("../jobs.json");
const dataDiagnosis = require("../challenges/data-diagnosis.json");
const businessEnglishManifest = require("../challenges/business-english/manifest.json");
const businessEnglishLevels = businessEnglishManifest.levels.map((level) => require(`../${level.file}`));
const businessEnglish = { ...businessEnglishManifest, levels: businessEnglishLevels };
const lifecycleGrowth = require("../challenges/lifecycle-growth.json");
const projectDelivery = require("../challenges/project-delivery.json");
const paymentsFintech = require("../challenges/payments-fintech.json");
const internationalCollaboration = require("../challenges/international-collaboration.json");
const coreVocabulary = require("../challenges/core-vocabulary/glossary.json");
const coreVocabularyManifest = require("../challenges/core-vocabulary/manifest.json");
const coreVocabularyAudioManifest = require("../audio/core-vocabulary/manifest.json");

const executablePath = "/home/zjq/.cache/ms-playwright/chromium-1187/chrome-linux/chrome";
const baseURL = process.env.SITE_URL || "http://127.0.0.1:4173";
const coreVocabularyAudioBase = "https://cdn.jsdelivr.net/gh/JiqiangZhangNYU/recruitment@dfd6263d429c18d6f5e626a170eec8e5f36af416/audio/core-vocabulary";

assert.equal(interviewPlan.questions.length, 12);
assert.equal(new Set(interviewPlan.questions.map((question) => question.id)).size, interviewPlan.questions.length);
assert.equal(new Set(interviewPlan.categories.map((category) => category.id)).size, interviewPlan.categories.length);
const interviewCategoryIds = new Set(interviewPlan.categories.map((category) => category.id));

function validInterviewCheck(check) {
  if (!(check.id && check.label && check.kind && check.problem && check.improvement && check.followUp)) return false;
  if (check.kind === "keywordGroups") {
    return check.groups?.length
      && check.groups.every((group) => Array.isArray(group) && group.length)
      && Number.isInteger(check.minGroups)
      && check.minGroups > 0;
  }
  if (check.kind === "regexCount") return Boolean(check.pattern) && Number.isInteger(check.min) && check.min > 0;
  if (["charRange", "wordRange"].includes(check.kind)) {
    return Number.isFinite(check.min) && Number.isFinite(check.max) && check.max >= check.min;
  }
  return check.kind === "targetSpecificity";
}

assert.ok(interviewPlan.questions.every((question) => (
  interviewCategoryIds.has(question.category)
  && question.title
  && question.prompt
  && question.intent
  && question.duration
  && Array.isArray(question.dimensions)
  && question.framework.length >= 4
  && question.checks.length === 5
  && question.checks.every(validInterviewCheck)
)));
assert.equal(interviewQuestionBank.questions.length, 19);
assert.ok(interviewQuestionBank.methodSources.length >= 5);
assert.equal(new Set(interviewQuestionBank.methodSources.map((source) => source.name)).size, interviewQuestionBank.methodSources.length);
assert.equal(new Set(interviewQuestionBank.methodSources.map((source) => source.url)).size, interviewQuestionBank.methodSources.length);
assert.ok(interviewQuestionBank.methodSources.every((source) => (
  source.name.trim()
  && source.provider?.trim()
  && source.focus.trim()
  && ["priority", "role"].includes(source.group)
  && new URL(source.url).protocol === "https:"
)));
assert.equal(interviewQuestionBank.methodSources.filter((source) => source.group === "priority").length, 3);
assert.equal(Object.keys(interviewQuestionBank.answerGuides).length, interviewPlan.questions.length);
assert.deepEqual(
  new Set(Object.keys(interviewQuestionBank.answerGuides)),
  new Set(interviewPlan.questions.map((question) => question.id)),
);
const allInterviewQuestionIds = [
  ...interviewPlan.questions.map((question) => question.id),
  ...interviewQuestionBank.questions.map((question) => question.id),
];
assert.equal(new Set(allInterviewQuestionIds).size, allInterviewQuestionIds.length);
assert.ok(interviewQuestionBank.questions.every((question) => (
  interviewCategoryIds.has(question.category)
  && ["high", "medium", "supplementary"].includes(question.priority)
  && question.formats?.length
  && question.stages?.length
  && question.roleFamilies?.length
  && question.duration
  && Array.isArray(question.dimensions)
  && question.framework?.length >= 4
  && question.answerEdge
  && question.evidence?.length >= 3
  && question.followUps?.length >= 3
  && question.pitfalls?.length >= 2
  && interviewQuestionBank.checkProfiles[question.checkProfile]?.length === 5
)));
assert.ok(Object.values(interviewQuestionBank.checkProfiles).every((checks) => (
  checks.length === 5
  && checks.every(validInterviewCheck)
)));
assert.ok(interviewPlan.questions.every((question) => {
  const answerGuide = interviewQuestionBank.answerGuides[question.id];
  return answerGuide.answerEdge
    && answerGuide.evidence.length >= 3
    && answerGuide.followUps.length >= 3
    && answerGuide.pitfalls.length >= 2;
}));

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
checkChallengePackData(businessEnglish, 10, 500);
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
  new Set(guide.skills.filter((skill) => skill.priority === "P0").map((skill) => skill.id)),
  new Set([...challengePackBySkill.keys(), coreVocabularyManifest.skillId]),
);
assert.equal(coreVocabulary.count, 500);
assert.equal(coreVocabulary.version, coreVocabularyManifest.glossary.version);
assert.equal(coreVocabulary.entries.length, 500);
assert.ok(coreVocabulary.entries.every((entry) => /^\/.+\/$/.test(entry.ipa)));
const vocabularyByTerm = new Map(coreVocabulary.entries.map((entry) => [entry.term, entry]));
assert.equal(vocabularyByTerm.get("merchant").ipa, "/ˈmɝtʃənt/");
assert.equal(vocabularyByTerm.get("cut-off time").ipa, "/kʌt ɔf taɪm/");
assert.equal(vocabularyByTerm.get("month over month").ipa, "/mʌnθ ˈoʊvəɹ mʌnθ/");
assert.equal(vocabularyByTerm.get("impact").ipa, "/ˈɪmpækt/");
assert.equal(vocabularyByTerm.get("segment").ipa, "/ˈsɛɡmənt/");
assert.equal(vocabularyByTerm.get("routing").ipa, "/ˈɹutɪŋ/");
assert.equal(vocabularyByTerm.get("PAN").ipa, "/pæn/");
assert.equal(vocabularyByTerm.get("BIN").ipa, "/bɪn/");
assert.match(vocabularyByTerm.get("payment service provider (PSP)").ipa, /, .*piː.*ɛs.*piː\/$/);
assert.equal(coreVocabularyAudioManifest.expectedCount, coreVocabulary.count * 3);
assert.equal(coreVocabularyAudioManifest.completedCount, coreVocabularyAudioManifest.expectedCount);
assert.equal(coreVocabularyAudioManifest.version, 2);
assert.equal(coreVocabularyAudioManifest.glossaryVersion, coreVocabulary.version);
assert.equal(coreVocabularyAudioManifest.wordPhonemeSource, "challenges/core-vocabulary/glossary.json#ipa");
coreVocabulary.entries.forEach((entry) => {
  ["word", "example", "interview"].forEach((kind) => {
    const filename = `${String(entry.rank).padStart(3, "0")}-${kind}.mp3`;
    assert.ok(fs.statSync(path.join(__dirname, "..", "audio", "core-vocabulary", filename)).size > 0);
  });
});
assert.ok(businessEnglish.levels.flatMap((level) => level.questions)
  .every((question) => question.answer.translation?.length >= 20));
assert.ok(businessEnglish.levels.every((level) => level.questions.length === 50));
assert.equal(businessEnglishManifest.chunked, true);
assert.equal(businessEnglishManifest.ui.compact, true);
assert.ok(businessEnglishManifest.levels.every((level, index) => (
  level.questions.length === 50
  && level.file === `challenges/business-english/levels/${level.id}.json`
  && businessEnglishLevels[index].id === level.id
  && businessEnglishLevels[index].questions.length === 50
  && businessEnglishLevels[index].questions.every((question) => question.answer.translation?.length >= 20)
  && level.questions.every((question, questionIndex) => question.id === businessEnglishLevels[index].questions[questionIndex].id)
)));
const businessEnglishQuestions = businessEnglish.levels.flatMap((level) => level.questions);
assert.equal(new Set(businessEnglishQuestions.map((question) => question.id)).size, 500);
assert.equal(new Set(businessEnglishQuestions.map((question) => question.answer.sample)).size, 500);
assert.deepEqual(
  businessEnglishQuestions.reduce((counts, question) => {
    counts[question.difficulty] = (counts[question.difficulty] || 0) + 1;
    return counts;
  }, {}),
  { 1: 100, 2: 100, 3: 100, 4: 100, 5: 100 },
);
assert.ok(businessEnglishQuestions.every((question) => (
  question.difficulty >= 1
  && question.difficulty <= 5
  && question.answer.sample.length >= 80
  && question.answer.notes.length >= 2
  && question.answer.keywords.length >= 3
)));
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
  assert.equal(
    await page.locator(".skill-overview-group").nth(0).locator(".skill-overview-card").count(),
    guide.skills.filter((skill) => skill.group === guide.groups[0].id).length,
  );
  assert.equal(
    await page.locator(".skill-overview-group").nth(1).locator(".skill-overview-card").count(),
    guide.skills.filter((skill) => skill.group === guide.groups[1].id).length,
  );
  assert.equal(await page.locator("#learning-skill-nav button").count(), guide.skills.length);
  assert.equal(await page.locator("#ability-panel h2").textContent(), "技能总览");
  assert.equal(await page.locator("#learning-view-nav").count(), 0);
  assert.equal(await page.locator("#roadmap-panel").count(), 0);
  assert.equal(await page.locator("#portfolio-panel").count(), 0);
  assert.equal(await page.locator(".skill-detail-page").count(), 0);
  assert.equal(await page.locator(".week-row").count(), 0);
  assert.equal(await page.locator("#portfolio-list .checklist-item").count(), 0);
  assert.equal(await page.locator("#skill-job-count").textContent(), String(guide.sample.totalJobs));
  assert.match(await page.locator("#skills-view").textContent(), new RegExp(guide.skills[0].title));
  assert.equal(
    await page.locator(".skill-overview-card.challenge-enabled").count(),
    guide.skills.filter((skill) => skill.challenge && skill.challenge.defaultPage !== "challengeGlossary").length,
  );
  assert.equal(await page.locator(".skill-overview-card.glossary-enabled").count(), 1);

  await page.locator(".skill-overview-card")
    .filter({ hasText: dataDiagnosis.title.replace("闯关", "") })
    .click();
  await page.locator(".challenge-level-card").first().waitFor();
  assert.equal(requestedURLs.filter((url) => url.includes("challenges/data-diagnosis.json")).length, 1);
  [...challengePackBySkill.values()].filter((pack) => pack.skillId !== dataDiagnosis.skillId).forEach((pack) => {
    assert.equal(requestedURLs.filter((url) => url.includes(`challenges/${pack.skillId}.json`)).length, 0);
  });
  assert.equal(await page.locator(".challenge-level-card").count(), dataDiagnosis.levels.length);
  assert.equal(await page.locator(".challenge-level-card:disabled").count(), 0);
  assert.match(await page.locator(".challenge-hero").textContent(), /48/);
  assert.equal(await page.locator(".daily-mission-step").count(), 5);
  const initialDataMission = await page.evaluate(() => JSON.parse(localStorage.getItem("recruitment-daily-mission-data-diagnosis")));
  assert.equal(initialDataMission.version, 3);
  assert.equal(initialDataMission.keys.length, 5);
  assert.equal(new Set(initialDataMission.keys).size, 5);
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

  const completedDataKeys = await page.evaluate(() => JSON.parse(localStorage.getItem("recruitment-challenge-data-diagnosis")));
  await page.evaluate(() => {
    const mission = JSON.parse(localStorage.getItem("recruitment-daily-mission-data-diagnosis"));
    mission.date = "2000-01-01";
    localStorage.setItem("recruitment-daily-mission-data-diagnosis", JSON.stringify(mission));
  });
  await page.locator("#learning-skill-nav button").filter({ hasText: dataDiagnosis.title.replace("闯关", "") }).click();
  const refreshedDataMission = await page.evaluate(() => JSON.parse(localStorage.getItem("recruitment-daily-mission-data-diagnosis")));
  assert.equal(refreshedDataMission.keys.length, 5);
  assert.equal(new Set(refreshedDataMission.keys).size, 5);
  assert.ok(refreshedDataMission.keys.every((key) => !completedDataKeys.includes(key)));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".daily-mission-step").first().waitFor();
  assert.deepEqual(
    (await page.evaluate(() => JSON.parse(localStorage.getItem("recruitment-daily-mission-data-diagnosis")))).keys,
    refreshedDataMission.keys,
  );

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
  assert.equal(requestedURLs.filter((url) => url.includes("challenges/business-english/manifest.json")).length, 1);
  assert.equal(requestedURLs.filter((url) => url.includes("challenges/business-english.json")).length, 0);
  businessEnglishManifest.levels.forEach((level) => {
    assert.equal(requestedURLs.filter((url) => url.includes(level.file)).length, 0);
  });
  assert.equal(await page.locator(".challenge-level-card").count(), businessEnglish.levels.length);
  assert.equal(await page.locator(".challenge-level-card:disabled").count(), 0);
  assert.match(await page.locator(".challenge-hero").textContent(), /500/);
  assert.equal(await page.locator(".daily-mission-step").count(), 5);
  assert.match(await page.locator(".weekly-practice").textContent(), /0 \/ 3 天/);

  await page.locator(".challenge-level-card").first().click();
  await page.locator(".challenge-question-row").first().waitFor();
  assert.equal(requestedURLs.filter((url) => url.includes(businessEnglishManifest.levels[0].file)).length, 1);
  businessEnglishManifest.levels.slice(1).forEach((level) => {
    assert.equal(requestedURLs.filter((url) => url.includes(level.file)).length, 0);
  });
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
  assert.match(await page.locator("#learning-skill-nav button").filter({ hasText: "业务英语" }).textContent(), /2\/500/);
  const completedEnglishMissionItems = await page.evaluate(() => {
    const mission = JSON.parse(localStorage.getItem("recruitment-daily-mission-business-english"));
    return mission.completed.length;
  });
  assert.equal(await page.locator(".daily-mission-step.completed").count(), completedEnglishMissionItems);
  assert.match(await page.locator(".weekly-practice").textContent(), /1 \/ 3 天/);

  const rewardQuestion = businessEnglish.levels[0].questions[4];
  const firstLevelKeys = businessEnglish.levels[0].questions
    .filter((question) => question.id !== rewardQuestion.id)
    .map((question) => `payment-basics/${question.id}`);
  await page.evaluate((keys) => {
    localStorage.setItem("recruitment-challenge-business-english", JSON.stringify(keys));
  }, firstLevelKeys);
  const rewardURL = new URL(baseURL);
  rewardURL.searchParams.set("test", "reward");
  rewardURL.hash = `challenge/business-english/payment-basics/${rewardQuestion.id}`;
  await page.goto(rewardURL.href, { waitUntil: "domcontentloaded" });
  await page.locator(".challenge-choice").first().waitFor();
  assert.match(await page.locator(".challenge-response-heading").textContent(), /单选题/);
  assert.equal(await page.locator(".challenge-draft-input").count(), 0);
  await page.locator(".challenge-primary-button").click();
  assert.equal(await page.locator(".challenge-reward").isVisible(), true);
  assert.match(await page.locator(".challenge-reward h3").textContent(), /支付与商务表达基础表达卡/);
  assert.match(await page.locator(".challenge-answer-translation").textContent(), /费率等于支付总收入/);

  await page.locator('.primary-nav button[data-view="skills"]').click();
  assert.equal(await page.locator(".skill-overview-card").count(), guide.skills.length);
  const skillOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(skillOverflow <= 1, `skills horizontal overflow: ${skillOverflow}px`);
  if (screenshotPath) {
    await page.screenshot({ path: screenshotPath.replace(".png", "-skills.png"), fullPage: true });
  }
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
  if (screenshotPath) {
    await page.screenshot({ path: screenshotPath, fullPage: false });
  }
  await page.close();
}

async function checkInterviewPractice(browser, viewport, screenshotPath, fullFlow = false) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  const requestedURLs = [];
  page.on("request", (request) => requestedURLs.push(request.url()));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(`${baseURL}/#interview/payment-drop-diagnosis`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator("#interview-panel").waitFor();
  const aJobs = jobsData.jobs.filter((job) => ["A+", "A-"].includes(job.tier));
  assert.equal(await page.locator(".primary-nav button").count(), 3);
  assert.equal(await page.locator('.primary-nav button[data-view="interview"]').getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator("#interview-question-select option").count(), interviewPlan.questions.length);
  assert.equal(await page.locator("#interview-target-select option").count(), aJobs.length + 1);
  assert.equal(await page.locator("#interview-a-count").textContent(), String(aJobs.length));
  assert.equal(await page.locator("#interview-question-title").textContent(), "支付成功率突降诊断");
  assert.equal(await page.locator("#interview-framework-list li").count(), 5);
  assert.equal(await page.locator("#interview-evidence-list li").count(), 3);
  assert.equal(await page.locator("#interview-prep-followup-list li").count(), 3);
  assert.equal(await page.locator("#interview-pitfall-list li").count(), 2);
  assert.equal(await page.locator("#interview-evidence-heading").textContent(), "必须准备的事实");
  assert.match(await page.locator("#interview-guide-note").textContent(), /不要补造数字/);
  assert.equal(await page.locator("#interview-method-resources").isVisible(), true);
  assert.equal(await page.locator("#interview-method-resources").getAttribute("open"), null);
  assert.equal(
    await page.locator("#interview-method-resource-count").textContent(),
    String(interviewQuestionBank.methodSources.length),
  );
  const methodResourceLinks = page.locator(".interview-method-resource-link");
  assert.equal(await methodResourceLinks.count(), interviewQuestionBank.methodSources.length);
  await page.locator("#interview-method-resources > summary").click();
  assert.equal(await methodResourceLinks.first().isVisible(), true);
  for (const [index, source] of interviewQuestionBank.methodSources.entries()) {
    const link = methodResourceLinks.nth(index);
    assert.match(await link.textContent(), new RegExp(source.name));
    assert.match(await link.textContent(), new RegExp(source.provider));
    assert.match(await link.textContent(), new RegExp(source.focus));
    assert.equal(await link.getAttribute("href"), source.url);
    assert.equal(await link.getAttribute("target"), "_blank");
    const rel = new Set((await link.getAttribute("rel")).split(/\s+/));
    assert.ok(rel.has("noopener") && rel.has("noreferrer"));
  }
  assert.equal(
    requestedURLs.filter((url) => interviewQuestionBank.methodSources.some((source) => url === source.url)).length,
    0,
  );
  assert.equal(await page.locator("#interview-core-mode").getAttribute("aria-selected"), "true");
  assert.equal(await page.locator("#interview-bank-mode").getAttribute("aria-selected"), "false");
  assert.equal(await page.locator("#interview-bank-browser").isHidden(), true);
  assert.equal(await page.locator("#interview-bank-count").textContent(), String(interviewQuestionBank.questions.length));
  assert.equal(await page.locator("#interview-feedback").isHidden(), true);
  assert.equal(requestedURLs.filter((url) => url.includes("interview-plan.json")).length, 1);
  assert.equal(requestedURLs.filter((url) => url.includes("interview-question-bank.json")).length, 1);
  assert.equal(requestedURLs.filter((url) => url.includes("jobs.json")).length, 1);
  assert.equal(requestedURLs.filter((url) => url.includes("learning-guide.json")).length, 0);

  if (fullFlow) {
    const targetOption = page.locator("#interview-target-select option").nth(1);
    const targetId = await targetOption.getAttribute("value");
    const target = aJobs.find((job) => job.id === targetId);
    await page.locator("#interview-target-select").selectOption(targetId);
    await page.locator("#interview-question-select").selectOption("why-role-90-days");
    assert.match(await page.locator("#interview-question-prompt").textContent(), new RegExp(target.company));

    await page.locator("#interview-question-select").selectOption("fit-introduction");
    await page.locator("#interview-use-template").click();
    assert.match(await page.locator("#interview-answer").inputValue(), /^现在：/);
    assert.match(
      await page.evaluate(() => localStorage.getItem("recruitment-interview-drafts-v1")),
      /fit-introduction/,
    );

    const weakAnswer = "我负责过一个支付增长项目。我们做了很多分析，也积极推动产品上线，最后效果比较好。项目没有达到最初目标，我后来做了复盘。";
    await page.locator("#interview-answer").fill(weakAnswer);
    await page.locator("#interview-analyze-answer").click();
    await page.locator("#interview-feedback").waitFor();
    assert.notEqual(await page.locator("#interview-coverage-score").textContent(), "5 / 5");
    assert.equal(await page.locator("#interview-improvement-list li").count(), 2);
    assert.match(await page.locator("#interview-improvement-list").textContent(), /模糊|基线|数字/);

    const strongAnswer = [
      "我有 8 年国际支付和增长策略运营经验，核心标签是用数据诊断跨境商家转化问题并推动产品落地。",
      "过去一年我主导商家钱包首笔增长项目，通过漏斗分析定位配置环节阻力，并协调产品和技术完成流程改造；3 个月内有效首笔率从 28% 提升到 38%，投诉率保持在 0.5% 以下。",
      "另一个项目中，我设计分层实验并推动区域团队执行，使支付成功率提高 2.3 个百分点，季度净收入增长 12%。",
      "这些经历与目标岗位 JD 中的数据分析、增长策略和跨团队推进职责直接匹配。我选择这个岗位，是因为希望继续深耕国际支付，并能在入职后先贡献支付漏斗诊断和商业化落地经验。",
    ].join("");
    await page.locator("#interview-answer").fill(strongAnswer);
    await page.locator("#interview-analyze-answer").click();
    assert.equal(await page.locator("#interview-coverage-score").textContent(), "5 / 5");
    assert.equal(await page.locator("#interview-reviewed-count").textContent(), `1 / ${interviewPlan.questions.length}`);
    assert.deepEqual(
      await page.evaluate(() => JSON.parse(localStorage.getItem("recruitment-interview-reviewed-v1"))),
      ["fit-introduction"],
    );
    await page.locator("#interview-answer").fill(`${strongAnswer}。`);
    assert.equal(await page.locator("#interview-feedback").isHidden(), true);
    assert.equal(await page.locator("#interview-reviewed-count").textContent(), `0 / ${interviewPlan.questions.length}`);
    await page.locator("#interview-analyze-answer").click();
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("#interview-panel").waitFor();
    assert.match(await page.locator("#interview-answer").inputValue(), /8 年国际支付/);
    assert.match(page.url(), /#interview\/fit-introduction$/);

    await page.locator("#interview-bank-mode").click();
    assert.equal(await page.locator("#interview-bank-mode").getAttribute("aria-selected"), "true");
    assert.equal(await page.locator(".interview-method-resource-link").count(), interviewQuestionBank.methodSources.length);
    assert.equal(await page.locator("#interview-bank-browser").isVisible(), true);
    assert.equal(await page.locator("#interview-question-select option").count(), interviewQuestionBank.questions.length);
    assert.equal(await page.locator(".interview-bank-item").count(), interviewQuestionBank.questions.length);
    assert.equal(await page.locator("#interview-bank-relevant").isDisabled(), false);
    await page.locator("#interview-bank-relevant").check();
    const relevantQuestionCount = await page.locator(".interview-bank-item").count();
    assert.ok(relevantQuestionCount > 0 && relevantQuestionCount < interviewQuestionBank.questions.length);
    await page.locator("#interview-bank-relevant").uncheck();
    await page.locator("#interview-bank-search").fill("供给结构");
    assert.equal(await page.locator(".interview-bank-item").count(), 1);
    assert.equal(await page.locator("#interview-bank-result-count").textContent(), "1 题 · 已检查 0");
    await page.locator(".interview-bank-item").click();
    assert.equal(await page.locator("#interview-question-title").textContent(), "供给结构与商家生态诊断");
    assert.match(await page.locator("#interview-answer-edge").textContent(), /招商|需求侧/);
    assert.equal(await page.locator("#interview-evidence-heading").textContent(), "回答前先明确");
    assert.match(await page.locator("#interview-guide-note").textContent(), /明确假设|未知结果/);
    assert.match(page.url(), /#interview\/merchant-supply-structure$/);

    const bankAnswer = [
      "我的判断是先按品类和价格带定义需求缺口，不会直接扩大招商数量。",
      "我会拆解新老商家队列、生命周期漏斗和头部集中度，用数据验证问题来自招商质量、冷启动还是流量机制。",
      "优先选择高需求但有效供给不足的品类做试点，为潜力商家设计成长干预，同时设置 GMV、活跃供给、60 天留存、投诉和 ROI 护栏。",
      "试点复盘后，只有增量成立且供给质量稳定才扩展；无效商家进入清退机制。",
    ].join("");
    await page.locator("#interview-answer").fill(bankAnswer);
    await page.locator("#interview-analyze-answer").click();
    await page.locator("#interview-feedback").waitFor();
    assert.equal(await page.locator("#interview-reviewed-count").textContent(), `1 / ${interviewPlan.questions.length}`);
    assert.match(await page.locator(".interview-bank-item").textContent(), /已检查/);
    assert.equal(await page.locator(".interview-bank-arrow").textContent(), "✓");
    assert.deepEqual(
      new Set(await page.evaluate(() => JSON.parse(localStorage.getItem("recruitment-interview-reviewed-v1")))),
      new Set(["fit-introduction", "merchant-supply-structure"]),
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("#interview-panel").waitFor();
    assert.equal(await page.locator("#interview-bank-mode").getAttribute("aria-selected"), "true");
    assert.match(await page.locator("#interview-answer").inputValue(), /需求缺口/);
    assert.match(page.url(), /#interview\/merchant-supply-structure$/);

    await page.evaluate(() => { location.hash = "#interview"; });
    await page.locator("#interview-panel").waitFor();
    await page.waitForFunction(() => document.querySelector("#interview-question-title")?.textContent === "两分钟自我介绍与岗位匹配");
    assert.equal(await page.locator("#interview-core-mode").getAttribute("aria-selected"), "true");
    assert.match(page.url(), /#interview$/);
    await page.evaluate(() => { location.hash = "#interview/not-a-real-question"; });
    await page.waitForURL(/#interview\/fit-introduction$/);
    assert.equal(await page.locator("#interview-question-title").textContent(), "两分钟自我介绍与岗位匹配");
  } else {
    assert.equal(await page.locator(".interview-navigation").isHidden(), true);
    await page.locator("#interview-analyze-answer").click();
    assert.equal(await page.locator("#interview-feedback").isHidden(), true);
    assert.match(await page.locator("#interview-input-message").textContent(), /至少 40 个/);
    await page.locator("#interview-bank-mode").click();
    assert.equal(await page.locator("#interview-bank-browser").isVisible(), true);
    assert.equal(await page.locator("#interview-bank-relevant").isDisabled(), true);
    await page.locator("#interview-bank-search").fill("不存在的题目关键词");
    assert.equal(await page.locator(".interview-bank-item").count(), 0);
    assert.equal(await page.locator("#interview-bank-empty").isVisible(), true);
    await page.locator("#interview-bank-search").fill("");
    assert.equal(await page.locator(".interview-bank-item").count(), interviewQuestionBank.questions.length);
  }

  const layout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    offenders: [...document.querySelectorAll("body *")]
      .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .slice(0, 8)
      .map((element) => `${element.tagName.toLowerCase()}.${element.className}`),
  }));
  assert.ok(layout.overflow <= 1, `interview horizontal overflow: ${layout.overflow}px (${layout.offenders.join(", ")})`);
  assert.deepEqual(errors, []);
  if (screenshotPath) await page.screenshot({ path: screenshotPath, fullPage: false });
  await page.close();
}

async function checkInterviewBankFallback(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/interview-question-bank.json", (route) => route.fulfill({
    status: 404,
    contentType: "application/json",
    body: JSON.stringify({ error: "not found" }),
  }));
  await page.goto(`${baseURL}/#interview/payment-drop-diagnosis`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator("#interview-panel").waitFor();
  assert.equal(await page.locator("#interview-question-title").textContent(), "支付成功率突降诊断");
  assert.equal(await page.locator("#interview-question-select option").count(), interviewPlan.questions.length);
  assert.equal(await page.locator("#interview-bank-mode").isDisabled(), true);
  assert.equal(await page.locator("#interview-bank-count").textContent(), "0");
  assert.equal(await page.locator("#interview-evidence-list li").count(), 3);
  assert.equal(await page.locator("#interview-method-resources").isHidden(), true);
  assert.ok(errors.every((message) => /Failed to load resource:.*404/.test(message)));
  await page.close();
}

async function checkGlossaryReadAloud(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const requestedURLs = [];
  const audioRequests = [];
  const errors = [];
  page.on("request", (request) => {
    requestedURLs.push(request.url());
    if (request.url().includes("/audio/core-vocabulary/")) {
      audioRequests.push({
        resourceType: request.resourceType(),
        range: request.headers().range,
      });
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route(`${coreVocabularyAudioBase}/**`, async (route) => {
    const filename = path.basename(new URL(route.request().url()).pathname);
    await route.fulfill({
      status: 200,
      contentType: "audio/mpeg",
      path: path.join(__dirname, "..", "audio", "core-vocabulary", filename),
    });
  });

  await page.goto(`${baseURL}/#glossary/core-vocabulary`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator(".glossary-entry").first().waitFor();
  assert.equal(await page.locator(".glossary-entry").count(), 20);
  assert.equal(await page.locator(".glossary-ipa").count(), 20);
  assert.equal(await page.locator(".glossary-ipa").first().textContent(), "/ˈpeɪmənt/");
  assert.equal(await page.locator(".glossary-page-picker option").count(), 25);
  assert.equal(requestedURLs.filter((url) => url.includes("/audio/core-vocabulary/")).length, 0);

  const wordButton = page.locator(".glossary-entry").first().locator(".glossary-entry-header .glossary-speak-button");
  const wordResponsePromise = page.waitForResponse((response) => (
    new URL(response.url()).pathname.endsWith("/audio/core-vocabulary/001-word.mp3")
  ));
  await wordButton.click();
  const wordResponse = await wordResponsePromise;
  assert.ok([200, 206].includes(wordResponse.status()));
  assert.match(wordResponse.headers()["content-type"], /^audio\/(?:mpeg|mp3)/);
  assert.equal(new URL(wordResponse.url()).origin, "https://cdn.jsdelivr.net");
  assert.equal(new URL(wordResponse.url()).searchParams.get("v"), String(coreVocabulary.version));

  const interviewButton = page.locator(".glossary-entry").first()
    .locator(".glossary-interview-practice .glossary-speak-button");
  const interviewResponsePromise = page.waitForResponse((response) => (
    response.url().endsWith("/audio/core-vocabulary/001-interview.mp3")
  ));
  await interviewButton.click();
  const interviewResponse = await interviewResponsePromise;
  assert.ok([200, 206].includes(interviewResponse.status()));
  await interviewButton.locator("xpath=self::*[contains(@class, 'speaking')]").waitFor();
  assert.equal(await interviewButton.getAttribute("aria-pressed"), "true");

  await page.locator(".glossary-pagination button").last().click();
  assert.equal(await page.locator(".glossary-rank").first().textContent(), "021");
  assert.equal(await page.locator(".glossary-speak-button.speaking").count(), 0);
  assert.equal(requestedURLs.filter((url) => url.includes("/audio/core-vocabulary/")).length, 2);
  assert.deepEqual(audioRequests, [
    { resourceType: "fetch", range: undefined },
    { resourceType: "fetch", range: undefined },
  ]);
  assert.deepEqual(errors, []);
  await page.close();
}

async function checkSkillLevelMigration(browser) {
  const page = await browser.newPage();
  const requestedURLs = [];
  page.on("request", (request) => requestedURLs.push(request.url()));
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
  assert.equal(requestedURLs.filter((url) => url.includes("jobs.json")).length, 0);
  const levels = await page.evaluate(() => JSON.parse(localStorage.getItem("recruitment-skill-levels")));
  assert.equal(levels["data-diagnosis"], 3);
  assert.equal(levels["lifecycle-growth"], 4);
  assert.equal(levels["project-delivery"], 3);
  assert.equal(levels["metrics-results"], undefined);
  assert.equal(levels["strategy-design"], undefined);
  assert.equal(levels["product-data-ml"], undefined);
  assert.equal(levels["experience-assets"], undefined);
  await page.locator('.primary-nav button[data-view="jobs"]').click();
  await page.locator(".job-card").first().waitFor();
  assert.equal(requestedURLs.filter((url) => url.includes("jobs.json")).length, 1);
  await page.close();
}

async function checkBusinessEnglishProgressMigration(browser) {
  const page = await browser.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("recruitment-challenge-business-english", JSON.stringify([
      "business-writing/bluf-rewrite",
      "authorization-declines/authorization-declines-explain",
    ]));
  });
  await page.goto(
    `${baseURL}/#challenge/business-english/business-writing/bluf-rewrite`,
    { waitUntil: "domcontentloaded", timeout: 60000 },
  );
  await page.locator(".challenge-question-header").waitFor();
  assert.match(page.url(), /#challenge\/business-english\/payment-basics\/bluf-rewrite$/);
  assert.deepEqual(
    await page.evaluate(() => JSON.parse(localStorage.getItem("recruitment-challenge-business-english"))),
    [
      "payment-basics/bluf-rewrite",
      "payment-performance-operations/authorization-declines-explain",
    ],
  );
  await page.close();
}

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true });
  const screenshotDir = process.env.SCREENSHOT_DIR;
  try {
    await checkSkillLevelMigration(browser);
    await checkBusinessEnglishProgressMigration(browser);
    await checkGlossaryReadAloud(browser);
    await checkInterviewBankFallback(browser);
    await checkInterviewPractice(
      browser,
      { width: 1440, height: 1000 },
      screenshotDir ? path.join(screenshotDir, "interview-desktop.png") : null,
      true,
    );
    await checkInterviewPractice(
      browser,
      { width: 390, height: 844 },
      screenshotDir ? path.join(screenshotDir, "interview-mobile.png") : null,
    );
    await checkPage(
      browser,
      { width: 1440, height: 1000 },
      screenshotDir ? path.join(screenshotDir, "recruitment-desktop.png") : null,
    );
    await checkPage(
      browser,
      { width: 390, height: 844 },
      screenshotDir ? path.join(screenshotDir, "recruitment-mobile.png") : null,
    );
    console.log("Site checks passed for desktop and mobile viewports.");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
