@echo off
echo Applying registry changes...
reg import "%~dp0fix-cmg-icon.reg"

echo Refreshing icon cache...
taskkill /F /IM explorer.exe
start explorer.exe

echo.
echo Icon cache refreshed. Please check your .cmg files now.
pause
