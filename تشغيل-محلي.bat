@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title نظام زيارة كفالة - تشغيل محلي

echo ============================================
echo   نظام زيارة كفالة - تشغيل محلي
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [X] Node.js غير مثبّت.
  echo     حمّله من: https://nodejs.org  ثم اعد تشغيل هذا الملف.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node -v') do echo [OK] Node %%v

call corepack enable 2>nul
where pnpm >nul 2>nul || call npm i -g pnpm

where docker >nul 2>nul
if errorlevel 1 (
  echo [X] Docker Desktop غير مثبّت - قاعدة البيانات تحتاجه.
  echo     حمّله من: https://www.docker.com/products/docker-desktop  ثم شغّله ثم اعد المحاولة.
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ('docker --version') do echo [OK] %%v

echo.
echo [1/6] تشغيل قاعدة البيانات (PostgreSQL)...
docker compose up -d
if errorlevel 1 (
  echo [X] تعذّر تشغيل قاعدة البيانات. تأكد أن Docker Desktop يعمل.
  pause
  exit /b 1
)

set "DATABASE_URL=postgresql://kafalah:kafalah@localhost:5432/kafalah_visits?schema=public"
set "BETTER_AUTH_SECRET=local-dev-secret-change-in-production-0123456789"
set "BETTER_AUTH_URL=http://localhost:8787"
set "API_PORT=8787"
set "WEB_ORIGIN=http://localhost:5173"
set "ADMIN_ORIGIN=http://localhost:5174"
set "PUBLIC_WEB_URL=http://localhost:5173"
set "SEED_ADMIN_EMAIL=admin@kafalah.sa"
set "SEED_ADMIN_PASSWORD=Kafalah@2026"
set "VITE_API_URL=http://localhost:8787"

if not exist ".env" copy ".env.example" ".env" >nul

echo.
echo [2/6] تثبيت الحزم (قد يأخذ بضع دقائق اول مرة)...
call pnpm install
if errorlevel 1 ( echo [X] فشل تثبيت الحزم. & pause & exit /b 1 )

echo.
echo [3/6] توليد Prisma...
call pnpm --filter @ramh/db exec prisma generate

echo.
echo [4/6] انتظار جاهزية قاعدة البيانات...
timeout /t 6 >nul

echo [5/6] انشاء الجداول + البيانات الاولية + حساب المدير...
call pnpm --filter @ramh/db exec prisma db push --skip-generate --accept-data-loss
call pnpm --filter @ramh/db run seed
call pnpm --filter @ramh/api run bootstrap

echo.
echo [6/6] تشغيل الخادم والواجهة...
start "Kafalah API" cmd /k "set DATABASE_URL=%DATABASE_URL%&& set BETTER_AUTH_SECRET=%BETTER_AUTH_SECRET%&& set BETTER_AUTH_URL=%BETTER_AUTH_URL%&& set API_PORT=%API_PORT%&& set WEB_ORIGIN=%WEB_ORIGIN%&& set ADMIN_ORIGIN=%ADMIN_ORIGIN%&& set PUBLIC_WEB_URL=%PUBLIC_WEB_URL%&& set SEED_ADMIN_EMAIL=%SEED_ADMIN_EMAIL%&& set SEED_ADMIN_PASSWORD=%SEED_ADMIN_PASSWORD%&& pnpm --filter @ramh/api dev"
start "Kafalah WEB" cmd /k "set VITE_API_URL=%VITE_API_URL%&& pnpm --filter @ramh/web dev"
start "Kafalah ADMIN" cmd /k "set VITE_API_URL=%VITE_API_URL%&& pnpm --filter @ramh/admin dev"

echo.
echo انتظار بدء الواجهة...
timeout /t 10 >nul
start "" http://localhost:5173
start "" http://localhost:5174

echo.
echo ============================================
echo   جاهز
echo   واجهة الزوّار:  http://localhost:5173
echo   لوحة الادارة (تطبيق منفصل):  http://localhost:5174
echo   دخول المدير:   admin@kafalah.sa  /  Kafalah@2026
echo ============================================
echo (لا تغلق نافذتي API و WEB - النظام يعمل من خلالهما)
pause
