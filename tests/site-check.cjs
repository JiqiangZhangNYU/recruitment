const { chromium } = require("playwright-core");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const guide = require("../learning-guide.json");
const interviewPlan = require("../interview-plan.json");
const interviewQuestionBank = require("../interview-question-bank.json");
const interviewSampleAnswers = require("../interview-sample-answers.json");
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

function resolveChromiumExecutable() {
  const configured = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    || process.env.CHROMIUM_EXECUTABLE_PATH
    || process.env.BROWSER_EXECUTABLE_PATH;
  if (configured) {
    assert.ok(fs.existsSync(configured), `Configured Chromium executable does not exist: ${configured}`);
    return configured;
  }

  const candidates = [];
  try {
    candidates.push(chromium.executablePath());
  } catch {
    // playwright-core may not have a bundled browser; local cache and system paths follow.
  }
  const cacheRoot = path.join(os.homedir(), ".cache", "ms-playwright");
  if (fs.existsSync(cacheRoot)) {
    fs.readdirSync(cacheRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^chromium-\d+$/.test(entry.name))
      .sort((left, right) => Number(right.name.split("-")[1]) - Number(left.name.split("-")[1]))
      .forEach((entry) => {
        candidates.push(path.join(cacheRoot, entry.name, "chrome-linux", "chrome"));
        candidates.push(path.join(cacheRoot, entry.name, "chrome-linux64", "chrome"));
      });
  }
  candidates.push(
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
  );
  return candidates.find((candidate) => candidate && fs.existsSync(candidate));
}

