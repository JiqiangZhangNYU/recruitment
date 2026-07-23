const state = {
  profile: null,
  directions: null,
  skills: null,
  activeView: "overview",
  directionFilter: "all",
};

const viewMetadata = {
  overview: {
    eyebrow: "费后实盘 · 2024.03 至今",
    title: "商品期货量化研究员",
  },
  directions: {
    eyebrow: "初始岗位假设 · 尚未接入招聘数据",
    title: "目标岗位方向",
    subtitle: "以商品截面研究为主定价，按证据要求区分直接匹配、进阶目标与迁移方向。",
  },
  skills: {
    eyebrow: "去重能力框架 · 证据优先",
    title: "九项能力地图",
    subtitle: "P0 决定高级研究员与策略负责人定价，P1 用于形成差异化与扩大机会集。",
  },
};

const elements = {
  title: document.querySelector("#page-title"),
  eyebrow: document.querySelector("#page-eyebrow"),
  subtitle: document.querySelector("#page-subtitle"),
  themeButton: document.querySelector("#theme-button"),
  dataDate: document.querySelector("#data-date"),
  errorState: document.querySelector("#error-state"),
  overviewLoading: document.querySelector("#overview-loading"),
  overviewContent: document.querySelector("#overview-content"),
  directionsLoading: document.querySelector("#directions-loading"),
  directionsContent: document.querySelector("#directions-content"),
  skillsLoading: document.querySelector("#skills-loading"),
  skillsOverview: document.querySelector("#skills-overview"),
  skillDetail: document.querySelector("#skill-detail"),
  skillSideSection: document.querySelector("#skill-side-section"),
  skillSideNav: document.querySelector("#skill-side-nav"),
};

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function list(items, className = "") {
  return `<ul class="${className}">${items.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`;
}

