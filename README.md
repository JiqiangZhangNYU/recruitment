# Recruitment Shortlist

上海支付与策略运营岗位的静态筛选页面。公开数据来自互联网大厂、Airwallex、Mastercard、Adyen、Worldpay、汇付天下、易宝支付等公司官网及 BOSS 直聘，仅展示符合当前 A+/A-/B/C 规则的岗位摘要、匹配度、岗位属性、风险提示和原始链接。

筛选规则以工作地点上海为硬性标准，并优先匹配头部国际支付平台经验。A+ 必须同时属于明确支付业务和大平台或头部支付机构；A- 必须是相关策略运营，并至少满足支付或大平台之一；两档均排除频繁出差和明显招聘风险。B 必须是数据驱动的相关增长或策略运营岗位；C 最多 10 个，仅保留关闭岗位或必要的原始标杆供方向参考，不建议投递。

网页包含独立的技能提升页。它以 68 个 A 档岗位为样本，把重叠内容整理为边界清晰的技能域：P0 合并通用底盘与支付、英语、国际市场核心专项，P1 保留电商经营、研究洞察和实验验证；点击提升计划后直接显示技能总览，也可从左侧目录进入单项训练。核心能力中的六项设有懒加载题库，共 42 章 668 题：业务英语为 10 个主题关卡、每关 50 题，数据分析与经营诊断为 8 章 48 题，其余四项各 6 章 30 题。核心词汇作为独立首项，提供 500 个带美式音标的支付业务词条，可按常用程度或字母 A-Z 排序。所有题库只使用单选和排序等点击式交互，可跳过作答、直接查看参考答案或自由切换题目；词汇表支持分别遮盖中文释义、英文例句和中文翻译，并记录掌握状态。

关卡首页会从未作答的内容中随机生成“今日五题”，当天题组保持不变，同时记录每周练习天数；完成章节后会解锁一张可复用的速查卡。通用技能内容独立存放在 `learning-guide.json`，六套 P0 题库存放在 `challenges/` 并仅在进入对应技能时懒加载；业务英语拆为轻量目录和 10 个关卡文件，核心词汇的数据独立存放在 `challenges/core-vocabulary/`。核心词汇的单词、例句和面试表达配有 Kokoro 离线生成的美式英语音频，点击后按需加载，音频缺失时回退到浏览器朗读。各题库的学习进度、每日任务、词汇掌握状态和点击选择分别保存在当前浏览器。内容依据上级项目中的 `sources/recruit/A档岗位能力提升完整指南.md` 整理，因此刷新岗位数据时不会覆盖学习内容。

## 本地运行

```bash
python3 -m http.server 4173
```

打开 `http://localhost:4173/`。

## 生成核心词汇语音

语音构建依赖 Python 3.11、CPU 版 PyTorch 和 `scripts/glossary-audio-requirements.txt`。首次运行会下载 Kokoro 模型权重，之后支持断点续跑：

```bash
python scripts/build-glossary-audio.py
```

输出位于 `audio/core-vocabulary/`，共 1500 个按需加载的单声道 MP3。可以使用 `--start-rank` 和 `--end-rank` 分段并行生成，全部完成后运行 `python scripts/build-glossary-audio.py --manifest-only` 更新清单。

## 量化职业子站

商品期货量化研究员的职业画像、岗位方向和能力地图发布在 `quant/` 子目录，线上地址为 `https://jiqiangzhangnyu.github.io/recruitment/quant/`。源文件维护在 `/mnt/Data/jiqiang/job_quant/`，通过该目录下的 `scripts/sync-to-recruitment.cjs` 同步，不直接在发布副本中编辑。

## 更新数据

在上级项目目录执行：

```bash
npm run refresh:recruitment
```

官网抓取配置位于 `sources/recruit/official-job-targets.json`。单个官网临时失败时会沿用上一版该来源的数据并标记为 stale；其他来源继续更新。提交并推送 `jobs.json` 后，GitHub Pages 会自动重新部署。
