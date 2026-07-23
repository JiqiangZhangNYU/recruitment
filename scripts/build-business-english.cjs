const fs = require("node:fs");
const path = require("node:path");

const packPath = path.join(__dirname, "..", "challenges", "business-english.json");
const source = JSON.parse(fs.readFileSync(packPath, "utf8"));

const legacyQuestionIds = {
  "payment-basics": ["authorization-capture-settlement", "refund-chargeback", "payment-participants", "kyc-kyb-aml", "take-rate-net-revenue"],
  "business-writing": ["bluf-rewrite", "polite-data-request", "delay-notice", "action-minutes", "executive-escalation"],
  "data-reporting": ["success-rate-drop", "gmv-up-revenue-down", "incident-update", "experiment-result", "executive-summary"],
  "meetings-objections": ["clarify-vague-request", "respectful-disagreement", "no-bandwidth", "confirm-owner-deadline", "regional-objection"],
  "cross-region": ["localization-translation", "market-entry-memo", "timezone-agreement", "compliance-uncertainty", "global-local-conflict"],
  interview: ["self-introduction", "star-payment-project", "failure-story", "why-role", "project-recap-questions"],
};

const sourceQuestions = source.levels.flatMap((level) => level.questions);
const originalQuestions = new Map();
Object.entries(legacyQuestionIds).forEach(([levelId, ids]) => {
  ids.forEach((id) => {
    const question = sourceQuestions.find((item) => item.id === id);
    if (!question) throw new Error(`Missing legacy question: ${levelId}/${id}`);
    originalQuestions.set(id, question);
  });
});

