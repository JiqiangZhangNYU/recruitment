function readStoredJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function learningRouteFromHash(hash) {
  if (hash === "#skills") return { page: "overview", skillId: null };
  if (hash === "#roadmap" || hash === "#portfolio") return { page: "overview", skillId: null };
  if (hash.startsWith("#glossary/")) {
    const requestedSkillId = decodeURIComponent(hash.slice(10));
    const skillId = requestedSkillId === "business-english" ? "core-vocabulary" : requestedSkillId;
    if (skillId) return { page: "challengeGlossary", skillId, levelId: null, questionId: null };
  }
  if (hash.startsWith("#challenge/")) {
    const [skillId, levelId, questionId] = hash.slice(11).split("/").map((part) => decodeURIComponent(part || ""));
    if (skillId && levelId && questionId) return { page: "challengeQuestion", skillId, levelId, questionId };
    if (skillId && levelId) return { page: "challengeLevel", skillId, levelId, questionId: null };
    if (skillId) return { page: "detail", skillId, levelId: null, questionId: null };
  }
  if (hash.startsWith("#skill-")) return { page: "detail", skillId: decodeURIComponent(hash.slice(7)) };
  return null;
}

function interviewRouteFromHash(hash) {
  if (hash === "#interview") return { questionId: null };
  if (hash.startsWith("#interview/")) {
    const questionId = decodeURIComponent(hash.slice(11));
    return { questionId: questionId || null };
  }
  return null;
}

const initialInterviewRoute = interviewRouteFromHash(location.hash);
const initialLearningRoute = initialInterviewRoute ? null : learningRouteFromHash(location.hash);
const directLearningAssets = {
  "core-vocabulary": {
    manifest: "challenges/core-vocabulary/manifest.json",
    glossary: {
      count: 500,
      file: "challenges/core-vocabulary/glossary.json",
    },
  },
};

const legacySkillIds = {
  "sql-excel": "data-diagnosis",
  "metrics-funnel": "data-diagnosis",
  lifecycle: "lifecycle-growth",
  strategy: "lifecycle-growth",
  project: "project-delivery",
  insight: "research-insight",
  experimentation: "experimentation",
  payments: "payments-fintech",
  ecommerce: "ecommerce-merchants",
  english: "business-english",
};
const legacyMasteredValue = readStoredJSON("recruitment-mastered-skills", []);
const legacyMasteredSkills = Array.isArray(legacyMasteredValue) ? legacyMasteredValue : [];
const storedSkillLevelsValue = readStoredJSON("recruitment-skill-levels", {});
const storedSkillLevels = storedSkillLevelsValue && typeof storedSkillLevelsValue === "object" && !Array.isArray(storedSkillLevelsValue)
  ? storedSkillLevelsValue
  : {};
legacyMasteredSkills.forEach((id) => {
  const currentId = legacySkillIds[id];
  if (currentId && storedSkillLevels[currentId] === undefined) storedSkillLevels[currentId] = 3;
});
const mergedSkillIds = {
  "data-diagnosis": ["metrics-results"],
  "lifecycle-growth": ["strategy-design"],
  "project-delivery": ["product-data-ml"],
};
Object.entries(mergedSkillIds).forEach(([targetId, sourceIds]) => {
  const ids = [targetId, ...sourceIds];
  const levels = ids
    .filter((id) => Object.hasOwn(storedSkillLevels, id))
    .map((id) => Number(storedSkillLevels[id]))
    .filter(Number.isFinite);
  if (levels.length) storedSkillLevels[targetId] = Math.max(...levels);
});

const storedInterviewDraftsValue = readStoredJSON("recruitment-interview-drafts-v1", {});
const storedInterviewDrafts = storedInterviewDraftsValue
  && typeof storedInterviewDraftsValue === "object"
  && !Array.isArray(storedInterviewDraftsValue)
  ? storedInterviewDraftsValue
  : {};
const storedInterviewTarget = localStorage.getItem("recruitment-interview-target-v1") || "all";

function storedArray(key) {
  const value = readStoredJSON(key, []);
  return Array.isArray(value) ? value : [];
}

const state = {
  data: null,
  guide: null,
  guidePromise: null,
  challengePacks: new Map(),
  challengePromises: new Map(),
  challengeLevels: new Map(),
  challengeLevelPromises: new Map(),
  challengeGlossaries: new Map(),
  challengeGlossaryPromises: new Map(),
  challengeProgress: new Map(),
  glossaryMastery: new Map(),
  challengeDrafts: new Map(),
  practiceDays: new Map(),
  view: initialInterviewRoute ? "interview" : initialLearningRoute ? "skills" : "jobs",
  query: "",
  tier: "all",
  direction: "all",
  experience: "all",
  salary: 0,
  risk: "all",
  bonus: "all",
  sort: "score",
  savedOnly: false,
  saved: new Set(storedArray("recruitment-saved")),
  learningTab: initialLearningRoute?.page || "overview",
  selectedSkill: initialLearningRoute?.skillId || null,
  selectedLevel: initialLearningRoute?.levelId || null,
  selectedQuestion: initialLearningRoute?.questionId || null,
  glossaryQuery: "",
  glossaryCategory: "all",
  glossaryFrequency: "all",
  glossarySort: "frequency",
  glossaryUnmasteredOnly: false,
  glossaryPage: 1,
  glossaryMasks: { definition: false, example: false, translation: false },
  skillLevels: storedSkillLevels,
  renderedLearningViews: new Set(),
  jobsPromise: null,
  interviewPlan: null,
  interviewPlanPromise: null,
  interviewQuestion: initialInterviewRoute?.questionId || null,
  interviewMode: "core",
  interviewBankQuery: "",
  interviewBankCategory: "all",
  interviewBankRelevantOnly: false,
  interviewTarget: storedInterviewTarget,
  interviewDrafts: storedInterviewDrafts,
  interviewReviewed: new Set(storedArray("recruitment-interview-reviewed-v1")),
};

const elements = {
  appShell: document.querySelector(".app-shell"),
  viewButtons: [...document.querySelectorAll(".primary-nav button[data-view]")],
  jobsView: document.querySelector("#jobs-view"),
  skillsView: document.querySelector("#skills-view"),
  interviewView: document.querySelector("#interview-view"),
  tierNav: document.querySelector("#tier-nav"),
  directionNav: document.querySelector("#direction-nav"),
  tierBars: document.querySelector("#tier-bars"),
  profileButton: document.querySelector("#profile-button"),
  pageEyebrow: document.querySelector("#page-eyebrow"),
  pageTitle: document.querySelector("#page-title"),
  sourceTime: document.querySelector("#source-time"),
  profileSummary: document.querySelector("#profile-summary"),
  poolStat: document.querySelector("#pool-stat"),
  eligibleStat: document.querySelector("#eligible-stat"),
  displayedStat: document.querySelector("#displayed-stat"),
  visibleStat: document.querySelector("#visible-stat"),
  themeButton: document.querySelector("#theme-button"),
  searchInput: document.querySelector("#search-input"),
  resetButton: document.querySelector("#reset-button"),
  directionSelect: document.querySelector("#direction-select"),
  experienceSelect: document.querySelector("#experience-select"),
  salarySelect: document.querySelector("#salary-select"),
  riskSelect: document.querySelector("#risk-select"),
  bonusSelect: document.querySelector("#bonus-select"),
  sortSelect: document.querySelector("#sort-select"),
  tierSegments: document.querySelector("#tier-segments"),
  savedOnly: document.querySelector("#saved-only"),
  resultCaption: document.querySelector("#result-caption"),
  activeFilters: document.querySelector("#active-filters"),
  jobList: document.querySelector("#job-list"),
  emptyState: document.querySelector("#empty-state"),
  emptyReset: document.querySelector("#empty-reset"),
  profileDialog: document.querySelector("#profile-dialog"),
  dialogClose: document.querySelector("#dialog-close"),
  dialogSummary: document.querySelector("#dialog-summary"),
  criteriaList: document.querySelector("#criteria-list"),
  jobTemplate: document.querySelector("#job-template"),
  skillJobCount: document.querySelector("#skill-job-count"),
  guideLoading: document.querySelector("#guide-loading"),
  learningSkillNav: document.querySelector("#learning-skill-nav"),
  abilityPanel: document.querySelector("#ability-panel"),
  skillDetailPanel: document.querySelector("#skill-detail-panel"),
  detailBreadcrumb: document.querySelector(".detail-breadcrumb"),
  detailPagination: document.querySelector(".detail-pagination"),
  skillOverviewGroups: document.querySelector("#skill-overview-groups"),
  skillDetailContainer: document.querySelector("#skill-detail-container"),
  backToOverview: document.querySelector("#back-to-overview"),
  detailPosition: document.querySelector("#detail-position"),
  previousSkill: document.querySelector("#previous-skill"),
  nextSkill: document.querySelector("#next-skill"),
  interviewLoading: document.querySelector("#interview-loading"),
  interviewPanel: document.querySelector("#interview-panel"),
  interviewACount: document.querySelector("#interview-a-count"),
  interviewReviewedCount: document.querySelector("#interview-reviewed-count"),
  interviewProgressTrack: document.querySelector(".interview-progress-track"),
  interviewProgressFill: document.querySelector("#interview-progress-fill"),
  interviewTargetSelect: document.querySelector("#interview-target-select"),
  interviewQuestionSelect: document.querySelector("#interview-question-select"),
  interviewCoreMode: document.querySelector("#interview-core-mode"),
  interviewBankMode: document.querySelector("#interview-bank-mode"),
  interviewCoreCount: document.querySelector("#interview-core-count"),
  interviewBankCount: document.querySelector("#interview-bank-count"),
  interviewBankBrowser: document.querySelector("#interview-bank-browser"),
  interviewBankSearch: document.querySelector("#interview-bank-search"),
  interviewBankCategory: document.querySelector("#interview-bank-category"),
  interviewBankRelevant: document.querySelector("#interview-bank-relevant"),
  interviewBankResultCount: document.querySelector("#interview-bank-result-count"),
  interviewBankList: document.querySelector("#interview-bank-list"),
  interviewBankEmpty: document.querySelector("#interview-bank-empty"),
  interviewSideProgress: document.querySelector("#interview-side-progress"),
  interviewQuestionNav: document.querySelector("#interview-question-nav"),
  interviewQuestionPosition: document.querySelector("#interview-question-position"),
  interviewQuestionCategory: document.querySelector("#interview-question-category"),
  interviewQuestionDuration: document.querySelector("#interview-question-duration"),
  interviewQuestionTitle: document.querySelector("#interview-question-title"),
  interviewTierFocus: document.querySelector("#interview-tier-focus"),
  interviewQuestionPrompt: document.querySelector("#interview-question-prompt"),
  interviewQuestionIntent: document.querySelector("#interview-question-intent"),
  interviewCoverage: document.querySelector("#interview-coverage"),
  interviewDimensionList: document.querySelector("#interview-dimension-list"),
  interviewJobExamples: document.querySelector("#interview-job-examples"),
  interviewFrameworkList: document.querySelector("#interview-framework-list"),
  interviewAnswerEdge: document.querySelector("#interview-answer-edge"),
  interviewEvidenceHeading: document.querySelector("#interview-evidence-heading"),
  interviewEvidenceList: document.querySelector("#interview-evidence-list"),
  interviewPrepFollowUpList: document.querySelector("#interview-prep-followup-list"),
  interviewPitfallList: document.querySelector("#interview-pitfall-list"),
  interviewGuideNote: document.querySelector("#interview-guide-note"),
  interviewMethodResources: document.querySelector("#interview-method-resources"),
  interviewMethodResourceCount: document.querySelector("#interview-method-resource-count"),
  interviewMethodResourceList: document.querySelector("#interview-method-resource-list"),
  interviewUseTemplate: document.querySelector("#interview-use-template"),
  interviewAnswer: document.querySelector("#interview-answer"),
  interviewSaveStatus: document.querySelector("#interview-save-status"),
  interviewAnswerCount: document.querySelector("#interview-answer-count"),
  interviewClearAnswer: document.querySelector("#interview-clear-answer"),
  interviewAnalyzeAnswer: document.querySelector("#interview-analyze-answer"),
  interviewInputMessage: document.querySelector("#interview-input-message"),
  interviewFeedback: document.querySelector("#interview-feedback"),
  interviewCoverageScore: document.querySelector("#interview-coverage-score"),
  interviewFeedbackSummary: document.querySelector("#interview-feedback-summary"),
  interviewCheckList: document.querySelector("#interview-check-list"),
  interviewStrengthList: document.querySelector("#interview-strength-list"),
  interviewImprovementList: document.querySelector("#interview-improvement-list"),
  interviewFollowUpQuestion: document.querySelector("#interview-follow-up-question"),
  previousInterviewQuestion: document.querySelector("#previous-interview-question"),
  nextInterviewQuestion: document.querySelector("#next-interview-question"),
};

const tierNames = {
  all: "全部",
  "A+": "支付大厂",
  "A-": "接近标准",
  B: "策略匹配",
  C: "仅供参考",
};
const tierClasses = { "A+": "tier-A-plus", "A-": "tier-A-minus", B: "tier-B", C: "tier-C" };

function persistSaved() {
  localStorage.setItem("recruitment-saved", JSON.stringify([...state.saved]));
}

function persistSkillLevels() {
  localStorage.setItem("recruitment-skill-levels", JSON.stringify(state.skillLevels));
}

function persistLearningChecklist(key, values) {
  localStorage.setItem(key, JSON.stringify([...values]));
}

function normalizeLearningProgress() {
  const validSkills = new Set(state.guide.skills.map((skill) => skill.id));
  Object.keys(state.skillLevels).forEach((id) => {
    if (!validSkills.has(id)) delete state.skillLevels[id];
    else state.skillLevels[id] = Math.max(0, Math.min(4, Math.round(Number(state.skillLevels[id]) || 0)));
  });
  persistSkillLevels();
}

