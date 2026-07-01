#!/usr/bin/env node
/**
 * Smoke test: portfolio /api/health reaches home API.
 *   BASE_URL=https://portfolio.muscadine.xyz node scripts/test-health-proxy.mjs
 *   BASE_URL=http://127.0.0.1:3000 node scripts/test-health-proxy.mjs
 */
const BASE = (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

const res = await fetch(`${BASE}/api/health`, { cache: "no-store" });
const text = await res.text();
if (!res.ok || !text.trim()) {
  console.error(`FAIL: GET /api/health → HTTP ${res.status}, body length ${text.length}`);
  process.exit(1);
}

const body = JSON.parse(text);
if (body.status !== "ok" || !body.version) {
  console.error("FAIL: unexpected body", body);
  process.exit(1);
}

console.log(`OK: ${BASE}/api/health → ${body.service} v${body.version}`);

const emptyPost = await fetch(`${BASE}/api/market/quotes`, { method: "POST" });
if (emptyPost.status === 502) {
  const err = await emptyPost.json().catch(() => ({}));
  console.error("FAIL: empty POST /api/market/quotes → 502", err);
  process.exit(1);
}
console.log(
  `OK: empty POST /api/market/quotes → HTTP ${emptyPost.status} (expected 401 without session, not 502)`
);
