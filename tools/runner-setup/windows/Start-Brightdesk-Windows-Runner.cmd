@echo off
setlocal EnableExtensions

set "INSTALLER_PATH=%~dp0Install-Brightdesk-Windows-Runner.ps1"
set "INSTALLER_SHA256=8e30aa1ba49d1c306a03a8aff5f349a7697120b39c2887af055f7053d72e59b3"

if not exist "%INSTALLER_PATH%" (
  echo.
  echo SETUP STOPPED: Install-Brightdesk-Windows-Runner.ps1 was not found.
  echo Keep the CMD launcher and PowerShell installer together in the same folder.
  pause
  exit /b 1
)

echo Verifying the Brightdesk Windows runner installer...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; try { $actual=(Get-FileHash -LiteralPath $env:INSTALLER_PATH -Algorithm SHA256).Hash.ToLowerInvariant(); if ($actual -ne '%INSTALLER_SHA256%') { throw 'The local PowerShell installer failed its pinned SHA-256 check.' }; Write-Host 'Installer checksum verified.' -ForegroundColor Green } catch { Write-Host ('SETUP STOPPED: ' + $_.Exception.Message) -ForegroundColor Red; exit 1 }"
if errorlevel 1 (
  echo.
  echo The setup file could not be verified.
  pause
  exit /b 1
)

echo.
echo Starting the verified Brightdesk Windows runner setup...
echo The PowerShell installer will request normal Windows administrator approval.
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%INSTALLER_PATH%"
set "RESULT=%ERRORLEVEL%"

if not "%RESULT%"=="0" (
  echo.
  echo Setup did not finish successfully. Read the message above before retrying.
  pause
)
exit /b %RESULT%