function setView(view, updateURL = true) {
  state.view = ["jobs", "skills", "interview"].includes(view) ? view : "jobs";
  elements.jobsView.hidden = state.view !== "jobs";
  elements.skillsView.hidden = state.view !== "skills";
  elements.interviewView.hidden = state.view !== "interview";
  elements.appShell.dataset.view = state.view;
  const isSkills = state.view === "skills";
  const isInterview = state.view === "interview";
  if (isSkills) {
    elements.pageEyebrow.textContent = "A 档岗位共性技能 · 互动训练";
    elements.pageTitle.textContent = "技能提升";
    elements.profileSummary.textContent = "从技能总览或左侧目录进入训练，学习进度自动保存在当前浏览器。";
  } else if (isInterview) {
    elements.pageEyebrow.textContent = "A 档岗位需求 · 真实回答演练";
    elements.pageTitle.textContent = "面试提升";
    elements.profileSummary.textContent = "一次只练一道题；先说清事实，再补足个人贡献、数据证据和复盘。";
  } else {
    elements.pageEyebrow.textContent = "上海硬性 · 大厂/支付官网 + BOSS";
    elements.pageTitle.textContent = "支付与策略运营岗位筛选";
    elements.profileSummary.textContent = state.data?.profile.summary || "加载岗位数据中...";
  }
  if ((isSkills || isInterview) && !state.data) elements.sourceTime.textContent = "岗位数据按需加载";
  if (isInterview && state.data) {
    elements.sourceTime.textContent = formatTime(
      state.data.officialSourceGeneratedAt
      || state.data.sourceGeneratedAt
      || state.data.generatedAt,
    );
  }
  elements.viewButtons.forEach((button) => {
    const active = button.dataset.view === state.view;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  if (updateURL) {
    const url = new URL(location.href);
    if (state.view === "interview") {
      url.hash = state.interviewQuestion
        ? `interview/${encodeURIComponent(state.interviewQuestion)}`
        : "interview";
    } else if (state.view === "skills") {
      if (state.learningTab === "challengeGlossary" && state.selectedSkill) {
        url.hash = `glossary/${encodeURIComponent(state.selectedSkill)}`;
      } else if (state.learningTab === "challengeQuestion" && state.selectedSkill && state.selectedLevel && state.selectedQuestion) {
        url.hash = `challenge/${encodeURIComponent(state.selectedSkill)}/${encodeURIComponent(state.selectedLevel)}/${encodeURIComponent(state.selectedQuestion)}`;
      } else if (state.learningTab === "challengeLevel" && state.selectedSkill && state.selectedLevel) {
        url.hash = `challenge/${encodeURIComponent(state.selectedSkill)}/${encodeURIComponent(state.selectedLevel)}`;
      } else if (state.learningTab === "detail" && state.selectedSkill) {
        url.hash = `skill-${encodeURIComponent(state.selectedSkill)}`;
      } else {
        url.hash = "skills";
      }
    } else {
      url.hash = "";
    }
    history.replaceState(null, "", url);
  }
}

async function navigateLearning(page, skillId = null, updateURL = true, levelId = null, questionId = null) {
  const detailPages = ["detail", "challengeLevel", "challengeQuestion", "challengeGlossary"];
  state.learningTab = ["overview", ...detailPages].includes(page) ? page : "overview";
  state.selectedSkill = detailPages.includes(state.learningTab) ? skillId : null;
  state.selectedLevel = ["challengeLevel", "challengeQuestion"].includes(state.learningTab) ? levelId : null;
  state.selectedQuestion = state.learningTab === "challengeQuestion" ? questionId : null;
  elements.appShell.dataset.learningPage = state.learningTab;
  if (state.selectedSkill) elements.appShell.dataset.selectedSkill = state.selectedSkill;
  else delete elements.appShell.dataset.selectedSkill;
  setView("skills", updateURL);
  elements.guideLoading.hidden = Boolean(state.guide);
  elements.abilityPanel.hidden = true;
  elements.skillDetailPanel.hidden = true;

  const requestedPage = state.learningTab;
  const requestedSkill = state.selectedSkill;
  const requestedLevel = state.selectedLevel;
  const requestedQuestion = state.selectedQuestion;
  try {
    await ensureGuideLoaded();
    if (
      requestedPage !== state.learningTab
      || requestedSkill !== state.selectedSkill
      || requestedLevel !== state.selectedLevel
      || requestedQuestion !== state.selectedQuestion
    ) return;
    if (detailPages.includes(state.learningTab) && !state.guide.skills.some((skill) => skill.id === state.selectedSkill)) {
      state.learningTab = "overview";
      state.selectedSkill = null;
      state.selectedLevel = null;
      state.selectedQuestion = null;
      if (updateURL) setView("skills");
    }

    const selectedSkill = state.guide.skills.find((skill) => skill.id === state.selectedSkill);
    if (state.learningTab === "detail" && selectedSkill?.challenge?.defaultPage) {
      await navigateLearning(selectedSkill.challenge.defaultPage, selectedSkill.id, updateURL);
      return;
    }
    const isChallenge = Boolean(selectedSkill?.challenge) && detailPages.includes(state.learningTab);
    let challengePack = null;
    let challengeGlossary = null;
    if (isChallenge) {
      elements.guideLoading.hidden = false;
      elements.guideLoading.querySelector("strong").textContent = selectedSkill.challenge.loadingLabel || "正在加载互动关卡";
      challengePack = await ensureChallengePack(state.selectedSkill);
      if (
        requestedPage !== state.learningTab
        || requestedSkill !== state.selectedSkill
        || requestedLevel !== state.selectedLevel
        || requestedQuestion !== state.selectedQuestion
      ) return;
      if (state.learningTab === "challengeGlossary") {
        elements.guideLoading.querySelector("strong").textContent = "正在加载支付业务英语词汇表";
        challengeGlossary = await ensureChallengeGlossary(state.selectedSkill, challengePack);
        if (requestedPage !== state.learningTab || requestedSkill !== state.selectedSkill) return;
      }
      if (["challengeLevel", "challengeQuestion"].includes(state.learningTab)) {
        let level = challengePack.levels.find((item) => item.id === state.selectedLevel);
        if (!level) {
          level = challengePack.levels.find((item) => (
            item.topicIds?.includes(state.selectedLevel)
            || (state.selectedQuestion && item.questions.some((question) => question.id === state.selectedQuestion))
          ));
          if (level) {
            state.selectedLevel = level.id;
            setView("skills");
          }
        }
        if (level) {
          const loadedLevel = await ensureChallengeLevel(state.selectedSkill, level.id, challengePack);
          if (
            requestedPage !== state.learningTab
            || requestedSkill !== state.selectedSkill
            || level.id !== state.selectedLevel
            || requestedQuestion !== state.selectedQuestion
          ) return;
          challengePack = {
            ...challengePack,
            levels: challengePack.levels.map((item) => item.id === loadedLevel.id ? loadedLevel : item),
          };
        }
      }
    }
    elements.guideLoading.hidden = true;
    elements.guideLoading.querySelector("strong").textContent = "正在加载能力指南";
    elements.abilityPanel.hidden = state.learningTab !== "overview";
    elements.skillDetailPanel.hidden = !detailPages.includes(state.learningTab);

    if (state.learningTab === "overview") renderSkillOverview();
    if (state.learningTab === "detail" && isChallenge) renderChallengeHub(challengePack);
    else if (state.learningTab === "detail") renderSkillDetail(state.selectedSkill);
    if (state.learningTab === "challengeLevel") renderChallengeLevel(challengePack, state.selectedLevel);
    if (state.learningTab === "challengeQuestion") renderChallengeQuestion(challengePack, state.selectedLevel, state.selectedQuestion);
    if (state.learningTab === "challengeGlossary") renderChallengeGlossary(challengePack, challengeGlossary);
    renderLearningSidebar();
    if (updateURL) window.scrollTo({ top: 0, behavior: "auto" });
  } catch (error) {
    elements.guideLoading.hidden = false;
    elements.guideLoading.querySelector("strong").textContent = `能力指南加载失败：${error.message}`;
  }
}

function textIncludes(job, query) {
  const haystack = [
    job.title,
    job.company,
    job.sourceLabel,
    job.salary,
    job.experience,
    ...job.directions,
    ...job.dimensions,
    ...job.responsibilities,
    job.requirements,
    ...job.notes,
  ].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function filteredJobs() {
  const jobs = state.data.jobs.filter((job) => {
    if (state.query && !textIncludes(job, state.query)) return false;
    if (state.tier !== "all" && job.tier !== state.tier) return false;
    if (state.direction !== "all" && !job.directions.includes(state.direction)) return false;
    if (state.experience !== "all" && job.experience !== state.experience) return false;
    if (state.salary > 0 && (!job.salaryFloor || job.salaryFloor < state.salary)) return false;
    if (state.risk === "direct" && job.agency) return false;
    if (state.risk === "no-english" && job.requiresEnglish) return false;
    if (state.risk === "low-risk" && (job.agency || job.requiresEnglish)) return false;
    if (state.bonus === "payment" && !job.paymentBonus) return false;
    if (state.bonus === "international-payment" && !job.internationalPaymentFit) return false;
    if (state.bonus === "payment-native" && !job.paymentNative) return false;
    if (state.bonus === "payment-leader" && !job.paymentLeader) return false;
    if (state.bonus === "major" && !job.majorCompany) return false;
    if (state.bonus === "both" && !(job.paymentBonus && job.majorCompany)) return false;
    if (state.bonus === "official" && !job.officialSource) return false;
    if (state.bonus === "reference" && !job.isReference) return false;
    if (state.savedOnly && !state.saved.has(job.id)) return false;
    return true;
  });

  return jobs.sort((left, right) => {
    if (state.sort === "salary") return (right.salaryFloor || 0) - (left.salaryFloor || 0) || right.score - left.score;
    if (state.sort === "rank") return left.rank - right.rank;
    return right.score - left.score || left.rank - right.rank;
  });
}

function makeNavButton({ key = "", label, count, active, onClick, compact = false }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = active ? "active" : "";
  button.setAttribute("aria-pressed", String(active));
  if (!compact) {
    const keySpan = document.createElement("span");
    keySpan.className = "nav-key";
    keySpan.textContent = key;
    button.append(keySpan);
  }
  const labelSpan = document.createElement("span");
  labelSpan.className = "nav-label";
  labelSpan.textContent = label;
  const countSpan = document.createElement("span");
  countSpan.className = "nav-count";
  countSpan.textContent = count;
  button.append(labelSpan, countSpan);
  button.addEventListener("click", onClick);
  return button;
}

function renderNavigation() {
  const total = state.data.jobs.length;
  elements.tierNav.replaceChildren();
  const tiers = [
    { key: "ALL", value: "all", label: "全部岗位", count: total },
    ...["A+", "A-", "B", "C"].map((tier) => ({ key: tier, value: tier, label: tierNames[tier], count: state.data.counts[tier] })),
  ];
  tiers.forEach((item) => {
    elements.tierNav.append(makeNavButton({
      key: item.key,
      label: item.label,
      count: item.count,
      active: state.tier === item.value,
      onClick: () => { state.tier = item.value; render(); },
    }));
  });

  const counts = new Map();
  state.data.jobs.forEach((job) => job.directions.forEach((direction) => counts.set(direction, (counts.get(direction) || 0) + 1)));
  const directions = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  elements.directionNav.replaceChildren();
  directions.forEach(([direction, count]) => {
    elements.directionNav.append(makeNavButton({
      label: direction,
      count,
      compact: true,
      active: state.direction === direction,
      onClick: () => {
        state.direction = state.direction === direction ? "all" : direction;
        elements.directionSelect.value = state.direction;
        render();
      },
    }));
  });
}

function renderTierControls() {
  elements.tierSegments.replaceChildren();
  ["all", "A+", "A-", "B", "C"].forEach((tier) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = tier === "all" ? "全部" : `${tier} · ${state.data.counts[tier]}`;
    button.className = state.tier === tier ? "active" : "";
    button.setAttribute("aria-pressed", String(state.tier === tier));
    button.addEventListener("click", () => { state.tier = tier; render(); });
    elements.tierSegments.append(button);
  });
}

function renderBars() {
  elements.tierBars.replaceChildren();
  const max = Math.max(...Object.values(state.data.counts));
  ["A+", "A-", "B", "C"].forEach((tier) => {
    const row = document.createElement("div");
    row.className = "tier-bar";
    row.innerHTML = `<div class="tier-bar-label"><span>${tier} · ${tierNames[tier]}</span><span>${state.data.counts[tier]}</span></div><div class="tier-bar-track"><span class="tier-bar-fill" style="width:${state.data.counts[tier] / max * 100}%"></span></div>`;
    elements.tierBars.append(row);
  });
}

function appendSpans(container, values, className = "") {
  values.forEach((value) => {
    const span = document.createElement("span");
    if (className) span.className = className;
    span.textContent = value;
    container.append(span);
  });
}

function makeJobCard(job) {
  const fragment = elements.jobTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".job-card");
  card.dataset.id = job.id;
  fragment.querySelector(".rank-number").textContent = String(job.rank).padStart(2, "0");
  const tierBadge = fragment.querySelector(".tier-badge");
  tierBadge.textContent = job.tier;
  tierBadge.classList.add(tierClasses[job.tier]);
  fragment.querySelector(".job-title").textContent = job.title;
  fragment.querySelector(".company").textContent = job.company;
  fragment.querySelector(".score-value").textContent = job.score;
  card.classList.toggle("closed", job.closed);
  card.classList.toggle("reference-only", !job.applicationRecommended);

  const meta = fragment.querySelector(".meta-line");
  appendSpans(meta, [job.salary, job.city, job.experience, job.education]);
  const bonuses = [];
  if (job.isReference) bonuses.push("原始标杆");
  if (job.officialSource) bonuses.push(job.sourceLabel);
  if (job.paymentBonus) bonuses.push("支付业务 +14");
  if (job.internationalPaymentFit) bonuses.push("国际支付经验匹配");
  if (job.paymentLeader) bonuses.push("头部支付机构");
  else if (job.paymentNative) bonuses.push("支付公司");
  if (job.majorCompany) bonuses.push("大平台 +10");
  if (!job.applicationRecommended) bonuses.push("仅供方向参考 · 不建议投递");
  appendSpans(fragment.querySelector(".bonus-list"), bonuses);
  appendSpans(fragment.querySelector(".dimension-list"), job.dimensions);

  const riskLine = fragment.querySelector(".risk-line");
  const risks = job.notes.filter((note) => !note.startsWith("未发现明显硬性风险"));
  appendSpans(riskLine, risks.length ? risks : ["未发现明显硬性风险"], risks.length ? "" : "clear-risk");

  const link = fragment.querySelector(".external-button");
  link.href = job.url;
  link.textContent = job.applicationRecommended
    ? `${job.officialSource ? "官网" : "BOSS"} ↗`
    : "参考 JD ↗";
  link.setAttribute(
    "aria-label",
    job.applicationRecommended
      ? `在${job.officialSource ? job.sourceLabel : "BOSS 直聘"}查看 ${job.title}`
      : `查看仅供参考的岗位描述：${job.title}`,
  );

  const saveButton = fragment.querySelector(".save-button");
  saveButton.hidden = !job.applicationRecommended;
  const setSaveState = () => {
    const saved = state.saved.has(job.id);
    saveButton.classList.toggle("saved", saved);
    saveButton.textContent = saved ? "★" : "☆";
    saveButton.setAttribute("aria-label", saved ? "取消收藏" : "收藏岗位");
    saveButton.title = saved ? "取消收藏" : "收藏岗位";
  };
  setSaveState();
  saveButton.addEventListener("click", () => {
    state.saved.has(job.id) ? state.saved.delete(job.id) : state.saved.add(job.id);
    persistSaved();
    if (state.savedOnly) render(); else setSaveState();
  });

  const detail = fragment.querySelector(".job-detail");
  const toggle = fragment.querySelector(".detail-toggle");
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    detail.hidden = expanded;
  });
  const responsibilities = fragment.querySelector(".responsibility-list");
  job.responsibilities.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    responsibilities.append(li);
  });
  fragment.querySelector(".requirements").textContent = job.requirements;
  return fragment;
}

function filterLabels() {
  const labels = [];
  if (state.query) labels.push(`“${state.query}”`);
  if (state.tier !== "all") labels.push(`${state.tier} 级`);
  if (state.direction !== "all") labels.push(state.direction);
  if (state.experience !== "all") labels.push(state.experience);
  if (state.salary) labels.push(`${state.salary}K+`);
  if (state.risk !== "all") labels.push(elements.riskSelect.selectedOptions[0].textContent);
  if (state.bonus !== "all") labels.push(elements.bonusSelect.selectedOptions[0].textContent);
  if (state.savedOnly) labels.push("已收藏");
  return labels;
}

function renderJobs() {
  const jobs = filteredJobs();
  elements.jobList.replaceChildren(...jobs.map(makeJobCard));
  elements.visibleStat.textContent = jobs.length;
  elements.resultCaption.textContent = `${jobs.length} / ${state.data.displayedSize}`;
  elements.activeFilters.textContent = filterLabels().join(" · ");
  elements.emptyState.hidden = jobs.length !== 0;
  elements.jobList.hidden = jobs.length === 0;
}

function render() {
  renderNavigation();
  renderTierControls();
  renderJobs();
}

function makeLevelSelect(skill, onChange) {
  const select = document.createElement("select");
  select.className = "skill-level";
  select.setAttribute("aria-label", `${skill.title}当前能力等级`);
  state.guide.levelDefinitions.forEach((definition) => {
    const option = document.createElement("option");
    option.value = definition.level;
    option.textContent = `${definition.level} · ${definition.label}`;
    option.title = definition.description;
    select.append(option);
  });
  select.value = String(Number(state.skillLevels[skill.id]) || 0);
  select.addEventListener("change", () => {
    state.skillLevels[skill.id] = Number(select.value);
    persistSkillLevels();
    renderLearningSidebar();
    onChange?.(Number(select.value));
  });
  return select;
}

function makePriorityBadge(skill) {
  const badge = document.createElement("span");
  badge.className = `skill-priority priority-${skill.group}`;
  badge.textContent = skill.priority;
  return badge;
}

function skillLandingPage(skill) {
  return skill.challenge?.defaultPage || "detail";
}

function makeSkillOverviewCard(skill) {
  const level = Number(state.skillLevels[skill.id]) || 0;
  const isGlossary = skill.challenge?.defaultPage === "challengeGlossary";
  const glossaryMastery = isGlossary ? getGlossaryMastery(skill.id).size : 0;
  const button = document.createElement("button");
  button.type = "button";
  button.className = `skill-overview-card skill-group-${skill.group}`;
  button.dataset.skillId = skill.id;
  button.classList.toggle("mastered", isGlossary ? glossaryMastery === skill.challenge.glossary : level >= state.guide.targetLevel);
  button.classList.toggle("challenge-enabled", Boolean(skill.challenge) && !isGlossary);
  button.classList.toggle("glossary-enabled", isGlossary);

  const top = document.createElement("span");
  top.className = "overview-card-top";
  const badges = document.createElement("span");
  badges.className = "skill-badges";
  const coverage = document.createElement("span");
  coverage.className = "skill-coverage";
  coverage.textContent = skill.coverageLabel;
  badges.append(makePriorityBadge(skill), coverage);
  const levelLabel = document.createElement("span");
  levelLabel.className = "overview-level";
  levelLabel.textContent = isGlossary ? `${glossaryMastery} / ${skill.challenge.glossary}` : `${level} 级`;
  top.append(badges, levelLabel);

  const title = document.createElement("strong");
  title.textContent = skill.title;
  const goal = document.createElement("span");
  goal.className = "overview-goal";
  goal.textContent = skill.goal;
  const meta = document.createElement("span");
  meta.className = "overview-meta";
  const exerciseCount = document.createElement("span");
  exerciseCount.textContent = skill.challenge?.label || `${skill.exercises.length} 道练习`;
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";
  meta.append(exerciseCount, arrow);
  button.append(top, title, goal, meta);
  button.addEventListener("click", () => navigateLearning(skillLandingPage(skill), skill.id));
  return button;
}

function renderSkillOverview() {
  elements.skillOverviewGroups.replaceChildren();
  state.guide.groups.forEach((group) => {
    const skills = state.guide.skills
      .filter((skill) => skill.group === group.id)
      .sort((left, right) => left.number - right.number);
    const section = document.createElement("section");
    section.className = "skill-overview-group";
    const header = document.createElement("header");
    const copy = document.createElement("div");
    const title = document.createElement("h4");
    title.textContent = group.label;
    const description = document.createElement("p");
    description.textContent = group.description;
    copy.append(title, description);
    const count = document.createElement("span");
    count.textContent = `${skills.length} 项`;
    header.append(copy, count);
    const grid = document.createElement("div");
    grid.className = "skill-overview-grid";
    grid.append(...skills.map(makeSkillOverviewCard));
    section.append(header, grid);
    elements.skillOverviewGroups.append(section);
  });
  state.renderedLearningViews.add("overview");
}

function makeResourceLink(resource) {
  const link = document.createElement("a");
  link.className = "resource-link";
  link.href = resource.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  const type = document.createElement("span");
  type.textContent = resource.type;
  const title = document.createElement("strong");
  title.textContent = resource.title;
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";
  link.append(type, title, arrow);
  return link;
}

function appendList(list, values) {
  values.forEach((value) => {
    const item = document.createElement("li");
    item.textContent = value;
    list.append(item);
  });
}

function makeTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function challengeStorageKey(skillId) {
  return `recruitment-challenge-${skillId}`;
}

function getChallengeProgress(skillId) {
  if (!state.challengeProgress.has(skillId)) {
    state.challengeProgress.set(skillId, new Set(storedArray(challengeStorageKey(skillId))));
  }
  return state.challengeProgress.get(skillId);
}

function persistChallengeProgress(skillId) {
  persistLearningChecklist(challengeStorageKey(skillId), getChallengeProgress(skillId));
}

function glossaryMasteryStorageKey(skillId) {
  return `recruitment-glossary-mastered-${skillId}`;
}

function getGlossaryMastery(skillId) {
  if (!state.glossaryMastery.has(skillId)) {
    const stored = storedArray(glossaryMasteryStorageKey(skillId));
    if (skillId === "core-vocabulary" && !stored.length) {
      stored.push(...storedArray(glossaryMasteryStorageKey("business-english")));
    }
    state.glossaryMastery.set(skillId, new Set(stored));
  }
  return state.glossaryMastery.get(skillId);
}

function persistGlossaryMastery(skillId) {
  persistLearningChecklist(glossaryMasteryStorageKey(skillId), getGlossaryMastery(skillId));
}

function challengeDraftStorageKey(skillId) {
  return `recruitment-challenge-drafts-${skillId}`;
}

function getChallengeDrafts(skillId) {
  if (!state.challengeDrafts.has(skillId)) {
    const stored = readStoredJSON(challengeDraftStorageKey(skillId), {});
    state.challengeDrafts.set(skillId, stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {});
  }
  return state.challengeDrafts.get(skillId);
}

function getChallengeDraft(skillId, key) {
  return getChallengeDrafts(skillId)[key] || {};
}

