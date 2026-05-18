$ErrorActionPreference = "Stop"

param(
  [Parameter(Mandatory = $true)]
  [string]$Ref
)

$repo = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $repo

$dirty = git status --porcelain
if ($dirty) {
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  git add .
  git commit -m "Auto backup before restore $timestamp"
  git push
}

git revert --no-edit "$Ref..HEAD"
git push

Write-Host "Restored by reverting changes after $Ref."