const topics = [
  {
    id: "payment-basics", title: "支付术语基础", difficulty: 1,
    focus: ["Authorization, capture and settlement are separate stages in a card payment", "授权、请款和结算是银行卡支付中的不同阶段"],
    metric: ["payment status accuracy", "支付状态准确率"],
    signal: ["teams are using payment terms interchangeably and giving merchants conflicting explanations", "团队混用支付术语，向商户提供了相互矛盾的解释"],
    cause: ["the operating playbook does not define ownership or the movement of funds at each stage", "运营手册没有定义各阶段的负责人和资金流转状态"],
    action: ["publish one payment-flow glossary and use it in support, product and partner reviews", "发布统一的支付流程术语表，并在客服、产品和合作方复盘中使用"],
    guardrail: ["every status maps to one owner, customer message and reconciliation treatment", "每个状态都对应明确负责人、客户话术和对账处理方式"],
  },
  {
    id: "business-writing", title: "清晰商务写作", difficulty: 1,
    focus: ["A strong business message leads with the conclusion, evidence and requested action", "高质量商务信息应先给出结论、证据和请求的行动"],
    metric: ["decision turnaround time", "决策周转时间"],
    signal: ["leaders need several follow-up messages before they understand the decision and owner", "管理者需要多轮追问才能理解决策事项和负责人"],
    cause: ["emails begin with chronology and background instead of the business implication", "邮件先写时间线和背景，而不是业务影响"],
    action: ["rewrite updates in BLUF format with a clear ask, owner and deadline", "用 BLUF 结构重写更新，并明确请求、负责人和截止时间"],
    guardrail: ["the first paragraph can be understood without opening an attachment", "读者不打开附件也能理解第一段"],
  },
  {
    id: "meeting-essentials", title: "会议澄清与确认", difficulty: 1,
    focus: ["Effective meetings convert ambiguous discussion into explicit decisions and actions", "有效会议要把模糊讨论转化为明确决策和行动"],
    metric: ["action closure rate", "行动项关闭率"],
    signal: ["the same topics return every week because participants remember different conclusions", "相同议题每周重复出现，因为参会者记住了不同结论"],
    cause: ["the facilitator does not restate the decision, owner, deadline or open question", "主持人没有重述决策、负责人、截止时间和待解决问题"],
    action: ["close each agenda item with a verbal summary and written action log", "每个议题结束时进行口头总结并记录书面行动项"],
    guardrail: ["every action has one accountable owner and a date", "每个行动都有唯一负责人和日期"],
  },
  {
    id: "metric-language", title: "指标与数字表达", difficulty: 1,
    focus: ["A useful metric statement includes the baseline, change, period and comparison", "有效的指标表达应包含基线、变化、时间窗和对照"],
    metric: ["reporting accuracy", "汇报准确率"],
    signal: ["a dashboard says conversion improved by five percent without showing whether this means points or relative growth", "看板称转化率提升百分之五，却没有说明是百分点还是相对增幅"],
    cause: ["the reporting template omits units, denominators and comparison windows", "汇报模板遗漏单位、分母和对比时间窗"],
    action: ["standardize metric sentences and show both the numerator and denominator", "统一指标句式，并同时展示分子和分母"],
    guardrail: ["every reported change can be reproduced from the cited data", "每项汇报变化都能根据引用数据复现"],
  },
  {
    id: "status-updates", title: "项目状态更新", difficulty: 1,
    focus: ["A status update separates completed work, current risk, next action and required decision", "项目更新应区分已完成事项、当前风险、下一步行动和所需决策"],
    metric: ["milestone predictability", "里程碑可预测性"],
    signal: ["the project is marked green although a critical dependency has no confirmed delivery date", "项目状态被标为绿色，但关键依赖尚无确认的交付日期"],
    cause: ["the team reports activity rather than changes to scope, timing and risk", "团队汇报的是活动，而不是范围、时间和风险的变化"],
    action: ["use a red-amber-green update with evidence, owner and recovery date", "采用红黄绿状态更新，并附证据、负责人和恢复日期"],
    guardrail: ["a green status has no unresolved critical-path dependency", "绿色状态不存在未解决的关键路径依赖"],
  },
  {
    id: "checkout-payments", title: "收银台与支付方式", difficulty: 1,
    focus: ["Checkout design balances payment-method relevance, speed and customer trust", "收银台设计需要平衡支付方式相关性、速度和客户信任"],
    metric: ["checkout completion rate", "收银台完成率"],
    signal: ["mobile customers abandon after seeing a long unranked list of payment methods", "移动端客户看到冗长且未排序的支付方式列表后流失"],
    cause: ["the same payment-method order is shown to every market and device", "所有市场和设备使用相同的支付方式排序"],
    action: ["rank eligible methods by local usage while keeping fees and terms transparent", "按本地使用情况排列可用支付方式，同时透明展示费用和条款"],
    guardrail: ["complaints and payment-method errors do not increase", "投诉和支付方式错误不增加"],
  },
  {
    id: "card-payment-flow", title: "银行卡支付链路", difficulty: 1,
    focus: ["Card payments depend on coordinated messages across the merchant, PSP, acquirer, network and issuer", "银行卡支付依赖商户、支付服务商、收单行、卡组织和发卡行之间的协同信息流"],
    metric: ["end-to-end payment success", "端到端支付成功率"],
    signal: ["the PSP reports successful submission while merchants still see an unusual number of failed orders", "支付服务商报告提交成功，但商户仍看到异常多的失败订单"],
    cause: ["technical receipt is being confused with issuer approval and final order confirmation", "技术接收被误当成发卡行批准和最终订单确认"],
    action: ["map every response code to the exact payment stage and merchant-facing status", "把每个响应码映射到准确的支付阶段和商户状态"],
    guardrail: ["no order is fulfilled before the required payment confirmation", "任何订单都不会在获得所需支付确认前履约"],
  },
  {
    id: "refund-dispute-ops", title: "退款与争议运营", difficulty: 1,
    focus: ["Refunds and chargebacks have different initiators, evidence paths and merchant impacts", "退款和拒付拥有不同的发起方、证据路径和商户影响"],
    metric: ["dispute resolution rate", "争议解决率"],
    signal: ["support agents are sending refund instructions to merchants facing formal chargebacks", "客服向面临正式拒付的商户发送了退款操作说明"],
    cause: ["case intake does not distinguish merchant refunds from issuer-led disputes", "案件受理没有区分商户退款和发卡行主导的争议"],
    action: ["route cases by initiator, reason code, evidence deadline and financial exposure", "根据发起方、原因码、举证期限和财务风险分流案件"],
    guardrail: ["evidence is submitted before network deadlines and duplicate refunds are prevented", "证据在卡组织截止日前提交，且避免重复退款"],
  },
  {
    id: "merchant-onboarding", title: "商户入驻", difficulty: 1,
    focus: ["Merchant onboarding must balance conversion, compliance quality and time to first transaction", "商户入驻需要平衡转化率、合规质量和首笔交易时间"],
    metric: ["onboarding completion rate", "入驻完成率"],
    signal: ["small merchants abandon at the ownership-document step while manual reviews keep rising", "小商户在所有权文件环节流失，同时人工审核不断增加"],
    cause: ["document requirements are not explained by entity type or risk tier", "文件要求没有按企业类型和风险等级解释"],
    action: ["tailor the checklist by entity and show examples before upload", "按企业类型定制清单，并在上传前展示示例"],
    guardrail: ["KYB completeness and beneficial-owner checks remain within policy", "KYB 完整性和受益所有人核验仍符合政策"],
  },
  {
    id: "pricing-fees-basics", title: "费率与账单基础", difficulty: 1,
    focus: ["Payment pricing should distinguish merchant fees, network costs, processing costs and taxes", "支付定价应区分商户费用、卡组织成本、处理成本和税费"],
    metric: ["billing accuracy", "账单准确率"],
    signal: ["merchants dispute invoices because blended pricing does not explain cross-border and refund fees", "商户质疑账单，因为综合费率没有解释跨境费和退款费"],
    cause: ["commercial terms and invoice line items use different definitions", "商务条款与账单明细使用了不同定义"],
    action: ["align the pricing glossary and add worked invoice examples", "统一定价术语，并增加账单计算示例"],
    guardrail: ["every charged item can be traced to the signed commercial terms", "每项收费都能追溯到已签署的商务条款"],
  },
  {
    id: "data-reporting", title: "数据汇报", difficulty: 2,
    focus: ["A payment performance report connects metric movement to a tested business explanation", "支付表现汇报应把指标变化与经过验证的业务解释连接起来"],
    metric: ["payment success rate", "支付成功率"],
    signal: ["overall success fell by 2.4 points even though the largest market remained stable", "总体成功率下降 2.4 个百分点，但最大市场保持稳定"],
    cause: ["the aggregate hides a payment-method mix shift in two fast-growing markets", "汇总数据掩盖了两个快速增长市场的支付方式结构变化"],
    action: ["decompose the change by market, method, issuer and response code", "按市场、支付方式、发卡行和响应码拆解变化"],
    guardrail: ["the conclusion is supported by stable definitions and comparable cohorts", "结论由稳定口径和可比群组支持"],
  },
  {
    id: "presentations", title: "商务演示与讲故事", difficulty: 2,
    focus: ["A business presentation should move from decision context to evidence, recommendation and consequence", "商务演示应从决策背景推进到证据、建议和后果"],
    metric: ["decision clarity", "决策清晰度"],
    signal: ["a twenty-slide payment review contains accurate analysis but ends without a decision", "一份二十页的支付复盘分析准确，却没有以决策结束"],
    cause: ["the deck follows the analyst's work sequence rather than the audience's decision path", "材料按照分析者的工作顺序，而不是听众的决策路径组织"],
    action: ["rebuild the deck around one decision, three supporting facts and explicit trade-offs", "围绕一个决策、三项支持事实和明确取舍重构材料"],
    guardrail: ["each chart answers a stated question and uses a visible source", "每张图都回答一个明确问题并标注数据来源"],
  },
  {
    id: "meeting-minutes", title: "纪要与行动跟进", difficulty: 2,
    focus: ["Meeting minutes are an operating record of decisions, actions and unresolved risks", "会议纪要是决策、行动和未解决风险的运营记录"],
    metric: ["action completion rate", "行动完成率"],
    signal: ["teams agree in the meeting but later dispute what was approved", "团队在会上表示同意，会后却对批准内容产生争议"],
    cause: ["minutes summarize discussion but omit decision wording and dissent", "纪要总结了讨论，却遗漏决策原文和异议"],
    action: ["send a decision log within twenty-four hours and ask owners to confirm", "在二十四小时内发送决策日志并请负责人确认"],
    guardrail: ["open disagreements remain visible until explicitly resolved", "未解决的分歧在明确解决前始终可见"],
  },
  {
    id: "stakeholder-email", title: "利益相关方邮件", difficulty: 2,
    focus: ["Stakeholder emails should adapt detail and tone without changing the underlying facts", "利益相关方邮件可以调整细节和语气，但不能改变底层事实"],
    metric: ["response completion rate", "回复完成率"],
    signal: ["engineering asks for exact evidence while executives ask for the business consequence", "工程团队要求精确证据，而管理层关注业务后果"],
    cause: ["one long update is being sent unchanged to every audience", "同一封冗长更新未经调整就发送给所有受众"],
    action: ["keep one source of truth and tailor the opening, detail and requested action", "保留唯一事实源，并针对受众调整开头、细节和行动请求"],
    guardrail: ["all audience versions use the same metric definitions and decision status", "面向不同受众的版本使用相同指标定义和决策状态"],
  },
  {
    id: "negotiation-basics", title: "基础商务谈判", difficulty: 2,
    focus: ["A sound negotiation separates interests, positions, tradable terms and non-negotiable controls", "有效谈判应区分利益、立场、可交换条款和不可妥协的控制要求"],
    metric: ["commercial value retained", "保留的商业价值"],
    signal: ["a payment partner requests a lower fee and immediate exclusivity in the same proposal", "支付合作方在同一方案中要求更低费率和立即独家合作"],
    cause: ["the discussion is treating each request independently rather than as a package", "讨论把每项要求孤立处理，而不是作为整体方案"],
    action: ["trade volume commitment and term length for pricing while rejecting unconditional exclusivity", "用交易量承诺和合同期限交换价格，同时拒绝无条件独家"],
    guardrail: ["service levels, compliance rights and exit terms remain enforceable", "服务水平、合规权利和退出条款仍可执行"],
  },
  {
    id: "authorization-declines", title: "授权与拒绝码", difficulty: 2,
    focus: ["Authorization optimization requires separating issuer decisions, technical failures and merchant errors", "授权优化需要区分发卡行决策、技术失败和商户错误"],
    metric: ["authorization approval rate", "授权批准率"],
    signal: ["approval fell from 84.2% to 80.9% in Brazil after an issuer-mix shift", "巴西授权批准率在发卡行结构变化后从 84.2% 降至 80.9%"],
    cause: ["timeouts and generic declines are concentrated in two issuers rather than the whole market", "超时和通用拒绝集中在两家发卡行，而非整个市场"],
    action: ["separate retryable failures and work with the acquirer on issuer-specific routing", "区分可重试失败，并与收单行制定针对发卡行的路由方案"],
    guardrail: ["fraud loss and duplicate authorization attempts stay within threshold", "欺诈损失和重复授权尝试保持在阈值内"],
  },
  {
    id: "retry-routing", title: "重试与智能路由", difficulty: 2,
    focus: ["Retry and routing rules should recover legitimate payments without creating duplicate charges or excess cost", "重试和路由规则应在不造成重复扣款或额外成本的前提下挽回正常支付"],
    metric: ["incremental recovered approvals", "增量挽回批准数"],
    signal: ["unconditional retries add traffic and fees but recover very few approved payments", "无条件重试增加了流量和费用，却只挽回很少的批准交易"],
    cause: ["hard declines, soft declines and technical errors follow the same retry rule", "硬拒绝、软拒绝和技术错误使用了相同重试规则"],
    action: ["retry only eligible response codes with capped attempts and idempotency controls", "仅对符合条件的响应码重试，并限制次数和实施幂等控制"],
    guardrail: ["duplicate-charge complaints and processing cost stay flat", "重复扣款投诉和处理成本保持稳定"],
  },
  {
    id: "local-payment-methods", title: "本地支付方式运营", difficulty: 2,
    focus: ["Local payment methods should be evaluated by customer reach, economics, reliability and operational fit", "本地支付方式应从客户覆盖、经济性、可靠性和运营适配度评估"],
    metric: ["incremental checkout conversion", "增量收银台转化率"],
    signal: ["a popular wallet attracts clicks but has low completion and high support contacts", "一种热门钱包点击量高，但完成率低且客服咨询多"],
    cause: ["the integration lacks clear pending-state communication and refund expectations", "集成缺少清晰的处理中状态说明和退款预期"],
    action: ["fix status messaging and run a market-level pilot before expanding placement", "修复状态提示，并在扩大展示前进行市场级试点"],
    guardrail: ["net conversion improves after fees, failures and support cost", "扣除费用、失败和客服成本后净转化有所提升"],
  },
  {
    id: "reconciliation-settlement", title: "对账与结算运营", difficulty: 2,
    focus: ["Reconciliation matches internal orders, provider transactions, fees and bank movements", "对账需要匹配内部订单、服务商交易、费用和银行资金流"],
    metric: ["unreconciled transaction rate", "未对账交易率"],
    signal: ["finance sees a growing settlement difference after a provider changed file timing", "服务商调整文件时间后，财务看到结算差异持续扩大"],
    cause: ["transaction dates, settlement dates and time zones are being joined as if they were identical", "交易日期、结算日期和时区被当作相同字段关联"],
    action: ["rebuild matching rules around stable identifiers, timing windows and fee records", "围绕稳定标识、时间窗口和费用记录重建匹配规则"],
    guardrail: ["every manual adjustment has evidence, approval and an audit trail", "每项人工调整都有证据、审批和审计记录"],
  },
  {
    id: "merchant-support", title: "商户支持运营", difficulty: 2,
    focus: ["Merchant support should resolve individual cases while converting repeated contacts into product fixes", "商户支持既要解决个案，也要把重复咨询转化为产品修复"],
    metric: ["merchant contact rate", "商户咨询率"],
    signal: ["contacts about pending payouts doubled after a dashboard change", "看板改版后，关于待处理付款的咨询量翻倍"],
    cause: ["the new status label does not explain the expected date or required merchant action", "新状态标签没有解释预计日期或商户需要采取的行动"],
    action: ["restore clear status guidance and tag contacts by root cause for weekly review", "恢复清晰的状态指引，并按根因标记咨询以供每周复盘"],
    guardrail: ["resolution time improves without hiding unresolved financial cases", "解决时长改善，同时不会掩盖未解决的资金案件"],
  },
  {
    id: "meetings-objections", title: "会议与异议", difficulty: 3,
    focus: ["Constructive disagreement acknowledges the concern, tests the evidence and proposes a decision path", "建设性异议应承认对方顾虑、检验证据并提出决策路径"],
    metric: ["decision closure rate", "决策关闭率"],
    signal: ["regional and global teams repeat opposing positions without agreeing on evidence", "区域和全球团队反复表达相反立场，却未就证据达成一致"],
    cause: ["the meeting is debating preferences rather than assumptions and thresholds", "会议争论的是偏好，而不是假设和阈值"],
    action: ["state the shared goal, isolate the disputed assumption and agree on a test", "说明共同目标、隔离争议假设并商定验证方式"],
    guardrail: ["the final decision and remaining dissent are both documented", "最终决策和仍然存在的异议都被记录"],
  },
  {
    id: "cross-region", title: "跨区域协作", difficulty: 3,
    focus: ["Cross-region execution distinguishes global principles from evidence-based local exceptions", "跨区域执行需要区分全球原则和有证据支持的本地例外"],
    metric: ["regional launch readiness", "区域上线准备度"],
    signal: ["a global payment flow performs well in Europe but creates abandonment in Southeast Asia", "全球支付流程在欧洲表现良好，却在东南亚造成流失"],
    cause: ["local language, payment habits and regulatory steps were treated as translation details", "本地语言、支付习惯和监管步骤被当作翻译细节"],
    action: ["define non-negotiable controls and pilot localized journey changes", "明确不可妥协的控制要求，并试点本地化流程变更"],
    guardrail: ["local exceptions have an owner, expiry date and measurable rationale", "本地例外拥有负责人、到期日和可衡量的依据"],
  },
  {
    id: "executive-summary", title: "高管摘要", difficulty: 3,
    focus: ["An executive summary states the implication, recommendation, evidence and decision needed", "高管摘要应说明业务影响、建议、证据和所需决策"],
    metric: ["executive decision time", "管理层决策时间"],
    signal: ["a payment strategy paper contains detailed analysis but its recommendation appears on page twelve", "支付策略文件分析详尽，但建议直到第十二页才出现"],
    cause: ["the document is optimized for completeness rather than decision usefulness", "文件追求完整性，而不是决策价值"],
    action: ["place the recommendation and quantified consequence in the opening paragraph", "在开头段落放置建议和量化后果"],
    guardrail: ["material uncertainty and downside remain visible in the summary", "重大不确定性和下行风险仍在摘要中清晰可见"],
  },
  {
    id: "project-update", title: "跨团队项目推进", difficulty: 3,
    focus: ["Cross-functional delivery requires explicit dependencies, decision rights and escalation triggers", "跨团队交付需要明确依赖关系、决策权和升级触发条件"],
    metric: ["on-time milestone rate", "里程碑按时完成率"],
    signal: ["a payment launch is two weeks from release but certification ownership remains unclear", "支付上线距离发布只剩两周，但认证责任仍不清晰"],
    cause: ["the plan lists tasks without mapping dependencies or a single accountable owner", "计划列出了任务，却没有映射依赖或唯一责任人"],
    action: ["rebuild the critical path and escalate the unowned certification decision", "重建关键路径，并升级无人负责的认证决策"],
    guardrail: ["no launch-critical dependency lacks an owner and fallback", "所有影响上线的关键依赖都有负责人和备选方案"],
  },
  {
    id: "customer-escalation", title: "客户升级处理", difficulty: 3,
    focus: ["A strong escalation response combines empathy, verified facts, containment and a timed update", "高质量升级响应需要结合共情、已核实事实、止损措施和定时更新"],
    metric: ["escalation resolution time", "升级案件解决时长"],
    signal: ["a strategic merchant reports duplicate charges and threatens to pause payment traffic", "一家战略商户报告重复扣款，并威胁暂停支付流量"],
    cause: ["a timeout retry bypassed one idempotency check during a provider incident", "服务商事故期间，一次超时重试绕过了幂等检查"],
    action: ["stop the faulty retry path, identify affected transactions and give the merchant timed updates", "停止错误重试路径、识别受影响交易并定时向商户更新"],
    guardrail: ["no customer is charged twice and remediation is independently verified", "任何客户都不会被重复扣款，且补救结果经过独立核验"],
  },
  {
    id: "fraud-risk", title: "欺诈与风险策略", difficulty: 3,
    focus: ["Payment risk strategy balances fraud loss, approval, customer friction and review cost", "支付风险策略需要平衡欺诈损失、批准率、客户摩擦和审核成本"],
    metric: ["fraud loss rate", "欺诈损失率"],
    signal: ["a stricter rule reduced fraud but rejected many long-standing low-risk customers", "更严格的规则降低了欺诈，却拒绝了许多长期低风险客户"],
    cause: ["the rule uses one transaction threshold without customer-history features", "规则只使用单笔交易阈值，没有客户历史特征"],
    action: ["segment the rule by customer history and send uncertain cases to targeted review", "按客户历史细分规则，并将不确定案件送入定向审核"],
    guardrail: ["fraud savings exceed lost margin and manual-review cost", "欺诈节省金额高于损失毛利和人工审核成本"],
  },
  {
    id: "three-d-secure", title: "3DS 与身份验证", difficulty: 3,
    focus: ["3DS strategy should apply the right authentication path by regulation, risk and issuer behavior", "3DS 策略应根据监管、风险和发卡行行为选择合适的验证路径"],
    metric: ["authenticated payment conversion", "验证支付转化率"],
    signal: ["mandatory challenges reduced fraud but created a sharp mobile checkout drop", "强制挑战降低了欺诈，却造成移动端收银台大幅流失"],
    cause: ["low-risk transactions are not using exemptions or frictionless authentication", "低风险交易没有使用豁免或无摩擦验证"],
    action: ["apply risk-based exemptions where allowed and monitor issuer-level outcomes", "在允许范围内使用基于风险的豁免，并监控发卡行层面的结果"],
    guardrail: ["regulatory compliance and fraud liability remain clear", "监管合规和欺诈责任归属保持清晰"],
  },
  {
    id: "subscription-payments", title: "订阅与周期扣款", difficulty: 3,
    focus: ["Subscription payment operations combine mandate quality, renewal timing and recovery communication", "订阅支付运营结合授权质量、续费时点和挽回沟通"],
    metric: ["renewal recovery rate", "续费挽回率"],
    signal: ["involuntary churn rose after expired cards became the largest decline reason", "卡片过期成为最大拒绝原因后，非自愿流失上升"],
    cause: ["the recovery flow lacks account updates, smart timing and customer reminders", "挽回流程缺少账户更新、智能时点和客户提醒"],
    action: ["combine account updates with decline-specific retries and transparent reminders", "结合账户更新、按拒绝原因重试和透明提醒"],
    guardrail: ["complaints and opt-out failures do not increase", "投诉和退订失败不增加"],
  },
  {
    id: "cross-border-fx", title: "跨境支付与外汇", difficulty: 3,
    focus: ["Cross-border payment economics depend on currency, acquiring location, conversion and settlement design", "跨境支付经济性取决于币种、收单地点、换汇和结算设计"],
    metric: ["cross-border net margin", "跨境净利润率"],
    signal: ["volume is growing while margin falls in corridors with frequent currency conversion", "频繁换汇的支付走廊交易量增长，但利润率下降"],
    cause: ["pricing does not recover FX spread, cross-border assessment and settlement cost", "定价没有覆盖外汇价差、跨境评估费和结算成本"],
    action: ["measure corridor economics and offer local currency or settlement choices selectively", "衡量支付走廊经济性，并有选择地提供本币或结算选项"],
    guardrail: ["currency disclosure is transparent and merchants understand settlement exposure", "币种披露透明，商户理解结算风险"],
  },
  {
    id: "payment-costs", title: "支付成本分析", difficulty: 3,
    focus: ["Payment cost analysis separates fixed, variable, network, provider and loss components", "支付成本分析应区分固定、可变、卡组织、服务商和损失成本"],
    metric: ["cost per successful payment", "每笔成功支付成本"],
    signal: ["a low headline processing fee produces higher total cost after failures and manual work", "较低的名义处理费在计入失败和人工工作后产生了更高总成本"],
    cause: ["vendor comparison excludes retry traffic, minimum fees and operational exceptions", "供应商比较遗漏了重试流量、最低费用和运营例外"],
    action: ["build a fully loaded cost model by method, market and success outcome", "按支付方式、市场和成功结果建立全口径成本模型"],
    guardrail: ["cost savings do not reduce approval, reliability or support quality", "成本节省不会降低批准率、可靠性或客服质量"],
  },
  {
    id: "market-entry", title: "支付市场进入", difficulty: 4,
    focus: ["Payment market entry requires a sequenced view of demand, regulation, partners, economics and operations", "支付市场进入需要按顺序评估需求、监管、合作方、经济性和运营"],
    metric: ["validated market opportunity", "经验证的市场机会"],
    signal: ["a high-volume market looks attractive but licensing and settlement ownership are unresolved", "一个高交易量市场很有吸引力，但牌照和结算责任尚未解决"],
    cause: ["the business case assumes global capabilities transfer without local constraints", "商业论证假设全球能力可以不受本地约束地迁移"],
    action: ["run regulatory and partner discovery before committing the full launch plan", "在承诺完整上线计划前完成监管和合作方调研"],
    guardrail: ["the pilot has a legal basis, viable economics and an accountable operator", "试点具备法律依据、可行经济性和明确运营主体"],
  },
  {
    id: "acquiring-strategy", title: "收单布局策略", difficulty: 4,
    focus: ["Acquiring strategy balances local approval, resilience, cost and operational complexity", "收单策略需要平衡本地批准率、韧性、成本和运营复杂度"],
    metric: ["risk-adjusted acquiring value", "风险调整后的收单价值"],
    signal: ["local acquiring may improve approval but requires new entities, reserves and reconciliation", "本地收单可能提高批准率，却需要新实体、准备金和对账能力"],
    cause: ["the proposal compares approval uplift without the full operating model", "方案只比较批准率提升，没有纳入完整运营模式"],
    action: ["prioritize markets where incremental margin exceeds setup and control cost", "优先选择增量利润高于建设和控制成本的市场"],
    guardrail: ["resilience and compliance do not depend on one untested partner", "韧性和合规不依赖单一未经验证的合作方"],
  },
  {
    id: "payment-orchestration", title: "支付编排与自建外购", difficulty: 4,
    focus: ["Payment orchestration decisions compare control, speed, coverage, data quality and lifetime cost", "支付编排决策应比较控制力、速度、覆盖、数据质量和全生命周期成本"],
    metric: ["orchestration value realization", "支付编排价值实现度"],
    signal: ["a vendor promises rapid routing gains but key data and failover logic remain proprietary", "供应商承诺快速获得路由收益，但关键数据和故障切换逻辑仍是专有的"],
    cause: ["the selection process weights launch speed but not switching cost or decision control", "选型过程重视上线速度，却忽略切换成本和决策控制权"],
    action: ["score build, buy and hybrid options against explicit five-year scenarios", "根据明确的五年情景评估自建、外购和混合方案"],
    guardrail: ["transaction data, routing rules and exit rights remain usable", "交易数据、路由规则和退出权保持可用"],
  },
  {
    id: "pricing-strategy", title: "支付定价策略", difficulty: 4,
    focus: ["Payment pricing converts customer value, willingness to pay, cost and risk into coherent terms", "支付定价把客户价值、支付意愿、成本和风险转化为一致条款"],
    metric: ["risk-adjusted net revenue", "风险调整后净收入"],
    signal: ["a uniform price wins volume but destroys margin in high-cost payment mixes", "统一价格赢得了交易量，却在高成本支付结构中损害利润"],
    cause: ["pricing tiers use volume alone and ignore method, market and service intensity", "定价分层只使用交易量，忽略支付方式、市场和服务强度"],
    action: ["segment pricing by value and cost while keeping the offer understandable", "按价值和成本细分定价，同时保持报价易于理解"],
    guardrail: ["discounts have expiry dates, performance commitments and margin floors", "折扣包含到期日、业绩承诺和利润底线"],
  },
  {
    id: "enterprise-merchants", title: "大型商户经营", difficulty: 4,
    focus: ["Enterprise merchant strategy combines account economics, product gaps, service commitments and growth potential", "大型商户策略结合账户经济性、产品差距、服务承诺和增长潜力"],
    metric: ["merchant lifetime value", "商户生命周期价值"],
    signal: ["a large merchant requests custom features after moving only a small share of promised volume", "一家大型商户仅迁移少量承诺交易量后就要求定制功能"],
    cause: ["commercial commitments are not linked to delivery priority or realized value", "商务承诺没有与交付优先级或已实现价值关联"],
    action: ["create a joint plan that ties roadmap investment to measurable adoption", "制定联合计划，把产品路线投入与可衡量的采用情况关联"],
    guardrail: ["custom work has reusable value or a funded commercial return", "定制工作具有可复用价值或有资金支持的商业回报"],
  },
  {
    id: "sme-segmentation", title: "中小商户分层运营", difficulty: 4,
    focus: ["SME payment operations scale by matching service intensity to need, value and risk", "中小商户支付运营通过让服务强度匹配需求、价值和风险实现规模化"],
    metric: ["cost-to-serve by segment", "分层服务成本"],
    signal: ["high-touch support is applied uniformly while many merchants need the same basic guidance", "高接触服务被统一使用，而许多商户需要的是相同基础指引"],
    cause: ["segmentation reflects sales size but not lifecycle stage or operational need", "分层反映销售规模，却没有反映生命周期阶段或运营需求"],
    action: ["combine self-service journeys with trigger-based specialist support", "结合自助服务流程和基于触发器的专家支持"],
    guardrail: ["vulnerable or high-risk merchants are not routed away from necessary help", "脆弱或高风险商户不会被排除在必要帮助之外"],
  },
  {
    id: "platform-marketplaces", title: "平台与市场支付", difficulty: 4,
    focus: ["Marketplace payments require clear responsibility for onboarding, split funds, refunds, reserves and payouts", "平台支付需要明确入驻、分账、退款、准备金和付款责任"],
    metric: ["seller payout reliability", "卖家付款可靠性"],
    signal: ["seller growth is accelerating while payout holds and support contacts rise", "卖家增长加速，但付款冻结和客服咨询同步上升"],
    cause: ["risk rules and payout communication do not reflect seller maturity", "风险规则和付款沟通没有反映卖家成熟度"],
    action: ["tier payout controls by seller risk and explain hold reasons with release criteria", "按卖家风险分层付款控制，并说明冻结原因和释放标准"],
    guardrail: ["fund flows and platform obligations remain legally and operationally clear", "资金流和平台义务在法律及运营上保持清晰"],
  },
  {
    id: "incident-management", title: "支付事故管理", difficulty: 4,
    focus: ["Payment incident management prioritizes customer containment, truthful communication and controlled recovery", "支付事故管理优先考虑客户止损、真实沟通和受控恢复"],
    metric: ["customer-impact minutes", "客户受影响分钟数"],
    signal: ["payment failures are rising across two providers and the root cause is not yet confirmed", "两家服务商的支付失败正在上升，根因尚未确认"],
    cause: ["a shared dependency is suspected but provider-specific evidence is incomplete", "疑似共同依赖出现问题，但服务商层面的证据不完整"],
    action: ["contain affected traffic, open a command channel and publish timed fact-based updates", "隔离受影响流量、建立指挥频道并定时发布基于事实的更新"],
    guardrail: ["recovery changes are reversible and do not create duplicate financial events", "恢复变更可回退，且不会造成重复资金事件"],
  },
  {
    id: "regulatory-change", title: "监管变化落地", difficulty: 4,
    focus: ["Regulatory implementation translates legal interpretation into owned product and operating controls", "监管落地需要把法律解释转化为有负责人的产品和运营控制"],
    metric: ["regulatory readiness", "监管准备度"],
    signal: ["a new authentication rule takes effect in ninety days but product scope remains disputed", "新的身份验证规则将在九十天后生效，但产品范围仍有争议"],
    cause: ["legal requirements have not been converted into testable business scenarios", "法律要求尚未转化为可测试的业务场景"],
    action: ["create a requirement-to-control matrix with legal sign-off and launch evidence", "建立从要求到控制的矩阵，并包含法务签字和上线证据"],
    guardrail: ["no mandatory obligation is treated as an optional product trade-off", "任何强制义务都不会被当作可选产品取舍"],
  },
  {
    id: "partner-management", title: "支付合作方管理", difficulty: 4,
    focus: ["Payment partner management combines performance evidence, governance, incentives and credible alternatives", "支付合作方管理结合绩效证据、治理、激励和可信替代方案"],
    metric: ["partner service-level attainment", "合作方服务水平达成率"],
    signal: ["a provider misses latency targets repeatedly but offers only informal recovery promises", "一家服务商多次未达到延迟目标，却只提供非正式恢复承诺"],
    cause: ["reviews discuss incidents individually without enforcing the contracted improvement process", "复盘逐个讨论事故，却没有执行合同约定的改进流程"],
    action: ["issue a documented remediation plan with milestones, consequences and fallback capacity", "发布包含里程碑、后果和备选容量的书面整改计划"],
    guardrail: ["traffic concentration does not prevent an orderly provider exit", "流量集中不会阻碍有序退出服务商"],
  },
  {
    id: "portfolio-strategy", title: "支付能力组合策略", difficulty: 5,
    focus: ["A payment portfolio allocates investment across growth, resilience, compliance and efficiency", "支付能力组合需要在增长、韧性、合规和效率之间分配投入"],
    metric: ["portfolio risk-adjusted return", "能力组合风险调整后回报"],
    signal: ["the roadmap contains many local requests but no view of shared strategic capabilities", "路线图包含大量本地请求，却没有共同战略能力视角"],
    cause: ["initiatives are ranked by sponsor urgency rather than enterprise value and dependency", "项目按发起人紧迫性，而不是企业价值和依赖关系排序"],
    action: ["group investments by capability and fund a balanced set of strategic outcomes", "按能力对投入分组，并资助一组平衡的战略结果"],
    guardrail: ["mandatory resilience and compliance work cannot be displaced by short-term revenue", "强制韧性和合规工作不会被短期收入挤占"],
  },
  {
    id: "unit-economics", title: "支付单位经济", difficulty: 5,
    focus: ["Payment unit economics connect revenue, processing cost, losses, incentives and service cost", "支付单位经济连接收入、处理成本、损失、激励和服务成本"],
    metric: ["contribution margin per successful payment", "每笔成功支付贡献利润"],
    signal: ["gross revenue rises with volume while contribution margin turns negative in one segment", "总收入随交易量上升，但一个客群的贡献利润转为负值"],
    cause: ["pricing does not cover fraud loss, premium support and expensive payment methods", "定价无法覆盖欺诈损失、高级支持和高成本支付方式"],
    action: ["reprice or redesign the segment offer using fully loaded marginal economics", "使用全口径边际经济重新定价或设计该客群方案"],
    guardrail: ["growth targets are measured after variable cost and expected loss", "增长目标在扣除可变成本和预期损失后衡量"],
  },
  {
    id: "tokenization-updater", title: "令牌化与账户更新", difficulty: 5,
    focus: ["Network tokens and account updater services can improve security and credential continuity", "网络令牌和账户更新服务可以提升安全性及支付凭证连续性"],
    metric: ["credential-related approval uplift", "凭证相关批准率提升"],
    signal: ["expired and replaced cards drive recurring-payment failures in valuable cohorts", "过期和换卡导致高价值群体的周期支付失败"],
    cause: ["stored credentials are not consistently tokenized or refreshed before billing", "存储凭证没有在扣款前被一致令牌化或更新"],
    action: ["pilot network tokens and account updates by issuer and merchant cohort", "按发卡行和商户群体试点网络令牌与账户更新"],
    guardrail: ["consent, credential lifecycle and fallback behavior remain controlled", "同意管理、凭证生命周期和回退行为保持受控"],
  },
  {
    id: "open-banking-rtp", title: "开放银行与实时支付", difficulty: 5,
    focus: ["Account-to-account payments require a complete view of consent, confirmation, refunds and fraud liability", "账户到账户支付需要完整考虑授权、确认、退款和欺诈责任"],
    metric: ["account-to-account completed conversion", "账户到账户支付完成转化率"],
    signal: ["lower processing cost is offset by abandonment during bank selection and authentication", "较低处理成本被银行选择和验证环节的流失抵消"],
    cause: ["the business case assumes card-like customer behavior and dispute handling", "商业论证假设客户行为和争议处理与银行卡相同"],
    action: ["pilot the journey with explicit confirmation, support and return-payment design", "通过明确的确认、客服和退款设计试点该流程"],
    guardrail: ["customers understand authorization and have a workable error-resolution path", "客户理解授权含义并拥有可行的问题解决路径"],
  },
  {
    id: "treasury-liquidity", title: "资金与流动性运营", difficulty: 5,
    focus: ["Payment treasury manages settlement timing, currency exposure, prefunding and liquidity concentration", "支付资金管理涵盖结算时点、币种风险、预存资金和流动性集中"],
    metric: ["liquidity buffer efficiency", "流动性缓冲效率"],
    signal: ["prefunding requirements grow faster than volume in volatile cross-border corridors", "波动较大的跨境走廊中，预存资金要求增长快于交易量"],
    cause: ["settlement calendars and stress scenarios are not reflected in daily funding rules", "日常资金规则没有反映结算日历和压力情景"],
    action: ["set corridor-level buffers using settlement forecasts and stress limits", "使用结算预测和压力限额设置走廊级缓冲"],
    guardrail: ["customer and merchant obligations remain funded under the approved stress case", "在批准的压力情景下，客户和商户义务仍有资金保障"],
  },
  {
    id: "executive-governance", title: "高管治理与决策", difficulty: 5,
    focus: ["Executive governance assigns decision rights, risk appetite, evidence standards and escalation paths", "高管治理明确决策权、风险偏好、证据标准和升级路径"],
    metric: ["strategic decision quality", "战略决策质量"],
    signal: ["three committees review the same payment risk but none owns the final trade-off", "三个委员会审查同一支付风险，却没有任何一个负责最终取舍"],
    cause: ["governance defines attendance and reporting but not decision authority", "治理机制定义了参会和汇报，却没有定义决策权"],
    action: ["assign one decision owner and publish thresholds for escalation and exception", "指定唯一决策负责人，并发布升级及例外阈值"],
    guardrail: ["material risk acceptance is explicit, time-bound and auditable", "重大风险接受是明确、有时限且可审计的"],
  },
  {
    id: "turnaround-case", title: "业务扭转与恢复", difficulty: 5,
    focus: ["A payment turnaround begins with fact-based triage, cash protection and a small number of owned moves", "支付业务扭转始于基于事实的分诊、现金保护和少量有负责人的行动"],
    metric: ["ninety-day contribution recovery", "九十天贡献利润恢复"],
    signal: ["approval, merchant trust and margin are declining at the same time", "批准率、商户信任和利润率同时下降"],
    cause: ["routing instability, unfunded discounts and slow incident communication reinforce one another", "路由不稳定、无资金支持的折扣和缓慢事故沟通相互强化"],
    action: ["stabilize critical traffic, stop value-destructive offers and rebuild merchant confidence", "稳定关键流量、停止破坏价值的优惠并重建商户信心"],
    guardrail: ["recovery actions protect regulated obligations and avoid hidden future cost", "恢复行动保护监管义务，并避免隐藏的未来成本"],
  },
  {
    id: "strategic-negotiation", title: "复杂合作谈判", difficulty: 5,
    focus: ["Strategic negotiation creates packages across economics, performance, data, risk and duration", "复杂谈判需要围绕经济性、绩效、数据、风险和期限设计整体方案"],
    metric: ["risk-adjusted deal value", "风险调整后的交易价值"],
    signal: ["a critical processor offers a discount in exchange for five-year exclusivity and weaker remedies", "一家关键处理商以五年独家和削弱补救条款换取折扣"],
    cause: ["the headline saving is being compared without concentration and exit risk", "名义节省没有与集中度和退出风险一同比较"],
    action: ["offer earned volume tiers while preserving performance remedies and exit options", "提供按业绩获得的交易量分层，同时保留绩效补救和退出选项"],
    guardrail: ["no price concession removes operational resilience or regulatory access", "任何价格让步都不会削弱运营韧性或监管访问权"],
  },
  {
    id: "board-presentation", title: "董事会级英文汇报", difficulty: 5,
    focus: ["A board-level payment narrative links strategic choice, financial consequence, risk and management action", "董事会级支付叙事连接战略选择、财务后果、风险和管理行动"],
    metric: ["board decision confidence", "董事会决策信心"],
    signal: ["directors see strong payment growth but question margin quality and operational concentration", "董事看到支付业务强劲增长，却质疑利润质量和运营集中度"],
    cause: ["management reporting separates growth, economics and resilience into unrelated sections", "管理层汇报把增长、经济性和韧性拆成互不关联的部分"],
    action: ["present one integrated scenario with choices, downside and funded mitigations", "呈现一个包含选择、下行风险和已落实缓解措施的综合情景"],
    guardrail: ["uncertainty is quantified and no material risk is buried in an appendix", "不确定性被量化，且重大风险不会埋在附录中"],
  },
  {
    id: "interview", title: "英文面试", difficulty: 5,
    focus: ["A strong payment strategy interview answer connects personal judgment, action, evidence and learning", "高质量支付策略面试回答连接个人判断、行动、证据和复盘"],
    metric: ["answer evidence quality", "回答证据质量"],
    signal: ["a candidate describes team activity but the interviewer cannot identify the candidate's decision", "候选人描述了团队活动，但面试官无法识别候选人的个人决策"],
    cause: ["the story spends too long on context and uses we for every important action", "案例在背景上花费过多时间，并对所有关键行动都使用“我们”"],
    action: ["use a concise STAR-L structure with explicit personal choices and quantified limits", "使用简洁的 STAR-L 结构，明确个人选择和量化限制"],
    guardrail: ["the claim can withstand follow-up questions about data, trade-offs and failure", "陈述能够经受关于数据、取舍和失败的追问"],
  },
];

