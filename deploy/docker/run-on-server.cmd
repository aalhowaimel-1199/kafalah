@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Loading Kafalah images (first time only)...
docker load -i kafalah-images-amd64.tar
echo Starting containers...
docker compose -f docker-compose.server.yml up -d
echo.
echo Done.
echo Public site:  http://localhost:8080
echo Admin panel:  http://localhost:8081
echo Admin login:  admin@kafalah.sa  /  Kafalah@2026
echo.
pause
