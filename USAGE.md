# 个人主页使用书

线上网站：

```text
https://zzhhhh666.github.io/
```

本地项目文件夹：

```text
C:\Users\zzh666\Documents\Codex\2026-06-07\latex-markdown-latex-markdown\outputs\personal-site
```

GitHub 仓库：

```text
https://github.com/zzhhhh666/zzhhhh666.github.io
```

## 1. 用什么软件改

推荐用 VS Code 打开整个项目文件夹：

```text
C:\Users\zzh666\Documents\Codex\2026-06-07\latex-markdown-latex-markdown\outputs\personal-site
```

如果没有 VS Code，也可以用记事本改 `.json` 和 `.md` 文件。

主要改这些位置：

```text
content\profile.json        主页文字、链接、标题、照片、右侧信息
content\blog                博客文章
content\papers.json         已发表论文 / 预印本 / 报告
content\projects.json       项目
styles.css                  页面样式
```

新手阶段尽量不要改：

```text
dist
api
.github
server.js
scripts
```

## 2. 改主页上的文字

编辑：

```text
content\profile.json
```

常用字段如下：

```json
{
  "name": "Zihan Zhang (张子晗)",
  "title": "PhD Student, Fudan University",
  "headline": "主页最大标题",
  "location": "China",
  "focus": ["AIDD", "LLMs", "GenAI"],
  "bio": "主页简介",
  "email": "zzh7488@stu.ouc.edu.cn"
}
```

对应关系：

- `name`: 左上角名字和网页标题。
- `title`: 首页小标题。
- `headline`: 首页最大的英文标题。
- `bio`: 首页中文简介。
- `focus`: 右侧 Focus 内容。
- `location`: 右侧 Location 内容。
- `email`: 页面底部联系方式。

JSON 注意事项：

- 必须用英文双引号 `"`。
- 每一项之间用英文逗号 `,`。
- 最后一项后面不要加逗号。

## 3. 改右侧 Writing / Location / 代码块

仍然编辑：

```text
content\profile.json
```

这一段控制右侧信息：

```json
"meta": {
  "writingLabel": "Writing",
  "writingValue": "Markdown + LaTeX",
  "locationLabel": "Location"
},
"heroCode": ""
```

如果你想把 `Writing` 改成 `Notes`：

```json
"writingLabel": "Notes"
```

如果你想把 `Markdown + LaTeX` 改成 `Chinese Notes / Research Logs`：

```json
"writingValue": "Chinese Notes / Research Logs"
```

如果你觉得右侧 LaTeX 示例没有意义，保持：

```json
"heroCode": ""
```

它就不会显示。

如果以后想显示一段代码，可以写成：

```json
"heroCode": "$$\\nE = mc^2\\n$$"
```

注意 JSON 里换行要写成 `\n`。

## 4. 改 Live Blog 大标题

编辑：

```text
content\profile.json
```

找到：

```json
"sections": {
  "researchTitle": "Research Direction",
  "researchDescription": "这里是研究方向说明",
  "blogTitle": "Research Notes",
  "projectsTitle": "Projects"
}
```

如果你想把 `Markdown / LaTeX Blog` 改成中文，例如：

```json
"blogTitle": "学习笔记"
```

如果你想改研究区标题：

```json
"researchTitle": "Research Interests"
```

如果你想改项目区标题：

```json
"projectsTitle": "Selected Projects"
```

## 5. 放个人照片

把你的照片复制到：

```text
content\assets\profile.jpg
```

推荐照片：

- 正方形或接近正方形。
- 清晰头像或半身照。
- 文件名就叫 `profile.jpg`。

如果你的照片是 PNG，放到：

```text
content\assets\profile.png
```

然后把 `content\profile.json` 里的：

```json
"photo": "content/assets/profile.jpg"
```

改成：

```json
"photo": "content/assets/profile.png"
```

## 6. 添加 / 更新博客

博客文件夹：

```text
content\blog
```

新建一个 Markdown 文件，例如：

```text
2026-06-08-aidd-note.md
```

文件名建议：

```text
日期-英文短标题.md
```

例如：

```text
2026-06-08-diffusion-model-reading.md
2026-06-09-protein-design-note.md
```

博客模板：

