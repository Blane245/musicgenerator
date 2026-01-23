@echo off
REM Batch script to open CMG files in the running Music Generator app
REM Usage: Associate .cmg files with this batch file in Windows File Explorer

if "%~1"=="" (
    echo No file specified
    start http://localhost:3006/
    exit /b
)

REM Get the full file path
set FILEPATH=%~1

REM URL encode the file path (replace backslashes with forward slashes, spaces with %20)
set ENCODED=%FILEPATH:\=/%
set ENCODED=%ENCODED: =%%20

REM Open the browser with the file parameter
start http://localhost:3006/?file=%ENCODED%
