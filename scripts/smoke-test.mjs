#!/usr/bin/env node
/**
 * Smoke test against local dev server (localhost:3000).
 * Run: node scripts/smoke-test.mjs
 */

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const routes = [
  { path: "/", expect: [200, 307, 308] },
  { path: "/dashboard", expect: [200] },
  { path: "/assets", expect: [200] },
  { path: "/cash", expect: [200] },
  { path: "/liabilities", expect: [200] },
  { path: "/plan", expect: [200] },
  { path: "/plan?tab=wallets", expect: [200] },
  { path: "/plan?tab=income", expect: [200] },
  { path: "/settings", expect: [200] },
  { path: "/login", expect: [200] },
  { path: "/terms", expect: [200] },
  { path: "/api/auth/status", expect: [200] },
];

async function getAuthStatus() {
  const res = await fetch(`${BASE}/api/auth/status`);
  return res.json();
}

let failed = 0;
let passed = 0;

async function checkRoute({ path, expect: expected }) {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, { redirect: "manual" });
    const ok = expected.includes(res.status);
    if (ok) {
      passed++;
      console.log(`✓ ${res.status} ${path}`);
    } else {
      failed++;
      console.log(`✗ ${res.status} ${path} (expected ${expected.join("|")})`);
    }
    return res;
  } catch (err) {
    failed++;
    console.log(`✗ ERR ${path}: ${err.message}`);
    return null;
  }
}

async function checkApi({ name, method, path, body, expect: expected }) {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const ok = expected.includes(res.status);
    if (ok) {
      passed++;
      console.log(`✓ ${res.status} ${name}`);
    } else {
      failed++;
      const text = await res.text().catch(() => "");
      console.log(`✗ ${res.status} ${name} (expected ${expected.join("|")}) ${text.slice(0, 80)}`);
    }
  } catch (err) {
    failed++;
    console.log(`✗ ERR ${name}: ${err.message}`);
  }
}

async function checkHtmlContains(path, needles) {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url);
    const html = await res.text();
    const missing = needles.filter((n) => !html.includes(n));
    if (res.status === 200 && missing.length === 0) {
      passed++;
      console.log(`✓ content ${path}`);
    } else {
      failed++;
      console.log(`✗ content ${path} missing: ${missing.join(", ")}`);
    }
  } catch (err) {
    failed++;
    console.log(`✗ ERR content ${path}: ${err.message}`);
  }
}

console.log(`\nSmoke test: ${BASE}\n--- Routes ---`);

for (const r of routes) {
  await checkRoute(r);
}

console.log("\n--- API ---");
const authStatus = await getAuthStatus();
console.log(
  `  auth: ${authStatus.enabled ? "enabled" : "disabled"} (authenticated: ${authStatus.authenticated})`
);
await checkApi({
  name: "POST /api/account",
  method: "POST",
  path: "/api/account",
  body: { username: "smoke_test", password: "smoke_test_pass" },
  expect: [200],
});
if (authStatus.enabled) {
  await checkApi({
    name: "POST /api/auth/login (invalid creds)",
    method: "POST",
    path: "/api/auth/login",
    body: { username: "wrong", password: "wrong" },
    expect: [401],
  });
} else {
  await checkApi({
    name: "POST /api/auth/login (auth off)",
    method: "POST",
    path: "/api/auth/login",
    body: { username: "x", password: "y" },
    expect: [200],
  });
}

console.log("\n--- Page content ---");
await checkHtmlContains("/dashboard", ["Overview", "Muscadine"]);
await checkHtmlContains("/plan?tab=wallets", ["Wallets", "wallet"]);
await checkHtmlContains("/settings", ["Settings", "Account"]);

console.log(`\n--- Result: ${passed} passed, ${failed} failed ---\n`);
process.exit(failed > 0 ? 1 : 0);
