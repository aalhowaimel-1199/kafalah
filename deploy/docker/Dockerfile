FROM node:20-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps ./apps
RUN pnpm install
RUN pnpm --filter @ramh/db generate
RUN printf 'VITE_API_URL=\n' > apps/web/.env && printf 'VITE_API_URL=\n' > apps/admin/.env
RUN pnpm --filter @ramh/web build && pnpm --filter @ramh/admin build
RUN rm -f apps/api/.env packages/db/.env

FROM node:20-slim AS api
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build /app ./
RUN rm -rf node_modules/embedded-postgres node_modules/@embedded-postgres \
    node_modules/.pnpm/embedded-postgres* node_modules/.pnpm/@embedded-postgres*
COPY deploy/docker/api-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
EXPOSE 8787
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

FROM nginx:1.27-alpine AS web
COPY deploy/docker/nginx-site.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
RUN chmod -R a+rX /usr/share/nginx/html

FROM nginx:1.27-alpine AS admin
COPY deploy/docker/nginx-site.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
RUN chmod -R a+rX /usr/share/nginx/html
