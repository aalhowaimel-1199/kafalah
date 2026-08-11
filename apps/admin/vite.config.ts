import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import obfuscator from "vite-plugin-javascript-obfuscator";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === "production"
      ? [
          obfuscator({
            include: ["src/**/*.ts", "src/**/*.tsx"],
            apply: "build",
            options: {
              compact: true,
              controlFlowFlattening: true,
              controlFlowFlatteningThreshold: 0.6,
              deadCodeInjection: false,
              identifierNamesGenerator: "hexadecimal",
              numbersToExpressions: true,
              simplify: true,
              stringArray: true,
              stringArrayEncoding: ["base64"],
              stringArrayThreshold: 0.75,
              splitStrings: true,
              transformObjectKeys: false,
            },
          }),
        ]
      : []),
  ],
  build: { minify: "terser", sourcemap: false },
  server: { port: 5174 },
}));
