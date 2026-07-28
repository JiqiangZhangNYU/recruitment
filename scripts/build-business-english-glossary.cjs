const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.join(__dirname, "..");
const outputPath = path.join(repoRoot, "challenges", "core-vocabulary", "glossary.json");
const entries = [];

function addEntries(category, source) {
  source.trim().split("\n").forEach((line) => {
    const separator = line.indexOf("|");
    if (separator < 1) throw new Error(`Invalid glossary line: ${line}`);
    entries.push({
      term: line.slice(0, separator).trim(),
      definition: line.slice(separator + 1).trim(),
      category,
    });
  });
}

addEntries("核心概念", `
payment|付款方通过约定渠道向收款方转移资金的过程
transaction|在支付系统中被记录和处理的一笔交易
merchant|接受客户付款并提供商品或服务的商家
customer|购买商品或服务并发起付款的个人或企业
card|由银行或支付机构发行的支付卡
payment method|客户在收银台可选择的具体付款方式
checkout|客户确认订单并完成付款的收银环节
authorization|发卡行核验交易并决定是否预留额度的过程
capture|商户确认交易并正式发起扣款的过程
settlement|交易资金按清算结果划转至收款方的过程
refund|商户把已收交易款退还给客户的操作
chargeback|发卡行根据持卡人争议撤回交易款项的流程
issuer|向客户发行支付卡并决定授权结果的金融机构
acquirer|为商户接入卡网络并处理收款的金融机构
payment service provider (PSP)|为商户提供支付接入、处理和运营服务的支付服务商
card network|制定银行卡交易规则并连接发卡行与收单行的卡组织
payment gateway|在商户和支付处理方之间安全传递交易信息的网关
payment processor|执行交易路由、授权报文和处理逻辑的服务方
bank transfer|付款方通过银行账户向收款账户转账的方式
digital wallet|保存支付凭证并帮助客户快速付款的数字钱包
payment success rate|成功完成的支付笔数占全部支付尝试的比例
conversion rate|从某一步骤成功进入目标步骤的用户比例
approval rate|获得授权批准的交易占授权请求的比例
decline|支付请求被发卡行、风控或系统拒绝的结果
response code|支付参与方返回、用于说明处理结果的代码
payment status|交易在授权、请款、退款或结算流程中的当前状态
order|客户提交并等待履约的一次购买记录
fee|支付服务或交易处理所收取的费用
cost|完成支付服务需要承担的资源和资金支出
revenue|企业因提供商品或服务取得的收入
payment volume|指定期间内处理的支付交易总量
transaction value|单笔交易或一组交易对应的金额
currency|交易计价、扣款或结算使用的货币
cross-border payment|付款方与收款方位于不同国家或地区的支付
fraud|通过欺骗、盗用或操纵方式获取不当利益的行为
risk|可能导致损失、违规或业务中断的不确定因素
compliance|业务遵守法律、监管规则和内部政策的状态
KYC|识别并验证个人客户身份的客户尽职调查流程
KYB|识别并验证企业及其所有权信息的商户核验流程
AML|用于预防、识别和报告洗钱活动的反洗钱体系
reconciliation|核对订单、交易、费用和银行资金记录是否一致的过程
payout|平台或支付机构向商户、卖家等收款方划款的操作
bank account|由银行维护、用于存取和收付资金的账户
balance|某一时点账户中可用或账面记录的资金金额
invoice|列明商品服务、金额、税费和付款条件的账单
billing|计算应收费用并向客户或商户出具账单的过程
subscription|客户按周期持续购买产品或服务的商业模式
recurring payment|依据授权按固定或约定周期重复发起的付款
retry|支付失败后按规则再次提交交易请求的动作
routing|根据规则把交易发送给不同处理通道的过程
integration|商户系统与支付系统连接并协同工作的实施过程
API|系统之间以标准接口交换请求和数据的机制
webhook|支付状态变化时由服务端主动推送给商户的通知
token|替代敏感支付凭证、可受控使用的唯一标识
authentication|核验付款人是否为合法账户或凭证持有人的过程
3D Secure (3DS)|由卡组织支持、用于银行卡线上交易身份验证的协议
data|用于描述交易、客户或经营结果的事实记录
metric|用统一口径衡量业务状态或结果的量化指标
dashboard|集中展示关键指标、趋势和异常的数据看板
report|按目的组织事实、分析、结论和行动的业务报告
baseline|用于衡量变化效果的初始值或对照水平
target|团队希望在指定时间内达到的量化目标
trend|指标随时间持续变化的方向和形态
segment|按照共同特征划分的一组客户、商户或交易
market|具有共同客户需求和竞争环境的业务区域
region|为经营和管理目的划分的地理范围
partner|与企业共同提供能力或推进业务的外部合作方
contract|明确合作权利、义务和责任的正式协议
service-level agreement (SLA)|约定服务可用性、响应时限和补救措施的协议
onboarding|引导并审核新客户或商户完成接入的过程
verification|使用数据或文件确认信息真实性的过程
dispute|客户或交易参与方对支付结果提出的正式异议
evidence|用于证明事实、解释判断或支持争议处理的材料
deadline|任务、举证或决策必须完成的最晚时间
owner|对一项结果承担明确责任的个人或团队
action item|会议或计划中明确负责人和期限的待办事项
root cause|导致问题发生并可被纠正的底层原因
incident|对客户、资金或系统造成实际影响的异常事件
outage|系统或服务完全或部分不可用的中断
impact|某项变化对客户、收入、成本或风险造成的结果
priority|依据价值、紧迫性和风险确定的处理先后顺序
recommendation|基于事实和取舍提出的建议方案
decision|在多个选项之间做出的明确选择
trade-off|为了获得某项收益而接受另一项成本或限制的取舍
pilot|在有限范围内验证方案效果和风险的试点
rollout|把已验证的产品或规则逐步推广到更大范围的过程
launch|产品、市场或支付能力正式对外启用
strategy|为实现长期目标而选择的方向、资源和行动组合
pricing|确定产品或支付服务收费方式与水平的过程
margin|收入扣除相关成本后保留的收益比例或金额
conversion|客户从意向或访问转变为完成目标行为的过程
retention|客户或商户在一段时间后仍继续使用服务的情况
churn|客户或商户停止使用或不再续约的流失现象
cohort|在同一时期或具有相同特征的一组分析对象
funnel|描述客户从进入到完成目标各步骤转化的漏斗
guardrail|防止方案在增长同时突破风险或体验底线的约束指标
stakeholder|会影响项目或受到项目结果影响的利益相关方
escalation|把超出当前权限或风险阈值的问题向上升级处理
roadmap|按时间展示能力建设和交付顺序的路线图
milestone|用于判断项目阶段性完成情况的关键节点
`);

