$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$disabledFile = Join-Path $projectDir "data\bookmark-sync-disabled"
$startupDir = [Environment]::GetFolderPath("Startup")
$startupFile = Join-Path $startupDir "AI Insight JP X Bookmark Auto Sync.cmd"

$nodeProcesses = Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -match "^node(\.exe)?$" -and
    $_.CommandLine -like "*scripts/sync-x-bookmarks-auto.mjs*"
  }

$startupEnabled = Test-Path -LiteralPath $startupFile
$paused = Test-Path -LiteralPath $disabledFile
$running = $nodeProcesses.Count -gt 0
$interval = $env:BOOKMARK_SYNC_INTERVAL_MINUTES

if (-not $interval) {
  $interval = "10"
}

Write-Host "X bookmark auto sync status"
Write-Host "Startup enabled: $startupEnabled"
Write-Host "Paused: $paused"
Write-Host "Running now: $running"
Write-Host "Interval: $interval minutes"
