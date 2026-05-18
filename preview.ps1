$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

npm run build

$existing = Get-CimInstance Win32_Process -Filter "name = 'node.exe'" |
  Where-Object {
    $_.CommandLine -like "*x-ai-web*next*" -or
    $_.CommandLine -like "*npx-cli.js*next start*"
  }

foreach ($process in $existing) {
  Stop-Process -Id $process.ProcessId -Force
}

Start-Process -WindowStyle Hidden -FilePath "C:\Program Files\nodejs\npx.cmd" -ArgumentList "next", "start", "-p", "3000" -WorkingDirectory $PSScriptRoot
Start-Sleep -Seconds 3
Start-Process "chrome.exe" "http://127.0.0.1:3000"