addEntries("支付链路", `
dependency|任务完成所依赖的外部条件、团队或交付物
business case|用收益、成本、风险和假设论证方案价值的商业论证
unit economics|按单个客户、商户或交易衡量收入与成本的经济模型
checkout completion rate|进入收银台后成功完成付款的客户比例
cart abandonment|客户加入商品后未完成结账或付款的行为
payment page|用于展示金额、支付方式并收集付款信息的页面
payment link|通过链接把客户带到指定付款页面的收款方式
payment intent|记录一次付款目标、金额和处理状态的支付对象
payment request|商户或系统向支付方发出的付款处理请求
payment confirmation|证明交易已达到所需成功状态的确认信息
payment failure|支付尝试未达到预期完成状态的结果
soft decline|可能通过补充验证或稍后重试恢复的临时拒绝
hard decline|通常不应重试、需要更换方式或联系银行的永久拒绝
issuer decline|由发卡行基于额度、风险或账户状态作出的拒绝
technical decline|由网络、超时或系统错误造成的技术性失败
timeout|请求在规定时间内未收到有效响应的情况
latency|系统从接收请求到返回结果所需的延迟时间
availability|系统在需要时能够正常提供服务的程度
uptime|服务在统计期间保持可用的时间比例
idempotency|同一请求重复提交时只产生一次业务结果的机制
duplicate charge|同一购买被客户重复扣款的异常
partial capture|只对授权金额中的一部分进行正式请款
delayed capture|在授权成功后延迟到履约时再发起请款
authorization hold|授权后在持卡人额度中暂时冻结的金额
authorization reversal|在无需扣款时释放原授权占用额度的操作
void|在交易完成结算前取消授权或请款的操作
partial refund|只退还原交易金额中一部分的退款
full refund|退还原交易全部可退金额的退款
refund status|退款在提交、处理、完成或失败流程中的状态
refund policy|企业对退款条件、时限和方式作出的规则说明
refund window|允许发起或预计完成退款的时间范围
dispute reason code|卡组织用于标识争议原因和举证要求的代码
representment|商户提交证据、对拒付提出抗辩的流程
pre-arbitration|拒付抗辩后、进入正式仲裁前的再次争议阶段
arbitration|由卡组织裁定争议责任和资金归属的正式程序
retrieval request|发卡行在正式拒付前向商户索取交易资料的请求
compelling evidence|能够有力证明交易有效或客户已获服务的证据
dispute deadline|商户必须提交争议材料或回应的最晚日期
friendly fraud|真实客户对本人交易错误或恶意发起争议的行为
first-party fraud|账户真实持有人利用规则漏洞实施欺诈的行为
payment credential|可用于识别付款账户并发起交易的敏感凭证
cardholder|支付卡账户的合法持有人
cardholder verification|确认使用者有权使用该支付卡的验证过程
CVV|印在卡片上、用于辅助验证持卡权限的安全码
AVS|通过核对账单地址帮助识别银行卡风险的验证服务
PAN|用于唯一标识银行卡账户的主账号
BIN|银行卡号前段、用于识别发卡机构和卡产品的编号
tokenization|用受限令牌替代真实卡号等敏感数据的过程
network token|由卡组织签发并可随卡状态更新的支付令牌
account updater|在卡片换发或到期后自动更新卡信息的服务
card-on-file|商户在客户授权后保存卡凭证用于后续付款的安排
credential-on-file|商户或服务商保存并复用支付凭证的业务模式
stored credential|经客户授权保存、可用于后续交易的支付凭证
merchant-initiated transaction|在客户不在线时由商户按既有授权发起的交易
customer-initiated transaction|客户当次主动参与并确认发起的交易
recurring billing|按约定周期自动计算并收取订阅费用的过程
subscription renewal|订阅到期后继续下一服务周期的续订
payment schedule|规定付款日期、频率和金额的支付计划
grace period|付款到期后仍允许客户补付而不立即终止服务的宽限期
dunning|通过提醒、重试和沟通追回订阅欠款的流程
involuntary churn|因支付失败而非客户主动意愿造成的流失
payment recovery|通过重试或更新支付方式挽回失败付款的过程
retry rule|规定哪些失败类型可以在何时重试的逻辑
retry window|允许再次提交失败交易的时间范围
retry limit|对同一交易或账户允许重试次数的上限
smart routing|依据实时表现、成本和风险动态选择通道的路由方式
dynamic routing|随交易特征和通道状态实时变化的路由策略
fallback routing|首选通道不可用或失败时切换备用通道的机制
routing rule|决定交易发送目标和顺序的条件规则
routing priority|多个可用通道之间预先设定的选择顺序
cascading|交易失败后依次尝试其他支付通道的处理方式
acquirer routing|在多家收单机构之间选择交易处理路径
issuer routing|根据发卡行特征优化交易路径的策略
local acquiring|通过交易发生市场内的本地收单机构处理付款
cross-border acquiring|通过境外收单实体处理当地客户付款
acquiring bank|为商户提供银行卡受理和资金结算服务的银行
merchant account|用于接收和管理商户支付结算资金的账户
merchant category code (MCC)|卡组织用于标识商户主营行业的四位代码
terminal ID|标识具体支付终端或受理渠道的编号
merchant ID (MID)|收单体系中唯一标识商户关系的编号
payment facilitator (PayFac)|代表收单机构聚合并管理多个子商户的平台
sub-merchant|通过支付聚合方接入收单服务的下级商户
marketplace|连接多个买家与卖家并协调交易的平台
platform payment|平台为生态内交易提供的收付和资金管理能力
split payment|把一笔客户付款按规则分配给多个收款方
split settlement|在结算时把交易净额分别划给多个参与方
escrow|由中立方暂时保管资金、满足条件后再释放的安排
reserve|为覆盖退款、拒付或信用风险预留的资金
rolling reserve|按比例滚动扣留交易款并在未来逐期释放的准备金
payout schedule|规定平台向商户或卖家付款频率和日期的计划
settlement cycle|从交易处理到资金结算完成的周期
settlement file|列明结算交易、费用和调整项的数据文件
settlement date|交易资金按规则实际完成结算的日期
transaction date|客户发起或系统记录交易发生的日期
value date|银行从该日期起计算资金价值或利息的日期
cut-off time|决定交易计入当日还是下一处理日的截止时点
net settlement|参与方按应收应付轧差后的净额完成结算
gross settlement|每笔或每项资金义务按全额分别结算
clearing|计算各参与方交易义务并形成结算结果的过程
funds flow|资金在客户、商户和支付参与方之间移动的路径
`);

