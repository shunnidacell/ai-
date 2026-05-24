$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$disabledFile = Join-Path $projectDir "data\bookmark-sync-disabled"
$startupDir = [Environment]::GetFolderPath("Startup")
$startupFile = Join-Path $startupDir "AI Insight JP X Bookmark Auto Sync.cmd"
$startScript = Join-Path $projectDir "scripts\start-bookmark-autosync.ps1"

if (Test-Path -LiteralPath $disabledFile) {
  Remove-Item -LiteralPath $disabledFile
}

Set-Content -LiteralPath $startupFile -Encoding ASCII -Value "@echo off`r`npowershell -NoProfile -ExecutionPolicy Bypass -File `"$startScript`"`r`n"

Write-Host "X bookmark auto sync is ON. It runs every 10 minutes while this PC is on."
Write-Host "Startup entry: $startupFile"
