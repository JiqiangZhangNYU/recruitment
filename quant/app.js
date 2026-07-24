const state = {
  profile: null,
  directions: null,
  skills: null,
  compensation: null,
  institutions: null,
  jobs: null,
  jobSkills: null,
  actionPlan: null,
  searchAudit: null,
  interviewPrep: null,
  applicationKit: null,
  evidenceTemplates: {},
  activeView: "overview",
  directionFilter: "all",
  jobFilter: "strict-watch",
  bonusTaxMode: "separate",
  interviewRoleId: "tianyan-senior-quant-researcher",
};

const viewMetadata = {
  overview: {
    eyebrow: "费后实盘 · 2024.03 至今",
    title: "商品期货量化研究员",
  },
  directions: {
    eyebrow: "职业方向 · 已接入核验岗位样本",
    title: "目标岗位方向",
    subtitle: "以商品截面研究为主定价，按证据要求区分直接匹配、进阶目标与迁移方向。",
  },
  skills: {
    eyebrow: "去重能力框架 · 证据优先",
    title: "九项能力地图",
    subtitle: "P0 决定高级研究员与策略负责人定价，P1 用于形成差异化与扩大机会集。",
  },
  compensation: {
    eyebrow: "上海税务口径 · 可复算估算",
    title: "薪酬换算与谈判门槛",
    subtitle: "固定税前保证收入和良好年份税后现金是两条独立条件；未披露固定薪酬的岗位必须人工核验。",
  },
  jobs: {
    eyebrow: "真实岗位样本 · 三道硬门槛",
    title: "上海量化岗位雷达",
    subtitle: "机构规模有官方证据，职位状态有核验日期；薪酬未公开时只进入待沟通池，不推断达标。",
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
  compensationLoading: document.querySelector("#compensation-loading"),
  compensationContent: document.querySelector("#compensation-content"),
  jobsLoading: document.querySelector("#jobs-loading"),
  jobsContent: document.querySelector("#jobs-content"),
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

function formatWan(value, digits = 2) {
  return `${(Number(value) / 10_000).toFixed(digits)} 万`;
}

function formatPercent(value) {
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function jobFreshness(checkedAt, status) {
  if (status !== "active") return { state: "historical", label: "历史参照" };
  const checked = new Date(`${checkedAt}T00:00:00+08:00`);
  const days = Math.max(0, Math.floor((Date.now() - checked.getTime()) / 86_400_000));
  if (days === 0) return { state: "fresh", label: "今日核验" };
  if (days <= 7) return { state: "fresh", label: `${days} 天前核验` };
  if (days <= 14) return { state: "review", label: `${days} 天前 · 即将复核` };
  return { state: "stale", label: `${days} 天前 · 待复核` };
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

    <section class="mandate-band section-band" aria-labelledby="mandate-title">
      <header class="section-heading compact-heading">
        <p class="section-index">03 / ROLE SEARCH MANDATE</p>
        <h2 id="mandate-title">换岗硬边界</h2>
      </header>
      <p class="mandate-summary">${escapeHTML(profile.careerMandate.summary)}</p>
      <div class="mandate-grid">
        ${profile.careerMandate.criteria.map((criterion) => `
          <article data-level="${escapeHTML(criterion.level)}">
            <div><span>${escapeHTML(criterion.label)}</span><small>${escapeHTML(criterion.level)}</small></div>
            <strong>${escapeHTML(criterion.value)}</strong>
            <p>${escapeHTML(criterion.note)}</p>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="research-chain section-band" aria-labelledby="research-chain-title">
      <header class="section-heading compact-heading">
        <p class="section-index">04 / RESEARCH EVIDENCE CHAIN</p>
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
        <p class="section-index">05 / RESPONSIBILITY BOUNDARY</p>
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
          <p class="section-index">06 / CONFIRMED</p>
          <h2>已确认事实</h2>
        </header>
        ${list(profile.confirmedFacts, "evidence-list")}
      </div>
      <div class="evidence-column questions-column">
        <header class="section-heading compact-heading">
          <p class="section-index">07 / TO VERIFY</p>
          <h2>决定岗位定价的问题</h2>
        </header>
        ${list(profile.evidenceQuestions, "question-list")}
      </div>
    </section>

    <section class="next-evidence section-band">
      <header class="section-heading compact-heading">
        <p class="section-index">08 / NEXT EVIDENCE</p>
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

function bracketForIncome(brackets, taxableIncome) {
  return brackets.find((bracket) => bracket.upper === null || taxableIncome <= bracket.upper);
}

function calculateSalary(gross, dataset) {
  const assumptions = dataset.assumptions;
  const contributionBase = Math.min(gross, assumptions.monthlyContributionCap * 12);
  const social = contributionBase * assumptions.employeeSocialRate;
  const housingFund = contributionBase * assumptions.employeeHousingFundRate;
  const taxableIncome = Math.max(0, gross
    - assumptions.annualBasicDeduction
    - social
    - housingFund
    - assumptions.specialAdditionalDeductions);
  const bracket = bracketForIncome(dataset.taxBrackets, taxableIncome);
  const tax = Math.max(0, taxableIncome * bracket.rate - bracket.quickDeduction);
  return {
    social,
    housingFund,
    taxableIncome,
    tax,
    cash: gross - social - housingFund - tax,
  };
}

function calculateSeparateBonusTax(bonus) {
  const monthly = bonus / 12;
  const brackets = [
    [3_000, 0.03, 0],
    [12_000, 0.10, 210],
    [25_000, 0.20, 1_410],
    [35_000, 0.25, 2_660],
    [55_000, 0.30, 4_410],
    [80_000, 0.35, 7_160],
    [Infinity, 0.45, 15_160],
  ];
  const bracket = brackets.find(([upper]) => monthly <= upper);
  return Math.max(0, bonus * bracket[1] - bracket[2]);
}

function compensationInputs() {
  const baseInput = document.querySelector("#guaranteed-income");
  const bonusInput = document.querySelector("#performance-bonus");
  return {
    base: Math.max(0, Number(baseInput?.value || 0) * 10_000),
    bonus: Math.max(0, Number(bonusInput?.value || 0) * 10_000),
  };
}

function updateCompensationResults() {
  if (!state.compensation) return;
  const { base, bonus } = compensationInputs();
  const dataset = state.compensation;
  let baseResult;
  let bonusTax;
  let totalCash;
  if (state.bonusTaxMode === "separate") {
    baseResult = calculateSalary(base, dataset);
    bonusTax = calculateSeparateBonusTax(bonus);
    totalCash = baseResult.cash + bonus - bonusTax;
  } else {
    baseResult = calculateSalary(base + bonus, dataset);
    const salaryOnly = calculateSalary(base, dataset);
    bonusTax = baseResult.tax - salaryOnly.tax;
    totalCash = baseResult.cash;
  }
  const guaranteePass = base >= dataset.objective.guaranteedGrossMinimum;
  const cashPass = totalCash > dataset.objective.successfulYearCashMinimum;
  const values = {
    "result-base-cash": formatWan(calculateSalary(base, dataset).cash),
    "result-bonus-tax": formatWan(bonusTax),
    "result-total-cash": formatWan(totalCash),
    "result-total-gross": formatWan(base + bonus),
  };
  Object.entries(values).forEach(([id, value]) => {
    const element = document.querySelector(`#${id}`);
    if (element) element.textContent = value;
  });
  const guaranteeStatus = document.querySelector("#guarantee-status");
  const cashStatus = document.querySelector("#cash-status");
  if (guaranteeStatus) {
    guaranteeStatus.dataset.pass = String(guaranteePass);
    guaranteeStatus.textContent = guaranteePass ? "达标" : `还差 ${formatWan(dataset.objective.guaranteedGrossMinimum - base)}`;
  }
  if (cashStatus) {
    cashStatus.dataset.pass = String(cashPass);
    cashStatus.textContent = cashPass ? "超过当前基线" : `还差 ${formatWan(dataset.objective.successfulYearCashMinimum - totalCash)}`;
  }
  document.querySelectorAll("[data-bonus-tax-mode]").forEach((button) => {
    const active = button.dataset.bonusTaxMode === state.bonusTaxMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderCompensation() {
  const dataset = state.compensation;
  const base = dataset.scenarios.guaranteedBase;
  const merged = dataset.scenarios.allComprehensiveIncome;
  const separate = dataset.scenarios.separateAnnualBonus;
  elements.compensationContent.innerHTML = `
    <section class="view-intro compensation-intro">
      <div>
        <p class="section-index">COMPENSATION GATE</p>
        <h2 id="compensation-title">两条条件，分别核验</h2>
      </div>
      <p>${escapeHTML(dataset.objective.interpretation)}</p>
    </section>
    <section class="compensation-summary" aria-label="薪酬门槛摘要">
      <article>
        <span>固定税前保证</span>
        <strong>≥ ${formatWan(dataset.objective.guaranteedGrossMinimum, 0)}</strong>
        <small>不能由不确定奖金补足</small>
      </article>
      <article>
        <span>100 万固定收入现金到手</span>
        <strong>约 ${formatWan(base.cashTakeHome)}</strong>
        <small>7% 公积金、无专项附加扣除</small>
      </article>
      <article>
        <span>单独计税奖金门槛</span>
        <strong>约 ${formatWan(separate.conservativeScreeningBonus)}</strong>
        <small>总税前约 ${formatWan(separate.conservativeScreeningTotalGross)}</small>
      </article>
      <article>
        <span>并入综合所得奖金门槛</span>
        <strong>约 ${formatWan(merged.conservativeScreeningBonus)}</strong>
        <small>总税前约 ${formatWan(merged.conservativeScreeningTotalGross)}</small>
      </article>
    </section>
    <section class="calculator-band section-band" aria-labelledby="calculator-title">
      <header class="section-heading compact-heading">
        <p class="section-index">OFFER CALCULATOR</p>
        <h2 id="calculator-title">录用条件换算器</h2>
      </header>
      <div class="calculator-layout">
        <form class="calculator-controls" onsubmit="return false">
          <label for="guaranteed-income">
            <span>固定税前保证收入</span>
            <span class="money-input"><input id="guaranteed-income" type="number" min="0" step="1" value="100" inputmode="decimal"><small>万元 / 年</small></span>
          </label>
          <label for="performance-bonus">
            <span>绩效良好时税前奖金</span>
            <span class="money-input"><input id="performance-bonus" type="number" min="0" step="1" value="10.5" inputmode="decimal"><small>万元 / 年</small></span>
          </label>
          <fieldset>
            <legend>奖金计税情景</legend>
            <div class="segment-control compact-segments" role="group">
              <button type="button" class="active" data-bonus-tax-mode="separate" aria-pressed="true">全年一次性奖金单独计税</button>
              <button type="button" data-bonus-tax-mode="merged" aria-pressed="false">并入综合所得</button>
            </div>
          </fieldset>
          <p>${escapeHTML(dataset.status)}</p>
        </form>
        <div class="calculator-results" aria-live="polite">
          <div><span>固定收入现金到手</span><strong id="result-base-cash"></strong></div>
          <div><span>奖金对应税额</span><strong id="result-bonus-tax"></strong></div>
          <div><span>全年税前总额</span><strong id="result-total-gross"></strong></div>
          <div class="primary-result"><span>全年工资现金到手</span><strong id="result-total-cash"></strong></div>
          <div class="gate-result"><span>固定保证条件</span><strong id="guarantee-status"></strong></div>
          <div class="gate-result"><span>税后现金条件</span><strong id="cash-status"></strong></div>
        </div>
      </div>
    </section>
    <section class="offer-examples section-band" aria-labelledby="offer-examples-title">
      <header class="section-heading compact-heading">
        <p class="section-index">OFFER STRUCTURE EXAMPLES</p>
        <h2 id="offer-examples-title">总包相近，结论可能相反</h2>
      </header>
      <div class="offer-example-table" role="table" aria-label="录用条件拆分示例">
        <div class="offer-example-row offer-example-head" role="row">
          <span role="columnheader">报价拆分</span><span role="columnheader">税前总额</span><span role="columnheader">现金到手</span><span role="columnheader">固定保证</span><span role="columnheader">税后现金</span>
        </div>
        ${dataset.offerExamples.map((example) => `
          <article class="offer-example-row" role="row" data-example="${escapeHTML(example.id)}">
            <div role="cell"><strong>${escapeHTML(example.label)}</strong><small>${escapeHTML(example.note)}</small></div>
            <span role="cell">${formatWan(example.totalGross)}</span>
            <span role="cell">${formatWan(example.estimatedCash)}</span>
            <em role="cell" data-pass="${example.guaranteePass}">${example.guaranteePass ? "通过" : "不通过"}</em>
            <em role="cell" data-pass="${example.cashPass}">${example.cashPass ? "通过" : "不通过"}</em>
          </article>
        `).join("")}
      </div>
    </section>
    <section class="assumption-band section-band" aria-labelledby="assumption-title">
      <header class="section-heading compact-heading">
        <p class="section-index">ASSUMPTIONS & SOURCES</p>
        <h2 id="assumption-title">计算口径与官方来源</h2>
      </header>
      <div class="assumption-grid">
        <dl>
          <div><dt>上海月缴费基数上限</dt><dd>${Number(dataset.assumptions.monthlyContributionCap).toLocaleString("zh-CN")} 元</dd></div>
          <div><dt>2026 参数状态</dt><dd>${escapeHTML(dataset.assumptions.contributionCapCaveat)}</dd></div>
          <div><dt>个人社保比例</dt><dd>${formatPercent(dataset.assumptions.employeeSocialRate)}</dd></div>
          <div><dt>个人公积金比例</dt><dd>${formatPercent(dataset.assumptions.employeeHousingFundRate)} 情景</dd></div>
          <div><dt>专项附加扣除</dt><dd>未计入</dd></div>
          <div><dt>现金到手定义</dt><dd>${escapeHTML(dataset.assumptions.cashDefinition)}</dd></div>
        </dl>
        <ol class="source-list">
          ${dataset.sources.map((source) => `
            <li>
              <a href="${escapeHTML(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(source.label)}</a>
              <span>${escapeHTML(source.publisher)} · ${escapeHTML(source.supports)}</span>
            </li>
          `).join("")}
        </ol>
      </div>
    </section>
  `;
  elements.compensationLoading.hidden = true;
  elements.compensationContent.hidden = false;
  updateCompensationResults();
}

function institutionById(id) {
  return state.institutions.institutions.find((institution) => institution.id === id);
}

function gateLabel(status) {
  return {
    pass: "已通过",
    verify: "待核验",
    unknown: "未知",
    fail: "不符合",
    "not-applicable": "不适用",
  }[status] || status;
}

function renderGate(label, status) {
  return `<span class="job-gate" data-status="${escapeHTML(status)}"><small>${escapeHTML(label)}</small><strong>${escapeHTML(gateLabel(status))}</strong></span>`;
}

function jobFilterOptions() {
  return [
    { id: "strict-watch", label: "重点待核" },
    { id: "adjacent", label: "相邻岗位" },
    { id: "secondary", label: "公募 / 券商" },
    { id: "boundary", label: "边界线索" },
    { id: "historical", label: "历史参照" },
    { id: "institutions", label: "机构库" },
    { id: "actions", label: "行动清单" },
    { id: "interview", label: "面试题库" },
    { id: "materials", label: "求职材料" },
    { id: "audit", label: "检索审计" },
  ];
}

function renderSearchAudit() {
  const audit = state.searchAudit;
  if (!audit) {
    return `<div class="audit-loading" role="status"><span></span><strong>正在载入检索审计</strong></div>`;
  }
  return `
    <div class="search-audit">
      <p class="audit-scope">${escapeHTML(audit.scope)}</p>
      <section class="audit-summary" aria-label="检索覆盖摘要">
        ${audit.summary.map((item) => `<article><span>${escapeHTML(item.label)}</span><strong>${escapeHTML(item.value)}</strong><small>${escapeHTML(item.note)}</small></article>`).join("")}
      </section>
      <section class="audit-section section-band" aria-labelledby="audit-source-title">
        <header class="section-heading compact-heading"><p class="section-index">SOURCE HIERARCHY</p><h3 id="audit-source-title">证据来源层级</h3></header>
        <div class="source-hierarchy">
          ${audit.sourceHierarchy.map((source) => `
            <article><span>${String(source.rank).padStart(2, "0")}</span><div><h4>${escapeHTML(source.label)}</h4><p>${escapeHTML(source.use)}</p></div><small>${escapeHTML(source.rule)}</small></article>
          `).join("")}
        </div>
      </section>
      <section class="audit-section section-band" aria-labelledby="audit-access-title">
        <header class="section-heading compact-heading"><p class="section-index">ACCESS BOUNDARIES</p><h3 id="audit-access-title">访问方式与边界</h3></header>
        <div class="access-channel-grid">
          ${audit.accessChannels.map((channel) => `
            <article><div><h4>${escapeHTML(channel.label)}</h4><span>${escapeHTML(channel.mode)}</span></div><p>${escapeHTML(channel.result)}</p><small>${escapeHTML(channel.next)}</small></article>
          `).join("")}
        </div>
      </section>
      <section class="audit-section section-band" aria-labelledby="audit-screened-title">
        <header class="section-heading compact-heading"><p class="section-index">SCREENED OUT / WATCHLIST</p><h3 id="audit-screened-title">没有进入推荐池的线索</h3></header>
        <div class="screened-candidate-list">
          ${audit.screenedCandidates.map((candidate) => `
            <details class="screened-candidate">
              <summary><div><strong>${escapeHTML(candidate.name)}</strong><small>${escapeHTML(candidate.signal)}</small></div><em>${escapeHTML(candidate.status)}</em></summary>
              <div><p>${escapeHTML(candidate.decision)}</p><nav>${candidate.sources.map((source) => `<a href="${escapeHTML(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(source.label)}</a>`).join("")}</nav></div>
            </details>
          `).join("")}
        </div>
      </section>
      <section class="audit-section section-band audit-followup" aria-labelledby="audit-followup-title">
        <header class="section-heading compact-heading"><p class="section-index">GAPS & NEXT REVIEW</p><h3 id="audit-followup-title">覆盖缺口与复核计划</h3></header>
        <div><section><span>仍缺什么</span>${list(audit.coverageGaps, "question-list")}</section><section><span>下一轮</span><ol>${audit.nextReview.map((item) => `<li><strong>${escapeHTML(item.date)}</strong><p>${escapeHTML(item.task)}</p></li>`).join("")}</ol></section></div>
      </section>
    </div>
  `;
}

function renderInterviewPrep() {
  const prep = state.interviewPrep;
  if (!prep) {
    return `<div class="audit-loading" role="status"><span></span><strong>正在载入岗位面试题库</strong></div>`;
  }
  const activeRole = prep.roles.find((role) => role.jobId === state.interviewRoleId) || prep.roles[0];
  return `
    <div class="interview-prep">
      <p class="interview-methodology">${escapeHTML(prep.methodology)}</p>
      <section class="answer-rules" aria-labelledby="answer-rules-title">
        <header><p class="section-index">ANSWER GUARDRAILS</p><h3 id="answer-rules-title">所有岗位共用的回答边界</h3></header>
        ${list(prep.answerRules, "evidence-list")}
      </section>
      <nav class="interview-role-tabs" aria-label="岗位题库">
        ${prep.roles.map((role) => `<button type="button" data-interview-role="${escapeHTML(role.jobId)}" class="${role.jobId === activeRole.jobId ? "active" : ""}" aria-pressed="${role.jobId === activeRole.jobId}">${escapeHTML(role.label)}</button>`).join("")}
      </nav>
      <section class="interview-role-header">
        <div><p class="section-index">ROLE-SPECIFIC DRILL · ${activeRole.questions.length} QUESTIONS</p><h3>${escapeHTML(activeRole.label)}</h3></div>
        <p>${escapeHTML(activeRole.fitThesis)}</p>
      </section>
      <section class="interview-opening" aria-labelledby="interview-opening-title">
        <span id="interview-opening-title">90 秒开场</span>
        <blockquote>${escapeHTML(activeRole.opening)}</blockquote>
      </section>
      <section class="interview-question-list" aria-label="岗位定制问题">
        ${activeRole.questions.map((question, index) => `
          <details class="interview-question">
            <summary>
              <span>${String(index + 1).padStart(2, "0")}</span>
              <div><small>${escapeHTML(question.category)} · ${escapeHTML(question.difficulty)}</small><strong>${escapeHTML(question.prompt)}</strong><p>${escapeHTML(question.whyAsked)}</p></div>
              <em>查看回答框架</em>
            </summary>
            <div class="interview-answer">
              <section><span>回答顺序</span><ol>${question.answerFramework.map((step) => `<li>${escapeHTML(step)}</li>`).join("")}</ol></section>
              <section class="answer-evidence"><span>带去的证据</span><p>${escapeHTML(question.evidence)}</p></section>
              <section class="answer-avoid"><span>不能这样答</span><p>${escapeHTML(question.avoid)}</p></section>
            </div>
          </details>
        `).join("")}
      </section>
    </div>
  `;
}

function renderApplicationKit() {
  const kit = state.applicationKit;
  if (!kit) {
    return `<div class="audit-loading" role="status"><span></span><strong>正在载入求职材料</strong></div>`;
  }
  return `
    <div class="application-kit">
      <p class="kit-principle">${escapeHTML(kit.principle)}</p>
      <section class="kit-section section-band" aria-labelledby="kit-profile-title">
        <header class="section-heading compact-heading"><p class="section-index">POSITIONING SCRIPTS</p><h3 id="kit-profile-title">中英文职业定位</h3></header>
        <div class="profile-script-list">
          ${kit.profiles.map((profile, index) => `
            <details ${index === 0 ? "open" : ""}><summary><strong>${escapeHTML(profile.label)}</strong><span>${index === 0 ? "默认展开" : "点击查看"}</span></summary><blockquote>${escapeHTML(profile.text)}</blockquote></details>
          `).join("")}
        </div>
      </section>
      <section class="kit-section section-band" aria-labelledby="kit-resume-title">
        <header class="section-heading compact-heading"><p class="section-index">BILINGUAL RESUME BULLETS</p><h3 id="kit-resume-title">六条可核验简历要点</h3></header>
        <div class="resume-bullet-list">
          ${kit.resumeBullets.map((bullet, index) => `
            <article><span>${String(index + 1).padStart(2, "0")}</span><div><small>${escapeHTML(bullet.theme)}</small><p>${escapeHTML(bullet.zh)}</p><p lang="en">${escapeHTML(bullet.en)}</p><em>${escapeHTML(bullet.proof)}</em></div></article>
          `).join("")}
        </div>
      </section>
      <section class="kit-section section-band" aria-labelledby="kit-outreach-title">
        <header class="section-heading compact-heading"><p class="section-index">RECRUITER OUTREACH</p><h3 id="kit-outreach-title">三类首轮沟通模板</h3></header>
        <div class="outreach-list">
          ${kit.outreach.map((item) => `
            <details><summary><div><strong>${escapeHTML(item.label)}</strong><small>${escapeHTML(item.subject)}</small></div><span>查看模板</span></summary><p>${escapeHTML(item.message)}</p></details>
          `).join("")}
        </div>
      </section>
      <section class="kit-section section-band" aria-labelledby="kit-keyword-title">
        <header class="section-heading compact-heading"><p class="section-index">KEYWORD MAPPING</p><h3 id="kit-keyword-title">按岗位取舍关键词</h3></header>
        <div class="keyword-map">
          ${kit.keywordMap.map((group) => `
            <article><h4>${escapeHTML(group.target)}</h4><div><span>可使用</span>${list(group.use, "compact-boundary-list")}</div><div class="keyword-avoid"><span>不可声称</span>${list(group.doNotClaim, "compact-boundary-list")}</div></article>
          `).join("")}
        </div>
      </section>
      <section class="kit-section section-band" aria-labelledby="kit-check-title">
        <header class="section-heading compact-heading"><p class="section-index">APPLICATION CHECKLIST</p><h3 id="kit-check-title">四阶段事实检查</h3></header>
        <div class="application-checklist">
          ${kit.checklist.map((stage, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><h4>${escapeHTML(stage.stage)}</h4>${list(stage.items, "evidence-list")}</article>`).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderActionPlan() {
  const plan = state.actionPlan;
  if (!plan) {
    return `<div class="audit-loading" role="status"><span></span><strong>正在载入行动清单</strong></div>`;
  }
  return `
    <div class="action-plan">
      <p class="action-principle">${escapeHTML(plan.principle)}</p>
      <section class="application-queue" aria-labelledby="application-queue-title">
        <header>
          <p class="section-index">PRIORITY QUEUE</p>
          <h3 id="application-queue-title">五条优先沟通路径</h3>
        </header>
        ${plan.queue.map((item) => {
          const job = state.jobs.jobs.find((candidate) => candidate.id === item.jobId);
          const institution = institutionById(job.institutionId);
          return `
            <details class="application-row" ${item.rank === 1 ? "open" : ""}>
              <summary>
                <span>${String(item.rank).padStart(2, "0")}</span>
                <div><strong>${escapeHTML(institution.name)} · ${escapeHTML(job.title)}</strong><small>${escapeHTML(item.why)}</small></div>
                <em>${escapeHTML(item.stage)}</em>
              </summary>
              <div class="application-detail">
                <p class="application-positioning"><span>沟通定位</span>${escapeHTML(item.positioning)}</p>
                <section><span>带去的证据</span>${list(item.proof, "compact-boundary-list")}</section>
                <section><span>首轮必问</span>${list(item.questions, "question-list")}</section>
                <p class="stop-rule"><strong>停止条件</strong>${escapeHTML(item.stopRule)}</p>
              </div>
            </details>
          `;
        }).join("")}
      </section>
      <section class="decision-rights section-band" aria-labelledby="decision-rights-title">
        <header class="section-heading compact-heading">
          <p class="section-index">DECISION RIGHTS</p>
          <h3 id="decision-rights-title">${escapeHTML(plan.decisionRights.title)}</h3>
        </header>
        <p class="decision-rights-note">${escapeHTML(plan.decisionRights.note)}</p>
        <div class="decision-rights-list">
          ${plan.decisionRights.items.map((item) => `
            <details class="decision-right-row">
              <summary>
                <strong>${escapeHTML(item.area)}</strong>
                <span>${escapeHTML(item.current)}</span>
                <em data-decision-status="${escapeHTML(item.status)}">${escapeHTML(item.status)}</em>
              </summary>
              <div>
                <p><span>目标权责</span>${escapeHTML(item.target)}</p>
                <p><span>必须问</span>${escapeHTML(item.mustAsk)}</p>
                <p class="decision-reject"><span>拒绝条件</span>${escapeHTML(item.rejectIf)}</p>
              </div>
            </details>
          `).join("")}
        </div>
      </section>
      <section class="negotiation-script section-band" aria-labelledby="negotiation-title">
        <header class="section-heading compact-heading">
          <p class="section-index">COMPENSATION VERIFICATION</p>
          <h3 id="negotiation-title">薪酬核验话术</h3>
        </header>
        <blockquote>${escapeHTML(plan.compensationScript.opening)}</blockquote>
        <div class="negotiation-grid">
          <section><span>必须问清</span>${list(plan.compensationScript.minimumQuestions, "evidence-list")}</section>
          <section><span>高风险信号</span>${list(plan.compensationScript.redFlags, "question-list")}</section>
        </div>
      </section>
      <section class="evidence-pack section-band" aria-labelledby="evidence-pack-title">
        <header class="section-heading compact-heading">
          <p class="section-index">INTERVIEW EVIDENCE PACK</p>
          <h3 id="evidence-pack-title">四份脱敏证据</h3>
        </header>
        <div class="evidence-pack-list">
          ${plan.evidencePack.map((item, index) => `
            <article>
              <span>${String(index + 1).padStart(2, "0")}</span>
              <div><h4>${escapeHTML(item.title)}</h4><p>${escapeHTML(item.purpose)}</p></div>
              <div class="evidence-pack-actions">
                ${list(item.contents, "compact-boundary-list")}
                <button type="button" data-evidence-template="${escapeHTML(item.id)}">打开填写模板</button>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
      <section id="evidence-template-view" class="evidence-template-view" hidden></section>
    </div>
  `;
}

function renderEvidenceTemplate(template) {
  const panel = document.querySelector("#evidence-template-view");
  if (!panel) return;
  panel.innerHTML = `
    <nav class="breadcrumb evidence-template-nav" aria-label="证据模板导航">
      <button type="button" data-close-evidence-template><span aria-hidden="true">←</span> 四份证据</button>
      <span>${escapeHTML(template.status)}</span>
    </nav>
    <header class="evidence-template-header">
      <p class="section-index">LAZY-LOADED EVIDENCE TEMPLATE</p>
      <h3>${escapeHTML(template.title)}</h3>
      <p>${escapeHTML(template.subtitle)}</p>
    </header>
    <div class="evidence-template-sections">
      ${template.sections.map((section, index) => `
        <article>
          <span>${String(index + 1).padStart(2, "0")}</span>
          <div class="template-section-intro"><h4>${escapeHTML(section.title)}</h4><p>${escapeHTML(section.purpose)}</p></div>
          ${list(section.fields, "template-field-list")}
          <blockquote>${escapeHTML(section.example)}</blockquote>
        </article>
      `).join("")}
    </div>
    <div class="template-checks">
      <section><span>保密边界</span>${list(template.guardrails, "question-list")}</section>
      <section><span>完成标准</span>${list(template.acceptanceCriteria, "evidence-list")}</section>
    </div>
  `;
  panel.hidden = false;
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function ensureEvidenceTemplate(templateId) {
  const known = state.actionPlan.evidencePack.some((item) => item.id === templateId);
  if (!known) return;
  if (!state.evidenceTemplates[templateId]) {
    state.evidenceTemplates[templateId] = await loadJSON(`data/evidence/${templateId}.json`);
  }
  renderEvidenceTemplate(state.evidenceTemplates[templateId]);
}

function renderInstitutionDirectory() {
  return `
    <section class="institution-list" aria-label="已核验机构">
      ${state.institutions.institutions.map((institution) => `
        <article class="institution-row">
          <div class="institution-name">
            <span>${escapeHTML(institution.priority)}关注</span>
            <h3>${escapeHTML(institution.name)}</h3>
            <p>${escapeHTML(institution.legalName)}</p>
          </div>
          <dl class="institution-facts">
            <div><dt>机构类型</dt><dd>${escapeHTML(institution.type)}</dd></div>
            <div><dt>管理规模</dt><dd>${escapeHTML(institution.scale.band)} · ${escapeHTML(institution.scale.asOf)}</dd></div>
            <div><dt>上海证据</dt><dd>${escapeHTML(institution.shanghai.evidence)}</dd></div>
          </dl>
          <div class="institution-access">
            <span data-mode="${escapeHTML(institution.accessPolicy.mode)}">${escapeHTML(institution.accessPolicy.mode)}</span>
            <p>${escapeHTML(institution.accessPolicy.reason)}</p>
            <div>${institution.sources.map((source) => `<a href="${escapeHTML(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(source.label)}</a>`).join("")}</div>
          </div>
        </article>
      `).join("")}
    </section>
  `;
}

function renderJobCards(jobs) {
  if (!jobs.length) return `<p class="empty-results">当前筛选下没有岗位。</p>`;
  return `
    <section class="job-list" aria-live="polite">
      ${jobs.map((job) => {
        const institution = job.institutionId ? institutionById(job.institutionId) : null;
        const freshness = jobFreshness(job.checkedAt, job.status);
        return `
          <article class="job-card">
            <div class="job-fit">
              <strong>${escapeHTML(job.fit.tier)}</strong>
              <span>${escapeHTML(String(job.fit.score))}</span>
              <small>匹配分</small>
            </div>
            <div class="job-body">
              <header class="job-header">
                <div>
                  <span class="job-institution">${escapeHTML(institution?.name || job.institutionName || "匿名客户")}</span>
                  <h3>${escapeHTML(job.title)}</h3>
                  <p>${escapeHTML(job.location)} · ${escapeHTML(job.employment)} · <span class="job-freshness" data-freshness="${escapeHTML(freshness.state)}">${escapeHTML(freshness.label)}</span></p>
                </div>
                <a href="${escapeHTML(job.source.url)}" target="_blank" rel="noopener noreferrer">查看原职位</a>
              </header>
              <div class="job-gates" aria-label="岗位硬条件">
                ${renderGate("上海", job.eligibility.location)}
                ${renderGate("百亿机构", job.eligibility.institutionScale)}
                ${renderGate("薪酬", job.eligibility.compensation)}
                ${renderGate("职级", job.eligibility.seniority)}
              </div>
              <p class="job-verdict">${escapeHTML(job.fit.verdict)}</p>
              <div class="job-tags">${job.skillTags.map((tag) => `<code>${escapeHTML(tag)}</code>`).join("")}</div>
              <details class="job-details">
                <summary>职责、要求与核验提醒</summary>
                <div class="job-detail-grid">
                  <section><span>核心职责</span>${list(job.responsibilities, "compact-boundary-list")}</section>
                  <section><span>主要要求</span>${list(job.requirements, "compact-boundary-list")}</section>
                </div>
                <p><strong>薪酬：</strong>${escapeHTML(job.compensation.note)}</p>
              </details>
            </div>
          </article>
        `;
      }).join("")}
    </section>
  `;
}

function renderJobSkills() {
  const sample = state.jobSkills.sample;
  return `
    <section class="market-skills section-band" aria-labelledby="market-skills-title">
      <header class="section-heading compact-heading market-skills-heading">
        <div>
          <p class="section-index">VERIFIED SAMPLE · N=${sample.size}</p>
          <h2 id="market-skills-title">岗位样本共同技能</h2>
        </div>
        <p>${escapeHTML(sample.warning)}</p>
      </header>
      <div class="market-skill-list">
        ${state.jobSkills.skills.map((skill) => `
          <details class="market-skill-row">
            <summary>
              <span class="skill-frequency"><i style="--frequency: ${skill.count / sample.size}"></i></span>
              <strong>${escapeHTML(skill.label)}</strong>
              <span>${skill.count} / ${sample.size}</span>
              <small>${escapeHTML(skill.priority)} · ${escapeHTML(skill.basis)}</small>
            </summary>
            <div>
              <p>${escapeHTML(skill.interpretation)}</p>
              <p><strong>个人现状 · ${escapeHTML(skill.candidateState)}：</strong>${escapeHTML(skill.candidateEvidence)}</p>
              <p><strong>当前缺口：</strong>${escapeHTML(skill.gap)}</p>
              <p><strong>要准备的证据：</strong>${escapeHTML(skill.evidenceToPrepare)}</p>
            </div>
          </details>
        `).join("")}
      </div>
      <p class="sample-rule">${escapeHTML(sample.rule)}</p>
    </section>
  `;
}

function renderJobs() {
  const filters = jobFilterOptions();
  const queueRanks = new Map((state.actionPlan?.queue || []).map((item) => [item.jobId, item.rank]));
  const jobs = state.jobs.jobs
    .filter((job) => job.pool === state.jobFilter)
    .sort((left, right) => (
      (queueRanks.get(left.id) || 99) - (queueRanks.get(right.id) || 99)
      || right.fit.score - left.fit.score
    ));
  const activeJobs = state.jobs.jobs.filter((job) => job.status === "active");
  const strictCount = state.jobs.jobs.filter((job) => job.pool === "strict-watch").length;
  const compensationKnown = activeJobs.filter((job) => job.eligibility.compensation === "pass").length;
  const compensationFailed = activeJobs.filter((job) => job.eligibility.compensation === "fail").length;
  elements.jobsContent.innerHTML = `
    <section class="view-intro jobs-intro">
      <div>
        <p class="section-index">JOB RADAR · ${escapeHTML(state.jobs.updatedAt)}</p>
        <h2 id="jobs-title">先核验，再判断匹配</h2>
      </div>
      <p>${escapeHTML(state.jobs.methodology.scope)} ${escapeHTML(state.jobs.methodology.compensation)}</p>
    </section>
    <section class="radar-summary" aria-label="岗位雷达摘要">
      <div><span>百亿机构</span><strong>${state.institutions.institutions.filter((item) => item.scale.status === "pass").length}</strong><small>均有协会规模证据</small></div>
      <div><span>当前职位</span><strong>${activeJobs.length}</strong><small>含相邻和边界线索</small></div>
      <div><span>重点待核</span><strong>${strictCount}</strong><small>地点、规模已过闸</small></div>
      <div><span>薪酬已达标</span><strong>${compensationKnown}</strong><small>${compensationFailed} 条明确淘汰，其余不推断</small></div>
    </section>
    ${renderJobSkills()}
    <section class="radar-results section-band" aria-labelledby="radar-results-title">
      <header class="section-heading compact-heading radar-results-header">
        <div>
          <p class="section-index">SCREENED OPPORTUNITIES</p>
          <h2 id="radar-results-title">岗位与机构证据</h2>
        </div>
        <span>薪酬 0 条已通过，面试前必须先问固定现金</span>
      </header>
      <div class="segment-control job-filter" role="group" aria-label="岗位池筛选">
        ${filters.map((filter) => `
          <button type="button" data-job-filter="${escapeHTML(filter.id)}" class="${filter.id === state.jobFilter ? "active" : ""}">${escapeHTML(filter.label)}</button>
        `).join("")}
      </div>
      ${state.jobFilter === "institutions"
        ? renderInstitutionDirectory()
        : state.jobFilter === "actions"
          ? renderActionPlan()
          : state.jobFilter === "interview"
            ? renderInterviewPrep()
          : state.jobFilter === "materials"
            ? renderApplicationKit()
          : state.jobFilter === "audit"
            ? renderSearchAudit()
          : renderJobCards(jobs)}
    </section>
    <p class="radar-methodology">${escapeHTML(state.institutions.methodology)} ${escapeHTML(state.jobs.methodology.freshness)}</p>
  `;
  elements.jobsLoading.hidden = true;
  elements.jobsContent.hidden = false;
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

async function ensureCompensation() {
  if (!state.compensation) state.compensation = await loadJSON("data/compensation.json");
  renderCompensation();
}

async function ensureJobs() {
  if (!state.institutions || !state.jobs || !state.jobSkills) {
    [state.institutions, state.jobs, state.jobSkills] = await Promise.all([
      loadJSON("data/institutions.json"),
      loadJSON("data/jobs.json"),
      loadJSON("data/job-skills.json"),
    ]);
  }
  renderJobs();
}

async function showView(view, detailId = "") {
  const safeView = ["overview", "directions", "skills", "compensation", "jobs"].includes(view) ? view : "overview";
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
    if (safeView === "compensation") await ensureCompensation();
    if (safeView === "jobs") await ensureJobs();
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

document.addEventListener("click", async (event) => {
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

  const taxModeButton = event.target.closest("[data-bonus-tax-mode]");
  if (taxModeButton) {
    state.bonusTaxMode = taxModeButton.dataset.bonusTaxMode;
    updateCompensationResults();
  }

  const jobFilterButton = event.target.closest("[data-job-filter]");
  if (jobFilterButton) {
    state.jobFilter = jobFilterButton.dataset.jobFilter;
    renderJobs();
    if (state.jobFilter === "audit" && !state.searchAudit) {
      try {
        state.searchAudit = await loadJSON("data/search-audit.json");
        renderJobs();
      } catch (error) {
        console.error(error);
        elements.errorState.hidden = false;
      }
    }
    if (state.jobFilter === "actions" && !state.actionPlan) {
      try {
        state.actionPlan = await loadJSON("data/action-plan.json");
        renderJobs();
      } catch (error) {
        console.error(error);
        elements.errorState.hidden = false;
      }
    }
    if (state.jobFilter === "interview" && !state.interviewPrep) {
      try {
        state.interviewPrep = await loadJSON("data/interview-prep.json");
        state.interviewRoleId = state.interviewPrep.roles[0].jobId;
        renderJobs();
      } catch (error) {
        console.error(error);
        elements.errorState.hidden = false;
      }
    }
    if (state.jobFilter === "materials" && !state.applicationKit) {
      try {
        state.applicationKit = await loadJSON("data/application-kit.json");
        renderJobs();
      } catch (error) {
        console.error(error);
        elements.errorState.hidden = false;
      }
    }
  }

  const interviewRoleButton = event.target.closest("[data-interview-role]");
  if (interviewRoleButton && state.interviewPrep) {
    state.interviewRoleId = interviewRoleButton.dataset.interviewRole;
    renderJobs();
  }

  const evidenceButton = event.target.closest("[data-evidence-template]");
  if (evidenceButton) {
    try {
      await ensureEvidenceTemplate(evidenceButton.dataset.evidenceTemplate);
    } catch (error) {
      console.error(error);
      elements.errorState.hidden = false;
    }
  }

  if (event.target.closest("[data-close-evidence-template]")) {
    const panel = document.querySelector("#evidence-template-view");
    if (panel) {
      panel.hidden = true;
      panel.innerHTML = "";
      document.querySelector(".evidence-pack")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
});

document.addEventListener("input", (event) => {
  if (event.target.matches("#guaranteed-income, #performance-bonus")) updateCompensationResults();
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
