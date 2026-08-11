#!/usr/bin/env bash
set -e

# تجهيز خادم Hostinger VPS (Ubuntu) لنظام زيارة كفالة
# شغّله مرة واحدة على السيرفر:  sudo bash hostinger-setup.sh

echo "==> تحديث النظام"
apt update && apt -y upgrade

echo "==> أدوات أساسية"
apt -y install curl git nginx ufw

echo "==> Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt -y install nodejs
corepack enable

echo "==> pnpm + pm2"
npm i -g pnpm pm2

echo "==> PostgreSQL"
apt -y install postgresql postgresql-contrib
DB_PASS="kafalah_$(openssl rand -hex 8)"
sudo -u postgres psql -c "CREATE USER kafalah WITH PASSWORD '${DB_PASS}';" || true
sudo -u postgres psql -c "CREATE DATABASE kafalah_visits OWNER kafalah;" || true

echo "==> الجدار الناري"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 8081/tcp   # لوحة الإدارة في مرحلة النطاق المؤقت
ufw --force enable

echo "==> certbot (شهادات SSL)"
apt -y install certbot python3-certbot-nginx

echo ""
echo "============================================================"
echo "تم التجهيز."
echo "DATABASE_URL=postgresql://kafalah:${DB_PASS}@localhost:5432/kafalah_visits?schema=public"
echo "احفظ هذا السطر — ستضعه في ملف .env"
echo "============================================================"
