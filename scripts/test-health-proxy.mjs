#!/usr/bin/env node
/**
 * Smoke test: portfolio /api/health reaches home API.
 *   BASE_URL=https://portfolio.muscadine.io node scripts/test-health-proxy.mjs
 *   BASE_URL=http://127.0.0.1:3000 node scripts/test-health-proxy.mjs
 */
const BASE = (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

const res = await fetch(`${BASE}/api/health`, { cache: "no-store" });
if (!res.ok) {
  console.error(`FAIL: GET /api/health → HTTP ${res.status}`);
  process.exit(1);
}

const body = await res.json();
if (body.status !== "ok" || !body.version) {
  console.error("FAIL: unexpected body", body);
  process.exit(1);
}

console.log(`OK: ${BASE}/api/health → ${body.service} v${body.version}`);
