$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location -LiteralPath $projectDir

if (-not $env:BOOKMARK_SYNC_INTERVAL_MINUTES) {
  $env:BOOKMARK_SYNC_INTERVAL_MINUTES = "10"
}

if (-not $env:X_HEADLESS) {
  $env:X_HEADLESS = "0"
}

npm run sync:bookmarks:auto
