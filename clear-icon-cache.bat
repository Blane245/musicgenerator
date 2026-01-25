@echo off
echo Clearing Windows icon cache...

echo Stopping Explorer...
taskkill /F /IM explorer.exe

echo Deleting icon cache files...
cd /d "%userprofile%\AppData\Local"
attrib -h IconCache.db
del IconCache.db /f /q
attrib -h "Microsoft\Windows\Explorer\iconcache*"
del "Microsoft\Windows\Explorer\iconcache*" /f /q 2>nul

echo Reapplying registry settings...
reg import "%~dp0fix-cmg-icon.reg"

echo Restarting Explorer...
timeout /t 2 /nobreak >nul
start explorer.exe

echo.
echo Icon cache cleared and Explorer restarted.
echo Please wait a few seconds for icons to rebuild, then check your .cmg files.
pause