const archetypes = [
  { id: "explain", title: "准确解释", type: "概念表达" },
  { id: "interpret", title: "解读指标", type: "数据表达" },
  { id: "incident", title: "事故更新", type: "状态沟通" },
  { id: "recommend", title: "提出建议", type: "策略表达" },
  { id: "tradeoff", title: "说明取舍", type: "决策表达" },
  { id: "disagree", title: "回应异议", type: "会议表达" },
  { id: "pilot", title: "设计试点", type: "实验表达" },
  { id: "executive", title: "高管摘要", type: "向上汇报" },
  { id: "negotiate", title: "协商边界", type: "谈判表达" },
  { id: "interview", title: "面试复盘", type: "案例表达" },
];

function answerFor(topic, archetypeId) {
  const [focusEn, focusZh] = topic.focus;
  const [metricEn, metricZh] = topic.metric;
  const [signalEn, signalZh] = topic.signal;
  const [causeEn, causeZh] = topic.cause;
  const [actionEn, actionZh] = topic.action;
  const [guardrailEn, guardrailZh] = topic.guardrail;
  const answers = {
    explain: [
      `${focusEn}. The current signal is that ${signalEn}. I recommend that we ${actionEn}.`,
      `${focusZh}。当前信号是${signalZh}。我建议${actionZh}。`,
    ],
    interpret: [
      `The headline ${metricEn} needs context because ${signalEn}. Evidence points to ${causeEn}. Before making a decision, we should segment the data and verify that ${guardrailEn}.`,
      `${metricZh}这一核心指标需要结合背景解读，因为${signalZh}。证据表明${causeZh}。在做决定前，我们应细分数据，并确认${guardrailZh}。`,
    ],
    incident: [
      `We are investigating a situation in which ${signalEn}. Current evidence points to ${causeEn}, but the root cause is not yet final. We will ${actionEn} and provide the next fact-based update at the agreed time.`,
      `我们正在调查以下情况：${signalZh}。当前证据表明${causeZh}，但根因尚未最终确认。我们将${actionZh}，并在约定时间提供下一次基于事实的更新。`,
    ],
    recommend: [
      `My recommendation is to ${actionEn}. This directly addresses the evidence that ${causeEn}. We will track ${metricEn} and scale only if ${guardrailEn}.`,
      `我建议${actionZh}。这直接回应了“${causeZh}”这一证据。我们将跟踪${metricZh}，并且只有在${guardrailZh}时才扩大实施。`,
    ],
    tradeoff: [
      `The decision should balance speed with control. Although the proposal may improve ${metricEn}, the evidence shows that ${causeEn}. We should ${actionEn}, but proceed only if ${guardrailEn}.`,
      `该决策应平衡速度与控制。虽然方案可能改善${metricZh}，但证据表明${causeZh}。我们应${actionZh}，但只有在${guardrailZh}时才继续推进。`,
    ],
    disagree: [
      `I understand the concern about adding operational complexity. However, the current signal is that ${signalEn}. I suggest that we ${actionEn}, using whether ${guardrailEn} as our shared decision rule.`,
      `我理解对增加运营复杂度的担忧。然而，当前信号是${signalZh}。我建议${actionZh}，并把“${guardrailZh}”作为共同决策规则。`,
    ],
    pilot: [
      `We propose a controlled pilot in which we ${actionEn}. The primary metric is ${metricEn}, and the guardrail is whether ${guardrailEn}. We will compare the pilot with a stable baseline before deciding whether to scale.`,
      `我们建议开展受控试点，在试点中${actionZh}。主要指标是${metricZh}，护栏是${guardrailZh}。在决定是否扩大前，我们会把试点结果与稳定基线比较。`,
    ],
    executive: [
      `Bottom line: ${signalEn}. The likely driver is that ${causeEn}. I recommend that we ${actionEn}; the decision needed today is whether to proceed under the guardrail that ${guardrailEn}.`,
      `结论是：${signalZh}。可能的驱动因素是${causeZh}。我建议${actionZh}；今天需要决定是否在“${guardrailZh}”这一护栏下推进。`,
    ],
    negotiate: [
      `Our shared goal is to improve ${metricEn}. We can be flexible on rollout timing, but we should not compromise the requirement that ${guardrailEn}. A workable package is to ${actionEn} and review the result against agreed evidence.`,
      `我们的共同目标是改善${metricZh}。我们可以在上线时间上灵活处理，但不能放弃“${guardrailZh}”这一要求。可行的整体方案是${actionZh}，并根据商定证据复盘结果。`,
    ],
    interview: [
      `The problem was that ${signalEn}. I analyzed the operating evidence, identified that ${causeEn}, and recommended that we ${actionEn}. The result created a measurable basis for improving ${metricEn}, and I learned to define the guardrail before execution.`,
      `当时的问题是${signalZh}。我分析了运营证据，识别出${causeZh}，并建议${actionZh}。结果为改善${metricZh}建立了可衡量基础，我也学会了在执行前先定义护栏。`,
    ],
  };
  return answers[archetypeId];
}

