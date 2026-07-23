function readStoredJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

const learningTabsByHash = {
  "#skills": "map",
  "#roadmap": "roadmap",
  "#portfolio": "portfolio",
};

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
  view: learningTabsByHash[location.hash] ? "skills" : "jobs",
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
  learningTab: learningTabsByHash[location.hash] || "map",
  skillGroup: "all",
  hideMastered: false,
  skillLevels: storedSkillLevels,
  roadmapPhase: "all",
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
  skillSegments: document.querySelector("#skill-segments"),
  hideMastered: document.querySelector("#hide-mastered"),
  skillGroups: document.querySelector("#skill-groups"),
  skillEmpty: document.querySelector("#skill-empty"),
  showMastered: document.querySelector("#show-mastered"),
  skillProgressCount: document.querySelector("#skill-progress-count"),
  skillAverageLevel: document.querySelector("#skill-average-level"),
  weekProgressCount: document.querySelector("#week-progress-count"),
  skillJobCount: document.querySelector("#skill-job-count"),
  skillProgressTrack: document.querySelector(".skill-progress-track"),
  skillProgressFill: document.querySelector("#skill-progress-fill"),
  skillTemplate: document.querySelector("#skill-template"),
  learningTabButtons: [...document.querySelectorAll("[data-learning-tab]")],
  abilityPanel: document.querySelector("#ability-panel"),
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
  elements.viewButtons.forEach((button) => {
    const active = button.dataset.view === state.view;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  if (updateURL) {
    const url = new URL(location.href);
    const hashes = { map: "skills", roadmap: "roadmap", portfolio: "portfolio" };
    url.hash = state.view === "skills" ? hashes[state.learningTab] : "";
    history.replaceState(null, "", url);
  }
}

function setLearningTab(tab, updateURL = true) {
  state.learningTab = ["map", "roadmap", "portfolio"].includes(tab) ? tab : "map";
  elements.abilityPanel.hidden = state.learningTab !== "map";
  elements.roadmapPanel.hidden = state.learningTab !== "roadmap";
  elements.portfolioPanel.hidden = state.learningTab !== "portfolio";
  elements.learningTabButtons.forEach((button) => {
    const active = button.dataset.learningTab === state.learningTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  if (updateURL && state.view === "skills") setView("skills");
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

function renderSkillSegments() {
  elements.skillSegments.replaceChildren();
  const options = [
    { id: "all", label: "全部" },
    ...state.guide.groups.map((group) => ({ id: group.id, label: group.label })),
  ];
  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option.label;
    button.className = state.skillGroup === option.id ? "active" : "";
    button.setAttribute("aria-pressed", String(state.skillGroup === option.id));
    button.addEventListener("click", () => {
      state.skillGroup = option.id;
      renderSkills();
    });
    elements.skillSegments.append(button);
  });
}

function makeSkillCard(skill) {
  const fragment = elements.skillTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".skill-card");
  card.dataset.skillId = skill.id;
  card.classList.add(`skill-group-${skill.group}`);
  const level = Number(state.skillLevels[skill.id]) || 0;
  card.dataset.level = level;
  card.classList.toggle("mastered", level >= state.guide.targetLevel);

  const priority = fragment.querySelector(".skill-priority");
  priority.textContent = skill.priority;
  priority.classList.add(`priority-${skill.group}`);
  fragment.querySelector(".skill-coverage").textContent = skill.coverageLabel;
  fragment.querySelector(".skill-title").textContent = skill.title;
  fragment.querySelector(".skill-week").textContent = skill.weeks;
  fragment.querySelector(".skill-description").textContent = skill.goal;
  fragment.querySelector(".skill-practice").textContent = skill.deliverable;

  fragment.querySelector(".coverage-track span").style.width = `${skill.coverageCount / skill.coverageTotal * 100}%`;

  const learningPath = fragment.querySelector(".learning-path");
  skill.path.forEach((stage) => {
    const block = document.createElement("div");
    block.className = "path-stage";
    const title = document.createElement("h5");
    title.textContent = stage.title;
    const list = document.createElement("ul");
    stage.points.forEach((point) => {
      const item = document.createElement("li");
      item.textContent = point;
      list.append(item);
    });
    block.append(title, list);
    learningPath.append(block);
  });

  const exerciseList = fragment.querySelector(".exercise-list");
  skill.exercises.forEach((exercise) => {
    const item = document.createElement("li");
    item.textContent = exercise;
    exerciseList.append(item);
  });

  const resourceList = fragment.querySelector(".resource-list");
  if (skill.resources.length) {
    skill.resources.forEach((resource) => {
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
      resourceList.append(link);
    });
  } else {
    const note = document.createElement("p");
    note.className = "resource-note";
    note.textContent = "本项不增加书单，优先复盘真实项目并补齐可验证证据。";
    resourceList.append(note);
  }

  const acceptanceList = fragment.querySelector(".acceptance-list");
  skill.acceptance.forEach((criterion) => {
    const item = document.createElement("li");
    item.textContent = criterion;
    acceptanceList.append(item);
  });

  const levelSelect = fragment.querySelector(".skill-level");
  state.guide.levelDefinitions.forEach((definition) => {
    const option = document.createElement("option");
    option.value = definition.level;
    option.textContent = `${definition.level} · ${definition.label}`;
    option.title = definition.description;
    levelSelect.append(option);
  });
  levelSelect.value = String(level);
  levelSelect.setAttribute("aria-label", `${skill.title}当前能力等级`);
  levelSelect.addEventListener("change", () => {
    state.skillLevels[skill.id] = Number(levelSelect.value);
    persistSkillLevels();
    if (state.hideMastered) renderSkills();
    else {
      card.dataset.level = levelSelect.value;
      card.classList.toggle("mastered", Number(levelSelect.value) >= state.guide.targetLevel);
      renderSkillProgress();
    }
  });

  const toggle = fragment.querySelector(".skill-toggle");
  const detail = fragment.querySelector(".skill-detail");
  toggle.setAttribute("aria-label", `展开${skill.title}的学习路径、习题和资料`);
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    detail.hidden = expanded;
    card.classList.toggle("expanded", !expanded);
  });
  return fragment;
}

