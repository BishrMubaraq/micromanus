#!/usr/bin/env node
/**
 * One-command local bootstrap for MicroManus.
 * Usage: npm run setup
 */
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envExample = resolve(root, ".env.example");
const envLocal = resolve(root, ".env.local");

function run(command, options = {}) {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit", cwd: root, ...options });
}

console.log("MicroManus setup\n");

if (!existsSync(envLocal)) {
  copyFileSync(envExample, envLocal);
  console.log("Created .env.local from .env.example");
} else {
  console.log(".env.local already exists — leaving it unchanged");
}

let envContents = readFileSync(envLocal, "utf8");
if (/^PROVIDER_ENCRYPTION_KEY=\s*$/m.test(envContents)) {
  const key = randomBytes(32).toString("hex");
  envContents = envContents.replace(
    /^PROVIDER_ENCRYPTION_KEY=.*$/m,
    `PROVIDER_ENCRYPTION_KEY=${key}`,
  );
  writeFileSync(envLocal, envContents);
  console.log("Generated PROVIDER_ENCRYPTION_KEY");
}

run("npm install");

let supabaseReady = false;
try {
  execSync("npx supabase --version", { stdio: "pipe", cwd: root });
  supabaseReady = true;
} catch {
  console.log(
    "\nSupabase CLI not required for install. Apply migrations manually or install the CLI.",
  );
}

if (supabaseReady && process.env.SUPABASE_DB_PUSH === "1") {
  run("npx supabase db push");
} else {
  console.log(`
Next steps:
  1. Fill Supabase + SerpAPI (+ Lemon) values in .env.local
  2. Enable GitHub Auth in Supabase (callback: {APP_URL}/auth/callback)
  3. Apply migrations:
       npx supabase link --project-ref <ref>
       npx supabase db push
     or run SQL files in supabase/migrations/ in order
  4. Start the app:
       npm run dev
`);
}

console.log("Setup complete.");
