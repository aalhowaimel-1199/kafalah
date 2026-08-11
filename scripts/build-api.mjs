import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entry = resolve(root, "apps/api/src/index.ts");
const outfile = resolve(root, "apps/api/dist/server.cjs");

await build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  minify: true,
  legalComments: "none",
  sourcemap: false,
  external: ["@prisma/client", ".prisma/client", "bwip-js", "nodemailer", "better-auth"],
});

console.log("API bundled and minified:", outfile);