addEntries("数据经营", `
reconciliation rate|在规定时间内成功匹配的交易占应对账交易的比例
unreconciled transaction|尚未在订单、支付和银行记录间完成匹配的交易
matching rule|用于把不同系统记录识别为同一交易的匹配逻辑
ledger|按会计规则持续记录资金变动的分类账
sub-ledger|按业务对象记录明细并汇总到总账的辅助账
general ledger|汇总企业全部会计科目和余额的总账
journal entry|记录一项经济业务借贷变化的会计分录
bank statement|银行提供的账户交易和余额对账单
variance|实际结果与计划、基线或另一数据源之间的差异
settlement difference|应结算金额与实际到账金额之间的差额
adjustment|为纠正差异或反映特殊事项作出的账务调整
write-off|确认无法收回或无需继续追踪后核销账面金额的处理
audit trail|可追溯每次数据、审批和资金变化的审计记录
source of truth|被团队共同认可、作为最终口径的权威数据源
data definition|对字段、指标范围和计算规则的明确说明
numerator|比率计算中位于分数上方的计数或金额
denominator|比率计算中用于确定总体范围的基数
percentage point|两个百分比之间的绝对差值单位
growth rate|某项指标相对前期或基线增长的比例
month over month|本月结果与上月结果之间的环比比较
year over year|本期结果与上年同期之间的同比比较
quarter over quarter|本季度结果与上一季度之间的环比比较
moving average|用连续多个期间均值平滑短期波动的指标
benchmark|用于判断当前表现好坏的行业或历史参照标准
threshold|达到后会触发提醒、控制或决策的数值边界
confidence interval|用于表示统计估计值可能范围和不确定性的区间
sample size|分析或实验中实际纳入观察的对象数量
statistical significance|观察到的差异不太可能由随机波动造成的程度
control group|实验中不接受新方案、用于比较结果的对照组
test group|实验中接受新方案并观察效果的实验组
experiment|在可控条件下验证因果假设的测试
A/B test|把对象随机分组并比较两个版本效果的实验方法
uplift|新方案相对基线带来的增量改善
incremental impact|扣除自然变化后可归因于方案的额外影响
attribution|把业务结果合理分配给不同渠道或行动的分析过程
correlation|两个变量共同变化但不必然存在因果关系的统计关联
causation|一个因素的变化直接导致另一结果变化的因果关系
mix shift|不同类型对象占比变化导致汇总指标改变的现象
cohort analysis|按共同起点或特征分组比较长期表现的分析方法
funnel analysis|逐层分析业务流程各步骤转化和流失的方法
segmentation|依据价值、行为或风险把对象划分为不同群组
outlier|明显偏离大多数观察值的异常数据点
anomaly|与正常模式不一致、需要调查的异常现象
data quality|数据在准确、完整、一致和及时方面的整体水平
data completeness|必需字段和记录没有缺失的程度
data accuracy|数据正确反映真实业务事实的程度
reporting accuracy|报告指标、口径和结论正确可复现的程度
payment performance|支付在成功率、速度、成本和稳定性方面的综合表现
authorization approval rate|获发卡行批准的授权请求所占比例
end-to-end success rate|从发起到最终完成整个链路均成功的交易比例
drop-off rate|进入某一步骤后未继续完成下一步的对象比例
retry recovery rate|通过重试成功挽回的失败支付所占比例
dispute rate|发生支付争议的交易占全部相关交易的比例
chargeback rate|形成拒付的交易占全部相关银行卡交易的比例
refund rate|发生退款的交易或金额占全部交易的比例
fraud rate|被识别为欺诈的交易占全部交易的比例
false-positive rate|正常交易被风控错误拦截的比例
acceptance rate|通过支付、风控或业务审核的请求比例
conversion uplift|新方案相对对照带来的转化率增量
cost per transaction|总处理成本除以交易笔数得到的单笔成本
cost per successful payment|总支付成本除以成功支付笔数得到的成本
take rate|平台或支付服务收入占交易总额的比例
net revenue|扣除退款、折扣和直接扣减项后的净收入
gross revenue|扣除相关成本和费用前确认的总收入
contribution margin|收入扣除可变成本后用于覆盖固定成本和利润的金额
customer lifetime value|客户在完整关系周期内预计贡献的净价值
merchant lifetime value|商户在合作周期内预计贡献的净价值
customer acquisition cost|获取一名新增客户平均投入的营销和销售成本
cost to serve|持续服务某类客户或商户所需的综合运营成本
break-even point|累计收入刚好覆盖累计成本的盈亏平衡点
return on investment|投资产生的净收益相对于投入金额的比例
payback period|项目产生的现金收益覆盖初始投入所需时间
`);

