#!/usr/bin/env node
/**
 * Production deploy helper (Vercel).
 * Usage: npm run deploy
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(command) {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit", cwd: root });
}

console.log("MicroManus deploy\n");

if (!existsSync(resolve(root, ".env.local")) && !process.env.VERCEL) {
  console.warn(
    "Warning: .env.local missing locally. Ensure Vercel project env vars are set.",
  );
}

run("npm run build");

try {
  execSync("npx vercel --version", { stdio: "pipe", cwd: root });
} catch {
  console.error(
    "\nVercel CLI is required. Install with: npm i -g vercel\nThen: vercel login && npm run deploy",
  );
  process.exit(1);
}

run("npx vercel --prod --yes");
console.log("\nDeploy finished. Set Lemon webhook to https://<domain>/api/webhooks/lemon-squeezy");