function rotateChoices(choices, seedText) {
  const offset = [...seedText].reduce((total, character) => total + character.charCodeAt(0), 0) % choices.length;
  return {
    choices: [...choices.slice(offset), ...choices.slice(0, offset)],
    correctChoice: (choices.length - offset) % choices.length,
  };
}

function makeGeneratedQuestion(topic, archetype, index) {
  const [sample, translation] = answerFor(topic, archetype.id);
  const [metricEn, metricZh] = topic.metric;
  const [, signalZh] = topic.signal;
  const firstSentence = sample.match(/^[^.!?]+[.!?]/)?.[0] || sample;
  const id = `${topic.id}-${archetype.id}`;
  const choice = index % 2 === 0;
  let activity = { mode: "arrange" };
  if (choice) {
    const rotated = rotateChoices([
      firstSentence,
      `Because ${metricEn} matters, we should launch globally before checking segments, evidence or controls.`,
      "The safest response is to wait until every uncertainty disappears and avoid naming an owner or deadline.",
    ], id);
    activity = {
      mode: "choice",
      prompt: `哪一句最适合用于“${archetype.title}”？`,
      choices: rotated.choices,
      correctChoice: rotated.correctChoice,
      feedback: `正确表达同时保留了业务事实、${metricZh}和可执行判断，没有跳过证据或护栏。`,
    };
  }
  return {
    id,
    title: `${topic.title}：${archetype.title}`,
    type: archetype.type,
    difficulty: topic.difficulty,
    activity,
    prompt: `你正在处理“${topic.title}”场景。已知${signalZh}，需要用英文向跨团队同事说明判断并推动下一步。`,
    task: choice
      ? "点击最符合业务事实、策略逻辑和专业语气的英文表达。"
      : "点击句子片段，将其排列成结论、证据和行动清晰的英文回答。",
    hint: `优先保留结论、证据、${metricZh}、行动和护栏，不要只复述背景。`,
    answer: {
      sample,
      notes: [
        `表达必须围绕${metricZh}说明业务影响，避免只有语言形式而没有判断。`,
        "参考答案使用结论、证据、行动和护栏结构，可直接迁移到邮件、会议或面试。",
      ],
      keywords: [topic.focus[0].split(" ").slice(0, 3).join(" "), metricEn, "recommendation", "guardrail"],
    },
    translation,
  };
}

