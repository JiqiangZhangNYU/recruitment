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
  if (hash === "#roadmap") return { page: "roadmap", skillId: null };
  if (hash === "#portfolio") return { page: "portfolio", skillId: null };
  if (hash.startsWith("#challenge/")) {
    const [skillId, levelId, questionId] = hash.slice(11).split("/").map((part) => decodeURIComponent(part || ""));
    if (skillId && levelId && questionId) return { page: "challengeQuestion", skillId, levelId, questionId };
    if (skillId && levelId) return { page: "challengeLevel", skillId, levelId, questionId: null };
    if (skillId) return { page: "detail", skillId, levelId: null, questionId: null };
  }
  if (hash.startsWith("#skill-")) return { page: "detail", skillId: decodeURIComponent(hash.slice(7)) };
  return null;
}

const initialLearningRoute = learningRouteFromHash(location.hash);

const legacySkillIds = {
  "sql-excel": "data-diagnosis",
  "metrics-funnel": "metrics-results",
  lifecycle: "lifecycle-growth",
  strategy: "strategy-design",
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
  challengeProgress: new Map(),
  view: initialLearningRoute ? "skills" : "jobs",
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
  skillLevels: storedSkillLevels,
  roadmapPhase: "all",
  renderedLearningViews: new Set(),
  completedWeeks: new Set(storedArray("recruitment-completed-weeks").map(Number)),
  completedPortfolio: new Set(storedArray("recruitment-completed-portfolio")),
  completedReadiness: new Set(storedArray("recruitment-completed-readiness")),
};

const elements = {
  appShell: document.querySelector(".app-shell"),
  viewButtons: [...document.querySelectorAll(".primary-nav button[data-view]")],
  jobsView: document.querySelector("#jobs-view"),
  skillsView: document.querySelector("#skills-view"),
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
  skillProgressCount: document.querySelector("#skill-progress-count"),
  skillAverageLevel: document.querySelector("#skill-average-level"),
  weekProgressCount: document.querySelector("#week-progress-count"),
  skillJobCount: document.querySelector("#skill-job-count"),
  skillProgressTrack: document.querySelector(".skill-progress-track"),
  skillProgressFill: document.querySelector("#skill-progress-fill"),
  guideLoading: document.querySelector("#guide-loading"),
  learningViewNav: document.querySelector("#learning-view-nav"),
  learningSkillNav: document.querySelector("#learning-skill-nav"),
  learningRouteButtons: [...document.querySelectorAll("[data-learning-route]")],
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
  roadmapPanel: document.querySelector("#roadmap-panel"),
  portfolioPanel: document.querySelector("#portfolio-panel"),
  caseTitle: document.querySelector("#case-title"),
  caseDescription: document.querySelector("#case-description"),
  caseEntities: document.querySelector("#case-entities"),
  methodSplit: document.querySelector("#method-split"),
  nextAction: document.querySelector("#next-action"),
  phaseNav: document.querySelector("#phase-nav"),
  roadmapList: document.querySelector("#roadmap-list"),
  roadmapProgress: document.querySelector("#roadmap-progress"),
  portfolioList: document.querySelector("#portfolio-list"),
  portfolioProgress: document.querySelector("#portfolio-progress"),
  readinessGroups: document.querySelector("#readiness-groups"),
  readinessProgress: document.querySelector("#readiness-progress"),
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
  const validWeeks = new Set(state.guide.weeks.map((week) => week.week));
  const validPortfolio = new Set(state.guide.portfolio.map((item) => item.id));
  const validReadiness = new Set(state.guide.readiness.map((item) => item.id));
  Object.keys(state.skillLevels).forEach((id) => {
    if (!validSkills.has(id)) delete state.skillLevels[id];
    else state.skillLevels[id] = Math.max(0, Math.min(4, Math.round(Number(state.skillLevels[id]) || 0)));
  });
  state.completedWeeks = new Set([...state.completedWeeks].filter((week) => validWeeks.has(week)));
  state.completedPortfolio = new Set([...state.completedPortfolio].filter((id) => validPortfolio.has(id)));
  state.completedReadiness = new Set([...state.completedReadiness].filter((id) => validReadiness.has(id)));
  persistSkillLevels();
  persistLearningChecklist("recruitment-completed-weeks", state.completedWeeks);
  persistLearningChecklist("recruitment-completed-portfolio", state.completedPortfolio);
  persistLearningChecklist("recruitment-completed-readiness", state.completedReadiness);
}

