# Paper + Code 个人主页

这是一个中文友好的个人学术主页原型，支持 Markdown 博客和 LaTeX 数学公式。

## 本地运行

如果系统已经装了 Node：

```powershell
npm run dev
```

如果像当前电脑一样系统 PATH 里没有 Node，可以用 Codex 自带 Node：

```powershell
& "C:\Users\zzh666\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" server.js
```

打开：

```text
http://localhost:4321
```

## 写博客

在 `content/blog` 里新建 `.md` 文件，例如：

```md
---
title: 我的文章标题
date: 2026-06-07
tags: math, notes
summary: 简短摘要
---

# 我的文章标题

中文内容可以直接写。

$$
\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}
$$
```

保存文件后，本地网页会自动刷新。

## 中文 LaTeX

完整 `.tex` 文件建议用 XeLaTeX 或 LuaLaTeX 编译。示例模板在：

```text
content/tex/chinese-xelatex-template.tex
```

Windows 上推荐安装 TeX Live 或 MiKTeX。安装后可以运行：

```powershell
xelatex content/tex/chinese-xelatex-template.tex
```

## 免费部署路线

推荐 Cloudflare Pages 或 GitHub Pages。

当前项目可以作为静态网站部署。构建命令：

```powershell
node scripts/build-static.js
```

输出目录：

```text
dist
```

Cloudflare Pages 设置：

- Build command: `node scripts/build-static.js`
- Build output directory: `dist`

## 后续可加

- GitHub 自动部署
- Obsidian Git 自动推送
- `.tex` 转 Markdown 的 Pandoc 流程
- CV PDF
- 论文列表
- RSS
- 全文搜索

## 当前结构

- `content/profile.json`: 个人信息、链接、研究方向。
- `content/projects.json`: 项目列表。
- `content/papers.json`: 论文或技术报告列表。
- `content/blog/*.md`: 博客文章。
- `content/tex/*.tex`: 中文 LaTeX 模板或源码。
- `DEPLOY.md`: 发布到 GitHub Pages / Cloudflare Pages 的步骤。
