const state = {
  data: null,
  query: "",
  tier: "all",
  direction: "all",
  experience: "all",
  salary: 0,
  risk: "all",
  sort: "score",
  savedOnly: false,
  saved: new Set(JSON.parse(localStorage.getItem("recruitment-saved") || "[]")),
};

const elements = {
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
};

const tierNames = { all: "全部", A: "优先看", B: "条件匹配", C: "备选" };

function persistSaved() {
  localStorage.setItem("recruitment-saved", JSON.stringify([...state.saved]));
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
    ...["A", "B", "C"].map((tier) => ({ key: tier, value: tier, label: tierNames[tier], count: state.data.counts[tier] })),
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
  ["all", "A", "B", "C"].forEach((tier) => {
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
  ["A", "B", "C"].forEach((tier) => {
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
  tierBadge.classList.add(`tier-${job.tier}`);
  fragment.querySelector(".job-title").textContent = job.title;
  fragment.querySelector(".company").textContent = job.company;
  fragment.querySelector(".score-value").textContent = job.score;

  const meta = fragment.querySelector(".meta-line");
  appendSpans(meta, [job.salary, job.city, job.experience, job.education]);
  appendSpans(fragment.querySelector(".dimension-list"), job.dimensions);

  const riskLine = fragment.querySelector(".risk-line");
  const risks = job.notes.filter((note) => !note.startsWith("未发现明显硬性风险"));
  appendSpans(riskLine, risks.length ? risks : ["未发现明显硬性风险"], risks.length ? "" : "clear-risk");

  const link = fragment.querySelector(".external-button");
  link.href = job.url;
  link.setAttribute("aria-label", `在 BOSS 直聘查看 ${job.title}`);

  const saveButton = fragment.querySelector(".save-button");
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

function resetFilters() {
  Object.assign(state, { query: "", tier: "all", direction: "all", experience: "all", salary: 0, risk: "all", sort: "score", savedOnly: false });
  elements.searchInput.value = "";
  elements.directionSelect.value = "all";
  elements.experienceSelect.value = "all";
  elements.salarySelect.value = "0";
  elements.riskSelect.value = "all";
  elements.sortSelect.value = "score";
  elements.savedOnly.checked = false;
  render();
}

function bindControls() {
  elements.searchInput.addEventListener("input", (event) => { state.query = event.target.value.trim(); renderJobs(); });
  elements.directionSelect.addEventListener("change", (event) => { state.direction = event.target.value; render(); });
  elements.experienceSelect.addEventListener("change", (event) => { state.experience = event.target.value; renderJobs(); });
  elements.salarySelect.addEventListener("change", (event) => { state.salary = Number(event.target.value); renderJobs(); });
  elements.riskSelect.addEventListener("change", (event) => { state.risk = event.target.value; renderJobs(); });
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
    const response = await fetch("jobs.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();
    elements.profileSummary.textContent = state.data.profile.summary;
    elements.poolStat.textContent = state.data.poolSize;
    elements.eligibleStat.textContent = state.data.eligibleSize;
    elements.displayedStat.textContent = state.data.displayedSize;
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
  } catch (error) {
    elements.profileSummary.textContent = "岗位数据读取失败，请稍后刷新页面";
    elements.resultCaption.textContent = error.message;
    elements.emptyState.hidden = false;
    elements.emptyState.querySelector("strong").textContent = "岗位数据暂时无法读取";
  }
}

init();