addEntries("风险合规", `
risk appetite|企业愿意为实现目标主动承担的总体风险水平
risk tolerance|具体业务指标可以接受的风险波动范围
risk threshold|超过后必须拦截、升级或采取行动的风险边界
risk score|模型基于多项信号计算的风险高低数值
risk tier|根据风险水平划分的客户、商户或交易等级
fraud rule|根据交易特征决定放行、验证或拦截的风控规则
fraud model|使用数据预测交易欺诈概率的统计或机器学习模型
fraud signal|能够提示潜在欺诈行为的特征或事件
device fingerprint|结合设备属性形成、用于识别设备的特征标识
velocity check|检查短时间内交易次数或金额是否异常的规则
transaction monitoring|持续监测交易模式并识别可疑活动的过程
suspicious activity|与客户正常行为不符、可能涉及违规的活动
sanctions screening|把客户和交易方与制裁名单进行比对的检查
watchlist screening|把对象与监管或内部关注名单进行匹配的检查
politically exposed person (PEP)|因重要公共职务而具有较高腐败风险的个人
beneficial owner|最终拥有、控制企业或从中获得利益的自然人
ultimate beneficial owner (UBO)|处于所有权链条末端的最终受益所有人
customer due diligence (CDD)|识别客户、理解关系目的并评估风险的尽调
enhanced due diligence (EDD)|针对高风险客户开展的更深入调查和持续审查
ongoing monitoring|在客户关系存续期间持续检查信息和交易的过程
source of funds|某一笔资金的直接来源及形成方式
source of wealth|客户整体财富长期积累的来源
transaction limit|对交易金额、次数或期间总量设置的上限
exposure|企业在特定客户、合作方或事件中可能承受的损失规模
loss rate|损失金额占相关交易金额或收入的比例
fraud loss|因确认欺诈交易产生的资金损失
expected loss|根据风险概率和损失规模估计的平均潜在损失
loss prevention|通过规则、验证和运营措施减少损失的活动
risk-based authentication|根据实时风险决定是否增加身份验证的机制
step-up authentication|发现较高风险后要求客户完成额外验证
frictionless flow|不打断客户付款、在后台完成风险判断的验证流程
challenge flow|要求客户主动完成验证码或银行确认的验证流程
exemption|符合规则时可免于执行某项强制要求的例外
low-value exemption|针对低金额交易适用的强验证豁免
transaction risk analysis (TRA)|基于实时风险分析申请强验证豁免的方法
strong customer authentication (SCA)|使用至少两类独立要素验证付款人的机制
two-factor authentication|使用两种不同类别凭证完成身份验证
biometric authentication|使用指纹、面容等生物特征核验身份
one-time password (OTP)|只能使用一次且短时间有效的验证码
passkey|基于公钥密码技术、可替代传统密码的登录凭证
liability shift|满足指定验证条件后欺诈责任在参与方之间转移
data breach|敏感或受保护数据被未授权访问、泄露或窃取的事件
account takeover|攻击者控制他人账户并进行未经授权操作的行为
phishing|通过伪装信息诱导用户交出凭证的欺诈方式
card testing|用大量小额尝试验证被盗卡信息是否有效的行为
credential stuffing|自动尝试复用泄露账号密码以接管账户的攻击
money laundering|掩盖非法资金来源并使其看似合法的过程
terrorist financing|为恐怖活动募集、转移或提供资金的行为
compliance review|检查业务方案是否满足法规和内部政策的评审
regulatory requirement|监管机构对业务必须遵守的具体要求
regulatory perimeter|决定哪些活动、实体和产品受特定监管约束的边界
licensing|申请并维持开展受监管支付业务所需许可的过程
payment institution|依法获得许可并提供支付服务的非银行机构
money transmitter|依法为客户接收并转移资金的持牌服务商
safeguarding|将客户资金隔离并保护其不受机构破产影响的措施
data privacy|规范个人数据收集、使用、共享和保存的原则与要求
consent|数据主体或客户对特定处理或付款作出的明确授权
data residency|要求数据在指定国家或地区存储和处理的规定
PCI DSS|保护支付卡数据安全的行业标准
PSD2|欧盟规范支付服务、开放银行和强验证的第二版指令
GDPR|欧盟关于个人数据保护和处理的通用法规
AML policy|企业用于落实反洗钱要求的制度和操作规则
KYC policy|企业用于识别、验证和持续了解个人客户的政策
KYB check|对企业资质、经营和所有权信息进行的核验
risk control|用于降低风险发生概率或损失程度的措施
control effectiveness|风险控制实际达到预期防护效果的程度
control owner|负责设计、执行和监控某项控制的人或团队
remediation|针对已发现问题制定并完成纠正措施的过程
`);

