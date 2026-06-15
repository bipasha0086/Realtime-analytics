@echo off
REM run_all.bat - cross-platform runner (Windows-friendly)
REM If Git Bash / WSL bash is available, prefer running the existing run_all.sh under bash.
REM Otherwise fallback to the PowerShell runner run_all.ps1.

SETLOCAL ENABLEDELAYEDEXPANSION

REM Try to find bash in PATH (Git Bash or WSL)
where bash >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto NoBash

echo Found bash in PATH. Running run_all.sh via bash...
bash -lc "cd /c/Users/rehan/Desktop/Project_FS/Project_FS && ./run_all.sh"
EXIT /B %ERRORLEVEL%

:NoBash
echo No bash found in PATH. Falling back to PowerShell runner (run_all.ps1)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_all.ps1"
EXIT /B %ERRORLEVEL%
