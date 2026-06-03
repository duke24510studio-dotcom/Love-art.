/**
 * Push OPENAI_API_KEY from .env to Render (requires RENDER_API_KEY + service name).
 * Create API key: https://dashboard.render.com/u/settings#api-keys
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");

function loadEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

const env = { ...process.env, ...loadEnv(envPath) };
const renderApiKey = env.RENDER_API_KEY;
const openaiKey = env.OPENAI_API_KEY;
const serviceName = env.RENDER_SERVICE_NAME || "japandi-poster-studio";

if (!renderApiKey) {
  console.error("Missing RENDER_API_KEY. Add it to .env from https://dashboard.render.com/u/settings#api-keys");
  process.exit(1);
}
if (!openaiKey) {
  console.error("Missing OPENAI_API_KEY in .env. Run: npm run setup:openai");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${renderApiKey}`,
  Accept: "application/json",
  "Content-Type": "application/json",
};

const listRes = await fetch("https://api.render.com/v1/services?limit=100", { headers });
if (!listRes.ok) {
  console.error("Render API error:", listRes.status, await listRes.text());
  process.exit(1);
}

const data = await listRes.json();
const services = Array.isArray(data) ? data.map((x) => x.service ?? x) : data.services ?? [];
const service = services.find((s) => s.name === serviceName || s.slug === serviceName);

if (!service?.id) {
  console.error(`Service "${serviceName}" not found. Deploy on Render first, or set RENDER_SERVICE_NAME in .env`);
  process.exit(1);
}

const putRes = await fetch(`https://api.render.com/v1/services/${service.id}/env-vars`, {
  method: "PUT",
  headers,
  body: JSON.stringify([
    { key: "OPENAI_API_KEY", value: openaiKey },
  ]),
});

if (!putRes.ok) {
  console.error("Failed to set env vars:", putRes.status, await putRes.text());
  process.exit(1);
}

console.log(`OK: OPENAI_API_KEY set on Render service "${service.name}" (${service.id})`);
console.log("Redeploy may start automatically. Check https://dashboard.render.com");
