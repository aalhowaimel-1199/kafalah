import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env, allowedOrigins } from "./env";
import { auth } from "./auth";
import { requireAuth } from "./middleware/auth";
import { visitsRoutes } from "./routes/visits.routes";
import { adminRoutes } from "./routes/admin.routes";
import { iclockRoutes } from "./routes/iclock.routes";
import { pagesRoutes } from "./routes/pages.routes";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => (allowedOrigins.includes(origin) ? origin : allowedOrigins[0]),
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.get("/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.get("/api/me", requireAuth(), (c) => c.json(c.get("user")));
app.route("/api/visits", visitsRoutes);
app.route("/api/pages", pagesRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/iclock", iclockRoutes);

serve({ fetch: app.fetch, port: env.API_PORT }, (info) => {
  console.log(`Visit API on http://localhost:${info.port}`);
});
