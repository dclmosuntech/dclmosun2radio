@echo off
set "GIT_DIR=%LOCALAPPDATA%\Programs\Git"
if not exist "%GIT_DIR%" mkdir "%GIT_DIR%"
set "ZIP_PATH=%TEMP%\mingit.zip"

echo Downloading MinGit...
curl.exe -L -o "%ZIP_PATH%" https://github.com/git-for-windows/git/releases/download/v2.55.0.windows.3/MinGit-2.55.0.3-64-bit.zip

echo Extracting MinGit to %GIT_DIR%...
tar.exe -xf "%ZIP_PATH%" -C "%GIT_DIR%"

if exist "%ZIP_PATH%" del /f /q "%ZIP_PATH%"

echo Verifying Git...
"%GIT_DIR%\cmd\git.exe" --version

echo Setting User PATH...
powershell -Command "[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path', 'User') + ';%LOCALAPPDATA%\Programs\Git\cmd', 'User')"

echo Done!
