<#
run_all.ps1 - Start backend (Flask) and frontend for Project_FS on Windows (PowerShell)
#>

param(
    [switch] $NoInstall
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host ('[run_all.ps1] Repo root: ' + $scriptDir)

$logDir = Join-Path $scriptDir 'logs'
if (-not (Test-Path $logDir)) { New-Item -Path $logDir -ItemType Directory | Out-Null }

function Install-Frontend($path) {
    if ($NoInstall) { Write-Host "[run_all] Skipping npm install for $path"; return }
    Write-Host "[run_all] Installing dependencies in $path..."
    Push-Location $path
    try { npm install } catch { Write-Warning ("npm install failed in {0}: {1}" -f $path, $_) }
    Pop-Location
}

function Setup-Backend($path) {
    if ($NoInstall) { Write-Host "[run_all] Skipping python setup for $path"; return }
    Write-Host "[run_all] Setting up Python venv and installing requirements in $path..."
    Push-Location $path
    try { 
        if (-not (Test-Path "venv")) {
            python -m venv venv
        }
        .\venv\Scripts\pip install -r requirements.txt
    } catch { Write-Warning ("python setup failed in {0}: {1}" -f $path, $_) }
    Pop-Location
}

$serverDir = Join-Path $scriptDir 'server'
$clientDir = Join-Path $scriptDir 'client'

Setup-Backend $serverDir
Install-Frontend $clientDir

$serverLog = Join-Path $logDir 'server.log'
$clientLog = Join-Path $logDir 'client.log'

Write-Host ('[run_all] Starting backend (Flask server). Logs -> ' + $serverLog)
# Start server process using python from venv
$serverCmd = ".\venv\Scripts\python app.py > `"$serverLog`" 2>&1"
$serverProc = Start-Process -FilePath cmd.exe -ArgumentList @('/c', $serverCmd) -WorkingDirectory $serverDir -NoNewWindow -PassThru
Write-Host "[run_all] Backend PID=$($serverProc.Id)"

Start-Sleep -Seconds 1

Write-Host ('[run_all] Starting frontend (client) - Vite dev server. Logs -> ' + $clientLog)
$clientCmd = "npm run dev > `"$clientLog`" 2>&1"
$clientProc = Start-Process -FilePath cmd.exe -ArgumentList @('/c', $clientCmd) -WorkingDirectory $clientDir -NoNewWindow -PassThru
Write-Host "[run_all] Frontend PID=$($clientProc.Id)"

# Clean-up helper
function Stop-Children {
    Write-Host '[run_all] Stopping child processes...'
    if ($clientProc -and -not $clientProc.HasExited) {
        Write-Host "[run_all] Stopping frontend PID $($clientProc.Id)"
        try { Stop-Process -Id $clientProc.Id -Force -ErrorAction SilentlyContinue } catch {}
    }
    if ($serverProc -and -not $serverProc.HasExited) {
        Write-Host "[run_all] Stopping backend PID $($serverProc.Id)"
        try { Stop-Process -Id $serverProc.Id -Force -ErrorAction SilentlyContinue } catch {}
    }
}

try {
    Write-Host '[run_all] Tailing logs — press Ctrl-C to stop and cleanup.'
    Get-Content -Path $serverLog, $clientLog -Tail 200 -Wait
} finally {
    Stop-Children
    Write-Host '[run_all] Exiting.'
}
