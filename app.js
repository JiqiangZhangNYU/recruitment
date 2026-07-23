const state = {
  data: null,
  view: location.hash === "#skills" ? "skills" : "jobs",
  query: "",
  tier: "all",
  direction: "all",
  experience: "all",
  salary: 0,
  risk: "all",
  bonus: "all",
  sort: "score",
  savedOnly: false,
  saved: new Set(JSON.parse(localStorage.getItem("recruitment-saved") || "[]")),
  skillGroup: "all",
  hideMastered: false,
  masteredSkills: new Set(JSON.parse(localStorage.getItem("recruitment-mastered-skills") || "[]")),
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
  skillJobCount: document.querySelector("#skill-job-count"),
  skillProgressTrack: document.querySelector(".skill-progress-track"),
  skillProgressFill: document.querySelector("#skill-progress-fill"),
  skillTemplate: document.querySelector("#skill-template"),
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

function persistMasteredSkills() {
  localStorage.setItem("recruitment-mastered-skills", JSON.stringify([...state.masteredSkills]));
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
    url.hash = state.view === "skills" ? "skills" : "";
    history.replaceState(null, "", url);
  }
}

function textIncludes(job, query) {
  const haystack = [
    job.title,
    job.company,
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
    if (state.bonus === "major" && !job.majorCompany) return false;
    if (state.bonus === "both" && !(job.paymentBonus && job.majorCompany)) return false;
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
  if (job.paymentBonus) bonuses.push("支付业务 +14");
  if (job.majorCompany) bonuses.push("大平台 +10");
  if (!job.applicationRecommended) bonuses.push("仅供方向参考 · 不建议投递");
  appendSpans(fragment.querySelector(".bonus-list"), bonuses);
  appendSpans(fragment.querySelector(".dimension-list"), job.dimensions);

  const riskLine = fragment.querySelector(".risk-line");
  const risks = job.notes.filter((note) => !note.startsWith("未发现明显硬性风险"));
  appendSpans(riskLine, risks.length ? risks : ["未发现明显硬性风险"], risks.length ? "" : "clear-risk");

  const link = fragment.querySelector(".external-button");
  link.href = job.url;
  link.textContent = job.applicationRecommended ? "BOSS ↗" : "参考 JD ↗";
  link.setAttribute(
    "aria-label",
    job.applicationRecommended
      ? `在 BOSS 直聘查看 ${job.title}`
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
  const skillIds = new Set(state.data.skills.items.map((skill) => skill.id));
  const completed = [...state.masteredSkills].filter((id) => skillIds.has(id)).length;
  const total = skillIds.size;
  elements.skillProgressCount.textContent = `${completed} / ${total}`;
  elements.skillProgressFill.style.width = `${total ? completed / total * 100 : 0}%`;
  elements.skillProgressTrack.setAttribute("aria-valuemax", String(total));
  elements.skillProgressTrack.setAttribute("aria-valuenow", String(completed));
}

function renderSkillSegments() {
  elements.skillSegments.replaceChildren();
  const options = [
    { id: "all", label: "全部" },
    ...state.data.skills.groups.map((group) => ({ id: group.id, label: group.label })),
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
  const mastered = state.masteredSkills.has(skill.id);
  card.classList.toggle("mastered", mastered);

  const priority = fragment.querySelector(".skill-priority");
  priority.textContent = skill.priority;
  priority.classList.add(`priority-${skill.group}`);
  fragment.querySelector(".skill-coverage").textContent = skill.evidence;
  fragment.querySelector(".skill-title").textContent = skill.title;
  fragment.querySelector(".skill-description").textContent = skill.description;
  fragment.querySelector(".skill-practice").textContent = skill.practice;

  const coverageValue = skill.relatedCount ?? skill.jobCount;
  fragment.querySelector(".coverage-track span").style.width = `${coverageValue / skill.totalJobs * 100}%`;
  const list = fragment.querySelector(".learning-points");
  skill.learningPoints.forEach((point) => {
    const item = document.createElement("li");
    item.textContent = point;
    list.append(item);
  });

  const checkbox = fragment.querySelector(".mastery-control input");
  checkbox.checked = mastered;
  checkbox.setAttribute("aria-label", `标记已掌握：${skill.title}`);
  checkbox.addEventListener("change", () => {
    checkbox.checked ? state.masteredSkills.add(skill.id) : state.masteredSkills.delete(skill.id);
    persistMasteredSkills();
    if (state.hideMastered) {
      renderSkills();
    } else {
      card.classList.toggle("mastered", checkbox.checked);
      renderSkillProgress();
    }
  });
  return fragment;
}

function renderSkillGroups() {
  elements.skillGroups.replaceChildren();
  let visibleCount = 0;
  state.data.skills.groups.forEach((group) => {
    if (state.skillGroup !== "all" && state.skillGroup !== group.id) return;
    const skills = state.data.skills.items.filter((skill) => (
      skill.group === group.id
      && (!state.hideMastered || !state.masteredSkills.has(skill.id))
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
  window.addEventListener("hashchange", () => setView(location.hash === "#skills" ? "skills" : "jobs", false));

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
    const response = await fetch("jobs.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();
    elements.profileSummary.textContent = state.data.profile.summary;
    elements.poolStat.textContent = state.data.poolSize;
    elements.eligibleStat.textContent = state.data.eligibleSize;
    elements.displayedStat.textContent = state.data.displayedSize;
    elements.skillJobCount.textContent = state.data.displayedSize;
    elements.sourceTime.textContent = formatTime(state.data.sourceGeneratedAt || state.data.generatedAt);
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
    renderSkills();
    setView(state.view, false);
  } catch (error) {
    elements.profileSummary.textContent = "岗位数据读取失败，请稍后刷新页面";
    elements.resultCaption.textContent = error.message;
    elements.emptyState.hidden = false;
    elements.emptyState.querySelector("strong").textContent = "岗位数据暂时无法读取";
  }
}

init();