function setView(view, updateURL = true) {
  state.view = view === "skills" ? "skills" : "jobs";
  elements.jobsView.hidden = state.view !== "jobs";
  elements.skillsView.hidden = state.view !== "skills";
  elements.appShell.dataset.view = state.view;
  const isSkills = state.view === "skills";
  elements.pageEyebrow.textContent = isSkills ? "A 档岗位共性能力 · 互动训练" : "上海硬性 · 大厂/支付官网 + BOSS";
  elements.pageTitle.textContent = isSkills ? "能力提升工作台" : "支付与策略运营岗位筛选";
  elements.profileSummary.textContent = isSkills
    ? "从能力地图进入单项训练，学习进度自动保存在当前浏览器。"
    : state.data?.profile.summary || "加载岗位数据中...";
  elements.viewButtons.forEach((button) => {
    const active = button.dataset.view === state.view;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  if (updateURL) {
    const url = new URL(location.href);
    if (state.view === "skills") {
      const hashes = { overview: "skills", roadmap: "roadmap", portfolio: "portfolio" };
      if (state.learningTab === "challengeQuestion" && state.selectedSkill && state.selectedLevel && state.selectedQuestion) {
        url.hash = `challenge/${encodeURIComponent(state.selectedSkill)}/${encodeURIComponent(state.selectedLevel)}/${encodeURIComponent(state.selectedQuestion)}`;
      } else if (state.learningTab === "challengeLevel" && state.selectedSkill && state.selectedLevel) {
        url.hash = `challenge/${encodeURIComponent(state.selectedSkill)}/${encodeURIComponent(state.selectedLevel)}`;
      } else if (state.learningTab === "detail" && state.selectedSkill) {
        url.hash = `skill-${encodeURIComponent(state.selectedSkill)}`;
      } else {
        url.hash = hashes[state.learningTab] || "skills";
      }
    } else {
      url.hash = "";
    }
    history.replaceState(null, "", url);
  }
}

async function navigateLearning(page, skillId = null, updateURL = true, levelId = null, questionId = null) {
  const detailPages = ["detail", "challengeLevel", "challengeQuestion"];
  state.learningTab = ["overview", ...detailPages, "roadmap", "portfolio"].includes(page) ? page : "overview";
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
  elements.roadmapPanel.hidden = true;
  elements.portfolioPanel.hidden = true;

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

    const isChallenge = state.selectedSkill === "business-english" && detailPages.includes(state.learningTab);
    let challengePack = null;
    if (isChallenge) {
      elements.guideLoading.hidden = false;
      elements.guideLoading.querySelector("strong").textContent = "正在加载业务英语关卡";
      challengePack = await ensureChallengePack(state.selectedSkill);
      if (
        requestedPage !== state.learningTab
        || requestedSkill !== state.selectedSkill
        || requestedLevel !== state.selectedLevel
        || requestedQuestion !== state.selectedQuestion
      ) return;
    }
    elements.guideLoading.hidden = true;
    elements.guideLoading.querySelector("strong").textContent = "正在加载能力指南";
    elements.abilityPanel.hidden = state.learningTab !== "overview";
    elements.skillDetailPanel.hidden = !detailPages.includes(state.learningTab);
    elements.roadmapPanel.hidden = state.learningTab !== "roadmap";
    elements.portfolioPanel.hidden = state.learningTab !== "portfolio";

    if (state.learningTab === "overview") renderSkillOverview();
    if (state.learningTab === "detail" && isChallenge) renderChallengeHub(challengePack);
    else if (state.learningTab === "detail") renderSkillDetail(state.selectedSkill);
    if (state.learningTab === "challengeLevel") renderChallengeLevel(challengePack, state.selectedLevel);
    if (state.learningTab === "challengeQuestion") renderChallengeQuestion(challengePack, state.selectedLevel, state.selectedQuestion);
    if (state.learningTab === "roadmap" && !state.renderedLearningViews.has("roadmap")) {
      renderRoadmap();
      state.renderedLearningViews.add("roadmap");
    }
    if (state.learningTab === "portfolio" && !state.renderedLearningViews.has("portfolio")) {
      renderPortfolio();
      state.renderedLearningViews.add("portfolio");
    }
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

function renderSkillProgress() {
  const skills = state.guide.skills;
  const maxLevel = Math.max(...state.guide.levelDefinitions.map((item) => item.level));
  const levels = skills.map((skill) => Number(state.skillLevels[skill.id]) || 0);
  const totalLevel = levels.reduce((sum, level) => sum + level, 0);
  const reached = levels.filter((level) => level >= state.guide.targetLevel).length;
  const average = skills.length ? totalLevel / skills.length : 0;
  const maxTotal = skills.length * maxLevel;
  elements.skillAverageLevel.textContent = average.toFixed(1);
  elements.skillProgressCount.textContent = `${reached} / ${skills.length} 达到 ${state.guide.targetLevel} 级`;
  elements.skillProgressFill.style.width = `${maxTotal ? totalLevel / maxTotal * 100 : 0}%`;
  elements.skillProgressTrack.setAttribute("aria-valuemax", String(maxTotal));
  elements.skillProgressTrack.setAttribute("aria-valuenow", String(totalLevel));
  elements.weekProgressCount.textContent = `${state.completedWeeks.size} / ${state.guide.weeks.length} 周完成`;
  elements.roadmapProgress.textContent = `${Math.round(state.completedWeeks.size / state.guide.weeks.length * 100)}%`;

  const nextWeek = state.guide.weeks.find((week) => !state.completedWeeks.has(week.week));
  elements.nextAction.textContent = nextWeek
    ? `下一步 · 第 ${nextWeek.week} 周 ${nextWeek.theme}：${nextWeek.outputs.join("、")}`
    : "路线已完成 · 开始按目标岗位定向修改作品与面试案例";
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
    renderSkillProgress();
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

function makeSkillOverviewCard(skill) {
  const level = Number(state.skillLevels[skill.id]) || 0;
  const button = document.createElement("button");
  button.type = "button";
  button.className = `skill-overview-card skill-group-${skill.group}`;
  button.dataset.skillId = skill.id;
  button.classList.toggle("mastered", level >= state.guide.targetLevel);
  button.classList.toggle("challenge-enabled", skill.id === "business-english");

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
  levelLabel.textContent = `${level} 级`;
  top.append(badges, levelLabel);

  const title = document.createElement("strong");
  title.textContent = skill.title;
  const goal = document.createElement("span");
  goal.className = "overview-goal";
  goal.textContent = skill.goal;
  const meta = document.createElement("span");
  meta.className = "overview-meta";
  const week = document.createElement("span");
  week.textContent = skill.weeks;
  const exerciseCount = document.createElement("span");
  exerciseCount.textContent = skill.id === "business-english" ? "6 级 · 30 题闯关" : `${skill.exercises.length} 道练习`;
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";
  meta.append(week, exerciseCount, arrow);
  button.append(top, title, goal, meta);
  button.addEventListener("click", () => navigateLearning("detail", skill.id));
  return button;
}

function renderSkillOverview() {
  elements.skillOverviewGroups.replaceChildren();
  state.guide.groups.forEach((group) => {
    const skills = state.guide.skills.filter((skill) => skill.group === group.id);
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
  renderSkillProgress();
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
    unlocked: index === 0 || progress.has(questions[index - 1]?.key),
    index,
    total: questions.length,
  };
}

function updateChallengeSkillLevel(pack) {
  const total = challengeQuestions(pack).length;
  const completed = getChallengeProgress(pack.skillId).size;
  const earnedLevel = completed === total ? 4 : Math.floor((completed / total) * 4);
  state.skillLevels[pack.skillId] = Math.max(Number(state.skillLevels[pack.skillId]) || 0, earnedLevel);
  persistSkillLevels();
  renderSkillProgress();
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
  nav.setAttribute("aria-label", "业务英语闯关导航");
  const overview = document.createElement("button");
  overview.type = "button";
  overview.textContent = "能力体系";
  overview.addEventListener("click", () => navigateLearning("overview"));
  const hub = document.createElement("button");
  hub.type = "button";
  hub.textContent = pack.title;
  hub.addEventListener("click", () => navigateLearning("detail", pack.skillId));
  nav.append(overview, makeTextElement("span", "", "/"), hub);
  if (level) nav.append(makeTextElement("span", "", "/"), makeTextElement("strong", "", level.title));
  return nav;
}

function setChallengeDetailChrome() {
  elements.detailBreadcrumb.hidden = true;
  elements.detailPagination.hidden = true;
}

function renderChallengeHub(pack) {
  setChallengeDetailChrome();
  const progress = getChallengeProgress(pack.skillId);
  const allQuestions = challengeQuestions(pack);
  const article = document.createElement("article");
  article.className = "challenge-page challenge-hub";
  article.dataset.skillId = pack.skillId;

  const header = document.createElement("header");
  header.className = "challenge-hero";
  const copy = document.createElement("div");
  copy.append(
    makeTextElement("span", "section-kicker", `互动训练 · ${pack.levels.length} 个等级`),
    makeTextElement("h2", "", pack.title),
    makeTextElement("p", "", pack.summary),
  );
  header.append(copy, makeChallengeProgress(progress.size, allQuestions.length, "总闯关进度"));

  const intro = document.createElement("div");
  intro.className = "challenge-instruction";
  intro.append(
    makeTextElement("strong", "", "从第一题开始，逐题解锁"),
    makeTextElement("span", "", "先独立作答，再查看参考答案；确认掌握后，下一题才会开放。"),
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
      makeTextElement("span", "challenge-level-number", `LEVEL ${String(levelIndex + 1).padStart(2, "0")}`),
      makeTextElement("span", "challenge-level-state", isComplete ? "已通关" : firstStatus.unlocked ? `${completed}/${level.questions.length}` : "未解锁"),
    );
    button.append(
      top,
      makeTextElement("strong", "", level.title),
      makeTextElement("span", "challenge-level-subtitle", level.subtitle),
      makeTextElement("span", "challenge-level-action", isComplete ? "重新练习 →" : firstStatus.unlocked ? "进入关卡 →" : "完成上一等级后开放"),
    );
    button.addEventListener("click", () => navigateLearning("challengeLevel", pack.skillId, true, level.id));
    grid.append(button);
  });

  article.append(makeChallengeBreadcrumb(pack), header, intro, grid);
  elements.skillDetailContainer.replaceChildren(article);
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

  const header = document.createElement("header");
  header.className = "challenge-level-header";
  const copy = document.createElement("div");
  const levelIndex = pack.levels.findIndex((item) => item.id === level.id);
  copy.append(
    makeTextElement("span", "section-kicker", `LEVEL ${String(levelIndex + 1).padStart(2, "0")}`),
    makeTextElement("h2", "", level.title),
    makeTextElement("p", "", level.objective),
  );
  header.append(copy, makeChallengeProgress(completed, level.questions.length, "本等级进度"));

  const list = document.createElement("div");
  list.className = "challenge-question-list";
  level.questions.forEach((question, questionIndex) => {
    const status = challengeStatus(pack, level, question);
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
      makeTextElement("span", "challenge-question-type", question.type),
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
  article.append(makeChallengeBreadcrumb(pack, level), header, list, footer);
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
  const article = document.createElement("article");
  article.className = "challenge-page challenge-question-page";
  article.dataset.questionId = question.id;

  const header = document.createElement("header");
  header.className = "challenge-question-header";
  const label = makeTextElement("span", "section-kicker", `${level.title} · 第 ${level.questions.indexOf(question) + 1} 题`);
  const title = makeTextElement("h2", "", question.title);
  const meta = document.createElement("div");
  meta.className = "challenge-question-meta";
  meta.append(makeTextElement("span", "", question.type), makeTextElement("span", "", `${status.index + 1} / ${status.total}`));
  header.append(label, title, meta);

  const promptSection = document.createElement("section");
  promptSection.className = "challenge-prompt";
  promptSection.append(
    makeTextElement("span", "challenge-section-label", "情境"),
    makeTextElement("p", "challenge-context", question.prompt),
    makeTextElement("span", "challenge-section-label", "你的任务"),
    makeTextElement("p", "challenge-task", question.task),
  );
  if (question.hint) {
    const hint = document.createElement("details");
    hint.className = "challenge-hint";
    hint.append(makeTextElement("summary", "", "需要提示？"), makeTextElement("p", "", question.hint));
    promptSection.append(hint);
  }

  const answerActions = document.createElement("div");
  answerActions.className = "challenge-answer-actions";
  const revealButton = document.createElement("button");
  revealButton.type = "button";
  revealButton.className = "challenge-primary-button";
  revealButton.textContent = "查看答案";
  revealButton.setAttribute("aria-expanded", "false");
  const completionButton = document.createElement("button");
  completionButton.type = "button";
  completionButton.className = "challenge-complete-button";
  completionButton.textContent = status.completed ? "已完成" : "掌握本题并解锁下一题";
  completionButton.disabled = true;
  answerActions.append(revealButton, completionButton);

  const answerPanel = document.createElement("section");
  answerPanel.className = "challenge-answer";
  answerPanel.hidden = true;
  answerPanel.append(
    makeTextElement("span", "challenge-section-label", "参考答案"),
    makeTextElement("div", "challenge-answer-sample", question.answer.sample),
  );
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
  const setNextButton = (completed) => {
    nextButton.disabled = !next || !completed;
    nextButton.textContent = !next
      ? "已完成全部题目"
      : completed ? `下一题 · ${next.question.title} →` : "完成本题后解锁下一题";
  };
  setNextButton(status.completed);
  nextButton.addEventListener("click", () => next && navigateLearning("challengeQuestion", pack.skillId, true, next.level.id, next.question.id));
  navigation.append(homeButton, previousButton, nextButton);

  revealButton.addEventListener("click", () => {
    const willShow = answerPanel.hidden;
    answerPanel.hidden = !willShow;
    revealButton.textContent = willShow ? "收起答案" : "查看答案";
    revealButton.setAttribute("aria-expanded", String(willShow));
    completionButton.disabled = !willShow || status.completed;
  });
  completionButton.addEventListener("click", () => {
    const progress = getChallengeProgress(pack.skillId);
    progress.add(`${level.id}/${question.id}`);
    persistChallengeProgress(pack.skillId);
    updateChallengeSkillLevel(pack);
    article.classList.add("completed");
    completionButton.textContent = "已完成";
    completionButton.disabled = true;
    setNextButton(true);
  });

  if (status.completed) article.classList.add("completed");
  article.append(makeChallengeBreadcrumb(pack, level), header, promptSection, answerActions, answerPanel, navigation);
  elements.skillDetailContainer.replaceChildren(article);
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
  copy.append(badges, title, goal);
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
    ["建议安排", skill.weeks],
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
  elements.learningViewNav.replaceChildren(
    makeLearningNavButton("能力体系", "13", state.learningTab === "overview", () => navigateLearning("overview")),
    makeLearningNavButton("16 周路线", `${state.completedWeeks.size}/17`, state.learningTab === "roadmap", () => navigateLearning("roadmap")),
    makeLearningNavButton("作品与验收", `${state.completedPortfolio.size}/14`, state.learningTab === "portfolio", () => navigateLearning("portfolio")),
  );
  elements.learningSkillNav.replaceChildren();
  state.guide.groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "learning-side-group";
    const title = document.createElement("h3");
    title.textContent = group.label;
    section.append(title);
    state.guide.skills.filter((skill) => skill.group === group.id).forEach((skill) => {
      const level = Number(state.skillLevels[skill.id]) || 0;
      const pack = state.challengePacks.get(skill.id);
      const challengeMeta = pack
        ? `${getChallengeProgress(skill.id).size}/${challengeQuestions(pack).length}`
        : "闯关";
      section.append(makeLearningNavButton(
        skill.title,
        skill.id === "business-english" ? challengeMeta : `${level}级`,
        ["detail", "challengeLevel", "challengeQuestion"].includes(state.learningTab) && state.selectedSkill === skill.id,
        () => navigateLearning("detail", skill.id),
      ));
    });
    elements.learningSkillNav.append(section);
  });
}

function renderStudyBrief() {
  const { caseStudy, method } = state.guide;
  elements.caseTitle.textContent = caseStudy.title;
  elements.caseDescription.textContent = caseStudy.description;
  elements.caseEntities.replaceChildren();
  caseStudy.entities.forEach((entity) => {
    const span = document.createElement("span");
    span.textContent = entity;
    elements.caseEntities.append(span);
  });
  elements.methodSplit.replaceChildren();
  method.forEach((item) => {
    const block = document.createElement("div");
    const value = document.createElement("strong");
    value.textContent = item.value;
    const label = document.createElement("span");
    label.textContent = item.label;
    block.append(value, label);
    elements.methodSplit.append(block);
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
        renderStudyBrief();
        renderSkillProgress();
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
    const request = fetch(`challenges/${encodeURIComponent(skillId)}.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`题库 HTTP ${response.status}`);
        return response.json();
      })
      .then((pack) => {
        if (pack.skillId !== skillId || !Array.isArray(pack.levels)) throw new Error("题库格式不正确");
        const validKeys = new Set(challengeQuestions(pack).map((item) => item.key));
        const progress = getChallengeProgress(skillId);
        [...progress].forEach((key) => {
          if (!validKeys.has(key)) progress.delete(key);
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

function renderPhaseNav() {
  const options = [
    { id: "all", label: "全部阶段" },
    ...state.guide.phases.map((phase) => ({ id: phase.id, label: phase.label })),
  ];
  elements.phaseNav.replaceChildren();
  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option.label;
    button.className = state.roadmapPhase === option.id ? "active" : "";
    button.setAttribute("aria-pressed", String(state.roadmapPhase === option.id));
    button.addEventListener("click", () => {
      state.roadmapPhase = option.id;
      renderRoadmap();
    });
    elements.phaseNav.append(button);
  });
}

function makeWeekRow(week) {
  const row = document.createElement("article");
  row.className = "week-row";
  row.classList.toggle("completed", state.completedWeeks.has(week.week));

  const control = document.createElement("label");
  control.className = "week-control";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = state.completedWeeks.has(week.week);
  checkbox.setAttribute("aria-label", `标记第 ${week.week} 周${week.theme}完成`);
  const number = document.createElement("span");
  number.textContent = `W${String(week.week).padStart(2, "0")}`;
  control.append(checkbox, number);

  const copy = document.createElement("div");
  copy.className = "week-copy";
  const title = document.createElement("h4");
  title.textContent = week.theme;
  const study = document.createElement("p");
  study.textContent = week.study;
  copy.append(title, study);

  const outputs = document.createElement("div");
  outputs.className = "week-outputs";
  week.outputs.forEach((output) => {
    const span = document.createElement("span");
    span.textContent = output;
    outputs.append(span);
  });
  row.append(control, copy, outputs);

  checkbox.addEventListener("change", () => {
    checkbox.checked ? state.completedWeeks.add(week.week) : state.completedWeeks.delete(week.week);
    row.classList.toggle("completed", checkbox.checked);
    persistLearningChecklist("recruitment-completed-weeks", state.completedWeeks);
    renderSkillProgress();
    renderLearningSidebar();
  });
  return row;
}

function renderRoadmap() {
  renderPhaseNav();
  elements.roadmapList.replaceChildren();
  state.guide.phases.forEach((phase) => {
    if (state.roadmapPhase !== "all" && state.roadmapPhase !== phase.id) return;
    const weeks = state.guide.weeks.filter((week) => week.phase === phase.id);
    const section = document.createElement("section");
    section.className = "roadmap-phase";
    const header = document.createElement("header");
    const copy = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = phase.label;
    const description = document.createElement("p");
    description.textContent = phase.description;
    copy.append(title, description);
    const range = document.createElement("span");
    range.textContent = phase.range;
    header.append(copy, range);
    const list = document.createElement("div");
    list.className = "week-list";
    list.append(...weeks.map(makeWeekRow));
    section.append(header, list);
    elements.roadmapList.append(section);
  });
  renderSkillProgress();
}

function makeChecklistItem(item, checkedSet, storageKey, onUpdate, badgeText = "") {
  const label = document.createElement("label");
  label.className = "checklist-item";
  label.classList.toggle("completed", checkedSet.has(item.id));
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checkedSet.has(item.id);
  const checkmark = document.createElement("span");
  checkmark.className = "check-mark";
  checkmark.setAttribute("aria-hidden", "true");
  checkmark.textContent = "✓";
  const text = document.createElement("span");
  text.className = "check-text";
  text.textContent = item.title || item.text;
  label.append(input, checkmark, text);
  if (badgeText) {
    const badge = document.createElement("span");
    badge.className = "check-badge";
    badge.textContent = badgeText;
    label.append(badge);
  }
  input.addEventListener("change", () => {
    input.checked ? checkedSet.add(item.id) : checkedSet.delete(item.id);
    label.classList.toggle("completed", input.checked);
    persistLearningChecklist(storageKey, checkedSet);
    onUpdate();
  });
  return label;
}

function updatePortfolioProgress() {
  elements.portfolioProgress.textContent = `${state.completedPortfolio.size} / ${state.guide.portfolio.length}`;
  const tierCounts = {};
  state.guide.readiness.forEach((item) => {
    tierCounts[item.tier] ??= { completed: 0, total: 0 };
    tierCounts[item.tier].total += 1;
    if (state.completedReadiness.has(item.id)) tierCounts[item.tier].completed += 1;
  });
  elements.readinessProgress.textContent = ["A-", "A+"]
    .map((tier) => `${tier} ${tierCounts[tier].completed}/${tierCounts[tier].total}`)
    .join(" · ");
  renderLearningSidebar();
}

function renderPortfolio() {
  elements.portfolioList.replaceChildren();
  state.guide.portfolio.forEach((item) => {
    elements.portfolioList.append(makeChecklistItem(
      item,
      state.completedPortfolio,
      "recruitment-completed-portfolio",
      updatePortfolioProgress,
      item.phase,
    ));
  });

  elements.readinessGroups.replaceChildren();
  ["A-", "A+"].forEach((tier) => {
    const section = document.createElement("section");
    section.className = "readiness-tier";
    const title = document.createElement("h5");
    title.textContent = `${tier} 最低标准`;
    const list = document.createElement("div");
    state.guide.readiness.filter((item) => item.tier === tier).forEach((item) => {
      list.append(makeChecklistItem(
        item,
        state.completedReadiness,
        "recruitment-completed-readiness",
        updatePortfolioProgress,
      ));
    });
    section.append(title, list);
    elements.readinessGroups.append(section);
  });
  updatePortfolioProgress();
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
      else setView("jobs");
    });
  });
  elements.learningRouteButtons.forEach((button) => {
    button.addEventListener("click", () => navigateLearning(button.dataset.learningRoute));
  });
  elements.backToOverview.addEventListener("click", () => navigateLearning("overview"));
  window.addEventListener("hashchange", () => {
    const route = learningRouteFromHash(location.hash);
    if (route) navigateLearning(route.page, route.skillId, false, route.levelId, route.questionId);
    else setView("jobs", false);
  });

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

async function init() {
  const theme = localStorage.getItem("recruitment-theme");
  if (theme) document.documentElement.dataset.theme = theme;
  bindControls();
  try {
    const jobsResponse = await fetch("jobs.json");
    if (!jobsResponse.ok) throw new Error(`岗位数据 HTTP ${jobsResponse.status}`);
    state.data = await jobsResponse.json();
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
    state.data.profile.criteria.forEach((criterion) => {
      const li = document.createElement("li");
      li.textContent = criterion;
      elements.criteriaList.append(li);
    });

    const directions = [...new Set(state.data.jobs.flatMap((job) => job.directions))].sort();
    directions.forEach((direction) => {
      const option = document.createElement("option");
      option.value = direction;
      option.textContent = direction;
      elements.directionSelect.append(option);
    });
    renderBars();
    render();
    setView(state.view, false);
    if (initialLearningRoute) {
      await navigateLearning(
        initialLearningRoute.page,
        initialLearningRoute.skillId,
        false,
        initialLearningRoute.levelId,
        initialLearningRoute.questionId,
      );
    }
  } catch (error) {
    elements.profileSummary.textContent = "岗位数据读取失败，请稍后刷新页面";
    elements.resultCaption.textContent = error.message;
    elements.emptyState.hidden = false;
    elements.emptyState.querySelector("strong").textContent = "岗位数据暂时无法读取";
  }
}

init();
