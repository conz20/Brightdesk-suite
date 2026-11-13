@echo off
setlocal EnableExtensions

set "INSTALLER_PATH=%~dp0Install-Brightdesk-Windows-Runner.ps1"

if not exist "%INSTALLER_PATH%" (
  echo.
  echo SETUP STOPPED: Install-Brightdesk-Windows-Runner.ps1 was not found.
  echo Keep the CMD launcher and PowerShell installer together in the same folder.
  pause
  exit /b 1
)

echo Starting the Brightdesk Windows runner setup...
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
