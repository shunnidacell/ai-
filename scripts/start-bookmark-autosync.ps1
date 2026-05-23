$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location -LiteralPath $projectDir

if (-not $env:BOOKMARK_SYNC_INTERVAL_MINUTES) {
  $env:BOOKMARK_SYNC_INTERVAL_MINUTES = "30"
}

npm run sync:bookmarks:auto