addEntries("商户产品", `
merchant onboarding|引导商户提交资料、通过审核并完成支付接入的流程
onboarding completion rate|开始入驻后成功完成全部步骤的商户比例
time to first transaction|商户从开始接入到完成首笔交易所需时间
application form|申请人提交企业、业务和联系人信息的表单
business registration|企业依法完成设立并取得登记证明的状态
legal entity|依法成立、能够承担权利和义务的组织
entity type|企业在法律和经营上的组织形式类别
incorporation document|证明企业设立、名称和注册信息的正式文件
ownership structure|说明企业股东层级、持股比例和控制关系的结构
bank account verification|确认收款账户真实存在且归属正确主体的核验
manual review|由审核人员判断资料、风险或例外情况的流程
automated review|由系统按规则和模型自动完成的审核
approval workflow|申请从提交到审查、批准和通知的流程
rejection reason|申请或交易未获批准的明确原因
merchant profile|汇总商户业务模式、规模、地区和风险的信息画像
merchant segment|按规模、行业、价值或需求划分的商户群体
small and medium-sized enterprise (SME)|规模处于规定范围内的中小型企业
enterprise merchant|交易规模大、集成复杂且需要定制服务的大型商户
strategic merchant|对收入、品牌或能力建设具有重要价值的商户
key account|需要专门团队维护和经营的重要客户账户
account management|持续维护客户关系并推动价值增长的工作
merchant support|帮助商户解决支付、资金和产品使用问题的服务
support ticket|记录问题、优先级、处理过程和结果的服务工单
contact rate|每单位客户、商户或交易产生的服务咨询比例
resolution time|问题从创建到确认解决所经历的时间
first response time|客户提交问题后收到首次有效回复所需时间
service quality|服务在准确性、速度、稳定性和体验方面的水平
customer complaint|客户对产品、付款或服务结果提出的不满
merchant satisfaction|商户对产品能力和服务体验的满意程度
net promoter score (NPS)|用推荐意愿衡量客户忠诚度的指标
product adoption|目标用户开始使用某项产品或能力的过程
feature adoption|已有用户启用并持续使用具体功能的情况
activation rate|完成关键首次使用行为的新增用户比例
engagement rate|用户在指定期间内发生有效互动的比例
retention rate|一段时间后仍保持活跃或继续使用的用户比例
renewal rate|到期客户中选择继续订阅或续签的比例
churn rate|指定期间内停止使用或结束关系的客户比例
checkout conversion|进入结账流程后最终完成订单或支付的比例
payment method mix|各类支付方式在全部交易中的占比结构
local payment method (LPM)|在特定国家或地区广泛使用的本地支付方式
alternative payment method (APM)|银行卡之外的钱包、转账等替代支付方式
buy now, pay later (BNPL)|客户先消费并在之后一次或分期付款的方式
account-to-account payment (A2A)|资金直接从付款银行账户转到收款账户的支付
real-time payment (RTP)|资金和确认信息可在极短时间内完成的支付
instant payment|全天候近乎实时完成到账的账户支付
direct debit|收款方依据授权从客户银行账户主动扣款的方式
credit transfer|付款方指示银行把资金转入收款账户的方式
cash on delivery|客户在商品送达时使用现金或现场方式付款
QR code payment|客户扫描或出示二维码完成信息交换和付款
mobile money|以手机号关联账户、主要通过移动终端使用的支付服务
e-wallet|在电子账户中保存余额或支付凭证的钱包产品
open banking|经客户授权通过开放接口共享账户数据或发起支付
payment initiation service|经客户授权从银行账户发起付款的服务
account information service|经客户授权聚合并展示多个账户信息的服务
request to pay|收款方向付款方发送可确认或拒绝的付款请求
request for payment|包含金额和用途、邀请客户完成付款的请求
recurring card payment|使用保存的银行卡凭证按周期重复扣款
installment payment|把应付金额分成多个时间点偿还的付款安排
deferred payment|客户先获得商品服务、在约定未来日期付款的方式
payment orchestration|统一连接多个支付服务并集中管理路由和数据的能力
`);

