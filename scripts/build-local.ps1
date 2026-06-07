$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$BundledNode = "C:\Users\zzh666\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$SystemNode = (Get-Command node -ErrorAction SilentlyContinue | Select-Object -First 1).Source

if (Test-Path $BundledNode) {
  $Node = $BundledNode
} elseif ($SystemNode) {
  $Node = $SystemNode
} else {
  throw "Node.js was not found."
}

Set-Location $ProjectRoot
& $Node scripts/build-static.js
