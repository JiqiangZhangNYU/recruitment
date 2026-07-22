# Recruitment Shortlist

上海增长运营岗位的静态筛选页面。公开数据来自本地筛选结果，包含 30 个岗位的摘要、匹配度、风险提示和 BOSS 直聘原始链接。

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
