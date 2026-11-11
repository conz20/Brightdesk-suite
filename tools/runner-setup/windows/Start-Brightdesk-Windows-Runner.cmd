@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-Brightdesk-Windows-Runner.ps1"
set "RESULT=%ERRORLEVEL%"
if not "%RESULT%"=="0" (
  echo.
  echo Setup did not finish successfully. No Brightdesk workflow has been changed.
  pause
)
exit /b %RESULT%