function updateChallengeDraft(skillId, key, update) {
  const drafts = getChallengeDrafts(skillId);
  drafts[key] = { ...drafts[key], ...update };
  localStorage.setItem(challengeDraftStorageKey(skillId), JSON.stringify(drafts));
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dailyMissionStorageKey(skillId) {
  return `recruitment-daily-mission-${skillId}`;
}

const DAILY_MISSION_VERSION = 3;
const DAILY_MISSION_SIZE = 5;

function shuffledQuestionKeys(questions) {
  const keys = questions.map((item) => item.key);
  for (let index = keys.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [keys[index], keys[swapIndex]] = [keys[swapIndex], keys[index]];
  }
  return keys;
}

function getDailyMission(pack) {
  const date = localDateKey();
  const questions = challengeQuestions(pack);
  const validKeys = new Set(questions.map((item) => item.key));
  const stored = readStoredJSON(dailyMissionStorageKey(pack.skillId), null);
  if (
    stored?.version === DAILY_MISSION_VERSION
    && stored.date === date
    && Array.isArray(stored.keys)
    && stored.keys.every((key) => validKeys.has(key))
  ) {
    stored.completed = Array.isArray(stored.completed)
      ? stored.completed.filter((key) => stored.keys.includes(key))
      : [];
    return stored;
  }
  const progress = getChallengeProgress(pack.skillId);
  const mission = {
    version: DAILY_MISSION_VERSION,
    date,
    keys: shuffledQuestionKeys(questions.filter((item) => !progress.has(item.key))).slice(0, DAILY_MISSION_SIZE),
    completed: [],
  };
  localStorage.setItem(dailyMissionStorageKey(pack.skillId), JSON.stringify(mission));
  return mission;
}

function completeDailyMissionItem(pack, key) {
  const mission = getDailyMission(pack);
  if (mission.keys.includes(key) && !mission.completed.includes(key)) mission.completed.push(key);
  localStorage.setItem(dailyMissionStorageKey(pack.skillId), JSON.stringify(mission));
}

function practiceDayStorageKey(skillId) {
  return `recruitment-practice-days-${skillId}`;
}

function getPracticeDays(skillId) {
  if (!state.practiceDays.has(skillId)) {
    state.practiceDays.set(skillId, new Set(storedArray(practiceDayStorageKey(skillId))));
  }
  return state.practiceDays.get(skillId);
}

function markPracticeDay(skillId) {
  const days = getPracticeDays(skillId);
  days.add(localDateKey());
  persistLearningChecklist(practiceDayStorageKey(skillId), days);
}

function practiceDaysThisWeek(skillId) {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const mondayKey = localDateKey(monday);
  return [...getPracticeDays(skillId)].filter((date) => date >= mondayKey && date <= localDateKey(now)).length;
}

function challengeQuestions(pack) {
  return pack.levels.flatMap((level) => level.questions.map((question) => ({
    key: `${level.id}/${question.id}`,
    level,
    question,
  })));
}

function challengeStatus(pack, level, question) {
  const questions = challengeQuestions(pack);
  const index = questions.findIndex((item) => item.level.id === level.id && item.question.id === question.id);
  const progress = getChallengeProgress(pack.skillId);
  const key = `${level.id}/${question.id}`;
  return {
    completed: progress.has(key),
    unlocked: true,
    index,
    total: questions.length,
  };
}

function challengeMode(question, questionIndex) {
  if (question.activity?.mode === "arrange") return "arrange";
  if (!question.activity?.mode && questionIndex === 1) return "arrange";
  return "warmup";
}

const challengeModeLabels = {
  warmup: "单选题",
  arrange: "句子排序",
};

function challengeModeLabel(pack, mode) {
  return pack.ui?.modeLabels?.[mode] || challengeModeLabels[mode] || "综合练习";
}

function objectiveChoiceActivity(pack, question) {
  if (question.activity?.mode === "choice") return question.activity;
  const isSQL = Boolean(
    question.sqlSpec
    || question.activity?.mode === "sql"
    || question.activity?.input === "sql"
    || question.answer?.format === "sql"
  );
  const isEnglish = pack.skillId === "business-english";
  const correct = question.answer?.notes?.filter(Boolean).slice(0, 2).join("；")
    || question.answer?.sample
    || "先明确目标和边界，再基于证据给出结论与行动。";
  const distractors = isSQL
    ? [
      "直接对原始明细做 COUNT 或 SUM，不处理重复记录、一对多关系、时区和统计边界。",
      "先筛选出符合预期的结果，再用总量变化代替题目要求的分群、漏斗或单位经济分析。",
    ]
    : isEnglish
      ? [
        "逐句直译并保留全部背景，把结论、请求、负责人和截止时间放到最后。",
        "只表达同意或反对，不说明依据、业务影响、下一步行动和确认方式。",
      ]
      : [
        "直接采用覆盖面最大的动作，不区分对象、约束、证据、成本或风险。",
        "只复述现象和目标，不说明判断依据、取舍、负责人、时间和验证标准。",
      ];
  const choices = [correct, ...distractors];
  const seed = [...question.id].reduce((total, character) => total + character.charCodeAt(0), 0);
  const offset = seed % choices.length;
  const rotated = [...choices.slice(offset), ...choices.slice(0, offset)];
  return {
    prompt: isSQL
      ? "以下哪种查询思路最符合题目的口径和边界？"
      : isEnglish
        ? "以下哪种表达思路最适合当前工作情境？"
        : "以下哪种处理思路最符合题目要求？",
    choices: rotated,
    correctChoice: (choices.length - offset) % choices.length,
    feedback: isSQL
      ? "参考答案中保留了完整 SQL、口径说明和边界处理。"
      : "参考答案中保留了可直接学习的完整示例。",
  };
}

function updateChallengeSkillLevel(pack) {
  const total = challengeQuestions(pack).length;
  const completed = getChallengeProgress(pack.skillId).size;
  const earnedLevel = completed === total ? 4 : Math.floor((completed / total) * 4);
  state.skillLevels[pack.skillId] = Math.max(Number(state.skillLevels[pack.skillId]) || 0, earnedLevel);
  persistSkillLevels();
  renderLearningSidebar();
}

function makeChallengeProgress(completed, total, label) {
  const wrapper = document.createElement("div");
  wrapper.className = "challenge-progress";
  const copy = document.createElement("div");
  copy.append(makeTextElement("span", "", label), makeTextElement("strong", "", `${completed} / ${total}`));
  const track = document.createElement("div");
  track.className = "challenge-progress-track";
  track.setAttribute("role", "progressbar");
  track.setAttribute("aria-label", label);
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", String(total));
  track.setAttribute("aria-valuenow", String(completed));
  const fill = document.createElement("span");
  fill.style.width = total ? `${completed / total * 100}%` : "0%";
  track.append(fill);
  wrapper.append(copy, track);
  return wrapper;
}

function makeChallengeBreadcrumb(pack, level = null) {
  const nav = document.createElement("nav");
  nav.className = "challenge-breadcrumb";
  nav.setAttribute("aria-label", `${pack.title}导航`);
  const overview = document.createElement("button");
  overview.type = "button";
  overview.textContent = "技能总览";
  overview.addEventListener("click", () => navigateLearning("overview"));
  const hub = document.createElement("button");
  hub.type = "button";
  hub.textContent = pack.title;
  hub.addEventListener("click", () => navigateLearning(pack.defaultPage || "detail", pack.skillId));
  nav.append(overview, makeTextElement("span", "", "/"), hub);
  if (level) nav.append(makeTextElement("span", "", "/"), makeTextElement("strong", "", level.title));
  return nav;
}

function setChallengeDetailChrome() {
  elements.detailBreadcrumb.hidden = true;
  elements.detailPagination.hidden = true;
}

function makeDailyMission(pack) {
  const mission = getDailyMission(pack);
  const allQuestions = challengeQuestions(pack);
  const byKey = new Map(allQuestions.map((item) => [item.key, item]));
  const completedCount = mission.completed.length;
  const section = document.createElement("section");
  section.className = "daily-mission";

  const heading = document.createElement("div");
  heading.className = "daily-mission-heading";
  const copy = document.createElement("div");
  copy.append(
    makeTextElement("span", "section-kicker", "TODAY · 约 10 分钟"),
    makeTextElement("h3", "", mission.keys.length ? "今日五题" : "全部关卡已完成"),
    makeTextElement("p", "", mission.keys.length ? "从未作答题目中随机抽取，每天完成五个小目标。" : "可以从关卡地图自由复习已经完成的题目。"),
  );
  const weekly = document.createElement("div");
  weekly.className = "weekly-practice";
  weekly.append(
    makeTextElement("strong", "", `${Math.min(practiceDaysThisWeek(pack.skillId), 3)} / 3 天`),
    makeTextElement("span", "", "本周柔性目标"),
  );
  heading.append(copy, weekly);

  const steps = document.createElement("div");
  steps.className = "daily-mission-steps";
  mission.keys.forEach((key, index) => {
    const item = byKey.get(key);
    const done = mission.completed.includes(key);
    const status = item ? challengeStatus(pack, item.level, item.question) : null;
    const step = document.createElement("span");
    step.className = "daily-mission-step";
    step.classList.toggle("completed", done);
    step.classList.toggle("locked", !done && !status?.unlocked);
    step.append(
      makeTextElement("span", "", done ? "✓" : String(index + 1)),
      makeTextElement("strong", "", item?.question.title || "练习题"),
    );
    steps.append(step);
  });

  const currentKey = mission.keys.find((key) => !mission.completed.includes(key));
  const current = byKey.get(currentKey);
  const currentStatus = current ? challengeStatus(pack, current.level, current.question) : null;
  const start = document.createElement("button");
  start.type = "button";
  start.className = "daily-mission-button";
  start.disabled = !current || !currentStatus?.unlocked;
  start.textContent = !mission.keys.length
    ? `已完成全部 ${allQuestions.length} 题`
    : completedCount === mission.keys.length
      ? "今日任务完成"
      : completedCount ? "继续今日任务 →" : "开始今日五题 →";
  start.addEventListener("click", () => current && navigateLearning(
    "challengeQuestion",
    pack.skillId,
    true,
    current.level.id,
    current.question.id,
  ));

  section.append(heading, steps, start);
  return section;
}

function makeLevelReward(level, newlyUnlocked = false) {
  const section = document.createElement("section");
  section.className = "challenge-reward";
  section.classList.toggle("newly-unlocked", newlyUnlocked);
  section.append(
    makeTextElement("span", "challenge-reward-mark", "✓"),
    makeTextElement("span", "section-kicker", newlyUnlocked ? "新奖励已解锁" : "通关奖励"),
    makeTextElement("h3", "", level.reward.title),
    makeTextElement("p", "", level.reward.description),
  );
  const list = document.createElement("div");
  list.className = "challenge-reward-list";
  level.reward.items.forEach((item) => list.append(makeTextElement("code", "", item)));
  section.append(list);
  return section;
}

function answerChunks(sample) {
  const normalized = sample.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  return (normalized.match(/[^.!?。！？；;]+[.!?。！？；;]+|[^.!?。！？；;]+$/g) || [normalized])
    .map((item) => item.trim());
}

function makeChallengeReference(pack) {
  if (!pack.reference) return null;
  const details = document.createElement("details");
  details.className = "challenge-reference";
  details.append(makeTextElement("summary", "", pack.reference.label || "查看练习表结构"));
  const body = document.createElement("div");
  if (pack.reference.description) body.append(makeTextElement("p", "", pack.reference.description));
  const code = makeTextElement("pre", "", pack.reference.schema || "");
  body.append(code);
  details.append(body);
  return details;
}

function makeSQLProblem(pack, question) {
  const spec = question.sqlSpec;
  const section = document.createElement("section");
  section.className = "challenge-prompt challenge-sql-prompt";
  section.append(
    makeTextElement("span", "challenge-section-label", "业务需求"),
    makeTextElement("p", "challenge-context", question.prompt),
  );

  const specification = document.createElement("div");
  specification.className = "challenge-sql-spec";
  const tables = document.createElement("section");
  tables.className = "challenge-sql-spec-tables";
  tables.append(makeTextElement("h3", "", "相关表"));
  const schemas = spec.tables.map((table) => pack.reference?.tables?.[table] || table);
  tables.append(makeTextElement("pre", "", schemas.join("\n")));

  const requirements = document.createElement("section");
  requirements.append(makeTextElement("h3", "", "查询要求"));
  const requirementList = document.createElement("ol");
  appendList(requirementList, spec.requirements);
  requirements.append(requirementList);

  const output = document.createElement("section");
  output.append(makeTextElement("h3", "", "输出字段"));
  const outputList = document.createElement("ul");
  outputList.className = "challenge-sql-output";
  appendList(outputList, spec.output);
  output.append(outputList);

  specification.append(tables, requirements, output);
  if (spec.boundaries?.length) {
    const boundaries = document.createElement("section");
    boundaries.className = "challenge-sql-boundaries";
    boundaries.append(makeTextElement("h3", "", "口径与边界"));
    const boundaryList = document.createElement("ul");
    appendList(boundaryList, spec.boundaries);
    boundaries.append(boundaryList);
    specification.append(boundaries);
  }
  section.append(specification);

  if (question.hint) {
    const hint = document.createElement("details");
    hint.className = "challenge-hint";
    hint.append(makeTextElement("summary", "", "查看提示"), makeTextElement("p", "", question.hint));
    section.append(hint);
  }
  return section;
}

function rotatedChunks(chunks, seedText) {
  if (chunks.length < 2) return chunks.map((text, index) => ({ text, index }));
  const seed = [...seedText].reduce((total, character) => total + character.charCodeAt(0), 0);
  const offset = seed % (chunks.length - 1) + 1;
  const indexed = chunks.map((text, index) => ({ text, index }));
  return [...indexed.slice(offset), ...indexed.slice(0, offset)];
}

function makeChallengeResponse(pack, level, question, questionIndex, onReady) {
  const key = `${level.id}/${question.id}`;
  const draft = getChallengeDraft(pack.skillId, key);
  const mode = challengeMode(question, questionIndex);
  const section = document.createElement("section");
  section.className = `challenge-response challenge-response-${mode}`;
  const heading = document.createElement("div");
  heading.className = "challenge-response-heading";
  heading.append(makeTextElement("span", "challenge-section-label", challengeModeLabel(pack, mode)));
  if (!pack.ui?.compact) {
    heading.append(makeTextElement("span", "", "可以作答，也可以直接查看答案或前往下一题"));
  }
  section.append(heading);

  let isReady = () => false;
  let onReveal = () => {};

  if (mode === "warmup") {
    const activity = objectiveChoiceActivity(pack, question);
    section.append(makeTextElement("p", "challenge-response-prompt", activity.prompt));
    const choices = document.createElement("div");
    choices.className = "challenge-choice-list";
    const buttons = activity.choices.map((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "challenge-choice";
      button.classList.toggle("selected", draft.choice === index);
      button.append(makeTextElement("span", "", String.fromCharCode(65 + index)), makeTextElement("strong", "", choice));
      button.addEventListener("click", () => {
        buttons.forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
        draft.choice = index;
        updateChallengeDraft(pack.skillId, key, { choice: index });
        onReady(true);
      });
      choices.append(button);
      return button;
    });
    const result = makeTextElement("p", "challenge-response-result", "");
    result.hidden = true;
    section.append(choices, result);
    isReady = () => Number.isInteger(draft.choice);
    onReveal = () => {
      const answered = Number.isInteger(draft.choice);
      buttons.forEach((button, index) => {
        button.disabled = true;
        button.classList.toggle("correct", index === activity.correctChoice);
        button.classList.toggle("incorrect", answered && index === draft.choice && index !== activity.correctChoice);
      });
      result.hidden = false;
      result.classList.toggle("correct", !answered || draft.choice === activity.correctChoice);
      result.textContent = `${!answered ? "已标出正确选项。" : draft.choice === activity.correctChoice ? "选择正确。" : "再留意一下概念边界。"}${activity.feedback}`;
    };
  } else if (mode === "arrange") {
    const chunks = answerChunks(question.answer.sample);
    draft.order = Array.isArray(draft.order)
      ? draft.order.filter((index) => Number.isInteger(index) && index >= 0 && index < chunks.length)
      : [];
    const instruction = makeTextElement("p", "challenge-response-prompt", "依次点击句子，把回复排成清楚的表达顺序。");
    const arranged = document.createElement("div");
    arranged.className = "challenge-arranged";
    const available = document.createElement("div");
    available.className = "challenge-chunk-bank";
    const controls = document.createElement("div");
    controls.className = "challenge-arrange-controls";
    const undo = document.createElement("button");
    undo.type = "button";
    undo.textContent = "撤回一步";
    const reset = document.createElement("button");
    reset.type = "button";
    reset.textContent = "重新排序";
    const result = makeTextElement("span", "challenge-response-result", "");
    result.hidden = true;
    controls.append(undo, reset, result);

    const renderOrder = () => {
      arranged.replaceChildren();
      if (!draft.order.length) arranged.append(makeTextElement("span", "challenge-arranged-placeholder", "从下方选择第一句"));
      draft.order.forEach((index, position) => {
        const line = document.createElement("button");
        line.type = "button";
        line.className = "challenge-arranged-line";
        line.append(makeTextElement("span", "", String(position + 1)), makeTextElement("strong", "", chunks[index]));
        line.addEventListener("click", () => {
          draft.order.splice(position, 1);
          updateChallengeDraft(pack.skillId, key, { order: draft.order });
          renderOrder();
        });
        arranged.append(line);
      });
      available.replaceChildren();
      rotatedChunks(chunks, question.id).filter((item) => !draft.order.includes(item.index)).forEach((item) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "challenge-chunk";
        chip.textContent = item.text;
        chip.addEventListener("click", () => {
          draft.order.push(item.index);
          updateChallengeDraft(pack.skillId, key, { order: draft.order });
          renderOrder();
        });
        available.append(chip);
      });
      undo.disabled = !draft.order.length;
      reset.disabled = !draft.order.length;
      onReady(draft.order.length === chunks.length);
    };
    undo.addEventListener("click", () => {
      draft.order.pop();
      updateChallengeDraft(pack.skillId, key, { order: draft.order });
      renderOrder();
    });
    reset.addEventListener("click", () => {
      draft.order = [];
      updateChallengeDraft(pack.skillId, key, { order: [] });
      renderOrder();
    });
    section.append(instruction, arranged, available, controls);
    isReady = () => draft.order.length === chunks.length;
    onReveal = () => {
      const attempted = draft.order.length === chunks.length;
      const correct = draft.order.every((value, index) => value === index);
      result.hidden = false;
      result.classList.toggle("correct", !attempted || correct);
      result.textContent = !attempted
        ? "已显示参考顺序，可以直接对照学习。"
        : correct ? "顺序正确，逻辑很清楚。" : "可以对照参考答案调整表达结构。";
    };
    renderOrder();
  }

  onReady(isReady());
  return { element: section, isReady, onReveal, mode };
}