addEntries("定价外汇", `
interchange fee|收单侧通常向发卡行支付的银行卡交换费
scheme fee|卡组织因网络使用、处理或品牌服务收取的费用
processing fee|支付服务商因处理交易所收取的费用
gateway fee|支付网关因传输和连接交易请求收取的费用
cross-border fee|因交易涉及不同国家或地区而收取的附加费
foreign exchange fee|因货币兑换或跨币种处理产生的费用
refund fee|处理退款时由支付服务方收取的费用
chargeback fee|发生拒付时向商户收取的处理费用
payout fee|向商户或卖家划付资金时收取的费用
fixed fee|不随交易金额变化、按笔或按期收取的费用
variable fee|随交易金额或业务规模按比例变化的费用
blended pricing|把多类底层成本合并为统一费率的定价方式
interchange-plus pricing|按实际交换费和卡组织费再加服务商加价的定价
tiered pricing|根据交易类别或业务量适用不同费率档位的定价
flat-rate pricing|对大多数交易使用统一固定比例的定价方式
volume discount|业务量达到约定条件后给予的价格优惠
minimum fee|即使使用量较低也必须支付的最低费用
monthly fee|按月固定收取的平台、账户或服务费用
setup fee|首次配置、审核或接入服务时收取的一次性费用
pricing tier|根据规模、风险或服务内容划分的价格档位
price floor|为覆盖成本和价值而设定的最低可接受价格
price ceiling|合同、监管或市场允许的最高价格水平
price elasticity|需求量对价格变化敏感程度的衡量
willingness to pay|客户为获得某项价值愿意支付的最高金额
value-based pricing|依据客户获得的业务价值而非单纯成本定价
cost-based pricing|在成本基础上增加目标利润形成价格的方法
markup|在底层成本之上增加的价格金额或比例
discount rate|相对标准价格给予客户的折扣比例
gross margin|收入扣除直接成本后占收入的比例
net margin|扣除全部相关成本和费用后净利润占收入的比例
contribution margin per transaction|每笔交易收入扣除可变成本后的贡献金额
payment economics|支付业务收入、成本、风险损失和资本占用的综合经济性
cross-border economics|跨境支付中汇兑、通道、合规和资金成本的综合收益
foreign exchange (FX)|一种货币兑换为另一种货币的交易和市场
exchange rate|两种货币之间的兑换比率
FX spread|客户兑换价与基准外汇价格之间的差额
currency conversion|按适用汇率把金额从一种货币换算为另一种货币
dynamic currency conversion (DCC)|让持卡人在境外收银台选择用本币计价的服务
settlement currency|参与方最终接收或支付结算资金的货币
transaction currency|商品价格和原始交易金额所使用的货币
multi-currency pricing|商户同时以多种货币向不同客户展示价格
local currency pricing|在目标市场使用客户熟悉的当地货币定价
`);

