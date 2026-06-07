$ErrorActionPreference = "Stop"

if (Get-Command git -ErrorAction SilentlyContinue) {
  git --version
  exit 0
}

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
  throw "winget was not found. Please install Git for Windows manually: https://git-scm.com/download/win"
}

winget install --id Git.Git -e --source winget --scope user --accept-package-agreements --accept-source-agreements

Write-Host "Git install finished. If this terminal cannot find git yet, close and reopen the terminal."
