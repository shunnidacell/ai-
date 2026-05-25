param(
  [ValidateSet("sync-and-generate", "generate")]
  [string]$Task = "sync-and-generate"
)

$ErrorActionPreference = "Continue"

$projectDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$dataDir = Join-Path $projectDir "data"
$statusFile = Join-Path $dataDir "local-automation-status.json"
$logFile = Join-Path $dataDir "local-automation.log"

if (-not (Test-Path -LiteralPath $dataDir)) {
  New-Item -ItemType Directory -Path $dataDir | Out-Null
}

function Write-Status {
  param(
    [string]$Phase,
    [bool]$Running,
    [int]$ExitCode = 0,
    [string]$Message = ""
  )

  $status = [ordered]@{
    task = $Task
    phase = $Phase
    running = $Running
    exitCode = $ExitCode
    message = $Message
    updatedAt = (Get-Date).ToString("o")
  }

  $status | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $statusFile -Encoding UTF8
}

function Invoke-LoggedCommand {
  param(
    [string]$Label,
    [string[]]$Command
  )

  Add-Content -LiteralPath $logFile -Encoding UTF8 -Value ""
  Add-Content -LiteralPath $logFile -Encoding UTF8 -Value "[$((Get-Date).ToString("s"))] $Label"
  Add-Content -LiteralPath $logFile -Encoding UTF8 -Value ($Command -join " ")

  & $Command[0] $Command[1..($Command.Length - 1)] 2>&1 |
    Tee-Object -FilePath $logFile -Append

  return $LASTEXITCODE
}

Set-Location -LiteralPath $projectDir
Write-Status -Phase "started" -Running $true -Message "ローカル自動処理を開始しました。"

if ($Task -eq "sync-and-generate") {
  Write-Status -Phase "syncing" -Running $true -Message "Xブックマークを読み込んでいます。"
  $syncExit = Invoke-LoggedCommand -Label "Sync X bookmarks" -Command @("npm.cmd", "run", "sync:bookmarks:chrome")
  if ($syncExit -ne 0) {
    Write-Status -Phase "failed" -Running $false -ExitCode $syncExit -Message "Xブックマーク同期に失敗しました。"
    exit $syncExit
  }
}

Write-Status -Phase "generating" -Running $true -Message "Ollamaで記事本文を生成しています。"
$generateExit = Invoke-LoggedCommand -Label "Generate local drafts" -Command @("npm.cmd", "run", "generate:drafts:local")
if ($generateExit -ne 0) {
  Write-Status -Phase "failed" -Running $false -ExitCode $generateExit -Message "記事本文生成に失敗しました。Ollamaの起動状態を確認してください。"
  exit $generateExit
}

Write-Status -Phase "finished" -Running $false -ExitCode 0 -Message "処理が完了しました。ページを更新してください。"