function renderChallengeHub(pack) {
  setChallengeDetailChrome();
  const progress = getChallengeProgress(pack.skillId);
  const allQuestions = challengeQuestions(pack);
  const article = document.createElement("article");
  article.className = "challenge-page challenge-hub";
  article.classList.toggle("challenge-compact", Boolean(pack.ui?.compact));
  article.dataset.skillId = pack.skillId;

  const header = document.createElement("header");
  header.className = "challenge-hero";
  const copy = document.createElement("div");
  copy.append(
    makeTextElement("span", "section-kicker", `互动训练 · ${pack.levels.length} 个关卡`),
    makeTextElement("h2", "", pack.title),
    makeTextElement("p", "", pack.summary),
  );
  if (!pack.ui?.compact) copy.append(makeTextElement("p", "challenge-story", pack.story));
  header.append(copy, makeChallengeProgress(progress.size, allQuestions.length, "总闯关进度"));

  const intro = document.createElement("div");
  intro.className = "challenge-instruction";
  intro.append(
    makeTextElement("strong", "", "按需要自由学习"),
    makeTextElement("span", "", "题目仅需点击选择或排序；可以跳过作答，直接查看答案或切换任意题目。"),
  );

  const grid = document.createElement("div");
  grid.className = "challenge-level-grid";
  pack.levels.forEach((level, levelIndex) => {
    const completed = level.questions.filter((question) => progress.has(`${level.id}/${question.id}`)).length;
    const firstStatus = challengeStatus(pack, level, level.questions[0]);
    const isComplete = completed === level.questions.length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "challenge-level-card";
    button.classList.toggle("completed", isComplete);
    button.classList.toggle("locked", !firstStatus.unlocked);
    button.disabled = !firstStatus.unlocked;
    button.dataset.levelId = level.id;

    const top = document.createElement("span");
    top.className = "challenge-level-top";
    top.append(
      makeTextElement("span", "challenge-level-number", level.chapter || `LEVEL ${String(levelIndex + 1).padStart(2, "0")}`),
      makeTextElement("span", "challenge-level-state", isComplete ? "已通关" : firstStatus.unlocked ? `${completed}/${level.questions.length}` : "未解锁"),
    );
    button.append(
      top,
      makeTextElement("strong", "", level.title),
      makeTextElement("span", "challenge-level-subtitle", level.subtitle),
    );
    if (pack.ui?.compact && level.difficulty) {
      button.append(makeTextElement("span", "challenge-level-difficulty", `难度 ${level.difficulty} / 5`));
    } else {
      button.append(makeTextElement("span", "challenge-level-story", level.story));
    }
    button.append(makeTextElement("span", "challenge-level-action", isComplete ? "重新练习 →" : firstStatus.unlocked ? "进入关卡 →" : "完成上一等级后开放"));
    button.addEventListener("click", () => navigateLearning("challengeLevel", pack.skillId, true, level.id));
    grid.append(button);
  });

  const reference = makeChallengeReference(pack);
  article.append(makeChallengeBreadcrumb(pack), header);
  if (reference) article.append(reference);
  article.append(makeDailyMission(pack), intro, grid);
  elements.skillDetailContainer.replaceChildren(article);
}

const GLOSSARY_PAGE_SIZE = 20;
const CORE_VOCABULARY_GLOSSARY_VERSION = 4;
const CORE_VOCABULARY_AUDIO_BASE = "https://cdn.jsdelivr.net/gh/JiqiangZhangNYU/recruitment@dfd6263d429c18d6f5e626a170eec8e5f36af416/audio/core-vocabulary";

function makeGlossaryCoveredField(label, text, covered, action = null) {
  const section = document.createElement("section");
  section.className = "glossary-field";
  const heading = document.createElement("div");
  heading.className = "glossary-field-heading";
  heading.append(makeTextElement("span", "glossary-field-label", label));
  if (action) heading.append(action);
  section.append(heading);
  if (!covered) {
    section.append(makeTextElement("p", "glossary-field-value", text));
    return section;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "glossary-covered-value";
  button.textContent = `点击显示${label}`;
  button.setAttribute("aria-expanded", "false");
  button.addEventListener("click", () => {
    const reveal = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(reveal));
    button.classList.toggle("revealed", reveal);
    button.textContent = reveal ? text : `点击显示${label}`;
  });
  section.append(button);
  return section;
}

function formatGlossaryRecordingTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function renderChallengeGlossary(pack, glossary) {
  setChallengeDetailChrome();
  const mastery = getGlossaryMastery(pack.skillId);
  const article = document.createElement("article");
  article.className = "challenge-page glossary-page";
  article.dataset.skillId = pack.skillId;
  const recordings = new Map();
  const recordingSupported = Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
  const speechSupported = Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance);
  const readAloudAudio = document.createElement("audio");
  const generatedSpeechSupported = Boolean(
    readAloudAudio.canPlayType("audio/mpeg")
    && window.fetch
    && window.URL?.createObjectURL,
  );
  const readAloudSupported = generatedSpeechSupported || speechSupported;
  readAloudAudio.preload = "none";
  let activeRecording = null;
  let activeSpeech = null;

  const resetSpeechButton = (request) => {
    if (!request) return;
    request.button.classList.remove("loading", "speaking");
    request.button.setAttribute("aria-pressed", "false");
    request.button.textContent = readAloudSupported ? "AI 朗读" : "朗读不可用";
  };

  const releaseGeneratedSpeech = (request, abort = false) => {
    if (!request) return;
    clearTimeout(request.loadTimer);
    request.loadTimer = null;
    if (abort) request.controller?.abort();
    request.controller = null;
    if (!request.objectURL) return;
    URL.revokeObjectURL(request.objectURL);
    request.objectURL = null;
  };

  const finishSpeech = (request) => {
    if (!request || activeSpeech !== request) return;
    activeSpeech = null;
    readAloudAudio.pause();
    readAloudAudio.removeAttribute("src");
    readAloudAudio.load();
    releaseGeneratedSpeech(request);
    resetSpeechButton(request);
  };

  const speakWithBrowserVoice = (request) => {
    if (!request || activeSpeech !== request || request.fallbackStarted) return;
    request.fallbackStarted = true;
    readAloudAudio.pause();
    readAloudAudio.removeAttribute("src");
    readAloudAudio.load();
    releaseGeneratedSpeech(request, true);
    if (!speechSupported) {
      finishSpeech(request);
      return;
    }
    request.button.classList.remove("loading");
    request.button.classList.add("speaking");
    request.button.textContent = "停止朗读";
    const utterance = new SpeechSynthesisUtterance(request.text);
    utterance.lang = "en-US";
    utterance.rate = 0.88;
    utterance.pitch = 1;
    const voices = speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang === "en-US" && voice.localService)
      || voices.find((voice) => voice.lang === "en-US")
      || voices.find((voice) => voice.lang.startsWith("en"))
      || null;
    utterance.addEventListener("end", () => finishSpeech(request));
    utterance.addEventListener("error", () => finishSpeech(request));
    speechSynthesis.speak(utterance);
  };

  readAloudAudio.addEventListener("ended", () => finishSpeech(activeSpeech));
  readAloudAudio.addEventListener("error", () => speakWithBrowserVoice(activeSpeech));

  const stopSpeech = () => {
    const request = activeSpeech;
    activeSpeech = null;
    if (request) request.cancelled = true;
    if (speechSupported) speechSynthesis.cancel();
    readAloudAudio.pause();
    readAloudAudio.removeAttribute("src");
    readAloudAudio.load();
    if (!request) return;
    releaseGeneratedSpeech(request, true);
    resetSpeechButton(request);
  };

  const playGeneratedSpeech = async (request, audioPath) => {
    request.controller = new AbortController();
    request.loadTimer = setTimeout(() => {
      request.controller?.abort();
    }, 12000);
    try {
      const response = await fetch(audioPath, {
        cache: "force-cache",
        signal: request.controller.signal,
      });
      if (!response.ok) throw new Error(`Speech audio request failed: ${response.status}`);
      const audioBlob = await response.blob();
      clearTimeout(request.loadTimer);
      request.loadTimer = null;
      request.controller = null;
      if (activeSpeech !== request || request.cancelled) return;
      request.objectURL = URL.createObjectURL(audioBlob);
      readAloudAudio.src = request.objectURL;
      await readAloudAudio.play();
      if (activeSpeech !== request) return;
      request.button.classList.remove("loading");
      request.button.classList.add("speaking");
      request.button.textContent = "停止朗读";
    } catch {
      clearTimeout(request.loadTimer);
      request.loadTimer = null;
      request.controller = null;
      if (activeSpeech !== request || request.cancelled) return;
      speakWithBrowserVoice(request);
    }
  };

  const setSpeakButtonsDisabled = (disabled) => {
    article.querySelectorAll(".glossary-speak-button").forEach((button) => {
      button.disabled = disabled || !readAloudSupported;
    });
  };

  const makeSpeakButton = (text, label, audioPath) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "glossary-speak-button";
    button.textContent = readAloudSupported ? "AI 朗读" : "朗读不可用";
    button.disabled = !readAloudSupported;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      if (activeSpeech?.button === button) {
        stopSpeech();
        return;
      }
      stopSpeech();
      const request = {
        button,
        text,
        fallbackStarted: false,
        cancelled: false,
        controller: null,
        loadTimer: null,
        objectURL: null,
      };
      activeSpeech = request;
      button.classList.add("loading");
      button.setAttribute("aria-pressed", "true");
      button.textContent = "加载中";
      if (!generatedSpeechSupported) {
        speakWithBrowserVoice(request);
        return;
      }
      playGeneratedSpeech(request, audioPath);
    });
    return button;
  };

  const glossaryAudioPath = (entry, kind) => (
    `${CORE_VOCABULARY_AUDIO_BASE}/${String(entry.rank).padStart(3, "0")}-${kind}.mp3${kind === "word" ? `?v=${glossary.version}` : ""}`
  );

  const setRecordButtonsDisabled = (disabled) => {
    article.querySelectorAll(".glossary-record-button").forEach((button) => {
      button.disabled = disabled || !recordingSupported;
    });
  };

  const finishActiveRecording = (discard = false) => {
    if (!activeRecording) return;
    activeRecording.discarded ||= discard;
    clearInterval(activeRecording.timer);
    if (activeRecording.recorder.state !== "inactive") activeRecording.recorder.stop();
    activeRecording.stream.getTracks().forEach((track) => track.stop());
  };

  const cleanupRecordings = () => {
    stopSpeech();
    finishActiveRecording(true);
    recordings.forEach(({ url }) => URL.revokeObjectURL(url));
    recordings.clear();
  };
  window.addEventListener("hashchange", cleanupRecordings, { once: true });

  const makeInterviewPractice = (entry) => {
    const section = document.createElement("section");
    section.className = "glossary-interview-practice";

    const copy = document.createElement("div");
    copy.className = "glossary-interview-copy";
    const copyHeading = document.createElement("div");
    copyHeading.className = "glossary-field-heading";
    copyHeading.append(
      makeTextElement("span", "glossary-field-label", "面试表达"),
      makeSpeakButton(
        entry.interviewExpression,
        `朗读 ${entry.term} 的面试表达`,
        glossaryAudioPath(entry, "interview"),
      ),
    );
    copy.append(copyHeading, makeTextElement("p", "glossary-interview-expression", entry.interviewExpression));

    const recorderPanel = document.createElement("div");
    recorderPanel.className = "glossary-recorder";
    const actions = document.createElement("div");
    actions.className = "glossary-recorder-actions";
    const recordButton = document.createElement("button");
    recordButton.type = "button";
    recordButton.className = "glossary-record-button";
    recordButton.textContent = recordingSupported ? "开始录音" : "录音不可用";
    recordButton.disabled = !recordingSupported;
    const stopButton = document.createElement("button");
    stopButton.type = "button";
    stopButton.className = "glossary-stop-button";
    stopButton.textContent = "停止录音";
    stopButton.disabled = true;
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "glossary-delete-recording";
    deleteButton.textContent = "删除录音";
    deleteButton.disabled = true;
    actions.append(recordButton, stopButton, deleteButton);

    const status = makeTextElement(
      "span",
      "glossary-recording-status",
      recordingSupported ? "未录音" : "当前浏览器不支持麦克风录音",
    );
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const audio = document.createElement("audio");
    audio.className = "glossary-recording-playback";
    audio.controls = true;
    audio.preload = "metadata";
    audio.hidden = true;
    audio.setAttribute("aria-label", `${entry.term} 的口语录音`);
    recorderPanel.append(actions, status, audio);

    const savedRecording = recordings.get(entry.term);
    if (savedRecording) {
      audio.src = savedRecording.url;
      audio.hidden = false;
      recordButton.textContent = "重新录音";
      deleteButton.disabled = false;
      status.textContent = `录音完成 · ${formatGlossaryRecordingTime(savedRecording.duration)}`;
    }

    recordButton.addEventListener("click", async () => {
      if (activeRecording) return;
      stopSpeech();
      setSpeakButtonsDisabled(true);
      setRecordButtonsDisabled(true);
      status.textContent = "正在请求麦克风权限...";
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!section.isConnected) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const preferredTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
        const mimeType = typeof MediaRecorder.isTypeSupported === "function"
          ? preferredTypes.find((type) => MediaRecorder.isTypeSupported(type))
          : undefined;
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        const chunks = [];
        const session = {
          term: entry.term,
          recorder,
          stream,
          timer: null,
          startedAt: Date.now(),
          discarded: false,
          failed: false,
        };
        activeRecording = session;

        recorder.addEventListener("dataavailable", (event) => {
          if (event.data.size) chunks.push(event.data);
        });
        recorder.addEventListener("error", () => {
          session.failed = true;
          status.textContent = "录音失败，请重试";
          finishActiveRecording(true);
        });
        recorder.addEventListener("stop", () => {
          clearInterval(session.timer);
          stream.getTracks().forEach((track) => track.stop());
          if (activeRecording === session) activeRecording = null;
          setSpeakButtonsDisabled(false);
          setRecordButtonsDisabled(false);
          stopButton.disabled = true;

          if (session.discarded || session.failed) {
            deleteButton.disabled = !recordings.has(entry.term);
            return;
          }
          const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" });
          if (!blob.size) {
            status.textContent = "没有录到声音，请重试";
            deleteButton.disabled = !recordings.has(entry.term);
            return;
          }
          const existing = recordings.get(entry.term);
          if (existing) URL.revokeObjectURL(existing.url);
          const url = URL.createObjectURL(blob);
          const duration = Math.max(1, Math.round((Date.now() - session.startedAt) / 1000));
          recordings.set(entry.term, { url, duration });
          audio.src = url;
          audio.hidden = false;
          deleteButton.disabled = false;
          recordButton.textContent = "重新录音";
          status.textContent = `录音完成 · ${formatGlossaryRecordingTime(duration)}`;
        });

        audio.pause();
        recorder.start(250);
        stopButton.disabled = false;
        deleteButton.disabled = true;
        status.textContent = "录音中 00:00 / 01:00";
        session.timer = setInterval(() => {
          const elapsed = Math.min(60, Math.floor((Date.now() - session.startedAt) / 1000));
          status.textContent = `录音中 ${formatGlossaryRecordingTime(elapsed)} / 01:00`;
          if (elapsed >= 60) finishActiveRecording();
        }, 500);
      } catch (error) {
        stream?.getTracks().forEach((track) => track.stop());
        if (activeRecording?.term === entry.term) {
          clearInterval(activeRecording.timer);
          activeRecording = null;
        }
        setSpeakButtonsDisabled(false);
        setRecordButtonsDisabled(false);
        stopButton.disabled = true;
        status.textContent = error.name === "NotAllowedError"
          ? "未获得麦克风权限，请在浏览器中允许后重试"
          : "无法启动录音，请检查麦克风后重试";
      }
    });

    stopButton.addEventListener("click", () => {
      if (!activeRecording || activeRecording.term !== entry.term) return;
      stopButton.disabled = true;
      status.textContent = "正在保存录音...";
      finishActiveRecording();
    });

    deleteButton.addEventListener("click", () => {
      const recording = recordings.get(entry.term);
      if (!recording) return;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio.hidden = true;
      URL.revokeObjectURL(recording.url);
      recordings.delete(entry.term);
      deleteButton.disabled = true;
      recordButton.textContent = "开始录音";
      status.textContent = "未录音";
    });

    section.append(copy, recorderPanel);
    return section;
  };

  const header = document.createElement("header");
  header.className = "challenge-hero glossary-hero";
  const copy = document.createElement("div");
  const glossaryKicker = makeTextElement("span", "section-kicker", "按工作常用程度排序 · 500 词");
  copy.append(
    glossaryKicker,
    makeTextElement("h2", "", glossary.title),
    makeTextElement("p", "", glossary.summary),
  );
  const masteryProgress = makeChallengeProgress(mastery.size, glossary.count, "已掌握词汇");
  header.append(copy, masteryProgress);

  const controls = document.createElement("section");
  controls.className = "glossary-controls";
  controls.setAttribute("aria-label", "词汇表筛选和自测设置");

  const filters = document.createElement("div");
  filters.className = "glossary-filters";
  const searchLabel = document.createElement("label");
  searchLabel.className = "glossary-search";
  searchLabel.append(makeTextElement("span", "", "搜索词汇"));
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "英文词条或中文释义";
  search.autocomplete = "off";
  search.value = state.glossaryQuery;
  searchLabel.append(search);

  const categoryLabel = document.createElement("label");
  categoryLabel.append(makeTextElement("span", "", "业务分类"));
  const category = document.createElement("select");
  [["all", "全部分类"], ...glossary.categories.map((value) => [value, value])].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    category.append(option);
  });
  category.value = state.glossaryCategory;
  categoryLabel.append(category);

  const frequencyLabel = document.createElement("label");
  frequencyLabel.append(makeTextElement("span", "", "常用程度"));
  const frequency = document.createElement("select");
  [["all", "全部词汇"], ...glossary.frequencyTiers.map((value) => [value, value])].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    frequency.append(option);
  });
  frequency.value = state.glossaryFrequency;
  frequencyLabel.append(frequency);

  const sortLabel = document.createElement("label");
  sortLabel.append(makeTextElement("span", "", "排序方式"));
  const sort = document.createElement("select");
  [
    ["frequency", "常用程度"],
    ["alphabetical", "字母 A-Z"],
  ].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    sort.append(option);
  });
  sort.value = state.glossarySort;
  sortLabel.append(sort);

  const unmasteredLabel = document.createElement("label");
  unmasteredLabel.className = "glossary-check-control";
  const unmastered = document.createElement("input");
  unmastered.type = "checkbox";
  unmastered.checked = state.glossaryUnmasteredOnly;
  unmasteredLabel.append(unmastered, makeTextElement("span", "", "只看未掌握"));
  filters.append(searchLabel, categoryLabel, frequencyLabel, sortLabel, unmasteredLabel);

  const masks = document.createElement("fieldset");
  masks.className = "glossary-mask-controls";
  masks.append(makeTextElement("legend", "", "遮盖自测"));
  [
    ["definition", "中文释义"],
    ["example", "英文例句"],
    ["translation", "中文翻译"],
  ].forEach(([key, label]) => {
    const control = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.glossaryMasks[key];
    checkbox.addEventListener("change", () => {
      state.glossaryMasks[key] = checkbox.checked;
      renderEntries();
    });
    control.append(checkbox, makeTextElement("span", "", label));
    masks.append(control);
  });
  controls.append(filters, masks);

  const resultHead = document.createElement("div");
  resultHead.className = "glossary-result-head";
  const resultCount = makeTextElement("strong", "", "");
  const resultRange = makeTextElement("span", "", "");
  resultHead.append(resultCount, resultRange);

  const list = document.createElement("div");
  list.className = "glossary-list";
  list.setAttribute("aria-live", "polite");

  const pagination = document.createElement("nav");
  pagination.className = "glossary-pagination";
  pagination.setAttribute("aria-label", "词汇表分页");
  const previous = document.createElement("button");
  previous.type = "button";
  previous.textContent = "← 上一页";
  const pagePicker = document.createElement("label");
  pagePicker.className = "glossary-page-picker";
  const pageSelect = document.createElement("select");
  pageSelect.setAttribute("aria-label", "选择页码");
  const pageTotal = makeTextElement("span", "", "");
  pagePicker.append(makeTextElement("span", "", "第"), pageSelect, pageTotal);
  const next = document.createElement("button");
  next.type = "button";
  next.textContent = "下一页 →";
  pagination.append(previous, pagePicker, next);

  const updateMasteryProgress = () => {
    masteryProgress.querySelector("strong").textContent = `${mastery.size} / ${glossary.count}`;
    masteryProgress.querySelector(".challenge-progress-track").setAttribute("aria-valuenow", String(mastery.size));
    masteryProgress.querySelector(".challenge-progress-track span").style.width = `${mastery.size / glossary.count * 100}%`;
  };

  const filteredEntries = () => {
    const query = state.glossaryQuery.toLocaleLowerCase("zh-CN");
    const filtered = glossary.entries.filter((entry) => {
      if (state.glossaryCategory !== "all" && entry.category !== state.glossaryCategory) return false;
      if (state.glossaryFrequency !== "all" && entry.frequency !== state.glossaryFrequency) return false;
      if (state.glossaryUnmasteredOnly && mastery.has(entry.term)) return false;
      if (!query) return true;
      return [entry.term, entry.definition, entry.example, entry.translation, entry.interviewExpression]
        .some((value) => value.toLocaleLowerCase("zh-CN").includes(query));
    });
    return filtered.sort((left, right) => state.glossarySort === "alphabetical"
      ? left.term.localeCompare(right.term, "en", { sensitivity: "base", numeric: true })
      : left.rank - right.rank);
  };

  function renderEntries() {
    stopSpeech();
    finishActiveRecording(true);
    const filtered = filteredEntries();
    const totalPages = Math.max(1, Math.ceil(filtered.length / GLOSSARY_PAGE_SIZE));
    state.glossaryPage = Math.min(Math.max(1, state.glossaryPage), totalPages);
    const start = (state.glossaryPage - 1) * GLOSSARY_PAGE_SIZE;
    const visible = filtered.slice(start, start + GLOSSARY_PAGE_SIZE);
    list.replaceChildren();

    visible.forEach((entry) => {
      const row = document.createElement("article");
      row.className = "glossary-entry";
      row.classList.toggle("mastered", mastery.has(entry.term));
      row.dataset.rank = entry.rank;

      const entryHeader = document.createElement("header");
      entryHeader.className = "glossary-entry-header";
      const rank = makeTextElement("span", "glossary-rank", String(entry.rank).padStart(3, "0"));
      const title = document.createElement("div");
      const termHeading = document.createElement("div");
      termHeading.className = "glossary-term-heading";
      termHeading.append(
        makeTextElement("h3", "", entry.term),
        makeTextElement("span", "glossary-ipa", entry.ipa),
      );
      title.append(
        termHeading,
        makeSpeakButton(entry.term, `朗读单词 ${entry.term}`, glossaryAudioPath(entry, "word")),
        makeTextElement("span", "glossary-category", entry.category),
        makeTextElement("span", "glossary-frequency", entry.frequency),
      );
      const masteredButton = document.createElement("button");
      masteredButton.type = "button";
      masteredButton.className = "glossary-mastery-button";
      const setMasteryButton = () => {
        const isMastered = mastery.has(entry.term);
        masteredButton.classList.toggle("active", isMastered);
        masteredButton.setAttribute("aria-pressed", String(isMastered));
        masteredButton.textContent = isMastered ? "✓ 已掌握" : "标记掌握";
      };
      setMasteryButton();
      masteredButton.addEventListener("click", () => {
        if (mastery.has(entry.term)) mastery.delete(entry.term);
        else mastery.add(entry.term);
        persistGlossaryMastery(pack.skillId);
        renderLearningSidebar();
        updateMasteryProgress();
        if (state.glossaryUnmasteredOnly) renderEntries();
        else {
          row.classList.toggle("mastered", mastery.has(entry.term));
          setMasteryButton();
        }
      });
      entryHeader.append(rank, title, masteredButton);

      const body = document.createElement("div");
      body.className = "glossary-entry-body";
      body.append(
        makeGlossaryCoveredField("中文释义", entry.definition, state.glossaryMasks.definition),
        makeGlossaryCoveredField(
          "英文例句",
          entry.example,
          state.glossaryMasks.example,
          makeSpeakButton(
            entry.example,
            `朗读 ${entry.term} 的英文例句`,
            glossaryAudioPath(entry, "example"),
          ),
        ),
        makeGlossaryCoveredField("中文翻译", entry.translation, state.glossaryMasks.translation),
      );
      row.append(entryHeader, body, makeInterviewPractice(entry));
      list.append(row);
    });

    if (!visible.length) {
      const empty = document.createElement("div");
      empty.className = "glossary-empty";
      empty.append(
        makeTextElement("strong", "", "没有符合当前条件的词汇"),
        makeTextElement("span", "", "调整搜索、分类或掌握状态后再试。"),
      );
      list.append(empty);
    }

    resultCount.textContent = `${filtered.length} 个词条`;
    const sortDescription = state.glossarySort === "alphabetical" ? "按字母 A-Z 排序" : "按常用程度排序";
    glossaryKicker.textContent = `${sortDescription} · ${glossary.count} 词`;
    resultRange.textContent = filtered.length
      ? `显示 ${start + 1}-${Math.min(start + GLOSSARY_PAGE_SIZE, filtered.length)} · ${sortDescription}`
      : "当前筛选无结果";
    pageSelect.replaceChildren(...Array.from({ length: totalPages }, (_, index) => {
      const option = document.createElement("option");
      option.value = String(index + 1);
      option.textContent = String(index + 1);
      return option;
    }));
    pageSelect.value = String(state.glossaryPage);
    pageTotal.textContent = `/ ${totalPages} 页`;
    previous.disabled = state.glossaryPage === 1;
    next.disabled = state.glossaryPage === totalPages;
    pagination.hidden = filtered.length <= GLOSSARY_PAGE_SIZE;
  }

  const resetPageAndRender = () => {
    state.glossaryPage = 1;
    renderEntries();
  };
  search.addEventListener("input", () => {
    state.glossaryQuery = search.value.trim();
    resetPageAndRender();
  });
  category.addEventListener("change", () => {
    state.glossaryCategory = category.value;
    resetPageAndRender();
  });
  frequency.addEventListener("change", () => {
    state.glossaryFrequency = frequency.value;
    resetPageAndRender();
  });
  sort.addEventListener("change", () => {
    state.glossarySort = sort.value;
    resetPageAndRender();
  });
  unmastered.addEventListener("change", () => {
    state.glossaryUnmasteredOnly = unmastered.checked;
    resetPageAndRender();
  });
  pageSelect.addEventListener("change", () => {
    state.glossaryPage = Number(pageSelect.value);
    renderEntries();
    resultHead.scrollIntoView({ block: "start", behavior: "smooth" });
  });
  previous.addEventListener("click", () => {
    state.glossaryPage -= 1;
    renderEntries();
    resultHead.scrollIntoView({ block: "start", behavior: "smooth" });
  });
  next.addEventListener("click", () => {
    state.glossaryPage += 1;
    renderEntries();
    resultHead.scrollIntoView({ block: "start", behavior: "smooth" });
  });

  article.append(
    makeChallengeBreadcrumb(pack),
    header,
    controls,
    resultHead,
    list,
    pagination,
  );
  elements.skillDetailContainer.replaceChildren(article);
  renderEntries();
}

