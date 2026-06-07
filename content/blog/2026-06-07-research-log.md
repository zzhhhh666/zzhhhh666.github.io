---
title: 研究日志：把想法变成网页
date: 2026-06-07
tags: research, notes
summary: 一个适合论文、代码和读书笔记的页面结构。
---

# 研究日志：把想法变成网页

这类个人主页最重要的不是花哨，而是长期可维护：

1. 首页给出身份、方向和联系方式。
2. 博客承载研究日志、读书笔记和推导过程。
3. 项目页连接代码、数据和 demo。
4. 论文页记录 preprint、PDF、slides 和复现材料。

一个常见的推导可以这样写：

$$
\nabla_\theta \log p_\theta(x)
= \frac{\nabla_\theta p_\theta(x)}{p_\theta(x)}
$$

如果之后要写完整 `.tex`，可以用 XeLaTeX 编译中文 PDF，或者用 Pandoc 转成 Markdown 后发布到网站。