const translations = {};
const topicQuestionGroups = topics.map((topic) => {
  const legacyIds = legacyQuestionIds[topic.id] || [];
  const legacyQuestions = legacyIds.map((id) => ({ ...originalQuestions.get(id), difficulty: topic.difficulty }));
  const generatedCount = 10 - legacyQuestions.length;
  const generatedQuestions = archetypes.slice(0, generatedCount)
    .map((archetype, index) => makeGeneratedQuestion(topic, archetype, index));
  const questions = [...legacyQuestions, ...generatedQuestions];
  questions.forEach((question) => {
    const translation = question.translation || source.translations?.[question.id];
    if (!translation) throw new Error(`Missing translation: ${topic.id}/${question.id}`);
    translations[question.id] = translation;
    delete question.translation;
  });
  return { topic, questions };
});

const themes = [
  { id: "payment-basics", title: "支付与商务表达基础", track: "基础表达", difficulty: 1 },
  { id: "payment-operations-foundations", title: "支付链路与商户基础", track: "支付基础", difficulty: 1 },
  { id: "business-analysis-communication", title: "数据汇报与商务协作", track: "运营沟通", difficulty: 2 },
  { id: "payment-performance-operations", title: "支付成功率与日常运营", track: "支付运营", difficulty: 2 },
  { id: "cross-functional-risk-communication", title: "跨团队协作与客户沟通", track: "复杂协作", difficulty: 3 },
  { id: "risk-economics-operations", title: "风控、验证与支付经济", track: "风险经营", difficulty: 3 },
  { id: "market-commercial-strategy", title: "市场进入与商业策略", track: "策略设计", difficulty: 4 },
  { id: "scaled-merchant-governance", title: "规模化经营与合规治理", track: "经营治理", difficulty: 4 },
  { id: "advanced-payment-strategy", title: "高阶支付与资金战略", track: "高阶策略", difficulty: 5 },
  { id: "interview", title: "高管决策、谈判与英文面试", track: "综合实战", difficulty: 5 },
];

