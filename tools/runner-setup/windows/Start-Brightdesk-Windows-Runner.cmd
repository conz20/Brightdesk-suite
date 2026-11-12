@echo off
setlocal EnableExtensions

set "INSTALLER_PATH=%TEMP%\Brightdesk-Windows-Runner-%RANDOM%%RANDOM%.ps1"
set "INSTALLER_URL=https://raw.githubusercontent.com/conz20/Brightdesk-suite/7bb28c3a40c2bb2053c3e38690778cde646bb67c/tools/runner-setup/windows/Install-Brightdesk-Windows-Runner.ps1"
set "INSTALLER_SHA256=8e30aa1ba49d1c306a03a8aff5f349a7697120b39c2887af055f7053d72e59b3"

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
