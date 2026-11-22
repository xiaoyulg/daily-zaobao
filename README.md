# 每日枣报

每天十条要闻，附枣评。独立、克制、有态度。

《每日枣报》是一份每日更新的中文新闻简报：选取当天国内外值得关注的十条要闻，每条附一段短评（"枣评"），并在文末收录若干金句。内容由自动化流程每日生成并发布。

## 在线阅读

- **首页（最新一期）**：https://zaobao.sdgzu.edu.kg
- **今日一期**：https://zaobao.sdgzu.edu.kg/p/2026-11-22
- **创刊词**：https://zaobao.sdgzu.edu.kg/manifesto.html
- **站点地图**：https://zaobao.sdgzu.edu.kg/sitemap.xml

每一期都有可直接访问、便于分享和搜索引擎收录的静态页面，地址格式为 `https://zaobao.sdgzu.edu.kg/p/YYYY-MM-DD`。首页同时提供往期归档、标签网与共享留言。

## 关于本站

- 站点基于 Cloudflare Workers + KV 搭建，内容源文件保存在本仓库 `posts/` 目录。
- 每期数据为 JSON 格式，包含日期、主标题、十条新闻（事实摘要、枣评、金句、原文来源）与金句列表。
- 浏览量、点赞与留言通过 Cloudflare KV 跨设备同步。

## 仓库结构

- `posts/` — 各期内容（JSON）与索引
- `worker.js` — Cloudflare Worker：API、服务端渲染文章页、sitemap、robots
- `assets/` — 前端脚本与样式
- `index.html` — 单页应用首页
- `manifesto.html` — 创刊词
- `admin.html` — 管理后台
