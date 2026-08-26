@echo off
title Push SecureGRC to GitHub
cls

echo ======================================================================
echo                 Pushing SecureGRC to GitHub Repository                
echo                   https://github.com/Ree2612/SecureGRC                
echo ======================================================================
echo.

set PATH=%LOCALAPPDATA%\Programs\MinGit\cmd;%PATH%

echo Configuring remote origin...
git remote remove origin 2>nul
git remote add origin https://github.com/Ree2612/SecureGRC.git
git branch -M main

echo.
echo Pushing codebase to GitHub (forcing update to sync with clean repository)...
git push -u origin main --force

echo.
if %ERRORLEVEL% EQU 0 (
    echo ======================================================================
    echo  SUCCESS: Code pushed to https://github.com/Ree2612/SecureGRC
    echo ======================================================================
) else (
    echo ======================================================================
    echo  If prompted for credentials:
    echo  - Username: Ree2612
    echo  - Password: Your GitHub Personal Access Token (PAT)
    echo ======================================================================
)

echo.
pause