function renderChallengeLevel(pack, levelId) {
  const level = pack.levels.find((item) => item.id === levelId);
  if (!level) {
    navigateLearning("detail", pack.skillId);
    return;
  }
  setChallengeDetailChrome();
  const progress = getChallengeProgress(pack.skillId);
  const completed = level.questions.filter((question) => progress.has(`${level.id}/${question.id}`)).length;
  const article = document.createElement("article");
  article.className = "challenge-page challenge-level-page";
  article.classList.toggle("challenge-compact", Boolean(pack.ui?.compact));

  const header = document.createElement("header");
  header.className = "challenge-level-header";
  const copy = document.createElement("div");
  const levelIndex = pack.levels.findIndex((item) => item.id === level.id);
  copy.append(
    makeTextElement("span", "section-kicker", level.chapter || `LEVEL ${String(levelIndex + 1).padStart(2, "0")}`),
    makeTextElement("h2", "", level.title),
    makeTextElement("p", "", level.objective),
  );
  if (!pack.ui?.compact) copy.append(makeTextElement("p", "challenge-story", level.story));
  header.append(copy, makeChallengeProgress(completed, level.questions.length, "本等级进度"));

  const list = document.createElement("div");
  list.className = "challenge-question-list";
  level.questions.forEach((question, questionIndex) => {
    const status = challengeStatus(pack, level, question);
    const mode = challengeMode(question, questionIndex);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "challenge-question-row";
    button.classList.toggle("completed", status.completed);
    button.classList.toggle("locked", !status.unlocked);
    button.disabled = !status.unlocked;
    button.dataset.questionId = question.id;
    button.append(
      makeTextElement("span", "challenge-question-number", String(questionIndex + 1).padStart(2, "0")),
      makeTextElement("span", "challenge-question-copy", question.title),
      makeTextElement("span", `challenge-question-type mode-${mode}`, challengeModeLabel(pack, mode)),
      makeTextElement("span", "challenge-question-state", status.completed ? "已完成" : status.unlocked ? "开始 →" : "锁定"),
    );
    button.addEventListener("click", () => navigateLearning("challengeQuestion", pack.skillId, true, level.id, question.id));
    list.append(button);
  });

  const footer = document.createElement("div");
  footer.className = "challenge-level-footer";
  const back = document.createElement("button");
  back.type = "button";
  back.textContent = "← 返回关卡地图";
  back.addEventListener("click", () => navigateLearning("detail", pack.skillId));
  footer.append(back);
  article.append(makeChallengeBreadcrumb(pack, level), header, list);
  if (completed === level.questions.length && level.reward) article.append(makeLevelReward(level));
  article.append(footer);
  elements.skillDetailContainer.replaceChildren(article);
}

function renderChallengeQuestion(pack, levelId, questionId) {
  const level = pack.levels.find((item) => item.id === levelId);
  const question = level?.questions.find((item) => item.id === questionId);
  if (!level || !question) {
    navigateLearning("detail", pack.skillId);
    return;
  }
  const status = challengeStatus(pack, level, question);
  if (!status.unlocked) {
    navigateLearning("challengeLevel", pack.skillId, true, level.id);
    return;
  }
  setChallengeDetailChrome();
  const allQuestions = challengeQuestions(pack);
  const previous = allQuestions[status.index - 1];
  const next = allQuestions[status.index + 1];
  const questionIndex = level.questions.indexOf(question);
  const mode = challengeMode(question, questionIndex);
  const article = document.createElement("article");
  article.className = `challenge-page challenge-question-page challenge-mode-${mode}`;
  article.classList.toggle("challenge-compact", Boolean(pack.ui?.compact));
  article.dataset.questionId = question.id;

  const header = document.createElement("header");
  header.className = "challenge-question-header";
  const label = makeTextElement("span", "section-kicker", `${level.chapter || level.title} · 第 ${questionIndex + 1} 题`);
  const title = makeTextElement("h2", "", question.title);
  const meta = document.createElement("div");
  meta.className = "challenge-question-meta";
  meta.append(makeTextElement("span", `mode-${mode}`, challengeModeLabel(pack, mode)));
  const difficulty = question.difficulty || level.difficulty;
  if (difficulty) meta.append(makeTextElement("span", "", `难度 ${difficulty} / 5`));
  meta.append(
    makeTextElement("span", "", question.type),
    makeTextElement("span", "", `${status.index + 1} / ${status.total}`),
  );
  header.append(label, title, meta);

  let promptSection;
  if (question.sqlSpec) {
    promptSection = makeSQLProblem(pack, question);
  } else {
    promptSection = document.createElement("section");
    promptSection.className = "challenge-prompt";
    promptSection.append(
      makeTextElement("span", "challenge-section-label", "情境"),
      makeTextElement("p", "challenge-context", question.prompt),
      makeTextElement("span", "challenge-section-label", "学习目标"),
      makeTextElement("p", "challenge-task", question.task),
    );
    if (question.hint) {
      const hint = document.createElement("details");
      hint.className = "challenge-hint";
      hint.append(makeTextElement("summary", "", "需要提示？"), makeTextElement("p", "", question.hint));
      promptSection.append(hint);
    }
  }

  const revealButton = document.createElement("button");
  revealButton.type = "button";
  revealButton.className = "challenge-primary-button";
  revealButton.textContent = "查看参考答案";
  revealButton.disabled = false;
  revealButton.setAttribute("aria-expanded", "false");
  const answerGate = makeTextElement("span", "challenge-answer-gate", "无需作答，可以直接查看答案或前往下一题。");
  answerGate.hidden = Boolean(pack.ui?.compact);
  const answerActions = document.createElement("div");
  answerActions.className = "challenge-answer-actions";
  answerActions.append(revealButton, answerGate);

  const response = makeChallengeResponse(pack, level, question, questionIndex, () => {});

  const answerPanel = document.createElement("section");
  answerPanel.className = "challenge-answer";
  answerPanel.classList.toggle("is-code", Boolean(
    question.sqlSpec
    || question.activity?.mode === "sql"
    || question.activity?.input === "sql"
    || question.answer?.format === "sql"
  ));
  answerPanel.hidden = true;
  answerPanel.append(
    makeTextElement("span", "challenge-section-label", "参考答案"),
    makeTextElement("div", "challenge-answer-sample", question.answer.sample),
  );
  const translation = question.answer.translation || pack.translations?.[question.id];
  if (translation) {
    answerPanel.append(
      makeTextElement("span", "challenge-section-label challenge-translation-label", "中文翻译"),
      makeTextElement("div", "challenge-answer-translation", translation),
    );
  }
  const notesTitle = makeTextElement("h3", "", "答案拆解");
  const notes = document.createElement("ul");
  appendList(notes, question.answer.notes);
  const keywords = document.createElement("div");
  keywords.className = "challenge-keywords";
  keywords.append(makeTextElement("span", "", "关键词"));
  question.answer.keywords.forEach((keyword) => keywords.append(makeTextElement("code", "", keyword)));
  answerPanel.append(notesTitle, notes, keywords);

  const navigation = document.createElement("nav");
  navigation.className = "challenge-question-navigation";
  navigation.setAttribute("aria-label", "上一题或下一题");
  const homeButton = document.createElement("button");
  homeButton.type = "button";
  homeButton.className = "challenge-home-button";
  homeButton.textContent = "关卡地图";
  homeButton.addEventListener("click", () => navigateLearning("detail", pack.skillId));
  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.textContent = previous ? `← 上一题 · ${previous.question.title}` : "已经是第一题";
  previousButton.disabled = !previous;
  previousButton.addEventListener("click", () => previous && navigateLearning("challengeQuestion", pack.skillId, true, previous.level.id, previous.question.id));
  const nextButton = document.createElement("button");
  nextButton.type = "button";
  const setNextButton = () => {
    nextButton.disabled = !next;
    nextButton.textContent = !next
      ? "已完成全部题目"
      : `下一题 · ${next.question.title} →`;
  };
  setNextButton();
  nextButton.addEventListener("click", () => next && navigateLearning("challengeQuestion", pack.skillId, true, next.level.id, next.question.id));
  navigation.append(homeButton, previousButton, nextButton);

  const completeQuestion = () => {
    const key = `${level.id}/${question.id}`;
    const progress = getChallengeProgress(pack.skillId);
    if (progress.has(key)) {
      setNextButton();
      return;
    }
    completeDailyMissionItem(pack, key);
    progress.add(key);
    persistChallengeProgress(pack.skillId);
    markPracticeDay(pack.skillId);
    updateChallengeSkillLevel(pack);
    article.classList.add("completed");
    setNextButton();

    const levelComplete = level.questions.every((item) => progress.has(`${level.id}/${item.id}`));
    if (levelComplete && level.reward && !article.querySelector(".challenge-reward")) {
      const reward = makeLevelReward(level, true);
      article.insertBefore(reward, navigation);
      reward.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  };

  revealButton.addEventListener("click", () => {
    const willShow = answerPanel.hidden;
    answerPanel.hidden = !willShow;
    revealButton.textContent = willShow ? "收起参考答案" : "查看参考答案";
    revealButton.setAttribute("aria-expanded", String(willShow));
    if (willShow) {
      response.onReveal();
      completeQuestion();
    }
  });

  if (status.completed) article.classList.add("completed");
  article.append(
    makeChallengeBreadcrumb(pack, level),
    header,
    promptSection,
    response.element,
    answerActions,
    answerPanel,
    navigation,
  );
  elements.skillDetailContainer.replaceChildren(article);
  if (next?.level.file && next.level.id !== level.id) {
    const schedule = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 0));
    schedule(() => ensureChallengeLevel(pack.skillId, next.level.id, pack).catch(() => {}));
  }
}