```md
---
title: 文章标题
date: 2026-06-08
tags: AIDD, notes, 中文
summary: 这是一句话摘要，会显示在文章列表里。
---

# 文章标题

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

完整例子：

```md
---
title: 还没写完的草稿
date: 2026-06-08
tags: draft
summary: 暂时不发布。
draft: true
---

# 还没写完的草稿
```

删除博客：

直接删除对应的 `.md` 文件，然后重新构建、提交、推送。

## 7. 添加已发表论文

编辑：

```text
content\papers.json
```

如果目前没有论文，内容可以是：

```json
[]
```

添加一篇论文：

```json
[
  {
    "title": "论文标题",
    "venue": "Journal / Conference / Preprint",
    "year": "2026",
    "description": "一句话简介。",
    "url": "https://论文链接"
  }
]
```

添加多篇论文：

```json
[
  {
    "title": "第一篇论文",
    "venue": "Preprint",
    "year": "2026",
    "description": "第一篇简介。",
    "url": "https://example.com/paper-1"
  },
  {
    "title": "第二篇论文",
    "venue": "Journal Name",
    "year": "2027",
    "description": "第二篇简介。",
    "url": "https://example.com/paper-2"
  }
]
```

注意：

- 每篇论文是一个 `{ ... }`。
- 多篇论文之间用英文逗号分隔。
- 最后一篇后面不要加逗号。

## 8. 添加项目

编辑：

```text
content\projects.json
```

如果目前没有公开项目，内容可以是：

```json
[]
```

添加一个项目：

```json
[
  {
    "index": "01",
    "title": "项目名称",
    "description": "项目简介。",
    "url": "https://github.com/你的项目"
  }
]
```

添加多个项目：

```json
[
  {
    "index": "01",
    "title": "AIDD Notes",
    "description": "AI 药物设计相关笔记和阅读记录。",
    "url": "https://github.com/zzhhhh666"
  },
  {
    "index": "02",
    "title": "LLM Experiments",
    "description": "大语言模型实验记录。",
    "url": "https://github.com/zzhhhh666"
  }
]
```

## 9. 本地预览

打开 PowerShell，进入项目目录：

```powershell
cd "C:\Users\zzh666\Documents\Codex\2026-06-07\latex-markdown-latex-markdown\outputs\personal-site"
```

启动本地预览：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1
```

浏览器打开：

```text
http://localhost:4321/
```

本地预览时，改 `content` 里的文件后页面会自动更新。

## 10. 上传更新网站

每次改完内容后，在 PowerShell 里进入项目目录：

```powershell
cd "C:\Users\zzh666\Documents\Codex\2026-06-07\latex-markdown-latex-markdown\outputs\personal-site"
```

第一步，重新构建：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-local.ps1
```

第二步，查看改了什么：

```powershell
git status
```

第三步，提交：

```powershell
git add .
git commit -m "Update site"
```

第四步，上传：

```powershell
git push
```

上传后等 30 秒到 2 分钟，打开：

```text
https://zzhhhh666.github.io/
```

## 11. 如果 git push 连不上

你的电脑通常需要代理。先在同一个 PowerShell 里运行：

```powershell
$env:HTTPS_PROXY="http://127.0.0.1:7890"
$env:HTTP_PROXY="http://127.0.0.1:7890"
```

然后再运行：

```powershell
git push
```

## 12. 查看 GitHub 发布状态

打开：

```text
https://github.com/zzhhhh666/zzhhhh666.github.io/actions
```

看最新一条是否是绿色对勾。

绿色对勾：发布成功。

黄色圆点：正在发布，等一会儿。

红色叉：发布失败，可以把截图或报错发给 Codex。

## 13. 常见问题

### Live Blog 不显示

先确认：

```text
api\posts
content\blog\你的文章.md
.nojekyll
```

都存在。

然后重新构建和上传：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-local.ps1
git add .
git commit -m "Fix blog"
git push
```

### 中文乱码

用 VS Code 打开文件，右下角编码选择 `UTF-8`。

不要用会自动转编码的老旧编辑器。

### JSON 报错

通常是：

- 少了英文逗号。
- 用了中文引号。
- 最后一项多了逗号。
- 数组 `[` `]` 或对象 `{` `}` 没配对。

### 线上没变化

确认你做了：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-local.ps1
git add .
git commit -m "Update site"
git push
```

再去 Actions 页面看是否成功。