async function loadJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load ${path}: ${response.status}`);
  return response.json();
}

function formatDate(date) {
  const [year, month, day] = date.split("-");
  return `${year}.${month}.${day}`;
}

function renderOverview() {
  const profile = state.profile;
  elements.subtitle.textContent = profile.summary;
  elements.dataDate.textContent = formatDate(profile.updatedAt);
  elements.overviewContent.innerHTML = `
    <section class="metric-strip" aria-label="核心履历指标">
      ${profile.metrics.map((metric) => `
        <article class="metric-item">
          <span>${escapeHTML(metric.label)}</span>
          <strong>${escapeHTML(metric.value)}</strong>
          <small>${escapeHTML(metric.note)}</small>
        </article>
      `).join("")}
    </section>

    <section class="strategy-scorecard section-band" aria-labelledby="scorecard-title">
      <header class="section-heading compact-heading">
        <p class="section-index">01 / LIVE STRATEGY SCORECARD</p>
        <h2 id="scorecard-title">策略成绩单</h2>
      </header>
      <div class="scorecard-layout">
        <div class="scorecard-context">
          <span>${escapeHTML(profile.strategyScorecard.status)}</span>
          <strong>${escapeHTML(profile.strategyScorecard.period)}</strong>
          <p>${escapeHTML(profile.strategyScorecard.context)}</p>
        </div>
        <dl class="scorecard-grid">
          ${profile.strategyScorecard.items.map((item) => `
            <div class="scorecard-item">
              <dt>${escapeHTML(item.label)}</dt>
              <dd>${escapeHTML(item.value)}</dd>
              <small>${escapeHTML(item.note)}</small>
            </div>
          `).join("")}
        </dl>
      </div>
    </section>

    <section class="positioning-band section-band">
      <header class="section-heading">
        <p class="section-index">02 / POSITIONING</p>
        <h2>${escapeHTML(profile.headline)}</h2>
      </header>
      <div class="positioning-grid">
        <div class="positioning-primary">
          <span class="field-label">主定位</span>
          <strong>${escapeHTML(profile.positioning.primary)}</strong>
          <p>${escapeHTML(profile.positioning.principle)}</p>
        </div>
        <dl class="positioning-lanes">
          <div><dt>相邻方向</dt><dd>${escapeHTML(profile.positioning.adjacent)}</dd></div>
          <div><dt>进阶目标</dt><dd>${escapeHTML(profile.positioning.stretch)}</dd></div>
        </dl>
      </div>
    </section>

    <section class="research-chain section-band" aria-labelledby="research-chain-title">
      <header class="section-heading compact-heading">
        <p class="section-index">03 / RESEARCH EVIDENCE CHAIN</p>
        <h2 id="research-chain-title">研究证据链</h2>
      </header>
      <div class="chain-visual">
        ${profile.researchChain.map((stage, index) => `
          <article class="chain-node" data-state="${escapeHTML(stage.state)}">
            <div class="chain-marker"><span>${String(index + 1).padStart(2, "0")}</span></div>
            <div>
              <span class="state-label">${escapeHTML(stage.state)}</span>
              <h3>${escapeHTML(stage.label)}</h3>
              <p>${escapeHTML(stage.detail)}</p>
            </div>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="responsibility-band section-band" aria-labelledby="responsibility-title">
      <header class="section-heading compact-heading">
        <p class="section-index">04 / RESPONSIBILITY BOUNDARY</p>
        <h2 id="responsibility-title">职责与决策边界</h2>
      </header>
      <div class="responsibility-grid">
        <section>
          <span class="responsibility-label owned">本人负责</span>
          ${list(profile.responsibility.owned, "evidence-list")}
        </section>
        <section>
          <span class="responsibility-label collaborated">协作完成</span>
          ${list(profile.responsibility.collaborated, "compact-boundary-list")}
        </section>
        <section>
          <span class="responsibility-label not-owned">当前不负责</span>
          ${list(profile.responsibility.notOwned, "question-list")}
        </section>
      </div>
      <p class="target-boundary"><span>目标边界</span>${escapeHTML(profile.responsibility.targetBoundary)}</p>
    </section>

    <section class="evidence-band section-band">
      <div class="evidence-column confirmed-column">
        <header class="section-heading compact-heading">
          <p class="section-index">05 / CONFIRMED</p>
          <h2>已确认事实</h2>
        </header>
        ${list(profile.confirmedFacts, "evidence-list")}
      </div>
      <div class="evidence-column questions-column">
        <header class="section-heading compact-heading">
          <p class="section-index">06 / TO VERIFY</p>
          <h2>决定岗位定价的问题</h2>
        </header>
        ${list(profile.evidenceQuestions, "question-list")}
      </div>
    </section>

    <section class="next-evidence section-band">
      <header class="section-heading compact-heading">
        <p class="section-index">07 / NEXT EVIDENCE</p>
        <h2>下一批材料</h2>
      </header>
      <div class="deliverable-grid">
        ${profile.nextEvidence.map((item, index) => `
          <article class="deliverable-item">
            <span>${String(index + 1).padStart(2, "0")}</span>
            <h3>${escapeHTML(item.title)}</h3>
            <p>${escapeHTML(item.output)}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
  elements.overviewLoading.hidden = true;
  elements.overviewContent.hidden = false;
}

function directionTierClass(tier) {
  return `tier-${tier.toLowerCase().replace("+", "-plus")}`;
}

function renderDirections() {
  const dataset = state.directions;
  const filters = ["all", "A+", "A", "B+", "B"];
  const visible = state.directionFilter === "all"
    ? dataset.directions
    : dataset.directions.filter((direction) => direction.tier === state.directionFilter);

  elements.directionsContent.innerHTML = `
    <section class="view-intro">
      <div>
        <p class="section-index">ROLE ARCHETYPES</p>
        <h2 id="directions-title">六类目标方向</h2>
      </div>
      <p>${escapeHTML(dataset.basis)}</p>
    </section>
    <section class="screening-panel" aria-labelledby="screening-title">
      <header class="screening-header">
        <div>
          <p class="section-index">SEARCH CONSTRAINTS</p>
          <h3 id="screening-title">岗位筛选边界</h3>
        </div>
        <span>上海 · 百亿以上 · 百万年薪</span>
      </header>
      <div class="screening-grid">
        ${dataset.screeningCriteria.map((criterion) => `
          <article class="screening-item" data-level="${escapeHTML(criterion.level)}">
            <div>
              <span>${escapeHTML(criterion.label)}</span>
              <small>${escapeHTML(criterion.level)}</small>
            </div>
            <strong>${escapeHTML(criterion.value)}</strong>
            <p>${escapeHTML(criterion.note)}</p>
          </article>
        `).join("")}
      </div>
      <p class="compensation-note"><span>口径提醒</span>${escapeHTML(dataset.compensationNote)}</p>
    </section>
    <div class="segment-control" role="group" aria-label="岗位匹配级别">
      ${filters.map((filter) => `
        <button type="button" data-direction-filter="${escapeHTML(filter)}" class="${filter === state.directionFilter ? "active" : ""}">
          ${filter === "all" ? "全部" : escapeHTML(filter)}
        </button>
      `).join("")}
    </div>
    <section class="direction-list" aria-live="polite">
      ${visible.map((direction) => `
        <article class="direction-card">
          <div class="direction-rank ${directionTierClass(direction.tier)}">
            <strong>${escapeHTML(direction.tier)}</strong>
            <span>${escapeHTML(direction.fit)}</span>
          </div>
          <div class="direction-main">
            <header>
              <div>
                <h3>${escapeHTML(direction.title)}</h3>
                <p class="english-title">${escapeHTML(direction.titleEn)}</p>
              </div>
            </header>
            <p class="direction-thesis">${escapeHTML(direction.thesis)}</p>
            <div class="direction-evidence-grid">
              <div>
                <span class="field-label">当前证据</span>
                <div class="tag-list">${direction.evidence.map((item) => `<span>${escapeHTML(item)}</span>`).join("")}</div>
              </div>
              <div>
                <span class="field-label">必须补证</span>
                ${list(direction.mustProve, "compact-list")}
              </div>
            </div>
            <div class="keyword-row" aria-label="岗位检索关键词">
              ${direction.keywords.map((item) => `<code>${escapeHTML(item)}</code>`).join("")}
            </div>
          </div>
        </article>
      `).join("")}
    </section>
  `;
  elements.directionsLoading.hidden = true;
  elements.directionsContent.hidden = false;
}

function renderSkillNavigation(activeSkillId = "") {
  elements.skillSideNav.innerHTML = state.skills.skills.map((skill, index) => `
    <button type="button" data-skill-id="${escapeHTML(skill.id)}" class="${skill.id === activeSkillId ? "active" : ""}">
      <span>${String(index + 1).padStart(2, "0")}</span>
      <strong>${escapeHTML(skill.title)}</strong>
    </button>
  `).join("");
}

function renderSkillsOverview() {
  const groups = ["P0", "P1"];
  renderSkillNavigation();
  elements.skillsOverview.innerHTML = `
    <section class="view-intro">
      <div>
        <p class="section-index">CAPABILITY MAP</p>
        <h2 id="skills-title">九项低重叠能力</h2>
      </div>
      <p>每项能力只承载一个招聘判断，当前状态以已确认事实为准，不用年限替代证据。</p>
    </section>
    <div class="skill-groups">
      ${groups.map((priority) => {
        const skills = state.skills.skills.filter((skill) => skill.priority === priority);
        return `
          <section class="skill-group" aria-labelledby="${priority.toLowerCase()}-heading">
            <header class="skill-group-header">
              <span>${priority}</span>
              <div>
                <h3 id="${priority.toLowerCase()}-heading">${priority === "P0" ? "核心定价能力" : "差异化与迁移能力"}</h3>
                <p>${priority === "P0" ? "高级研究员、策略负责人和 PM 岗位共同追问的底层证据" : "不稀释商品研究主身份的前提下扩大机会集"}</p>
              </div>
            </header>
            <div class="skill-card-grid">
              ${skills.map((skill, index) => `
                <button type="button" class="skill-card" data-skill-id="${escapeHTML(skill.id)}">
                  <span class="skill-number">${String(state.skills.skills.indexOf(skill) + 1).padStart(2, "0")}</span>
                  <span class="status-chip">${escapeHTML(skill.status)}</span>
                  <strong>${escapeHTML(skill.title)}</strong>
                  <span>${escapeHTML(skill.subtitle)}</span>
                  <small>${escapeHTML(skill.summary)}</small>
                  <span class="skill-arrow" aria-hidden="true">→</span>
                </button>
              `).join("")}
            </div>
          </section>
        `;
      }).join("")}
    </div>
  `;
  elements.skillDetail.hidden = true;
  elements.skillsOverview.hidden = false;
  elements.skillsLoading.hidden = true;
}

function renderSkillDetail(skillId) {
  const skills = state.skills.skills;
  const index = skills.findIndex((skill) => skill.id === skillId);
  if (index < 0) {
    location.hash = "skills";
    return;
  }
  const skill = skills[index];
  const previous = skills[index - 1];
  const next = skills[index + 1];
  renderSkillNavigation(skillId);
  elements.skillDetail.innerHTML = `
    <nav class="breadcrumb" aria-label="能力详情导航">
      <button type="button" data-back-skills><span aria-hidden="true">←</span> 九项能力</button>
      <span>${String(index + 1).padStart(2, "0")} / ${String(skills.length).padStart(2, "0")}</span>
    </nav>
    <article class="skill-detail-sheet">
      <header class="skill-detail-header">
        <div>
          <div class="skill-detail-meta">
            <span>${escapeHTML(skill.priority)}</span>
            <span>${escapeHTML(skill.status)}</span>
          </div>
          <h2>${escapeHTML(skill.title)}</h2>
          <p>${escapeHTML(skill.subtitle)}</p>
        </div>
        <span class="detail-index">${String(index + 1).padStart(2, "0")}</span>
      </header>
      <p class="skill-detail-summary">${escapeHTML(skill.summary)}</p>
      <div class="skill-detail-columns">
        <section>
          <span class="field-label">已确认</span>
          ${list(skill.confirmed, "evidence-list")}
        </section>
        <section>
          <span class="field-label">待补证</span>
          ${list(skill.toProve, "question-list")}
        </section>
      </div>
      <section class="next-action">
        <span>下一份证据</span>
        <strong>${escapeHTML(skill.next)}</strong>
      </section>
    </article>
    <nav class="detail-pagination" aria-label="上一项或下一项能力">
      <button type="button" ${previous ? `data-skill-id="${escapeHTML(previous.id)}"` : "disabled"}>
        <span>上一项</span><strong>${previous ? escapeHTML(previous.title) : "已经是第一项"}</strong>
      </button>
      <button type="button" ${next ? `data-skill-id="${escapeHTML(next.id)}"` : "disabled"}>
        <span>下一项</span><strong>${next ? escapeHTML(next.title) : "已经是最后一项"}</strong>
      </button>
    </nav>
  `;
  elements.skillsOverview.hidden = true;
  elements.skillDetail.hidden = false;
  elements.skillsLoading.hidden = true;
}

function updateHeader(view) {
  const metadata = viewMetadata[view];
  elements.eyebrow.textContent = metadata.eyebrow;
  elements.title.textContent = metadata.title;
  if (view === "overview" && state.profile) {
    elements.subtitle.textContent = state.profile.summary;
  } else {
    elements.subtitle.textContent = metadata.subtitle;
  }
}

async function ensureDirections() {
  if (!state.directions) state.directions = await loadJSON("data/directions.json");
  renderDirections();
}

async function ensureSkills(skillId = "") {
  if (!state.skills) state.skills = await loadJSON("data/skills.json");
  elements.skillSideSection.hidden = false;
  if (skillId) renderSkillDetail(skillId);
  else renderSkillsOverview();
}

async function showView(view, detailId = "") {
  const safeView = ["overview", "directions", "skills"].includes(view) ? view : "overview";
  state.activeView = safeView;
  document.querySelectorAll(".view-panel").forEach((panel) => {
    panel.hidden = panel.id !== `${safeView}-view`;
  });
  document.querySelectorAll(".primary-nav button").forEach((button) => {
    const active = button.dataset.view === safeView;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  elements.skillSideSection.hidden = safeView !== "skills";
  updateHeader(safeView);
  elements.errorState.hidden = true;
  try {
    if (safeView === "directions") await ensureDirections();
    if (safeView === "skills") await ensureSkills(detailId);
  } catch (error) {
    console.error(error);
    elements.errorState.hidden = false;
  }
  window.scrollTo({ top: 0, behavior: "instant" });
}

function route() {
  const [view = "overview", detailId = ""] = location.hash.replace(/^#/, "").split("/");
  showView(view, detailId);
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("quant-career-theme", theme);
  elements.themeButton.setAttribute("aria-label", theme === "dark" ? "切换到浅色主题" : "切换到深色主题");
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) location.hash = viewButton.dataset.view;

  const filterButton = event.target.closest("[data-direction-filter]");
  if (filterButton) {
    state.directionFilter = filterButton.dataset.directionFilter;
    renderDirections();
  }

  const skillButton = event.target.closest("[data-skill-id]");
  if (skillButton && !skillButton.disabled) location.hash = `skills/${skillButton.dataset.skillId}`;

  if (event.target.closest("[data-back-skills]")) location.hash = "skills";
});

elements.themeButton.addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

window.addEventListener("hashchange", route);

(async () => {
  const preferredTheme = localStorage.getItem("quant-career-theme")
    || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  setTheme(preferredTheme);
  try {
    state.profile = await loadJSON("data/profile.json");
    renderOverview();
    route();
  } catch (error) {
    console.error(error);
    elements.overviewLoading.hidden = true;
    elements.errorState.hidden = false;
  }
})();