addEntries("策略治理", `
treasury|管理企业现金、融资、流动性和金融风险的职能
liquidity|资产在不显著损失价值时满足付款需求的能力
liquidity buffer|为应对短期资金波动预留的高流动性资金
working capital|支持日常经营的流动资产减流动负债后的净额
cash flow|一定期间内现金流入和流出的变化
cash forecast|对未来各期间现金流入、流出和余额的预测
funding requirement|为满足运营、结算或投资需要必须筹集的资金量
prefunding|在交易或结算发生前预先存入所需资金的安排
reserve fund|为覆盖退款、争议或意外损失专门留存的资金
settlement risk|一方已履约但未能收到对方结算资金的风险
counterparty risk|交易或合作对手无法履行合同义务的风险
credit risk|借款人或交易对手不能按约偿还资金的风险
operational risk|流程、人员、系统或外部事件导致损失的风险
regulatory risk|法规变化或不合规行为导致处罚和业务受限的风险
concentration risk|业务过度依赖单一市场、客户或合作方的风险
currency risk|汇率变化导致收入、成本或资产价值波动的风险
hedging|使用金融工具或业务安排降低价格和汇率波动风险
payment portfolio|企业采用的支付方式、通道和合作方的整体组合
payment capability|支持特定支付场景所需的产品、技术和运营能力
capability gap|现有能力与目标业务要求之间的差距
build-or-buy decision|在自建能力与采购外部方案之间作出的选择
vendor selection|依据能力、成本、风险和服务水平选择供应商的过程
request for proposal (RFP)|邀请供应商按统一要求提交解决方案和报价的文件
due diligence|合作或投资前对能力、财务、合规和风险进行的调查
feasibility assessment|判断方案在技术、经济和运营上是否可行的评估
market entry|企业把产品或服务带入新国家、地区或客群的行动
market opportunity|由客户需求、市场规模和竞争空白形成的商业机会
market sizing|估算目标市场客户数量、交易规模或收入空间的过程
total addressable market (TAM)|不考虑现实限制时产品可服务的全部市场规模
serviceable addressable market (SAM)|在产品和地域范围内实际能够服务的市场规模
competitive landscape|目标市场主要竞争者、能力和定位的整体格局
competitive advantage|企业相对竞争者可持续创造更高价值的能力
value proposition|产品为目标客户解决问题并创造价值的清晰主张
go-to-market strategy|产品触达客户、销售、定价和交付的市场进入方案
localization|按本地语言、习惯、支付方式和法规调整产品与运营
local requirement|特定国家、行业或客户必须满足的本地要求
launch readiness|产品、运营、合规和支持达到可上线状态的程度
go/no-go decision|根据证据决定项目上线或暂停的正式决策
phased rollout|按地区、客群或流量比例逐阶段扩大上线范围
rollback plan|出现异常时把系统或规则恢复到原状态的预案
rollback threshold|指标达到后必须执行回滚的明确触发条件
contingency plan|主要方案失败时用于维持业务的备用计划
incident response|发现事故后进行识别、止损、修复和沟通的过程
business continuity|在严重中断期间维持关键业务运行的能力
disaster recovery|重大故障后恢复系统、数据和服务的计划与能力
escalation path|问题按严重程度向更高权限负责人传递的路径
decision rights|明确谁有权提出、审核和最终批准决策的安排
governance|通过规则、职责和监督机制控制组织决策与执行
steering committee|为重大项目提供决策、资源和监督的指导委员会
executive sponsor|为项目提供高层支持并帮助解决重大障碍的负责人
strategic priority|组织在资源有限时优先投入的长期重点
portfolio allocation|在多个产品、市场或项目之间分配资源的决策
risk-adjusted return|把预期收益与承担的风险结合后的回报水平
scenario analysis|比较多种未来情境下结果和应对方案的分析
sensitivity analysis|检验关键假设变化对结果影响程度的分析
negotiation|各方通过交换条件寻求可接受协议的过程
commercial term|合同中关于价格、期限、服务和责任的商务条款
exit clause|规定合作终止条件、通知期限和后续责任的合同条款
`);

