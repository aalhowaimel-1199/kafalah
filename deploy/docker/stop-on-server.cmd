@echo off
chcp 65001 >nul
cd /d "%~dp0"
docker compose -f docker-compose.server.yml down
echo Stopped. (database data is kept)
pause
