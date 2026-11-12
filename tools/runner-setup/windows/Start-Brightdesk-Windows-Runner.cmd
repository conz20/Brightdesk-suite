@echo off
setlocal EnableExtensions

set "INSTALLER_PATH=%TEMP%\Brightdesk-Windows-Runner-%RANDOM%%RANDOM%.ps1"
set "INSTALLER_URL=https://raw.githubusercontent.com/conz20/Brightdesk-suite/3689b07316e2c700cf868a895ad5b66843c2aca2/tools/runner-setup/windows/Install-Brightdesk-Windows-Runner.ps1"
set "INSTALLER_SHA256=24f51d6510002ef70e08af4df92f7f5254684c6127cb7c2cb754b0566c4f573e"

echo Downloading the Brightdesk Windows runner installer...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'; $installer=$env:INSTALLER_PATH; try { [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%INSTALLER_URL%' -OutFile $installer -UseBasicParsing; $actual=(Get-FileHash -LiteralPath $installer -Algorithm SHA256).Hash.ToLowerInvariant(); if ($actual -ne '%INSTALLER_SHA256%') { throw 'The downloaded PowerShell installer failed its SHA-256 check.' }; Write-Host 'Installer checksum verified.' -ForegroundColor Green } catch { if (Test-Path -LiteralPath $installer) { Remove-Item -LiteralPath $installer -Force -ErrorAction SilentlyContinue }; Write-Host ('SETUP STOPPED: ' + $_.Exception.Message) -ForegroundColor Red; exit 1 }"
if errorlevel 1 (
  echo.
  echo The setup file could not be downloaded and verified.
  pause
  exit /b 1
)

echo.
echo Starting the verified Brightdesk installer...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%INSTALLER_PATH%"
set "RESULT=%ERRORLEVEL%"
if exist "%INSTALLER_PATH%" del /f /q "%INSTALLER_PATH%" >nul 2>nul

if not "%RESULT%"=="0" (
  echo.
  echo Setup did not finish successfully. No Brightdesk workflow has been changed.
  pause
)
exit /b %RESULT%