const exampleTemplates = {
  "核心概念": [
    [(term) => `The weekly payment review includes a section on ${term}.`, (definition) => `支付周度复盘包含关于${definition}的专门部分。`],
    [(term) => `The team clarified how ${term} affects the merchant plan.`, (definition) => `团队明确了${definition}会如何影响商户方案。`],
    [(term) => `Please add an explanation of ${term} to the next operations update.`, (definition) => `请在下一次运营更新中加入对${definition}的说明。`],
  ],
  "支付链路": [
    [(term) => `The operations team mapped the role of ${term} before changing the payment flow.`, (definition) => `运营团队在调整支付流程前梳理了${definition}在链路中的作用。`],
    [(term) => `We reviewed the treatment of ${term} with the PSP during the incident follow-up.`, (definition) => `我们在事故复盘中与支付服务商核对了${definition}的处理方式。`],
    [(term) => `The launch checklist now includes a review of ${term}.`, (definition) => `上线清单现在包含对${definition}的检查。`],
  ],
  "数据经营": [
    [(term) => `The analysis explains how ${term} affects payment performance.`, (definition) => `分析说明了${definition}会如何影响支付表现。`],
    [(term) => `The dashboard includes a dedicated view of ${term}.`, (definition) => `看板包含一个专门展示${definition}的视图。`],
    [(term) => `Please validate the calculation or use of ${term} before presenting the result.`, (definition) => `汇报结果前，请先验证${definition}的计算或使用方式。`],
  ],
  "风险合规": [
    [(term) => `The risk team reviewed ${term} before approving the rollout.`, (definition) => `风险团队在批准推广前审查了${definition}。`],
    [(term) => `Our policy defines an owner and review cycle for ${term}.`, (definition) => `我们的政策为${definition}明确了负责人和复核周期。`],
    [(term) => `The control design accounts for ${term} without hurting conversion.`, (definition) => `控制设计考虑了${definition}，同时避免损害转化。`],
  ],
  "商户产品": [
    [(term) => `The merchant plan includes a dedicated section on ${term}.`, (definition) => `商户方案包含关于${definition}的专门部分。`],
    [(term) => `We tested ${term} with a small group of merchants first.`, (definition) => `我们先在一小组商户中测试了${definition}。`],
    [(term) => `Clear guidance on ${term} reduced support contacts.`, (definition) => `关于${definition}的清晰指引减少了客服咨询。`],
  ],
  "定价外汇": [
    [(term) => `The business case includes ${term} in the profitability model.`, (definition) => `商业论证在盈利模型中纳入了${definition}。`],
    [(term) => `We compared ${term} across providers before negotiating the price.`, (definition) => `议价前，我们比较了各服务商的${definition}。`],
    [(term) => `The proposal explains how ${term} affects merchant margin.`, (definition) => `方案解释了${definition}如何影响商户利润。`],
  ],
  "策略治理": [
    [(term) => `Leaders discussed ${term} before making the investment decision.`, (definition) => `管理层在作出投资决策前讨论了${definition}。`],
    [(term) => `The strategy memo sets out the assumptions behind the use of ${term}.`, (definition) => `策略备忘录列出了采用${definition}所依据的假设。`],
    [(term) => `The plan assigns an owner to work related to ${term}.`, (definition) => `方案为与${definition}相关的工作明确了负责人。`],
  ],
};

if (entries.length !== 500) throw new Error(`Expected 500 glossary entries, received ${entries.length}`);
const normalizedTerms = entries.map((entry) => entry.term.toLocaleLowerCase("en-US"));
if (new Set(normalizedTerms).size !== entries.length) throw new Error("Glossary terms must be unique");

const glossary = entries.map((entry, index) => {
  const rank = index + 1;
  const templates = exampleTemplates[entry.category];
  const [makeExample, makeTranslation] = templates[index % templates.length];
  return {
    rank,
    term: entry.term,
    definition: entry.definition,
    example: makeExample(entry.term),
    translation: makeTranslation(entry.definition),
    category: entry.category,
    frequency: rank <= 100 ? "高频核心" : rank <= 250 ? "工作常用" : rank <= 400 ? "专业常用" : "策略进阶",
  };
});

const payload = {
  version: 1,
  title: "支付业务英语词汇表",
  summary: "从现有业务英语题库覆盖的支付、经营、风控、定价与策略场景中整理 500 个词条，并按工作中的常用程度排序。",
  count: glossary.length,
  categories: [...new Set(glossary.map((entry) => entry.category))],
  frequencyTiers: ["高频核心", "工作常用", "专业常用", "策略进阶"],
  entries: glossary,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Generated ${glossary.length} glossary entries at ${path.relative(repoRoot, outputPath)}.`);