function renderSkillDetail(skillId) {
  const skill = state.guide.skills.find((item) => item.id === skillId);
  if (!skill) return;
  elements.detailBreadcrumb.hidden = false;
  elements.detailPagination.hidden = false;
  const article = document.createElement("article");
  article.className = `skill-detail-page skill-group-${skill.group}`;
  article.dataset.skillId = skill.id;

  const header = document.createElement("header");
  header.className = "skill-detail-header";
  const copy = document.createElement("div");
  const badges = document.createElement("div");
  badges.className = "skill-badges";
  const coverage = document.createElement("span");
  coverage.className = "skill-coverage";
  coverage.textContent = skill.coverageLabel;
  badges.append(makePriorityBadge(skill), coverage);
  const title = document.createElement("h2");
  title.textContent = skill.title;
  const goal = document.createElement("p");
  goal.textContent = skill.goal;
  const boundary = document.createElement("p");
  boundary.className = "skill-boundary";
  boundary.textContent = `能力边界 · ${skill.boundary}`;
  copy.append(badges, title, goal, boundary);
  const levelControl = document.createElement("label");
  levelControl.className = "detail-level-control";
  const levelLabel = document.createElement("span");
  levelLabel.textContent = "当前能力等级";
  const levelSelect = makeLevelSelect(skill, (level) => {
    article.classList.toggle("mastered", level >= state.guide.targetLevel);
  });
  levelControl.append(levelLabel, levelSelect);
  header.append(copy, levelControl);

  const facts = document.createElement("div");
  facts.className = "skill-detail-facts";
  [
    ["岗位信号", skill.coverageLabel],
    ["训练规模", `${skill.path.length} 个阶段 · ${skill.exercises.length} 道练习`],
  ].forEach(([label, value]) => {
    const block = document.createElement("div");
    const small = document.createElement("span");
    small.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value;
    block.append(small, strong);
    facts.append(block);
  });

  const progress = document.createElement("div");
  progress.className = "coverage-track";
  const fill = document.createElement("span");
  fill.style.width = `${skill.coverageCount / skill.coverageTotal * 100}%`;
  progress.append(fill);

  const detailGrid = document.createElement("div");
  detailGrid.className = "skill-detail-grid detail-content-grid";
  const pathSection = document.createElement("section");
  const pathTitle = document.createElement("h3");
  pathTitle.textContent = "学习路径";
  const path = document.createElement("div");
  path.className = "learning-path";
  skill.path.forEach((stage, index) => {
    const block = document.createElement("div");
    block.className = "path-stage";
    const heading = document.createElement("h4");
    const number = document.createElement("span");
    number.textContent = String(index + 1).padStart(2, "0");
    heading.append(number, document.createTextNode(stage.title));
    const list = document.createElement("ul");
    appendList(list, stage.points);
    block.append(heading, list);
    path.append(block);
  });
  pathSection.append(pathTitle, path);

  const exerciseSection = document.createElement("section");
  const exerciseTitle = document.createElement("h3");
  exerciseTitle.textContent = "练习题";
  const exercises = document.createElement("ol");
  exercises.className = "exercise-list";
  appendList(exercises, skill.exercises);
  exerciseSection.append(exerciseTitle, exercises);
  detailGrid.append(pathSection, exerciseSection);

  const resourceSection = document.createElement("section");
  resourceSection.className = "resource-section detail-section";
  const resourceTitle = document.createElement("h3");
  resourceTitle.textContent = "参考资料";
  const resources = document.createElement("div");
  resources.className = "resource-list";
  if (skill.resources.length) resources.append(...skill.resources.map(makeResourceLink));
  else {
    const note = document.createElement("p");
    note.className = "resource-note";
    note.textContent = "本项不增加书单，优先复盘真实项目并补齐可验证证据。";
    resources.append(note);
  }
  resourceSection.append(resourceTitle, resources);

  const outputSection = document.createElement("section");
  outputSection.className = "detail-output-section";
  const outputCopy = document.createElement("div");
  const outputKicker = document.createElement("span");
  outputKicker.className = "section-kicker";
  outputKicker.textContent = "必交产出";
  const outputTitle = document.createElement("h3");
  outputTitle.textContent = skill.deliverable;
  outputCopy.append(outputKicker, outputTitle);
  const acceptance = document.createElement("div");
  const acceptanceTitle = document.createElement("h4");
  acceptanceTitle.textContent = "完成标准";
  const acceptanceList = document.createElement("ul");
  acceptanceList.className = "acceptance-list";
  appendList(acceptanceList, skill.acceptance);
  acceptance.append(acceptanceTitle, acceptanceList);
  outputSection.append(outputCopy, acceptance);

  article.classList.toggle("mastered", (Number(state.skillLevels[skill.id]) || 0) >= state.guide.targetLevel);
  article.append(header, facts, progress, detailGrid, resourceSection, outputSection);
  elements.skillDetailContainer.replaceChildren(article);

  const ordered = [...state.guide.skills].sort((left, right) => left.number - right.number);
  const index = ordered.findIndex((item) => item.id === skill.id);
  const previous = ordered[index - 1];
  const next = ordered[index + 1];
  elements.detailPosition.textContent = `${index + 1} / ${ordered.length}`;
  elements.previousSkill.disabled = !previous;
  elements.previousSkill.textContent = previous ? `← ${previous.title}` : "已经是第一项";
  elements.nextSkill.disabled = !next;
  elements.nextSkill.textContent = next ? `${next.title} →` : "已经是最后一项";
  elements.previousSkill.onclick = () => previous && navigateLearning("detail", previous.id);
  elements.nextSkill.onclick = () => next && navigateLearning("detail", next.id);
  state.renderedLearningViews.add(`detail:${skill.id}`);
}

function makeLearningNavButton(label, meta, active, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = active ? "active" : "";
  button.setAttribute("aria-pressed", String(active));
  const text = document.createElement("span");
  text.className = "nav-label";
  text.textContent = label;
  const count = document.createElement("span");
  count.className = "nav-count";
  count.textContent = meta;
  button.append(text, count);
  button.addEventListener("click", onClick);
  return button;
}

function renderLearningSidebar() {
  if (!state.guide) return;
  elements.learningSkillNav.replaceChildren();
  state.guide.groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "learning-side-group";
    const title = document.createElement("h3");
    title.textContent = group.label;
    section.append(title);
    state.guide.skills
      .filter((skill) => skill.group === group.id)
      .sort((left, right) => left.number - right.number)
      .forEach((skill) => {
        const level = Number(state.skillLevels[skill.id]) || 0;
        const pack = state.challengePacks.get(skill.id);
        const isGlossary = skill.challenge?.defaultPage === "challengeGlossary";
        const challengeMeta = isGlossary
          ? `${getGlossaryMastery(skill.id).size}/${skill.challenge.glossary}`
          : pack
            ? `${getChallengeProgress(skill.id).size}/${challengeQuestions(pack).length}`
            : "闯关";
        section.append(makeLearningNavButton(
          skill.title,
          skill.challenge ? challengeMeta : `${level}级`,
          ["detail", "challengeLevel", "challengeQuestion", "challengeGlossary"].includes(state.learningTab) && state.selectedSkill === skill.id,
          () => navigateLearning(skillLandingPage(skill), skill.id),
        ));
      });
    elements.learningSkillNav.append(section);
  });
}

async function ensureGuideLoaded() {
  if (state.guide) return state.guide;
  if (!state.guidePromise) {
    state.guidePromise = fetch("learning-guide.json")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((guide) => {
        state.guide = guide;
        normalizeLearningProgress();
        elements.skillJobCount.textContent = guide.sample.totalJobs;
        renderLearningSidebar();
        return guide;
      })
      .catch((error) => {
        state.guidePromise = null;
        throw error;
      });
  }
  return state.guidePromise;
}

async function ensureChallengePack(skillId) {
  if (state.challengePacks.has(skillId)) return state.challengePacks.get(skillId);
  if (!state.challengePromises.has(skillId)) {
    const challenge = state.guide?.skills.find((skill) => skill.id === skillId)?.challenge;
    const source = challenge?.manifest
      || directLearningAssets[skillId]?.manifest
      || `challenges/${encodeURIComponent(skillId)}.json`;
    const request = fetch(source)
      .then((response) => {
        if (!response.ok) throw new Error(`题库 HTTP ${response.status}`);
        return response.json();
      })
      .then((pack) => {
        if (pack.skillId !== skillId || !Array.isArray(pack.levels)) throw new Error("题库格式不正确");
        const questions = challengeQuestions(pack);
        const validKeys = new Set(questions.map((item) => item.key));
        const keyByQuestionId = new Map(questions.map((item) => [item.question.id, item.key]));
        const progress = getChallengeProgress(skillId);
        [...progress].forEach((key) => {
          if (validKeys.has(key)) return;
          progress.delete(key);
          const migratedKey = keyByQuestionId.get(key.split("/").at(-1));
          if (migratedKey) progress.add(migratedKey);
        });
        persistChallengeProgress(skillId);
        state.challengePacks.set(skillId, pack);
        renderLearningSidebar();
        return pack;
      })
      .catch((error) => {
        state.challengePromises.delete(skillId);
        throw error;
      });
    state.challengePromises.set(skillId, request);
  }
  return state.challengePromises.get(skillId);
}

function validateChallengeGlossary(skillId, pack, glossary) {
  const expectedVersion = skillId === "core-vocabulary"
    ? CORE_VOCABULARY_GLOSSARY_VERSION
    : pack.glossary.version;
  if (
    (expectedVersion != null && glossary.version !== expectedVersion)
    || !Array.isArray(glossary.entries)
    || glossary.entries.length !== pack.glossary.count
  ) {
    throw new Error("词汇表格式或数量不正确");
  }
  if (glossary.entries.some((entry) => (
    typeof entry.interviewExpression !== "string"
    || !entry.interviewExpression.trim()
    || typeof entry.ipa !== "string"
    || !/^\/.+\/$/.test(entry.ipa)
  ))) {
    throw new Error("词汇表缺少面试表达或美式音标");
  }
  const ranks = glossary.entries.map((entry) => entry.rank);
  const terms = glossary.entries.map((entry) => entry.term.toLocaleLowerCase("en-US"));
  if (ranks.some((rank, index) => rank !== index + 1) || new Set(terms).size !== terms.length) {
    throw new Error("词汇表排序或词条不正确");
  }
  const mastery = getGlossaryMastery(skillId);
  const validTerms = new Set(glossary.entries.map((entry) => entry.term));
  [...mastery].forEach((term) => {
    if (!validTerms.has(term)) mastery.delete(term);
  });
  persistGlossaryMastery(skillId);
  return glossary;
}

function glossaryCacheKey(skillId) {
  const version = skillId === "core-vocabulary" ? `-v${CORE_VOCABULARY_GLOSSARY_VERSION}` : "";
  return `recruitment-glossary-cache-${skillId}${version}`;
}

function persistGlossaryCache(skillId, glossary) {
  try {
    localStorage.setItem(glossaryCacheKey(skillId), JSON.stringify(glossary));
  } catch {
    // The network path remains available when browser storage is restricted or full.
  }
}

async function ensureChallengeGlossary(skillId, pack) {
  if (state.challengeGlossaries.has(skillId)) return state.challengeGlossaries.get(skillId);
  if (!pack.glossary?.file) throw new Error("该题库尚未配置词汇表");

  const cached = readStoredJSON(glossaryCacheKey(skillId), null);
  if (cached) {
    try {
      const glossary = validateChallengeGlossary(skillId, pack, cached);
      state.challengeGlossaries.set(skillId, glossary);
      fetch(pack.glossary.file)
        .then((response) => response.ok ? response.json() : Promise.reject(new Error(`词汇表 HTTP ${response.status}`)))
        .then((freshGlossary) => {
          validateChallengeGlossary(skillId, pack, freshGlossary);
          persistGlossaryCache(skillId, freshGlossary);
          state.challengeGlossaries.set(skillId, freshGlossary);
        })
        .catch(() => {});
      return glossary;
    } catch {
      try {
        localStorage.removeItem(glossaryCacheKey(skillId));
      } catch {
        // Ignore storage restrictions and continue with the network copy.
      }
    }
  }

  if (!state.challengeGlossaryPromises.has(skillId)) {
    const request = fetch(pack.glossary.file)
      .then((response) => {
        if (!response.ok) throw new Error(`词汇表 HTTP ${response.status}`);
        return response.json();
      })
      .then((glossary) => {
        validateChallengeGlossary(skillId, pack, glossary);
        persistGlossaryCache(skillId, glossary);
        state.challengeGlossaries.set(skillId, glossary);
        return glossary;
      })
      .catch((error) => {
        state.challengeGlossaryPromises.delete(skillId);
        throw error;
      });
    state.challengeGlossaryPromises.set(skillId, request);
  }
  return state.challengeGlossaryPromises.get(skillId);
}

async function ensureChallengeLevel(skillId, levelId, pack) {
  const level = pack.levels.find((item) => item.id === levelId);
  if (!level || !level.file) return level;
  const cacheKey = `${skillId}/${levelId}`;
  if (state.challengeLevels.has(cacheKey)) return state.challengeLevels.get(cacheKey);
  if (!state.challengeLevelPromises.has(cacheKey)) {
    const request = fetch(level.file)
      .then((response) => {
        if (!response.ok) throw new Error(`关卡 HTTP ${response.status}`);
        return response.json();
      })
      .then((loadedLevel) => {
        if (
          loadedLevel.skillId !== skillId
          || loadedLevel.id !== levelId
          || !Array.isArray(loadedLevel.questions)
        ) throw new Error("关卡格式不正确");
        state.challengeLevels.set(cacheKey, loadedLevel);
        return loadedLevel;
      })
      .catch((error) => {
        state.challengeLevelPromises.delete(cacheKey);
        throw error;
      });
    state.challengeLevelPromises.set(cacheKey, request);
  }
  return state.challengeLevelPromises.get(cacheKey);
}

