@echo off
chcp 65001 >nul
cd /d "%~dp0"
where python >nul 2>nul && (set PY=python) || (set PY=py)
start "" "http://localhost:5180/?edit"
%PY% serve.py 5180
if errorlevel 1 (
  echo.
  echo   편집 서버를 켜지 못했어요. 이미 다른 창에서 켜져 있거나 Python이 없을 수 있어요.
  pause
)
