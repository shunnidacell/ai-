$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$dataDir = Join-Path $projectDir "data"
$disabledFile = Join-Path $dataDir "bookmark-sync-disabled"
$startupDir = [Environment]::GetFolderPath("Startup")
$startupFile = Join-Path $startupDir "AI Insight JP X Bookmark Auto Sync.cmd"

if (-not (Test-Path -LiteralPath $dataDir)) {
  New-Item -ItemType Directory -Path $dataDir | Out-Null
}

Set-Content -LiteralPath $disabledFile -Encoding ASCII -Value "disabled"

if (Test-Path -LiteralPath $startupFile) {
  Remove-Item -LiteralPath $startupFile
}

$nodeProcesses = Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -match "^node(\.exe)?$" -and
    $_.CommandLine -like "*scripts/sync-x-bookmarks-auto.mjs*"
  }

foreach ($process in $nodeProcesses) {
  Stop-Process -Id $process.ProcessId -Force
}

Write-Host "X bookmark auto sync is OFF."
Write-Host "Stopped running auto sync processes: $($nodeProcesses.Count)"
