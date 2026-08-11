#!/bin/sh
set -e
cd /app

echo "Applying database schema..."
node node_modules/prisma/build/index.js db push --schema packages/db/prisma/schema --skip-generate

echo "Seeding reference data..."
node node_modules/tsx/dist/cli.mjs packages/db/prisma/seed.ts

echo "Ensuring admin account..."
( cd apps/api && node ../../node_modules/tsx/dist/cli.mjs src/scripts/bootstrap.ts )

echo "Starting API..."
exec node node_modules/tsx/dist/cli.mjs apps/api/src/index.ts