const levels = themes.map((theme, themeIndex) => {
  const groups = topicQuestionGroups.slice(themeIndex * 5, themeIndex * 5 + 5);
  const topicTitles = groups.map(({ topic }) => topic.title);
  const questions = groups.flatMap((group) => group.questions);
  return {
    id: theme.id,
    title: theme.title,
    topicIds: groups.map(({ topic }) => topic.id),
    subtitle: topicTitles.join(" · "),
    objective: `能够围绕${topicTitles.join("、")}，用清晰英文完成事实解释、经营判断和行动建议。`,
    chapter: `第 ${themeIndex + 1} 关 · ${theme.track}`,
    story: `本关包含 5 个子主题、50 道题，从概念理解逐步推进到数据、协作与决策表达。`,
    difficulty: theme.difficulty,
    reward: {
      title: `${theme.title}表达卡`,
      description: "完成本关后，可复用以下表达结构。",
      items: [
        `The primary metric is ${groups[0].topic.metric[0]}.`,
        `I recommend that we ${groups[2].topic.action[0]}.`,
        `We should scale only if ${groups[4].topic.guardrail[0]}.`,
      ],
    },
    questions,
  };
});

const pack = {
  version: 5,
  skillId: "business-english",
  title: "业务英语闯关",
  summary: "500 道分级客观题归入 10 个主题关卡，每关 50 题。内容以支付业务策略运营为主线，并覆盖邮件、会议、汇报、谈判、跨区域协作和英文面试。",
  story: "从基础支付表达开始，逐步处理经营分析、商户运营、风险定价、市场策略与高层决策，在真实业务情境中建立可调用的英文表达。",
  ui: { compact: true, modeLabels: { warmup: "单选题", arrange: "句子排序" } },
  levels,
  translations,
};

