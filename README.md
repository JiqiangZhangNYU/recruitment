# Recruitment Shortlist

上海增长运营岗位的静态筛选页面。公开数据来自本地筛选结果，默认包含 50 个岗位的摘要、匹配度、加分项、风险提示和 BOSS 直聘原始链接。

筛选规则以工作地点上海为硬性标准，支付业务和大平台公司为明显加分项。五个原始标杆岗位保留在候选清单中。

网页包含独立的求职技能视图，按岗位覆盖率展示 SQL、Excel、漏斗分析、用户生命周期、A/B 测试、项目推进、支付、电商和英语等学习内容，并在浏览器本地保存掌握进度。

## 本地运行

```bash
python3 -m http.server 4173
```

打开 `http://localhost:4173/`。

## 更新数据

在上级项目目录执行：

```bash
python3 scripts/export_recruitment_site.py
```

提交并推送 `jobs.json` 后，GitHub Pages 会自动重新部署。