const executablePath = resolveChromiumExecutable();
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
assert.match(interviewSampleAnswers.persona.role, /WorldTrade.*目标岗位/);
assert.match(interviewSampleAnswers.persona.usageNote, /可核验|不要照背/);
assert.equal(interviewSampleAnswers.sources.length, 3);
assert.equal(new Set(interviewSampleAnswers.sources.map((source) => source.url)).size, 3);
assert.ok(interviewSampleAnswers.sources.every((source) => (
  source.name?.trim()
  && source.focus?.trim()
  && new URL(source.url).protocol === "https:"
)));
assert.deepEqual(new Set(Object.keys(interviewSampleAnswers.answers)), new Set(allInterviewQuestionIds));
assert.ok(Object.values(interviewSampleAnswers.answers).every((sample) => (
  sample.answer?.trim().length >= 180
  && sample.riskNote?.trim().length >= 20
)));
assert.ok(Object.values(interviewSampleAnswers.answers).every((sample) => (
  !/我(?:目前)?在.{0,24}WorldTrade.{0,24}(?:负责|任职|工作)/i.test(sample.answer)
)));
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
  const totalQuestions = interviewPlan.questions.length + interviewQuestionBank.questions.length;
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
  assert.equal(await page.locator("#interview-target-select option").count(), aJobs.length + 2);
  assert.equal(await page.locator("#interview-target-select").inputValue(), "worldtrade");
  assert.match(await page.locator("#interview-target-select option:checked").textContent(), /WorldTrade/);
  assert.equal(await page.locator("#interview-a-count").textContent(), String(aJobs.length));
  assert.equal(await page.locator("#interview-question-title").textContent(), "支付成功率突降诊断");
  assert.equal(await page.locator("#interview-framework-list li").count(), 5);
  assert.equal(await page.locator("#interview-evidence-list li").count(), 3);
  assert.equal(await page.locator("#interview-prep-followup-list li").count(), 3);
  assert.equal(await page.locator("#interview-pitfall-list li").count(), 2);
  assert.equal(await page.locator("#interview-evidence-heading").textContent(), "必须准备的事实");
  assert.match(await page.locator("#interview-guide-note").textContent(), /不要补造数字/);
  await page.locator("#interview-guidance > summary").click();
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
  await page.locator("#interview-guidance > summary").click();
  assert.equal(await page.locator("#interview-core-mode").getAttribute("aria-selected"), "true");
  assert.equal(await page.locator("#interview-bank-mode").getAttribute("aria-selected"), "false");
  assert.equal(await page.locator("#interview-bank-browser").isHidden(), true);
  assert.equal(await page.locator("#interview-bank-count").textContent(), String(interviewQuestionBank.questions.length));
  assert.equal(await page.locator("#interview-feedback").isHidden(), true);
  assert.equal(await page.locator("#interview-sample-step").isVisible(), true);
  assert.equal(await page.locator("#interview-sample-answer").getAttribute("open"), null);
  await page.locator("#interview-sample-answer > summary").click();
  assert.equal(await page.locator("#interview-sample-lock").isVisible(), true);
  assert.match(await page.locator("#interview-sample-lock").textContent(), /完成一版有效回答/);
  assert.equal(await page.locator("#interview-sample-full").isHidden(), true);
  assert.equal(await page.locator("#interview-sample-outline li").count(), 5);
  assert.match(await page.locator("#interview-sample-note").textContent(), /方括号.*可核验/);
  assert.match(await page.locator(".interview-sample-source-note").textContent(), /仅用于核对公开产品边界.*不为.*背书/);
  const sampleSourceLinks = page.locator("#interview-sample-sources a");
  assert.equal(await sampleSourceLinks.count(), interviewSampleAnswers.sources.length);
  for (const [index, source] of interviewSampleAnswers.sources.entries()) {
    assert.equal(await sampleSourceLinks.nth(index).getAttribute("href"), source.url);
    assert.equal(await sampleSourceLinks.nth(index).getAttribute("target"), "_blank");
  }
  assert.equal(
    requestedURLs.filter((url) => interviewSampleAnswers.sources.some((source) => source.url === url)).length,
    0,
  );
  const sampleScores = await page.evaluate((answers) => Object.entries(answers).map(([id, sample]) => {
    const question = findInterviewQuestion(id);
    const result = analyzeInterviewAnswer(sample.answer, question);
    return { id, score: result.passed.length };
  }), interviewSampleAnswers.answers);
  assert.ok(
    sampleScores.every(({ score }) => score >= 4),
    `reference samples below 4 / 5: ${sampleScores.filter(({ score }) => score < 4).map(({ id, score }) => `${id}=${score}`).join(", ")}`,
  );
  assert.equal(requestedURLs.filter((url) => url.includes("interview-plan.json")).length, 1);
  assert.equal(requestedURLs.filter((url) => url.includes("interview-question-bank.json")).length, 1);
  assert.equal(requestedURLs.filter((url) => url.includes("interview-sample-answers.json")).length, 1);
  assert.equal(requestedURLs.filter((url) => url.includes("jobs.json")).length, 1);
  assert.equal(requestedURLs.filter((url) => url.includes("learning-guide.json")).length, 0);

  if (fullFlow) {
    const target = aJobs[0];
    await page.locator("#interview-target-select").selectOption(target.id);
    await page.locator("#interview-question-select").selectOption("why-role-90-days");
    assert.match(await page.locator("#interview-question-prompt").textContent(), new RegExp(target.company));
    await page.locator("#interview-target-select").selectOption("worldtrade");

    await page.locator("#interview-question-select").selectOption("fit-introduction");
    await page.locator("#interview-story-bank > summary").click();
    await page.locator("#interview-story-title").fill("商家首笔激活项目");
    await page.locator("#interview-story-situation").fill("跨境商家开户后首笔转化偏低，需要在一个季度内定位阻力。");
    await page.locator("#interview-story-ownership").fill("我负责漏斗诊断、方案取舍与跨团队推进。");
    await page.locator("#interview-story-action").fill("我拆分商家队列，定位配置环节，并推动产品和技术改造流程。");
    await page.locator("#interview-story-result").fill("三个月内有效首笔率从 28% 提升到 38%。");
    await page.locator("#interview-story-reflection").fill("后续增加灰度护栏和投诉率复盘。");
    await page.locator("#interview-story-boundary").fill("不公开客户名和内部系统名。");
    await page.locator("#interview-bind-story").click();
    assert.equal(await page.locator("#interview-bound-story").isVisible(), true);
    assert.match(await page.locator("#interview-bound-story").textContent(), /商家首笔激活项目.*漏斗诊断/);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("#interview-panel").waitFor();
    assert.equal(await page.locator("#interview-story-title").inputValue(), "商家首笔激活项目");
    assert.match(await page.locator("#interview-story-result").inputValue(), /28%.*38%/);
    assert.equal(await page.locator("#interview-bound-story").isVisible(), true);
    assert.match(await page.locator("#interview-bound-story").textContent(), /商家首笔激活项目/);

    assert.equal(await page.locator("#interview-sample-answer").getAttribute("open"), null);
    await page.locator("#interview-sample-answer > summary").click();
    assert.equal(await page.locator("#interview-sample-full").isHidden(), true);
    assert.match(await page.locator("#interview-sample-lock").textContent(), /完成一版有效回答/);
    await page.locator("#interview-guidance > summary").click();
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
    assert.equal(await page.locator("#interview-feedback-title").textContent(), "第一版已完成");
    assert.match(await page.locator("#interview-save-status").textContent(), /已尝试/);
    assert.notEqual(await page.locator("#interview-coverage-score").textContent(), "5 项线索");
    assert.equal(await page.locator("#interview-improvement-list li").count(), 1);
    assert.match(await page.locator("#interview-improvement-list").textContent(), /模糊|基线|数字/);
    assert.equal(await page.locator("#interview-reviewed-count").textContent(), `1 / ${totalQuestions}`);
    assert.equal(await page.locator("#interview-progress-detail").textContent(), "已复练 0 · 待复查 0");
    const firstAttempt = await page.evaluate(() => (
      JSON.parse(localStorage.getItem("recruitment-interview-attempts-v2"))["fit-introduction"]
    ));
    assert.equal(firstAttempt.status, "attempted");
    assert.equal(firstAttempt.checkCount, 1);
    assert.equal(firstAttempt.first.text, weakAnswer);
    assert.equal(firstAttempt.latest.text, weakAnswer);

    await page.locator("#interview-sample-answer > summary").click();
    assert.equal(await page.locator("#interview-sample-lock").isHidden(), true);
    assert.equal(await page.locator("#interview-sample-full").isVisible(), true);
    await page.locator("#interview-sample-full > summary").click();
    assert.match(await page.locator("#interview-sample-answer-text").textContent(), /应聘的是蚂蚁国际万里汇 WorldTrade/);

    const followUpAnswer = "我会先核对分母和商家队列，再用同口径的前后数据解释提升。";
    await page.locator("#interview-follow-up-answer").fill(followUpAnswer);
    await page.locator("#interview-complete-follow-up").click();
    assert.equal(await page.locator("#interview-follow-up-status").textContent(), "追问回答已记录在本机");

    const strongAnswer = [
      "我有 8 年国际支付和增长策略运营经验，核心标签是用数据诊断跨境商家转化问题并推动产品落地。",
      "过去一年我主导商家钱包首笔增长项目，通过漏斗分析定位配置环节阻力，并协调产品和技术完成流程改造；3 个月内有效首笔率从 28% 提升到 38%，投诉率保持在 0.5% 以下。",
      "另一个项目中，我设计分层实验并推动区域团队执行，使支付成功率提高 2.3 个百分点，季度净收入增长 12%。",
      "这些经历与目标岗位 JD 中的数据分析、增长策略和跨团队推进职责直接匹配。我选择这个岗位，是因为希望继续深耕国际支付，并能在入职后先贡献支付漏斗诊断和商业化落地经验。",
    ].join("");
    await page.locator("#interview-answer").fill(strongAnswer);
    assert.equal(await page.locator("#interview-feedback").isVisible(), true);
    assert.equal(await page.locator("#interview-feedback-title").textContent(), "回答已修改，等待复查");
    assert.equal(await page.locator("#interview-feedback-state").textContent(), "基于上一版的本地提示");
    assert.match(await page.locator("#interview-save-status").textContent(), /待复查/);
    assert.equal(await page.locator("#interview-reviewed-count").textContent(), `1 / ${totalQuestions}`);
    assert.equal(await page.locator("#interview-progress-detail").textContent(), "已复练 0 · 待复查 1");
    assert.equal(await page.locator("#interview-version-comparison").isHidden(), true);
    assert.equal(
      await page.evaluate(() => JSON.parse(localStorage.getItem("recruitment-interview-attempts-v2"))["fit-introduction"].latest.text),
      weakAnswer,
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("#interview-panel").waitFor();
    assert.match(await page.locator("#interview-answer").inputValue(), /8 年国际支付/);
    assert.match(page.url(), /#interview\/fit-introduction$/);
    assert.equal(await page.locator("#interview-feedback").isVisible(), true);
    assert.equal(await page.locator("#interview-feedback-title").textContent(), "回答已修改，等待复查");
    assert.equal(await page.locator("#interview-follow-up-answer").inputValue(), followUpAnswer);
    assert.equal(await page.locator("#interview-follow-up-status").textContent(), "追问回答已记录在本机");
    await page.locator("#interview-recheck-answer").click();
    assert.equal(await page.locator("#interview-feedback-title").textContent(), "复练版已保存");
    assert.equal(await page.locator("#interview-coverage-score").textContent(), "5 项线索");
    assert.match(await page.locator("#interview-save-status").textContent(), /已复练/);
    assert.equal(await page.locator("#interview-progress-detail").textContent(), "已复练 1 · 待复查 0");
    assert.equal(await page.locator("#interview-version-comparison").isVisible(), true);
    assert.match(await page.locator("#interview-version-summary").textContent(), /补上了|两版已经保存/);
    assert.match(await page.locator("#interview-version-first").textContent(), /效果比较好/);
    assert.match(await page.locator("#interview-version-latest").textContent(), /8 年国际支付/);
    const repracticedAttempt = await page.evaluate(() => (
      JSON.parse(localStorage.getItem("recruitment-interview-attempts-v2"))["fit-introduction"]
    ));
    assert.equal(repracticedAttempt.status, "repracticed");
    assert.equal(repracticedAttempt.checkCount, 2);
    assert.equal(repracticedAttempt.first.text, weakAnswer);
    assert.equal(repracticedAttempt.latest.text, strongAnswer);
    assert.match(await page.locator("#interview-follow-up-status").textContent(), /上一版主回答/);
    await page.locator("#interview-complete-follow-up").click();
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("#interview-panel").waitFor();
    assert.equal(await page.locator("#interview-feedback-title").textContent(), "复练版已保存");
    assert.equal(await page.locator("#interview-version-comparison").isVisible(), true);
    assert.equal(await page.locator("#interview-follow-up-answer").inputValue(), followUpAnswer);
    assert.equal(await page.locator("#interview-follow-up-status").textContent(), "追问回答已记录在本机");

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
    assert.equal(await page.locator("#interview-bank-result-count").textContent(), "1 题 · 已练 0");
    await page.locator(".interview-bank-item").click();
    assert.equal(await page.locator("#interview-question-title").textContent(), "供给结构与商家生态诊断");
    assert.match(await page.locator("#interview-answer-edge").textContent(), /招商|需求侧/);
    assert.equal(await page.locator("#interview-evidence-heading").textContent(), "回答前先明确");
    assert.match(await page.locator("#interview-guide-note").textContent(), /明确假设|未知结果/);
    await page.locator("#interview-sample-answer > summary").click();
    assert.equal(await page.locator("#interview-sample-full").isHidden(), true);
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
    assert.equal(await page.locator("#interview-reviewed-count").textContent(), `2 / ${totalQuestions}`);
    assert.match(await page.locator(".interview-bank-item").textContent(), /已尝试/);
    assert.equal(await page.locator(".interview-bank-arrow").textContent(), "•");
    await page.locator("#interview-sample-answer > summary").click();
    assert.equal(await page.locator("#interview-sample-full").isVisible(), true);
    await page.locator("#interview-sample-full > summary").click();
    assert.match(await page.locator("#interview-sample-answer-text").textContent(), /平台供给题|WorldTrade/);
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

    await page.locator("#interview-target-select").selectOption(target.id);
    await page.locator("#interview-bank-mode").click();
    await page.locator('#interview-question-select option[value="career-transition-motivation"]').waitFor({ state: "attached" });
    await page.locator("#interview-question-select").selectOption("career-transition-motivation");
    const motivationAnswer = "我选择转向跨境支付增长，是因为过去的商家增长项目让我确认，自己的优势是用数据定位转化问题并推动多团队落地。这个岗位要求的数据分析、商业结果和国际协作与我的真实经历直接匹配；入职后我会先梳理商家分层与支付漏斗，用 30、60、90 天验证优先机会。";
    await page.locator("#interview-answer").fill(motivationAnswer);
    await page.locator("#interview-analyze-answer").click();
    await page.locator("#interview-sample-answer > summary").click();
    assert.match(await page.locator("#interview-sample-note").textContent(), /不是 WorldTrade.*只可借用结构/);
    assert.match(await page.locator("#interview-sample-lock").textContent(), /固定 WorldTrade 范文不适用.*完整范文已隐藏/);
    assert.equal(await page.locator("#interview-sample-lock").isVisible(), true);
    assert.equal(await page.locator("#interview-sample-full").isHidden(), true);

    page.once("dialog", (dialog) => dialog.accept());
    await page.locator("#interview-clear-data").click();
    await page.waitForFunction(() => document.querySelector("#interview-input-message")?.textContent.includes("本机面试数据已清除"));
    assert.equal(await page.locator("#interview-target-select").inputValue(), "worldtrade");
    assert.equal(await page.locator("#interview-reviewed-count").textContent(), `0 / ${totalQuestions}`);
    assert.equal(await page.locator("#interview-progress-detail").textContent(), "已复练 0 · 待复查 0");
    assert.equal(await page.locator("#interview-answer").inputValue(), "");
    assert.equal(await page.locator("#interview-feedback").isHidden(), true);
    assert.equal(await page.locator("#interview-story-summary").textContent(), "0 / 5 已填写");
    assert.equal(await page.locator("#interview-story-title").inputValue(), "代表性增长项目");
    await page.locator("#interview-core-mode").click();
    await page.locator("#interview-question-select").selectOption("fit-introduction");
    assert.equal(await page.locator("#interview-bound-story").isHidden(), true);
    const clearedTextData = await page.evaluate(() => ({
      drafts: localStorage.getItem("recruitment-interview-drafts-v1"),
      attempts: JSON.parse(localStorage.getItem("recruitment-interview-attempts-v2") || "{}"),
      reviewed: JSON.parse(localStorage.getItem("recruitment-interview-reviewed-v1") || "[]"),
      followUps: localStorage.getItem("recruitment-interview-follow-ups-v1"),
      stories: localStorage.getItem("recruitment-interview-stories-v1"),
      bindings: localStorage.getItem("recruitment-interview-story-bindings-v1"),
      target: localStorage.getItem("recruitment-interview-target-v1"),
    }));
    assert.equal(clearedTextData.drafts, null);
    assert.deepEqual(clearedTextData.attempts, {});
    assert.deepEqual(clearedTextData.reviewed, []);
    assert.equal(clearedTextData.followUps, null);
    assert.equal(clearedTextData.stories, null);
    assert.equal(clearedTextData.bindings, null);
    assert.equal(clearedTextData.target, null);
  } else {
    assert.equal(await page.locator(".interview-navigation").isHidden(), true);
    const mobileAnswerDistance = await page.evaluate(() => {
      const questionTop = document.querySelector(".interview-question-step").getBoundingClientRect().top;
      const answerTop = document.querySelector("#interview-answer").getBoundingClientRect().top;
      return { distance: answerTop - questionTop, viewportHeight: window.innerHeight };
    });
    assert.ok(
      mobileAnswerDistance.distance < mobileAnswerDistance.viewportHeight,
      `mobile answer entrance is ${mobileAnswerDistance.distance}px below the question (viewport ${mobileAnswerDistance.viewportHeight}px)`,
    );
    await page.locator("#interview-analyze-answer").click();
    assert.equal(await page.locator("#interview-feedback").isVisible(), true);
    assert.equal(await page.locator("#interview-feedback-title").textContent(), "还没有形成首版");
    assert.equal(await page.locator("#interview-coverage-score").textContent(), "0 项线索");
    assert.match(await page.locator("#interview-feedback-summary").textContent(), /空回答不会计入进度/);
    assert.equal(await page.locator("#interview-reviewed-count").textContent(), `0 / ${totalQuestions}`);
    assert.deepEqual(
      await page.evaluate(() => JSON.parse(localStorage.getItem("recruitment-interview-reviewed-v1") || "[]")),
      [],
    );
    assert.equal(await page.locator("#interview-input-message").isHidden(), true);
    assert.equal(await page.locator("#interview-sample-full").isHidden(), true);
    await page.locator("#interview-bank-mode").click();
    assert.equal(await page.locator("#interview-bank-browser").isVisible(), true);
    await page.locator("#interview-bank-browser > summary").click();
    assert.equal(await page.locator("#interview-bank-relevant").isDisabled(), false);
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
  assert.equal(await page.locator("#interview-sample-step").isVisible(), true);
  assert.ok(errors.every((message) => /Failed to load resource:.*404/.test(message)));
  await page.close();
}

async function checkInterviewRecording(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const requestedURLs = [];
  const errors = [];
  page.on("request", (request) => requestedURLs.push(request.url()));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.__interviewTrackStops = 0;
    window.__interviewURLRevokes = 0;
    window.__interviewTracks = [];
    const revokeObjectURL = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = (url) => {
      window.__interviewURLRevokes += 1;
      revokeObjectURL(url);
    };
    class FakeMediaRecorder extends EventTarget {
      constructor(stream, options = {}) {
        super();
        this.stream = stream;
        this.mimeType = options.mimeType || "audio/mp4";
        this.state = "inactive";
      }

      start() {
        this.state = "recording";
      }

      stop() {
        if (this.state === "inactive") return;
        this.state = "inactive";
        queueMicrotask(() => {
          const dataEvent = new Event("dataavailable");
          Object.defineProperty(dataEvent, "data", {
            value: new Blob(["recorded interview answer"], { type: this.mimeType }),
          });
          this.dispatchEvent(dataEvent);
          this.dispatchEvent(new Event("stop"));
        });
      }

      static isTypeSupported(type) {
        return type === "audio/mp4";
      }
    }
    window.__interviewGrantMicrophone = async () => {
      const track = new EventTarget();
      track.stop = () => { window.__interviewTrackStops += 1; };
      window.__interviewTracks.push(track);
      return { getTracks: () => [track] };
    };
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: FakeMediaRecorder });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: window.__interviewGrantMicrophone },
    });
  });

  const waitForArchiveCount = async (count) => {
    await page.waitForFunction((expected) => {
      const list = document.querySelector("#interview-recording-list");
      const rows = list?.querySelectorAll(".interview-recording-row").length || 0;
      if (rows !== expected) return false;
      return expected > 0 || list?.querySelector(".interview-recording-empty")?.textContent.includes("还没有本机录音");
    }, count);
  };
  const recordOne = async (expectedCount) => {
    await page.locator("#interview-record-answer").click();
    await page.waitForFunction(() => document.querySelector("#interview-recording-status")?.textContent.startsWith("录音中"));
    assert.equal(await page.locator("#interview-stop-recording").isEnabled(), true);
    assert.equal(await page.locator("#interview-record-answer").isDisabled(), true);
    await page.locator("#interview-stop-recording").click();
    await waitForArchiveCount(expectedCount);
    assert.equal(await page.locator("#interview-recording-playback").isVisible(), true);
    assert.match(await page.locator("#interview-recording-status").textContent(), /已自动保存到本机|本机已留档/);
  };

  await page.goto(`${baseURL}/#interview/fit-introduction`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator("#interview-panel").waitFor();
  await waitForArchiveCount(0);
  assert.equal(await page.locator("#interview-record-answer").isEnabled(), true);
  assert.equal(await page.locator("#interview-recording-playback").isHidden(), true);
  await recordOne(1);
  assert.equal(await page.locator("#interview-record-answer").textContent(), "再录一版");
  assert.ok(await page.evaluate(() => window.__interviewTrackStops >= 1));
  const firstRecording = await page.evaluate(async () => {
    const records = await window.InterviewRecordingStore.list("fit-introduction");
    return { count: records.length, size: records[0]?.blob.size, questionId: records[0]?.questionId };
  });
  assert.deepEqual(firstRecording, {
    count: 1,
    size: new Blob(["recorded interview answer"]).size,
    questionId: "fit-introduction",
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#interview-panel").waitFor();
  await waitForArchiveCount(1);
  assert.equal(await page.locator("#interview-recording-playback").isVisible(), true);
  assert.match(await page.locator("#interview-recording-status").textContent(), /本机已留档 1 条/);
  await recordOne(2);

  await page.locator("#interview-question-select").selectOption("signature-project");
  await waitForArchiveCount(0);
  assert.equal(await page.locator("#interview-recording-playback").isHidden(), true);
  await recordOne(1);
  await page.locator("#interview-question-select").selectOption("fit-introduction");
  await waitForArchiveCount(2);
  assert.equal(await page.locator("#interview-recording-playback").isVisible(), true);
  assert.equal(await page.locator(".interview-recording-row").count(), 2);

  await page.locator("#interview-record-answer").click();
  await page.waitForFunction(() => document.querySelector("#interview-recording-status")?.textContent.startsWith("录音中"));
  const fitRecordingIds = await page.evaluate(async () => (
    (await window.InterviewRecordingStore.list("fit-introduction")).map((recording) => recording.id)
  ));
  await page.evaluate(() => window.__interviewTracks.at(-1).dispatchEvent(new Event("ended")));
  await page.waitForFunction(() => document.querySelector("#interview-recording-status")?.textContent.includes("设备或系统中断"));
  await waitForArchiveCount(2);
  assert.deepEqual(
    await page.evaluate(async () => (
      (await window.InterviewRecordingStore.list("fit-introduction")).map((recording) => recording.id)
    )),
    fitRecordingIds,
  );

  await page.locator("#interview-record-answer").click();
  await page.waitForFunction(() => document.querySelector("#interview-recording-status")?.textContent.startsWith("录音中"));
  await page.evaluate(() => {
    window.__interviewVisibilityState = "hidden";
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => window.__interviewVisibilityState,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForFunction(() => document.querySelector("#interview-recording-status")?.textContent.includes("切换后台中断"));
  await waitForArchiveCount(2);
  assert.deepEqual(
    await page.evaluate(async () => (
      (await window.InterviewRecordingStore.list("fit-introduction")).map((recording) => recording.id)
    )),
    fitRecordingIds,
  );
  await page.evaluate(() => {
    window.__interviewVisibilityState = "visible";
    document.dispatchEvent(new Event("visibilitychange"));
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#interview-panel").waitFor();
  await waitForArchiveCount(2);
  assert.equal(await page.locator("#interview-recording-playback").isVisible(), true);
  await page.locator("#interview-question-select").selectOption("signature-project");
  await waitForArchiveCount(1);
  assert.equal(await page.locator("#interview-recording-playback").isVisible(), true);
  assert.equal(
    await page.evaluate(async () => (await window.InterviewRecordingStore.list("signature-project")).length),
    1,
  );
  await page.locator("#interview-question-select").selectOption("fit-introduction");
  await waitForArchiveCount(2);

  await page.locator("#interview-answer").fill("我负责跨境商家增长项目，通过漏斗分析定位首笔转化阻力，并推动产品和技术落地改造，三个月内首笔率从 28% 提升到 38%。");
  await page.locator("#interview-analyze-answer").click();
  await page.locator("#interview-follow-up-answer").fill("我会先核对同口径分母，再说明实验组和对照组差异。");
  await page.locator("#interview-complete-follow-up").click();
  await page.locator("#interview-story-bank > summary").click();
  await page.locator("#interview-story-title").fill("清除前的经历卡");
  await page.locator("#interview-story-action").fill("用于验证统一清除入口。");
  await page.locator("#interview-bind-story").click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("#interview-clear-data").click();
  await page.waitForFunction(() => document.querySelector("#interview-input-message")?.textContent.includes("本机面试数据已清除"));
  await waitForArchiveCount(0);
  assert.equal(await page.locator("#interview-recording-playback").isHidden(), true);
  assert.deepEqual(await page.evaluate(async () => window.InterviewRecordingStore.list()), []);
  assert.equal(await page.locator("#interview-answer").inputValue(), "");
  assert.equal(await page.locator("#interview-feedback").isHidden(), true);
  assert.equal(await page.locator("#interview-story-title").inputValue(), "代表性增长项目");
  assert.equal(await page.locator("#interview-bound-story").isHidden(), true);

  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const error = new Error("permission denied");
      error.name = "NotAllowedError";
      throw error;
    };
  });
  await page.locator("#interview-record-answer").click();
  await page.waitForFunction(() => document.querySelector("#interview-recording-status")?.textContent.includes("麦克风权限"));
  assert.equal(await page.locator("#interview-record-answer").isEnabled(), true);
  assert.equal(requestedURLs.filter((url) => url.includes("interview-sample-answers.json")).length, 3);
  assert.deepEqual(errors, []);
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
  const browser = await chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: true,
  });
  const screenshotDir = process.env.SCREENSHOT_DIR;
  try {
    await checkSkillLevelMigration(browser);
    await checkBusinessEnglishProgressMigration(browser);
    await checkGlossaryReadAloud(browser);
    await checkInterviewBankFallback(browser);
    await checkInterviewRecording(browser);
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