function validInterviewCheck(check) {
  if (!(check?.id && check.label && check.kind && check.problem && check.improvement && check.followUp)) return false;
  if (check.kind === "keywordGroups") {
    return Array.isArray(check.groups)
      && check.groups.length
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

function validInterviewQuestion(question, categoryIds) {
  return question.id
    && categoryIds.has(question.category)
    && question.title
    && question.prompt
    && question.intent
    && question.duration
    && Array.isArray(question.dimensions)
    && Array.isArray(question.framework)
    && question.framework.length >= 4
    && Array.isArray(question.checks)
    && question.checks.length === 5
    && question.checks.every(validInterviewCheck);
}

function emptyInterviewQuestionBank(loadError = "") {
  return {
    version: 0,
    title: "高频题库暂时不可用",
    description: "核心训练仍可正常使用。",
    answerGuides: {},
    checkProfiles: {},
    methodSources: [],
    questions: [],
    unavailable: true,
    loadError,
  };
}

function validateInterviewPlan(plan, questionBank = null) {
  if (!plan || !Array.isArray(plan.categories) || !Array.isArray(plan.questions) || !plan.questions.length) {
    throw new Error("面试计划格式不正确");
  }
  const categoryIds = new Set(plan.categories.map((category) => category.id));
  const coreQuestionIds = plan.questions.map((question) => question.id);
  if (new Set(coreQuestionIds).size !== coreQuestionIds.length) throw new Error("面试题 ID 重复");
  if (!plan.questions.every((question) => validInterviewQuestion(question, categoryIds))) {
    throw new Error("面试题缺少框架或检查项");
  }
  if (!questionBank) return { ...plan, questionBank: emptyInterviewQuestionBank() };
  if (!Array.isArray(questionBank.questions) || !questionBank.questions.length) {
    throw new Error("面试题库格式不正确");
  }
  const profiles = questionBank.checkProfiles || {};
  const bankQuestions = questionBank.questions.map((question) => ({
    ...question,
    checks: (profiles[question.checkProfile] || []).map((check) => ({ ...check })),
  }));
  const allQuestions = [...plan.questions, ...bankQuestions];
  const questionIds = allQuestions.map((question) => question.id);
  if (new Set(questionIds).size !== questionIds.length) throw new Error("面试题 ID 重复");
  if (!bankQuestions.every((question) => validInterviewQuestion(question, categoryIds))) {
    throw new Error("面试题缺少框架或检查项");
  }
  const validBankMetadata = bankQuestions.every((question) => (
    ["high", "medium", "supplementary"].includes(question.priority)
    && Array.isArray(question.formats)
    && question.formats.length
    && Array.isArray(question.stages)
    && question.stages.length
    && Array.isArray(question.roleFamilies)
    && question.roleFamilies.length
    && question.answerEdge
    && Array.isArray(question.evidence)
    && question.evidence.length >= 3
    && Array.isArray(question.followUps)
    && question.followUps.length >= 3
    && Array.isArray(question.pitfalls)
    && question.pitfalls.length >= 2
  ));
  if (!validBankMetadata) throw new Error("面试题库缺少岗位标签或答题指南");
  const guides = questionBank.answerGuides || {};
  const validCoreGuides = plan.questions.every((question) => {
    const guide = guides[question.id];
    return guide?.answerEdge
      && guide.evidence?.length >= 3
      && guide.followUps?.length >= 3
      && guide.pitfalls?.length >= 2;
  });
  if (!validCoreGuides) throw new Error("核心面试题缺少答题指南");
  return {
    ...plan,
    questionBank: {
      ...questionBank,
      questions: bankQuestions,
    },
  };
}

async function ensureInterviewPlanLoaded() {
  if (state.interviewPlan) return state.interviewPlan;
  if (!state.interviewPlanPromise) {
    state.interviewPlanPromise = Promise.all([
      fetch("interview-plan.json").then((response) => {
        if (!response.ok) throw new Error(`面试计划 HTTP ${response.status}`);
        return response.json();
      }),
      fetch("interview-question-bank.json").then((response) => {
        if (!response.ok) throw new Error(`面试题库 HTTP ${response.status}`);
        return response.json();
      }).catch((error) => ({ loadError: error.message })),
    ])
      .then(([plan, questionBank]) => {
        const corePlan = validateInterviewPlan(plan);
        if (!questionBank || questionBank.loadError) {
          const loadError = questionBank?.loadError || "题库内容为空";
          console.warn(`面试题库加载失败，已降级为核心训练：${loadError}`);
          corePlan.questionBank = emptyInterviewQuestionBank(loadError);
          state.interviewPlan = corePlan;
          return state.interviewPlan;
        }
        try {
          state.interviewPlan = validateInterviewPlan(plan, questionBank);
        } catch (error) {
          console.warn(`面试题库校验失败，已降级为核心训练：${error.message}`);
          corePlan.questionBank = emptyInterviewQuestionBank(error.message);
          state.interviewPlan = corePlan;
        }
        return state.interviewPlan;
      })
      .catch((error) => {
        state.interviewPlanPromise = null;
        throw error;
      });
  }
  return state.interviewPlanPromise;
}

function interviewAJobs() {
  return state.data?.jobs.filter((job) => ["A+", "A-"].includes(job.tier)) || [];
}

function currentInterviewTarget() {
  if (state.interviewTarget === "all") return null;
  return interviewAJobs().find((job) => job.id === state.interviewTarget) || null;
}

function interviewBankQuestions() {
  return state.interviewPlan?.questionBank.questions || [];
}

function allInterviewQuestions() {
  return state.interviewPlan ? [...state.interviewPlan.questions, ...interviewBankQuestions()] : [];
}

function interviewQuestionsForMode() {
  return state.interviewMode === "bank" ? interviewBankQuestions() : state.interviewPlan?.questions || [];
}

function findInterviewQuestion(questionId) {
  return allInterviewQuestions().find((question) => question.id === questionId) || null;
}

function currentInterviewQuestion() {
  return findInterviewQuestion(state.interviewQuestion);
}

function currentInterviewGuide(question) {
  const guide = state.interviewPlan?.questionBank.answerGuides?.[question.id] || question;
  if (guide.answerEdge && guide.evidence?.length && guide.followUps?.length && guide.pitfalls?.length) return guide;
  return {
    answerEdge: "先给结论，再用个人行动、判断依据、取舍和结果证明；不要背稿，也不要为了完整而补造事实。",
    evidence: question.checks.slice(0, 3).map((check) => check.improvement),
    followUps: question.checks.slice(0, 3).map((check) => check.followUp),
    pitfalls: ["背景过长，关键行动和判断被淹没", "只说团队成果，不解释个人责任与证据边界"],
  };
}

function interviewTextContext() {
  const target = currentInterviewTarget();
  return {
    company: target?.company || "目标公司",
    jobTitle: target?.title || "目标岗位",
    targetRole: target ? `${target.company} 的“${target.title}”岗位` : "当前选择的 A 档岗位",
  };
}

function interpolateInterviewText(value) {
  const context = interviewTextContext();
  return String(value).replace(/\{\{(company|jobTitle|targetRole)\}\}/g, (_, key) => context[key]);
}

function persistInterviewDrafts() {
  localStorage.setItem("recruitment-interview-drafts-v1", JSON.stringify(state.interviewDrafts));
}

function persistInterviewReviewed() {
  localStorage.setItem("recruitment-interview-reviewed-v1", JSON.stringify([...state.interviewReviewed]));
}

function interviewQuestionCoverage(question) {
  const jobs = interviewAJobs();
  if (question.coverage === "all") return jobs;
  if (question.requiresEnglish) return jobs.filter((job) => job.requiresEnglish);
  return jobs.filter((job) => question.dimensions.some((dimension) => job.dimensions.includes(dimension)));
}

function renderInterviewProgress() {
  const questions = state.interviewPlan.questions;
  const validIds = new Set(allInterviewQuestions().map((question) => question.id));
  [...state.interviewReviewed].forEach((id) => {
    if (!validIds.has(id)) state.interviewReviewed.delete(id);
  });
  persistInterviewReviewed();
  const reviewed = questions.filter((question) => state.interviewReviewed.has(question.id)).length;
  const total = questions.length;
  elements.interviewReviewedCount.textContent = `${reviewed} / ${total}`;
  elements.interviewProgressTrack.setAttribute("aria-valuemax", String(total));
  elements.interviewProgressTrack.setAttribute("aria-valuenow", String(reviewed));
  elements.interviewProgressFill.style.width = `${total ? reviewed / total * 100 : 0}%`;
  elements.interviewSideProgress.replaceChildren();
  const label = document.createElement("span");
  label.textContent = `已诊断 ${reviewed} / ${total}`;
  const track = document.createElement("span");
  track.className = "interview-side-progress-track";
  const fill = document.createElement("span");
  fill.style.width = `${total ? reviewed / total * 100 : 0}%`;
  track.append(fill);
  elements.interviewSideProgress.append(label, track);
}

function renderInterviewSidebar() {
  elements.interviewQuestionNav.replaceChildren();
  state.interviewPlan.categories.forEach((category) => {
    const section = document.createElement("section");
    section.className = "interview-side-group";
    const heading = document.createElement("h3");
    heading.textContent = category.label;
    section.append(heading);
    state.interviewPlan.questions
      .filter((question) => question.category === category.id)
      .forEach((question) => {
        const index = state.interviewPlan.questions.indexOf(question) + 1;
        const button = document.createElement("button");
        button.type = "button";
        button.classList.toggle("active", question.id === state.interviewQuestion);
        button.classList.toggle("reviewed", state.interviewReviewed.has(question.id));
        button.setAttribute("aria-pressed", String(question.id === state.interviewQuestion));
        const number = document.createElement("span");
        number.className = "interview-nav-number";
        number.textContent = state.interviewReviewed.has(question.id) ? "✓" : String(index).padStart(2, "0");
        const title = document.createElement("span");
        title.textContent = question.title;
        button.append(number, title);
        button.addEventListener("click", () => selectInterviewQuestion(question.id));
        section.append(button);
      });
    elements.interviewQuestionNav.append(section);
  });
}

function renderInterviewTargetOptions() {
  const jobs = interviewAJobs();
  const validTarget = state.interviewTarget === "all" || jobs.some((job) => job.id === state.interviewTarget);
  if (!validTarget) state.interviewTarget = "all";
  elements.interviewTargetSelect.replaceChildren();
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = "综合 A 档岗位要求";
  elements.interviewTargetSelect.append(all);
  ["A+", "A-"].forEach((tier) => {
    const group = document.createElement("optgroup");
    group.label = `${tier} 岗位`;
    jobs.filter((job) => job.tier === tier).forEach((job) => {
      const option = document.createElement("option");
      option.value = job.id;
      option.textContent = `${job.company} · ${job.title}`;
      group.append(option);
    });
    elements.interviewTargetSelect.append(group);
  });
  elements.interviewTargetSelect.value = state.interviewTarget;
}

function renderInterviewQuestionOptions() {
  elements.interviewQuestionSelect.replaceChildren();
  const questions = interviewQuestionsForMode();
  state.interviewPlan.categories.forEach((category) => {
    const group = document.createElement("optgroup");
    group.label = category.label;
    questions
      .filter((question) => question.category === category.id)
      .forEach((question) => {
        const index = questions.indexOf(question) + 1;
        const option = document.createElement("option");
        option.value = question.id;
        option.textContent = `${String(index).padStart(2, "0")} · ${question.title}`;
        group.append(option);
      });
    if (group.children.length) elements.interviewQuestionSelect.append(group);
  });
  elements.interviewQuestionSelect.value = state.interviewQuestion;
}

function interviewQuestionMatchesTarget(question) {
  const target = currentInterviewTarget();
  if (!target || question.coverage === "all" || question.roleFamilies.includes("all")) return true;
  const targetFamilies = interviewTargetRoleFamilies(target);
  return question.roleFamilies.some((family) => targetFamilies.has(family));
}

function interviewTargetRoleFamilies(target) {
  const families = new Set(["data", "delivery"]);
  const title = target.title.toLocaleLowerCase();
  if (/增长|用户|营销|投放|补贴|裂变|提频|会员|收入|growth|marketing/.test(title)) families.add("growth");
  if (/商家|商户|电商|行业|供给|商品|货品|达人|服务商|ka|仓店|商城|merchant/.test(title)) families.add("merchant");
  if (/国际|海外|跨境|tiktok|东南亚|拉美|欧美|越南|菲律宾|马来|印尼|global|transfer/.test(title)) families.add("international");
  if (/支付|钱包|bnpl|transfer/.test(title)) families.add("payment");
  if (/体验|研究|洞察|分析|产品|行业/.test(title)) families.add("insight");
  if (/策略|分析|strategy|solutions/.test(title)) families.add("strategy");
  if (/商业|收入|营销|销售|revenue|marketing|客户|代理|ka|transfer/.test(title)) families.add("commercial");
  return families;
}

function filteredInterviewBankQuestions() {
  const query = state.interviewBankQuery.toLocaleLowerCase();
  const target = currentInterviewTarget();
  const priorityOrder = { high: 0, medium: 1, supplementary: 2 };
  return interviewBankQuestions()
    .filter((question) => state.interviewBankCategory === "all" || question.category === state.interviewBankCategory)
    .filter((question) => !state.interviewBankRelevantOnly || interviewQuestionMatchesTarget(question))
    .filter((question) => {
      if (!query) return true;
      return [
        question.title,
        question.prompt,
        question.intent,
        ...question.dimensions,
        ...question.formats,
      ].join(" ").toLocaleLowerCase().includes(query);
    })
    .sort((left, right) => {
      const priorityDelta = priorityOrder[left.priority] - priorityOrder[right.priority];
      if (priorityDelta) return priorityDelta;
      if (!target) return 0;
      const families = interviewTargetRoleFamilies(target);
      const leftScore = left.roleFamilies.filter((family) => families.has(family)).length;
      const rightScore = right.roleFamilies.filter((family) => families.has(family)).length;
      return rightScore - leftScore;
    });
}

function renderInterviewMode() {
  const hasBank = interviewBankQuestions().length > 0;
  const isBank = state.interviewMode === "bank" && hasBank;
  elements.interviewCoreMode.setAttribute("aria-selected", String(!isBank));
  elements.interviewBankMode.setAttribute("aria-selected", String(isBank));
  elements.interviewCoreMode.classList.toggle("active", !isBank);
  elements.interviewBankMode.classList.toggle("active", isBank);
  elements.interviewBankMode.disabled = !hasBank;
  elements.interviewBankMode.title = hasBank ? "" : "题库暂时加载失败，核心训练仍可使用";
  elements.interviewBankBrowser.hidden = !isBank;
  elements.interviewCoreCount.textContent = state.interviewPlan.questions.length;
  elements.interviewBankCount.textContent = interviewBankQuestions().length;
}

function renderInterviewBankBrowser() {
  const target = currentInterviewTarget();
  const categories = new Set(interviewBankQuestions().map((question) => question.category));
  if (state.interviewBankCategory !== "all" && !categories.has(state.interviewBankCategory)) {
    state.interviewBankCategory = "all";
  }
  elements.interviewBankCategory.replaceChildren();
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = "全部方向";
  elements.interviewBankCategory.append(all);
  state.interviewPlan.categories
    .filter((category) => categories.has(category.id))
    .forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.label;
      elements.interviewBankCategory.append(option);
    });
  elements.interviewBankCategory.value = state.interviewBankCategory;
  elements.interviewBankSearch.value = state.interviewBankQuery;
  elements.interviewBankRelevant.checked = state.interviewBankRelevantOnly;
  elements.interviewBankRelevant.disabled = !target;
  elements.interviewBankRelevant.parentElement.title = target ? "" : "先选择一个具体目标岗位";

  const questions = filteredInterviewBankQuestions();
  const reviewed = interviewBankQuestions().filter((question) => state.interviewReviewed.has(question.id)).length;
  elements.interviewBankResultCount.textContent = `${questions.length} 题 · 已检查 ${reviewed}`;
  elements.interviewBankList.replaceChildren();
  questions.forEach((question) => {
    const category = state.interviewPlan.categories.find((item) => item.id === question.category);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "interview-bank-item";
    button.classList.toggle("active", question.id === state.interviewQuestion);
    button.classList.toggle("reviewed", state.interviewReviewed.has(question.id));
    button.setAttribute("aria-pressed", String(question.id === state.interviewQuestion));

    const copy = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = question.title;
    const meta = document.createElement("span");
    const relevance = target
      ? question.roleFamilies.filter((family) => interviewTargetRoleFamilies(target).has(family)).length
      : 0;
    const priority = question.priority === "high" ? "优先准备" : "高频补充";
    meta.textContent = [
      state.interviewReviewed.has(question.id) ? "已检查" : priority,
      category?.label,
      relevance ? `匹配 ${relevance} 类岗位场景` : question.stages.join(" / "),
    ]
      .filter(Boolean)
      .join(" · ");
    copy.append(title, meta);

    const arrow = document.createElement("span");
    arrow.className = "interview-bank-arrow";
    arrow.textContent = state.interviewReviewed.has(question.id) ? "✓" : "›";
    button.append(copy, arrow);
    button.addEventListener("click", () => selectInterviewQuestion(question.id));
    elements.interviewBankList.append(button);
  });
  elements.interviewBankEmpty.hidden = Boolean(questions.length);
}

function applyInterviewBankFilter() {
  const questions = filteredInterviewBankQuestions();
  if (
    state.interviewMode === "bank"
    && questions.length
    && !questions.some((question) => question.id === state.interviewQuestion)
  ) {
    state.interviewQuestion = questions[0].id;
    renderInterviewQuestion();
    setView("interview");
    return;
  }
  renderInterviewBankBrowser();
}

function setInterviewMode(mode, updateURL = true) {
  state.interviewMode = mode === "bank" && interviewBankQuestions().length ? "bank" : "core";
  const questions = interviewQuestionsForMode();
  if (!questions.some((question) => question.id === state.interviewQuestion)) {
    state.interviewQuestion = questions[0]?.id || null;
  }
  renderInterviewQuestion();
  setView("interview", updateURL);
}

function interviewFrameworkTemplate(question) {
  const separator = question.requiresEnglish ? ":" : "：";
  return question.framework.map((step) => {
    const label = step.split(/[：:]/, 1)[0];
    return `${label}${separator}\n`;
  }).join("\n");
}

function updateInterviewAnswerMeta() {
  const question = currentInterviewQuestion();
  const value = elements.interviewAnswer.value;
  const compactLength = value.replace(/\s/g, "").length;
  const words = value.trim() ? (value.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g) || []).length : 0;
  elements.interviewAnswerCount.textContent = question?.requiresEnglish
    ? `${words} words · ${compactLength} 字符`
    : compactLength
      ? `${compactLength} 字 · 约 ${Math.max(1, Math.ceil(compactLength / 240))} 分钟`
      : "0 字";
  elements.interviewSaveStatus.textContent = value.trim() ? "已保存在当前浏览器" : "尚未输入";
}

function renderInterviewGuideList(element, values) {
  element.replaceChildren();
  values.forEach((value) => {
    const item = document.createElement("li");
    item.textContent = interpolateInterviewText(value);
    element.append(item);
  });
}

function validInterviewMethodSource(source) {
  if (!(source?.name && source.provider && source.focus && ["priority", "role"].includes(source.group))) return false;
  try {
    return new URL(source.url).protocol === "https:";
  } catch {
    return false;
  }
}

function renderInterviewMethodSources() {
  const sources = (state.interviewPlan?.questionBank.methodSources || []).filter(validInterviewMethodSource);
  elements.interviewMethodResourceList.replaceChildren();
  elements.interviewMethodResourceCount.textContent = String(sources.length);
  elements.interviewMethodResources.hidden = !sources.length;
  if (!sources.length) return;

  const groupLabels = {
    priority: "优先学习",
    role: "岗位补充",
  };
  sources.forEach((source) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.className = "interview-method-resource-link";
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `打开${source.name}（新标签页）`);

    const meta = document.createElement("span");
    meta.className = "interview-method-resource-meta";
    meta.textContent = `${groupLabels[source.group]} · ${source.provider}`;
    const title = document.createElement("strong");
    title.textContent = source.name;
    const focus = document.createElement("p");
    focus.textContent = source.focus;
    const arrow = document.createElement("span");
    arrow.className = "interview-method-resource-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";
    link.append(meta, title, focus, arrow);
    item.append(link);
    elements.interviewMethodResourceList.append(item);
  });
}

function renderInterviewQuestion() {
  const question = currentInterviewQuestion();
  if (!question) return;
  const questions = interviewQuestionsForMode();
  const index = questions.indexOf(question);
  const category = state.interviewPlan.categories.find((item) => item.id === question.category);
  const target = currentInterviewTarget();
  const coveredJobs = interviewQuestionCoverage(question);
  const guide = currentInterviewGuide(question);
  const isHypothetical = question.formats?.some((format) => ["case", "situational"].includes(format));
  const relevantDimensions = target
    ? question.dimensions.filter((dimension) => target.dimensions.includes(dimension))
    : question.dimensions;

  elements.interviewQuestionPosition.textContent = `${String(index + 1).padStart(2, "0")} / ${questions.length}`;
  elements.interviewQuestionCategory.textContent = category?.label || "面试题";
  elements.interviewQuestionDuration.textContent = question.duration;
  elements.interviewQuestionTitle.textContent = question.title;
  elements.interviewQuestionPrompt.textContent = interpolateInterviewText(question.prompt);
  elements.interviewQuestionIntent.textContent = `面试官在看什么：${question.intent}`;
  const focus = question.tierFocus
    ? `${question.tierFocus} 重点`
    : state.interviewMode === "bank"
      ? question.priority === "high" ? "优先准备" : "高频补充"
      : "";
  elements.interviewTierFocus.hidden = !focus;
  elements.interviewTierFocus.textContent = focus;
  elements.interviewCoverage.textContent = target
    ? relevantDimensions.length
      ? `与目标岗位的 ${relevantDimensions.length} 项要求直接相关`
      : "通用必答题，适用于当前目标岗位"
    : `覆盖当前 ${interviewAJobs().length} 个 A 档岗位中的 ${coveredJobs.length} 个`;
  elements.interviewDimensionList.replaceChildren();
  appendSpans(
    elements.interviewDimensionList,
    target && relevantDimensions.length ? relevantDimensions : question.dimensions,
  );
  if (target) {
    elements.interviewJobExamples.textContent = `${target.tier} · ${target.company} · ${target.title}`;
  } else {
    const examples = coveredJobs.slice(0, 3).map((job) => `${job.company}「${job.title}」`);
    elements.interviewJobExamples.textContent = examples.length ? `岗位样本：${examples.join("、")}` : "适用于全部 A 档岗位";
  }

  elements.interviewFrameworkList.replaceChildren();
  question.framework.forEach((step) => {
    const item = document.createElement("li");
    const parts = step.split(/[：:]/);
    const label = document.createElement("strong");
    label.textContent = parts.shift();
    const detail = document.createElement("span");
    detail.textContent = parts.join("：").trim();
    item.append(label, detail);
    elements.interviewFrameworkList.append(item);
  });
  elements.interviewAnswerEdge.textContent = interpolateInterviewText(guide.answerEdge);
  elements.interviewEvidenceHeading.textContent = isHypothetical ? "回答前先明确" : "必须准备的事实";
  renderInterviewGuideList(elements.interviewEvidenceList, guide.evidence);
  renderInterviewGuideList(elements.interviewPrepFollowUpList, guide.followUps);
  renderInterviewGuideList(elements.interviewPitfallList, guide.pitfalls);
  elements.interviewGuideNote.textContent = isHypothetical
    ? "题设未给的数据要写成待确认信息或明确假设；可以引用相似真实案例，但不要把未知结果说成已经发生。"
    : "只使用真实且可脱敏的经历。没有可靠数字时，用范围、前后对比或可核验反馈，不要补造数字。";

  elements.interviewAnswer.value = state.interviewDrafts[question.id] || "";
  elements.interviewInputMessage.hidden = true;
  elements.interviewFeedback.hidden = true;
  updateInterviewAnswerMeta();
  elements.previousInterviewQuestion.disabled = index === 0;
  elements.previousInterviewQuestion.textContent = index ? `← ${questions[index - 1].title}` : "已经是第一题";
  elements.nextInterviewQuestion.disabled = index === questions.length - 1;
  elements.nextInterviewQuestion.textContent = index < questions.length - 1 ? `${questions[index + 1].title} →` : "已经是最后一题";
  elements.previousInterviewQuestion.onclick = () => index && selectInterviewQuestion(questions[index - 1].id);
  elements.nextInterviewQuestion.onclick = () => index < questions.length - 1 && selectInterviewQuestion(questions[index + 1].id);
  renderInterviewMode();
  renderInterviewBankBrowser();
  renderInterviewQuestionOptions();
  renderInterviewProgress();
  renderInterviewSidebar();
}

