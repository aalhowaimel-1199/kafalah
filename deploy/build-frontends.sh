#!/usr/bin/env bash
# يبني الواجهتين المنفصلتين (مشفّرتين) كلٌّ بعنوان API الخاص بنطاقها.
# الاستخدام:
#   نطاق مؤقت:  WEB_URL="http://<IP>"  ADMIN_URL="http://<IP>:8081"  bash deploy/build-frontends.sh
#   نطاق نهائي: WEB_URL="https://visits.ramh.sa"  ADMIN_URL="https://control.ramh.sa"  bash deploy/build-frontends.sh
set -e
cd "$(dirname "$0")/.."

: "${WEB_URL:?عيّن WEB_URL — نطاق واجهة الزوّار}"
: "${ADMIN_URL:?عيّن ADMIN_URL — نطاق لوحة الإدارة}"

echo "▶ بناء واجهة الزوّار (apps/web) → $WEB_URL"
VITE_API_URL="$WEB_URL" pnpm --filter @ramh/web build

echo "▶ بناء لوحة الإدارة (apps/admin) → $ADMIN_URL"
VITE_API_URL="$ADMIN_URL" pnpm --filter @ramh/admin build

echo "✓ تم. النواتج: apps/web/dist  و  apps/admin/dist  (مشفّرة)"
