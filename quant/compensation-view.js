function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatWan(value, digits = 2) {
  return `${(Number(value) / 10_000).toFixed(digits)} 万`;
}

function formatPercent(value) {
  return `${(Number(value) * 100).toFixed(1)}%`;
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
  return { tax, cash: gross - social - housingFund - tax };
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

export function renderCompensation(container, dataset) {
  const base = dataset.scenarios.guaranteedBase;
  const merged = dataset.scenarios.allComprehensiveIncome;
  const separate = dataset.scenarios.separateAnnualBonus;
  let bonusTaxMode = "separate";

  container.innerHTML = `
    <section class="view-intro compensation-intro">
      <div><p class="section-index">COMPENSATION GATE</p><h2 id="compensation-title">两条条件，分别核验</h2></div>
      <p>${escapeHTML(dataset.objective.interpretation)}</p>
    </section>
    <section class="compensation-summary" aria-label="薪酬门槛摘要">
      <article><span>固定税前保证</span><strong>≥ ${formatWan(dataset.objective.guaranteedGrossMinimum, 0)}</strong><small>不能由不确定奖金补足</small></article>
      <article><span>100 万固定收入现金到手</span><strong>约 ${formatWan(base.cashTakeHome)}</strong><small>7% 公积金、无专项附加扣除</small></article>
      <article><span>单独计税奖金门槛</span><strong>约 ${formatWan(separate.conservativeScreeningBonus)}</strong><small>总税前约 ${formatWan(separate.conservativeScreeningTotalGross)}</small></article>
      <article><span>并入综合所得奖金门槛</span><strong>约 ${formatWan(merged.conservativeScreeningBonus)}</strong><small>总税前约 ${formatWan(merged.conservativeScreeningTotalGross)}</small></article>
    </section>
    <section class="calculator-band section-band" aria-labelledby="calculator-title">
      <header class="section-heading compact-heading"><p class="section-index">OFFER CALCULATOR</p><h2 id="calculator-title">录用条件换算器</h2></header>
      <div class="calculator-layout">
        <form class="calculator-controls" onsubmit="return false">
          <label for="guaranteed-income"><span>固定税前保证收入</span><span class="money-input"><input id="guaranteed-income" type="number" min="0" step="1" value="100" inputmode="decimal"><small>万元 / 年</small></span></label>
          <label for="performance-bonus"><span>绩效良好时税前奖金</span><span class="money-input"><input id="performance-bonus" type="number" min="0" step="1" value="10.5" inputmode="decimal"><small>万元 / 年</small></span></label>
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
    <section class="bonus-ladder section-band" aria-labelledby="bonus-ladder-title">
      <header class="section-heading compact-heading"><p class="section-index">NEGOTIATION LADDER</p><h2 id="bonus-ladder-title">固定薪提高后，最低奖金怎么变</h2></header>
      <p class="bonus-ladder-note">${escapeHTML(dataset.negotiationLadder.note)}</p>
      <div class="bonus-ladder-table" role="table" aria-label="不同固定薪下的奖金门槛">
        <div class="bonus-ladder-row bonus-ladder-head" role="row"><span role="columnheader">固定保证</span><span role="columnheader">固定现金到手</span><span role="columnheader">单独计税建议</span><span role="columnheader">并入综合所得建议</span></div>
        ${dataset.negotiationLadder.rows.map((row) => `
          <article class="bonus-ladder-row" role="row">
            <strong role="cell">${formatWan(row.guaranteed, row.guaranteed % 100_000 === 0 ? 0 : 1)}</strong>
            <span role="cell">${formatWan(row.fixedCash)}</span>
            <span role="cell">${row.separateScreening ? formatWan(row.separateScreening, 1) : "无需奖金"}<small>精确 ${formatWan(row.separateMinimum)}</small></span>
            <span role="cell">${row.mergedScreening ? formatWan(row.mergedScreening, 1) : "无需奖金"}<small>精确 ${formatWan(row.mergedMinimum)}</small></span>
          </article>
        `).join("")}
      </div>
    </section>
    <section class="offer-examples section-band" aria-labelledby="offer-examples-title">
      <header class="section-heading compact-heading"><p class="section-index">OFFER STRUCTURE EXAMPLES</p><h2 id="offer-examples-title">总包相近，结论可能相反</h2></header>
      <div class="offer-example-table" role="table" aria-label="录用条件拆分示例">
        <div class="offer-example-row offer-example-head" role="row"><span role="columnheader">报价拆分</span><span role="columnheader">税前总额</span><span role="columnheader">现金到手</span><span role="columnheader">固定保证</span><span role="columnheader">税后现金</span></div>
        ${dataset.offerExamples.map((example) => `
          <article class="offer-example-row" role="row" data-example="${escapeHTML(example.id)}">
            <div role="cell"><strong>${escapeHTML(example.label)}</strong><small>${escapeHTML(example.note)}</small></div>
            <span role="cell">${formatWan(example.totalGross)}</span><span role="cell">${formatWan(example.estimatedCash)}</span>
            <em role="cell" data-pass="${example.guaranteePass}">${example.guaranteePass ? "通过" : "不通过"}</em>
            <em role="cell" data-pass="${example.cashPass}">${example.cashPass ? "通过" : "不通过"}</em>
          </article>
        `).join("")}
      </div>
    </section>
    <section class="assumption-band section-band" aria-labelledby="assumption-title">
      <header class="section-heading compact-heading"><p class="section-index">ASSUMPTIONS & SOURCES</p><h2 id="assumption-title">计算口径与官方来源</h2></header>
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
          ${dataset.sources.map((source) => `<li><a href="${escapeHTML(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(source.label)}</a><span>${escapeHTML(source.publisher)} · ${escapeHTML(source.supports)}</span></li>`).join("")}
        </ol>
      </div>
    </section>
  `;

  function updateResults() {
    const baseGross = Math.max(0, Number(container.querySelector("#guaranteed-income")?.value || 0) * 10_000);
    const bonus = Math.max(0, Number(container.querySelector("#performance-bonus")?.value || 0) * 10_000);
    let bonusTax;
    let totalCash;
    if (bonusTaxMode === "separate") {
      bonusTax = calculateSeparateBonusTax(bonus);
      totalCash = calculateSalary(baseGross, dataset).cash + bonus - bonusTax;
    } else {
      const total = calculateSalary(baseGross + bonus, dataset);
      bonusTax = total.tax - calculateSalary(baseGross, dataset).tax;
      totalCash = total.cash;
    }
    const values = {
      "result-base-cash": formatWan(calculateSalary(baseGross, dataset).cash),
      "result-bonus-tax": formatWan(bonusTax),
      "result-total-cash": formatWan(totalCash),
      "result-total-gross": formatWan(baseGross + bonus),
    };
    Object.entries(values).forEach(([id, value]) => { container.querySelector(`#${id}`).textContent = value; });
    const guaranteePass = baseGross >= dataset.objective.guaranteedGrossMinimum;
    const cashPass = totalCash > dataset.objective.successfulYearCashMinimum;
    const guaranteeStatus = container.querySelector("#guarantee-status");
    const cashStatus = container.querySelector("#cash-status");
    guaranteeStatus.dataset.pass = String(guaranteePass);
    guaranteeStatus.textContent = guaranteePass ? "达标" : `还差 ${formatWan(dataset.objective.guaranteedGrossMinimum - baseGross)}`;
    cashStatus.dataset.pass = String(cashPass);
    cashStatus.textContent = cashPass ? "超过当前基线" : `还差 ${formatWan(dataset.objective.successfulYearCashMinimum - totalCash)}`;
    container.querySelectorAll("[data-bonus-tax-mode]").forEach((button) => {
      const active = button.dataset.bonusTaxMode === bonusTaxMode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  container.onclick = (event) => {
    const button = event.target.closest("[data-bonus-tax-mode]");
    if (!button) return;
    bonusTaxMode = button.dataset.bonusTaxMode;
    updateResults();
  };
  container.oninput = (event) => {
    if (event.target.matches("#guaranteed-income, #performance-bonus")) updateResults();
  };
  updateResults();
}
