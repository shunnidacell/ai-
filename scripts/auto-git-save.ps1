$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $repo

$changed = git status --porcelain
if (-not $changed) {
  Write-Host "No changes to save."
  exit 0
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

git add .
git commit -m "Auto save $timestamp"
git push

Write-Host "Saved and pushed changes at $timestamp."
