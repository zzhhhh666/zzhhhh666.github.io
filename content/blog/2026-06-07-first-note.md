---
title: 第一篇中文 Markdown / LaTeX 笔记
date: 2026-06-07
tags: demo, latex, 中文
summary: 保存这个文件后，网页会实时刷新。
---

# 第一篇中文 Markdown / LaTeX 笔记

这是一篇示例博客。你可以在 `content/blog` 目录里继续新建 `.md` 文件，网页会自动更新文章列表和正文。

中文、English、代码和数学公式可以混在一起写：

$$
\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}
$$

行内公式也可以，例如 $E = mc^2$。

## 代码片段

```python
def hello(name: str) -> str:
    return f"你好，{name}"
```

## 写作建议

- 想公开发布的文章放在 `content/blog`。
- 还没写完的文章可以在 frontmatter 里加 `draft: true`。
- 如果只是数学公式，用 Markdown 里的 LaTeX 就够了。
