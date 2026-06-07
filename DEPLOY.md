# Deploy Guide

## Step 1: Edit your profile

Edit these files:

- `content/profile.json`
- `content/projects.json`
- `content/papers.json`
- `content/blog/*.md`

## Step 2: Build locally

```powershell
.\scripts\build-local.ps1
```

## Step 3: Publish to GitHub

Create a new empty GitHub repository, then run:

```powershell
git remote add origin https://github.com/YOUR_NAME/YOUR_REPO.git
git push -u origin main
```

## Step 4: Enable GitHub Pages

In the GitHub repository:

1. Open Settings.
2. Open Pages.
3. Set Source to GitHub Actions.
4. Wait for the workflow named `Deploy to GitHub Pages`.

The site URL will look like:

```text
https://YOUR_NAME.github.io/YOUR_REPO/
```

## Cloudflare Pages alternative

Cloudflare Pages settings:

- Framework preset: None
- Build command: `node scripts/build-static.js`
- Build output directory: `dist`

Cloudflare is a good choice if you later want a custom domain.