function renderSkillGroups() {
  elements.skillGroups.replaceChildren();
  let visibleCount = 0;
  state.guide.groups.forEach((group) => {
    if (state.skillGroup !== "all" && state.skillGroup !== group.id) return;
    const skills = state.guide.skills.filter((skill) => (
      skill.group === group.id
      && (!state.hideMastered || (Number(state.skillLevels[skill.id]) || 0) < state.guide.targetLevel)
    ));
    if (!skills.length) return;
    visibleCount += skills.length;

    const section = document.createElement("section");
    section.className = "skill-group-section";
    const header = document.createElement("header");
    header.className = "skill-group-header";
    const copy = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = group.label;
    const description = document.createElement("p");
    description.textContent = group.description;
    copy.append(title, description);
    const count = document.createElement("span");
    count.textContent = `${skills.length} 项`;
    header.append(copy, count);

    const grid = document.createElement("div");
    grid.className = "skill-grid";
    grid.append(...skills.map(makeSkillCard));
    section.append(header, grid);
    elements.skillGroups.append(section);
  });
  elements.skillGroups.hidden = visibleCount === 0;
  elements.skillEmpty.hidden = visibleCount !== 0;
}

function renderSkills() {
  renderSkillSegments();
  renderSkillGroups();
  renderSkillProgress();
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
    button.addEventListener("click", () => setView(button.dataset.view));
  });
  elements.learningTabButtons.forEach((button) => {
    button.addEventListener("click", () => setLearningTab(button.dataset.learningTab));
  });
  window.addEventListener("hashchange", () => {
    const learningTab = learningTabsByHash[location.hash];
    if (learningTab) {
      setLearningTab(learningTab, false);
      setView("skills", false);
    } else {
      setView("jobs", false);
    }
  });

  elements.searchInput.addEventListener("input", (event) => { state.query = event.target.value.trim(); renderJobs(); });
  elements.directionSelect.addEventListener("change", (event) => { state.direction = event.target.value; render(); });
  elements.experienceSelect.addEventListener("change", (event) => { state.experience = event.target.value; renderJobs(); });
  elements.salarySelect.addEventListener("change", (event) => { state.salary = Number(event.target.value); renderJobs(); });
  elements.riskSelect.addEventListener("change", (event) => { state.risk = event.target.value; renderJobs(); });
  elements.bonusSelect.addEventListener("change", (event) => { state.bonus = event.target.value; renderJobs(); });
  elements.sortSelect.addEventListener("change", (event) => { state.sort = event.target.value; renderJobs(); });
  elements.savedOnly.addEventListener("change", (event) => { state.savedOnly = event.target.checked; renderJobs(); });
  elements.hideMastered.addEventListener("change", (event) => {
    state.hideMastered = event.target.checked;
    renderSkills();
  });
  elements.showMastered.addEventListener("click", () => {
    state.hideMastered = false;
    elements.hideMastered.checked = false;
    renderSkills();
  });
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
    const [jobsResponse, guideResponse] = await Promise.all([
      fetch("jobs.json"),
      fetch("learning-guide.json"),
    ]);
    if (!jobsResponse.ok) throw new Error(`岗位数据 HTTP ${jobsResponse.status}`);
    if (!guideResponse.ok) throw new Error(`学习指南 HTTP ${guideResponse.status}`);
    [state.data, state.guide] = await Promise.all([
      jobsResponse.json(),
      guideResponse.json(),
    ]);
    normalizeLearningProgress();
    elements.profileSummary.textContent = state.data.profile.summary;
    elements.poolStat.textContent = state.data.poolSize;
    elements.eligibleStat.textContent = state.data.eligibleSize;
    elements.displayedStat.textContent = state.data.displayedSize;
    elements.skillJobCount.textContent = state.guide.sample.totalJobs;
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
    renderStudyBrief();
    renderSkills();
    renderRoadmap();
    renderPortfolio();
    setLearningTab(state.learningTab, false);
    setView(state.view, false);
  } catch (error) {
    elements.profileSummary.textContent = "岗位数据读取失败，请稍后刷新页面";
    elements.resultCaption.textContent = error.message;
    elements.emptyState.hidden = false;
    elements.emptyState.querySelector("strong").textContent = "岗位数据暂时无法读取";
  }
}

init();