fs.writeFileSync(packPath, `${JSON.stringify(pack, null, 2)}\n`);

const challengeDir = path.join(__dirname, "..", "challenges", "business-english");
const levelDir = path.join(challengeDir, "levels");
fs.mkdirSync(levelDir, { recursive: true });

const runtimeLevels = levels.map((level) => ({
  ...level,
  questions: level.questions.map((question) => ({
    ...question,
    answer: { ...question.answer, translation: translations[question.id] },
  })),
}));
runtimeLevels.forEach((level) => {
  fs.writeFileSync(path.join(levelDir, `${level.id}.json`), `${JSON.stringify({
    version: pack.version,
    skillId: pack.skillId,
    ...level,
  }, null, 2)}\n`);
});

const manifest = {
  version: pack.version,
  skillId: pack.skillId,
  title: pack.title,
  summary: pack.summary,
  story: pack.story,
  ui: pack.ui,
  chunked: true,
  levels: runtimeLevels.map((level) => ({
    id: level.id,
    title: level.title,
    subtitle: level.subtitle,
    objective: level.objective,
    chapter: level.chapter,
    story: level.story,
    difficulty: level.difficulty,
    topicIds: level.topicIds,
    reward: level.reward,
    file: `challenges/business-english/levels/${level.id}.json`,
    questions: level.questions.map((question) => ({
      id: question.id,
      title: question.title,
      type: question.type,
      difficulty: question.difficulty,
      activity: question.activity?.mode ? { mode: question.activity.mode } : undefined,
    })),
  })),
};
fs.writeFileSync(path.join(challengeDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Generated ${levels.length} levels and ${levels.flatMap((level) => level.questions).length} questions.`);
