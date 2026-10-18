@echo off
rem Open this launcher from the extracted release folder on Windows.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*
set "REA_REBUILD_RESULT=%ERRORLEVEL%"
echo.
pause
exit /b %REA_REBUILD_RESULT%