function selectInterviewQuestion(questionId, updateURL = true) {
  const question = findInterviewQuestion(questionId) || state.interviewPlan?.questions[0];
  if (!question) return;
  const isBankQuestion = interviewBankQuestions().some((item) => item.id === question.id);
  state.interviewMode = isBankQuestion ? "bank" : "core";
  if (isBankQuestion && !filteredInterviewBankQuestions().some((item) => item.id === question.id)) {
    state.interviewBankQuery = "";
    state.interviewBankCategory = "all";
    state.interviewBankRelevantOnly = false;
  }
  state.interviewQuestion = question.id;
  renderInterviewQuestion();
  setView("interview", updateURL);
}

function normalizeInterviewAnswer(answer, question) {
  let normalized = answer;
  question.framework.forEach((step) => {
    const label = step.split(/[：:]/, 1)[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    normalized = normalized.replace(new RegExp(`^\\s*${label}\\s*[：:]?`, "gim"), "");
  });
  return normalized.replace(/\[[^\]]*(?:填写|补充|替换)[^\]]*\]/g, "").trim();
}

function countRegexMatches(text, pattern, flags = "") {
  const numberPattern = "\\d+(?:\\.\\d+)?\\s*(?:%|万|亿|元|天|周|月|年|人|个|笔|bps|GMV|TPV|ROI)?";
  const source = pattern === "NUMBER" ? numberPattern : pattern;
  try {
    return (text.match(new RegExp(source, flags.includes("g") ? flags : `${flags}g`)) || []).length;
  } catch {
    return 0;
  }
}

function evaluateInterviewCheck(check, answer) {
  const lower = answer.toLocaleLowerCase();
  if (check.kind === "keywordGroups") {
    const matchedGroups = check.groups.filter((group) => group.some((keyword) => (
      lower.includes(interpolateInterviewText(keyword).toLocaleLowerCase())
    ))).length;
    return matchedGroups >= check.minGroups;
  }
  if (check.kind === "regexCount") return countRegexMatches(answer, check.pattern, check.flags || "") >= check.min;
  if (check.kind === "charRange") {
    const length = answer.replace(/\s/g, "").length;
    return length >= check.min && length <= check.max;
  }
  if (check.kind === "wordRange") {
    const words = answer.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g) || [];
    const chineseCharacters = answer.match(/[\u3400-\u9fff]/g) || [];
    return words.length >= check.min && words.length <= check.max && chineseCharacters.length < 20;
  }
  if (check.kind === "targetSpecificity") {
    const target = currentInterviewTarget();
    const businessTerms = ["支付", "国际化", "跨境", "增长", "商户", "商业化", "策略", "数据"];
    const motivationTerms = ["选择", "因为", "匹配", "适合", "贡献", "希望"];
    if (!businessTerms.some((term) => answer.includes(term)) || !motivationTerms.some((term) => answer.includes(term))) return false;
    if (!target) return ["岗位", "职责", "JD"].some((term) => answer.includes(term));
    const companyMentioned = answer.toLocaleLowerCase().includes(target.company.toLocaleLowerCase());
    const titleTerms = target.title.split(/[\s,，/·()（）-]+/).filter((term) => term.length >= 3);
    return companyMentioned || titleTerms.some((term) => lower.includes(term.toLocaleLowerCase()));
  }
  return false;
}

function analyzeInterviewAnswer(answer, question) {
  const normalized = normalizeInterviewAnswer(answer, question);
  const checks = question.checks.map((check) => ({ ...check, passed: evaluateInterviewCheck(check, normalized) }));
  const warnings = [];
  const placeholders = (answer.match(/\[[^\]]+\]|\{\{[^}]+\}\}/g) || []).length;
  if (placeholders) {
    warnings.push({
      label: "仍有空白占位",
      problem: `回答中还有 ${placeholders} 处占位内容未替换。`,
      improvement: "先用真实且可脱敏的事实替换所有占位内容，再进行口述压缩。",
      followUp: "这里缺少的事实证据具体是什么？",
    });
  }
  const vagueTerms = [...new Set(normalized.match(/很多|比较好|大幅|显著(?:提升|下降)?|效果(?:不错|很好)|全面负责|积极推动/g) || [])];
  if (vagueTerms.length) {
    warnings.push({
      label: "存在模糊表述",
      problem: `“${vagueTerms.slice(0, 3).join("、")}”缺少可核验的基线、变化或范围。`,
      improvement: "把模糊形容词替换为基线、变化、周期和影响范围；无法公开时使用比例或指数。",
      followUp: "你说的改善，具体从多少变到多少，持续了多久？",
    });
  }
  (question.warnings || []).forEach((warning) => {
    if (!countRegexMatches(normalized, warning.pattern)) return;
    warnings.push({
      label: "责任表达需要调整",
      problem: warning.message,
      improvement: "先说明自己的决策责任，再区分外部约束和后续可控动作。",
      followUp: "撇开其他团队，你当时可以更早做什么？",
    });
  });
  const personalCheck = checks.find((check) => check.id === "ownership");
  const teamMentions = countRegexMatches(normalized, "我们|团队");
  const personalMentions = countRegexMatches(normalized, "我(?:负责|主导|决定|设计|推动|发现|协调|提出|组织|分析|调整)");
  if (personalCheck && !personalCheck.passed && teamMentions > personalMentions) {
    warnings.push({
      label: "个人贡献偏少",
      problem: "团队动作多于个人动作，面试官可能无法判断你的实际职责。",
      improvement: "保留团队背景，但把关键句改为“我分析 / 我建议 / 我推动 / 我交付”。",
      followUp: "这个项目中，哪两个动作只有你能负责说明？",
    });
  }
  const failed = checks.filter((check) => !check.passed);
  return {
    checks,
    passed: checks.filter((check) => check.passed),
    failed,
    priorities: [...warnings, ...failed].slice(0, 2),
  };
}

function appendInterviewListItem(list, primary, secondary = "") {
  const item = document.createElement("li");
  const strong = document.createElement("strong");
  strong.textContent = primary;
  item.append(strong);
  if (secondary) {
    const span = document.createElement("span");
    span.textContent = secondary;
    item.append(span);
  }
  list.append(item);
}

function renderInterviewFeedback(result) {
  const total = result.checks.length;
  const count = result.passed.length;
  elements.interviewCoverageScore.textContent = `${count} / ${total}`;
  elements.interviewFeedbackSummary.textContent = result.priorities.length
    ? `检测到 ${count} 项表达线索。下一版先检查“${result.priorities.map((item) => item.label).join("”和“")}”。`
    : `检测到全部 ${total} 项表达线索；这不代表答案正确，下一轮仍要用追问核验因果和事实。`;

  elements.interviewCheckList.replaceChildren();
  result.checks.forEach((check) => {
    const item = document.createElement("span");
    item.className = check.passed ? "covered" : "missing";
    item.textContent = `${check.passed ? "✓" : "○"} ${check.label}`;
    elements.interviewCheckList.append(item);
  });

  elements.interviewStrengthList.replaceChildren();
  if (result.passed.length) {
    result.passed.forEach((check) => appendInterviewListItem(elements.interviewStrengthList, check.label));
  } else {
    appendInterviewListItem(elements.interviewStrengthList, "已形成第一版回答", "下一步从一项真实证据开始补充。");
  }

  elements.interviewImprovementList.replaceChildren();
  if (result.priorities.length) {
    result.priorities.forEach((item) => appendInterviewListItem(
      elements.interviewImprovementList,
      item.problem,
      item.improvement,
    ));
  } else {
    appendInterviewListItem(
      elements.interviewImprovementList,
      "把完整回答录音一次",
      "检查是否能在目标时长内自然说完，并准备每项证据的数据口径。",
    );
  }
  elements.interviewFollowUpQuestion.textContent = result.priorities[0]?.followUp
    || currentInterviewQuestion().checks[0].followUp;
  elements.interviewFeedback.hidden = false;
}

function runInterviewAnalysis() {
  const question = currentInterviewQuestion();
  const answer = elements.interviewAnswer.value.trim();
  const usableLength = normalizeInterviewAnswer(answer, question).replace(/\s/g, "").length;
  if (usableLength < 40) {
    elements.interviewInputMessage.textContent = "先写下至少 40 个有效字符，再检查结构和证据线索。";
    elements.interviewInputMessage.hidden = false;
    elements.interviewFeedback.hidden = true;
    elements.interviewAnswer.focus();
    return;
  }
  elements.interviewInputMessage.hidden = true;
  const result = analyzeInterviewAnswer(answer, question);
  renderInterviewFeedback(result);
  state.interviewReviewed.add(question.id);
  persistInterviewReviewed();
  renderInterviewProgress();
  renderInterviewSidebar();
  renderInterviewBankBrowser();
  elements.interviewFeedback.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function navigateInterview(questionId = null, updateURL = true) {
  setView("interview", false);
  elements.interviewLoading.hidden = false;
  elements.interviewPanel.hidden = true;
  try {
    await Promise.all([ensureInterviewPlanLoaded(), ensureJobsLoaded()]);
    const requested = findInterviewQuestion(questionId);
    const invalidRequestedQuestion = Boolean(questionId && !requested);
    state.interviewQuestion = requested?.id || state.interviewPlan.questions[0].id;
    state.interviewMode = interviewBankQuestions().some((question) => question.id === state.interviewQuestion)
      ? "bank"
      : "core";
    const validTarget = state.interviewTarget === "all" || interviewAJobs().some((job) => job.id === state.interviewTarget);
    if (!validTarget) state.interviewTarget = "all";
    elements.interviewACount.textContent = interviewAJobs().length;
    renderInterviewMethodSources();
    renderInterviewTargetOptions();
    renderInterviewQuestion();
    elements.interviewLoading.hidden = true;
    elements.interviewPanel.hidden = false;
    if (invalidRequestedQuestion) {
      const url = new URL(location.href);
      url.hash = `interview/${encodeURIComponent(state.interviewQuestion)}`;
      history.replaceState(null, "", url);
      setView("interview", false);
    } else {
      setView("interview", updateURL);
    }
  } catch (error) {
    elements.interviewLoading.querySelector("strong").textContent = `面试计划加载失败：${error.message}`;
  }
}

function resetFilters() {
  Object.assign(state, { query: "", tier: "all", direction: "all", experience: "all", salary: 0, risk: "all", bonus: "all", sort: "score", savedOnly: false });
  elements.searchInput.value = "";
  elements.directionSelect.value = "all";
  elements.experienceSelect.value = "all";
  elements.salarySelect.value = "0";
  elements.riskSelect.value = "all";
  elements.bonusSelect.value = "all";
  elements.sortSelect.value = "score";
  elements.savedOnly.checked = false;
  render();
}

function bindControls() {
  elements.viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.view === "skills") navigateLearning("overview");
      else if (button.dataset.view === "interview") navigateInterview(state.interviewQuestion);
      else navigateJobs();
    });
  });
  elements.backToOverview.addEventListener("click", () => navigateLearning("overview"));
  window.addEventListener("hashchange", () => {
    const interviewRoute = interviewRouteFromHash(location.hash);
    const route = learningRouteFromHash(location.hash);
    if (interviewRoute) navigateInterview(interviewRoute.questionId, false);
    else if (route) navigateLearning(route.page, route.skillId, false, route.levelId, route.questionId);
    else navigateJobs(false);
  });

  elements.interviewTargetSelect.addEventListener("change", (event) => {
    state.interviewTarget = event.target.value;
    localStorage.setItem("recruitment-interview-target-v1", state.interviewTarget);
    renderInterviewQuestion();
  });
  elements.interviewCoreMode.addEventListener("click", () => setInterviewMode("core"));
  elements.interviewBankMode.addEventListener("click", () => setInterviewMode("bank"));
  elements.interviewBankSearch.addEventListener("input", (event) => {
    state.interviewBankQuery = event.target.value.trim();
    applyInterviewBankFilter();
  });
  elements.interviewBankCategory.addEventListener("change", (event) => {
    state.interviewBankCategory = event.target.value;
    applyInterviewBankFilter();
  });
  elements.interviewBankRelevant.addEventListener("change", (event) => {
    state.interviewBankRelevantOnly = event.target.checked;
    applyInterviewBankFilter();
  });
  elements.interviewQuestionSelect.addEventListener("change", (event) => selectInterviewQuestion(event.target.value));
  elements.interviewAnswer.addEventListener("input", () => {
    const question = currentInterviewQuestion();
    if (!question) return;
    const answer = elements.interviewAnswer.value;
    if (answer) state.interviewDrafts[question.id] = answer;
    else delete state.interviewDrafts[question.id];
    persistInterviewDrafts();
    if (state.interviewReviewed.delete(question.id)) {
      persistInterviewReviewed();
      renderInterviewProgress();
      renderInterviewSidebar();
      renderInterviewBankBrowser();
    }
    elements.interviewFeedback.hidden = true;
    elements.interviewInputMessage.hidden = true;
    updateInterviewAnswerMeta();
  });
  elements.interviewUseTemplate.addEventListener("click", () => {
    const question = currentInterviewQuestion();
    if (!question) return;
    if (elements.interviewAnswer.value.trim()) {
      elements.interviewInputMessage.textContent = "回答框已有内容，空白框架未覆盖现有草稿。";
      elements.interviewInputMessage.hidden = false;
      elements.interviewAnswer.focus();
      return;
    }
    elements.interviewAnswer.value = interviewFrameworkTemplate(question);
    elements.interviewAnswer.dispatchEvent(new Event("input", { bubbles: true }));
    elements.interviewAnswer.focus();
  });
  elements.interviewClearAnswer.addEventListener("click", () => {
    const question = currentInterviewQuestion();
    if (!question || !elements.interviewAnswer.value) return;
    if (!window.confirm("清空这道题保存在当前浏览器中的回答？")) return;
    elements.interviewAnswer.value = "";
    elements.interviewAnswer.dispatchEvent(new Event("input", { bubbles: true }));
    elements.interviewAnswer.focus();
  });
  elements.interviewAnalyzeAnswer.addEventListener("click", runInterviewAnalysis);

  elements.searchInput.addEventListener("input", (event) => { state.query = event.target.value.trim(); renderJobs(); });
  elements.directionSelect.addEventListener("change", (event) => { state.direction = event.target.value; render(); });
  elements.experienceSelect.addEventListener("change", (event) => { state.experience = event.target.value; renderJobs(); });
  elements.salarySelect.addEventListener("change", (event) => { state.salary = Number(event.target.value); renderJobs(); });
  elements.riskSelect.addEventListener("change", (event) => { state.risk = event.target.value; renderJobs(); });
  elements.bonusSelect.addEventListener("change", (event) => { state.bonus = event.target.value; renderJobs(); });
  elements.sortSelect.addEventListener("change", (event) => { state.sort = event.target.value; renderJobs(); });
  elements.savedOnly.addEventListener("change", (event) => { state.savedOnly = event.target.checked; renderJobs(); });
  elements.resetButton.addEventListener("click", resetFilters);
  elements.emptyReset.addEventListener("click", resetFilters);

  elements.profileButton.addEventListener("click", () => elements.profileDialog.showModal());
  elements.dialogClose.addEventListener("click", () => elements.profileDialog.close());
  elements.profileDialog.addEventListener("click", (event) => {
    if (event.target === elements.profileDialog) elements.profileDialog.close();
  });

  elements.themeButton.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme;
    const dark = current ? current === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("recruitment-theme", next);
  });
}

function formatTime(value) {
  if (!value) return "抓取时间未知";
  const date = new Date(value);
  return `数据更新 ${new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(date)}`;
}

async function ensureJobsLoaded() {
  if (state.data) return state.data;
  if (!state.jobsPromise) {
    state.jobsPromise = fetch("jobs.json")
      .then((response) => {
        if (!response.ok) throw new Error(`岗位数据 HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        state.data = data;
        elements.profileSummary.textContent = state.data.profile.summary;
        elements.poolStat.textContent = state.data.poolSize;
        elements.eligibleStat.textContent = state.data.eligibleSize;
        elements.displayedStat.textContent = state.data.displayedSize;
        elements.sourceTime.textContent = formatTime(
          state.data.officialSourceGeneratedAt
          || state.data.sourceGeneratedAt
          || state.data.generatedAt,
        );
        elements.dialogSummary.textContent = state.data.profile.summary;
        elements.criteriaList.replaceChildren();
        state.data.profile.criteria.forEach((criterion) => {
          const li = document.createElement("li");
          li.textContent = criterion;
          elements.criteriaList.append(li);
        });

        const directions = [...new Set(state.data.jobs.flatMap((job) => job.directions))].sort();
        elements.directionSelect.querySelectorAll("option:not([value='all'])").forEach((option) => option.remove());
        directions.forEach((direction) => {
          const option = document.createElement("option");
          option.value = direction;
          option.textContent = direction;
          elements.directionSelect.append(option);
        });
        renderBars();
        render();
        return state.data;
      })
      .catch((error) => {
        state.jobsPromise = null;
        throw error;
      });
  }
  return state.jobsPromise;
}

async function navigateJobs(updateURL = true) {
  setView("jobs", updateURL);
  if (state.data) return;
  elements.resultCaption.textContent = "正在加载岗位数据";
  try {
    await ensureJobsLoaded();
    if (state.view === "jobs") setView("jobs", false);
  } catch (error) {
    elements.profileSummary.textContent = "岗位数据读取失败，请稍后刷新页面";
    elements.resultCaption.textContent = error.message;
    elements.emptyState.hidden = false;
    elements.emptyState.querySelector("strong").textContent = "岗位数据暂时无法读取";
  }
}

async function init() {
  const theme = localStorage.getItem("recruitment-theme");
  if (theme) document.documentElement.dataset.theme = theme;
  bindControls();
  if (initialInterviewRoute) {
    await navigateInterview(initialInterviewRoute.questionId, false);
  } else if (initialLearningRoute) {
    setView("skills", false);
    const assets = directLearningAssets[initialLearningRoute.skillId];
    if (initialLearningRoute.page === "challengeGlossary" && assets) {
      [
        ensureGuideLoaded(),
        ensureChallengePack(initialLearningRoute.skillId),
        ensureChallengeGlossary(initialLearningRoute.skillId, { glossary: assets.glossary }),
      ].forEach((request) => request.catch(() => {}));
    }
    await navigateLearning(
      initialLearningRoute.page,
      initialLearningRoute.skillId,
      false,
      initialLearningRoute.levelId,
      initialLearningRoute.questionId,
    );
  } else {
    await navigateJobs(false);
  }
}

init();
