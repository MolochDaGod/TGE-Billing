#!/usr/bin/env node
/**
 * deploy-puter.js
 * Deploys TGE-Billing frontend to Puter static hosting
 * and TGEWORKER to Puter Serverless Workers.
 *
 * Usage:
 *   node scripts/deploy-puter.js           # Deploy everything
 *   node scripts/deploy-puter.js --site    # Deploy frontend only
 *   node scripts/deploy-puter.js --worker  # Deploy worker only
 *
 * Prerequisites:
 *   npm install -g puter-cli
 *   puter login
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist", "public");
const WORKER_FILE = path.join(ROOT, "workers", "tgeworker.js");
const SUBDOMAIN = "tgebilling";

const args = process.argv.slice(2);
const deploySite = args.length === 0 || args.includes("--site");
const deployWorker = args.length === 0 || args.includes("--worker");

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit", cwd: ROOT, ...opts });
  } catch (e) {
    console.error(`Command failed: ${cmd}`);
    process.exit(1);
  }
}

function tryRun(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit", cwd: ROOT, ...opts });
    return true;
  } catch {
    return false;
  }
}

function log(msg) {
  console.log(`\n=== ${msg} ===`);
}

function checkPuterCli() {
  try {
    execSync("puter --version", { stdio: "pipe" });
    return true;
  } catch {
    console.error("puter-cli not found. Install it with: npm install -g puter-cli");
    console.error("Then login with: puter login");
    process.exit(1);
  }
}

// ---- Preflight ----
checkPuterCli();

// ---- Build & deploy frontend ----
if (deploySite) {
  log("Building frontend with Vite");
  run("npx vite build");

  if (!fs.existsSync(DIST_DIR)) {
    console.error(`Build output not found at ${DIST_DIR}`);
    process.exit(1);
  }

  log(`Uploading frontend to Puter (/tgebilling-app)`);
  run(`puter push "${DIST_DIR}" /tgebilling-app`);

  log(`Publishing site to ${SUBDOMAIN}.puter.site`);
  // Try creating the site; if it exists, update it
  if (!tryRun(`puter site create ${SUBDOMAIN} --dir /tgebilling-app`)) {
    tryRun(`puter site update ${SUBDOMAIN} --dir /tgebilling-app`);
  }

  console.log(`\n✅ Frontend live at: https://${SUBDOMAIN}.puter.site`);
}

// ---- Deploy TGEWORKER ----
if (deployWorker) {
  log("Deploying TGEWORKER to Puter Serverless");

  if (!fs.existsSync(WORKER_FILE)) {
    console.error(`Worker file not found at ${WORKER_FILE}`);
    process.exit(1);
  }

  log("Uploading worker file to Puter cloud storage");
  run(`puter push "${WORKER_FILE}" /tgeworker.js`);

  console.log(`
✅ Worker file uploaded to /tgeworker.js

To activate the worker, run this in your browser console at https://puter.com (while logged in):

  const dep = await puter.hosting.create('tgeworker', 'tgeworker.js');
  console.log('Worker URL:', dep.subdomain + '.puter.site');

Or update an existing worker:
  await puter.hosting.update('tgeworker', 'tgeworker.js');

Then set VITE_TGEWORKER_URL in your Vercel environment variables to the worker URL.
`);
}

log("Deployment complete");
console.log(`
Summary:
  Frontend: ${deploySite ? `https://${SUBDOMAIN}.puter.site` : "skipped"}
  Worker:   ${deployWorker ? "tgeworker uploaded — activate via Puter.js SDK" : "skipped"}

The Express backend runs on Vercel serverless (/api/* routes).
`);
