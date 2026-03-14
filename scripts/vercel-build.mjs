/**
 * Vercel Build Output API v3 build script.
 * Replaces the old `api/` auto-detection that broke in Vercel CLI 50.x
 * with `framework: null`.
 *
 * Output layout:
 *   .vercel/output/
 *     config.json                   ← routes
 *     static/                       ← from dist/public  (vite build output)
 *     functions/
 *       api/
 *         index.func/
 *           index.mjs               ← esbuild bundle of api/_lambda.ts
 *           .vc-config.json         ← lambda runtime config
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, ".vercel", "output");
const STATIC_OUT = path.join(OUT, "static");
const FUNC_OUT = path.join(OUT, "functions", "api", "index.func");

// ─── helpers ────────────────────────────────────────────────────────────────

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: ROOT });
}

function mkdir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeJSON(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}

function copyDir(src, dest) {
  mkdir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

// ─── 1. Vite build ──────────────────────────────────────────────────────────

run("npx vite build");

// ─── 2. Create output skeleton ──────────────────────────────────────────────

// Wipe previous output so stale files don't accumulate
if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
mkdir(STATIC_OUT);
mkdir(FUNC_OUT);

// ─── 3. Copy static assets ──────────────────────────────────────────────────

const distPublic = path.join(ROOT, "dist", "public");
copyDir(distPublic, STATIC_OUT);
console.log("\n✓ Static files copied to .vercel/output/static/");

// ─── 4. Bundle the lambda ────────────────────────────────────────────────────

const banner =
  "import { createRequire } from 'module'; const require = createRequire(import.meta.url);";

run(
  `npx esbuild api/_lambda.ts` +
    ` --bundle` +
    ` --platform=node` +
    ` --format=esm` +
    ` --external:bufferutil` +
    ` --external:utf-8-validate` +
    ` "--banner:js=${banner}"` +
    ` --outfile=${path.join(FUNC_OUT, "index.mjs")}`
);

// ─── 5. Lambda runtime config ────────────────────────────────────────────────

writeJSON(path.join(FUNC_OUT, ".vc-config.json"), {
  runtime: "nodejs20.x",
  handler: "index.default",
  launcherType: "Nodejs",
  maxDuration: 30,
  memory: 1024,
  regions: ["iad1"],
  environment: {},
});

console.log("\n✓ Lambda written to .vercel/output/functions/api/index.func/");

// ─── 6. Vercel output config (routes) ────────────────────────────────────────

writeJSON(path.join(OUT, "config.json"), {
  version: 3,
  routes: [
    // API and asset uploads → lambda
    { src: "^/api/(.*)", dest: "/api/index" },
    { src: "^/attached_assets/(.*)", dest: "/api/index" },
    // Static assets (hashed filenames) → serve directly
    { handle: "filesystem" },
    // SPA fallback
    { src: "^/(.*)", dest: "/index.html" },
  ],
});

console.log("\n✓ .vercel/output/config.json written");
console.log("\n🎉 Vercel Build Output API build complete!\n");
