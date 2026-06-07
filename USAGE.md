# 个人主页傻瓜版使用书

你的本地项目位置：

```text
C:\Users\zzh666\Documents\Codex\2026-06-07\latex-markdown-latex-markdown\outputs\personal-site
```

你的线上网站：

```text
https://zzhhhh666.github.io/
```

你的 GitHub 仓库：

```text
https://github.com/zzhhhh666/zzhhhh666.github.io
```

## 1. 平时改网站，先打开哪个文件夹

打开文件资源管理器，进入：

```text
C:\Users\zzh666\Documents\Codex\2026-06-07\latex-markdown-latex-markdown\outputs\personal-site
```

推荐用 VS Code 打开这个文件夹。如果没有 VS Code，也可以用记事本改 `.json` 和 `.md` 文件。

## 2. 改个人信息

编辑：

```text
content\profile.json
```

常改这些字段：

```json
{
  "name": "你的名字",
  "title": "Independent Researcher / Student",
  "location": "China",
  "focus": ["AI", "Systems", "Theory"],
  "bio": "这里写你的中文简介。",
  "email": "your.email@example.com"
}
```

注意：

- 英文双引号不能删。
- 每一项之间要有英文逗号。
- 最后一项后面不要多加逗号。

## 3. 改项目列表

编辑：

```text
content\projects.json
```

每个项目长这样：

```json
{
  "index": "01",
  "title": "项目名",
  "description": "项目简介",
  "url": "https://github.com/你的项目"
}
```

## 4. 改论文 / 报告列表

编辑：

```text
content\papers.json
```

每篇论文长这样：

```json
{
  "title": "论文标题",
  "venue": "Preprint",
  "year": "2026",
  "description": "一句话简介",
  "url": "https://arxiv.org/abs/xxxx.xxxxx"
}
```

## 5. 写博客

博客文件夹：

```text
content\blog
```

新建一个 `.md` 文件，例如：

```text
2026-06-08-my-first-real-note.md
```

内容模板：

```md
---
title: 我的第一篇真实笔记
date: 2026-06-08
tags: notes, latex, 中文
summary: 这是一句显示在文章列表里的摘要。
---

# 我的第一篇真实笔记

这里写正文。

行内公式：$E = mc^2$

块级公式：

$$
\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}
$$
```

如果文章没写完，不想发布，加：

```md
draft: true
```

例如：

```md
---
title: 还没写完的草稿
date: 2026-06-08
draft: true
---
```

## 6. 本地预览

打开 PowerShell，进入项目文件夹：

```powershell
cd "C:\Users\zzh666\Documents\Codex\2026-06-07\latex-markdown-latex-markdown\outputs\personal-site"
```

启动本地预览：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1
```

然后浏览器打开：

```text
http://localhost:4321/
```

本地预览时，你改 `content` 里的 Markdown 或 JSON，网页会自动更新。

## 7. 发布到 GitHub

每次改完内容，发布前先构建：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-local.ps1
```

然后提交：

```powershell
git add .
git commit -m "Update site"
git push
```

如果 `git push` 连不上 GitHub，先在同一个 PowerShell 里运行：

```powershell
$env:HTTPS_PROXY="http://127.0.0.1:7890"
$env:HTTP_PROXY="http://127.0.0.1:7890"
git push
```

发布后等 30 秒到 2 分钟，再打开：

```text
https://zzhhhh666.github.io/
```

## 8. 在 GitHub 网站上看发布状态

打开：

```text
https://github.com/zzhhhh666/zzhhhh666.github.io/actions
```

看最新的 `Deploy to GitHub Pages` 是否是绿色对勾。

如果是绿色对勾，说明发布成功。

## 9. 不要随便改这些

新手阶段尽量不要直接改：

```text
dist
api
.github
server.js
scripts
```

你主要改：

```text
content\profile.json
content\projects.json
content\papers.json
content\blog
```

想改页面样式时再改：

```text
styles.css
```

想改页面结构时再改：

```text
index.html
```

## 10. 最常见问题

### 本地网页没更新

刷新浏览器，或重新运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1
```

### 线上网页没更新

确认你做过：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-local.ps1
git add .
git commit -m "Update site"
git push
```

然后去 Actions 页面看是否成功。

### JSON 改坏了

通常是少了英文逗号、用了中文引号、最后一项多了逗号。

### Git 提示 nothing to commit

说明没有新改动，或者你改的不是这个项目文件夹。

### GitHub 打不开或 push 失败

在 PowerShell 里先设置代理：

```powershell
$env:HTTPS_PROXY="http://127.0.0.1:7890"
$env:HTTP_PROXY="http://127.0.0.1:7890"
```

再运行：

```powershell
git push
```
