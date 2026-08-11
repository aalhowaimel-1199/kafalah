module.exports = {
  apps: [
    {
      name: "kafalah-api",
      cwd: "/var/www/kafalah",
      script: "pnpm",
      args: "--filter @ramh/api start",
      env: { NODE_ENV: "production" },
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
