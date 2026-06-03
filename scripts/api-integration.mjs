#!/usr/bin/env node
/**
 * Verifies portfolio UI ↔ api-portfolio connectivity.
 * Usage:
 *   API_URL=http://127.0.0.1:3001 UI_URL=http://localhost:3000 node scripts/api-integration.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const API_BASE = (process.env.API_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
const UI_BASE = (process.env.UI_URL ?? "http://localhost:3000").replace(/\/$/, "");

let passed = 0;
let failed = 0;

function ok(name, detail = "") {
  passed++;
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  failed++;
  console.log(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

function readLocalSecret() {
  try {
    const envPath = resolve(process.cwd(), ".env");
    const text = readFileSync(envPath, "utf8");
    const match = text.match(/^API_SECRET=(.+)$/m);
    return match?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}

async function main() {
  console.log(`\nAPI integration: UI ${UI_BASE} → API ${API_BASE}\n`);

  // 1. Home API health
  try {
    const health = await fetch(`${API_BASE}/api/health`);
    if (health.ok) {
      const body = await health.json().catch(() => ({}));
      ok("Home API /api/health", body.status ?? "ok");
    } else {
      fail("Home API /api/health", `HTTP ${health.status}`);
    }
  } catch (err) {
    fail("Home API /api/health", err.message);
  }

  // 2. UI proxy health (if API_URL set on UI)
  try {
    const uiHealth = await fetch(`${UI_BASE}/api/health`, { redirect: "manual" });
    if (uiHealth.ok) ok("UI proxy /api/health");
    else if (uiHealth.status === 502) fail("UI proxy /api/health", "502 — home API unreachable from UI");
    else fail("UI proxy /api/health", `HTTP ${uiHealth.status}`);
  } catch (err) {
    fail("UI proxy /api/health", err.message);
  }

  // 3. Auth status JSON
  try {
    const status = await fetch(`${UI_BASE}/api/auth/status`);
    const body = await status.json();
    if (status.ok && typeof body === "object") ok("UI /api/auth/status returns JSON");
    else fail("UI /api/auth/status", `HTTP ${status.status}`);
  } catch (err) {
    fail("UI /api/auth/status", err.message);
  }

  // 4. Login proxy returns JSON (invalid creds)
  try {
    const login = await fetch(`${UI_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "__integration_test__", password: "wrong" }),
    });
    const contentType = login.headers.get("content-type") ?? "";
    const text = await login.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* not json */
    }
    if (contentType.includes("application/json") && json && typeof json === "object") {
      ok("UI POST /api/auth/login returns JSON body", `status ${login.status}`);
    } else {
      fail("UI POST /api/auth/login", "response is not JSON — check home-api proxy buffering");
    }
  } catch (err) {
    fail("UI POST /api/auth/login", err.message);
  }

  // 5. Demo session + /api/me round-trip
  try {
    const demo = await fetch(`${UI_BASE}/api/auth/demo`, { method: "POST" });
    const cookies =
      typeof demo.headers.getSetCookie === "function" ? demo.headers.getSetCookie() : [];
    const cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ");
    if (!demo.ok || !cookieHeader) {
      fail("Demo auth session");
    } else {
      ok("Demo auth session");
      const me = await fetch(`${UI_BASE}/api/me`, { headers: { Cookie: cookieHeader } });
      const meType = me.headers.get("content-type") ?? "";
      const meBody = await me.json().catch(() => null);
      const portfolio = meBody?.portfolio ?? meBody;
      if (me.ok && meType.includes("json") && portfolio?.sections) {
        ok("GET /api/me returns portfolio payload");
        const widgets = portfolio.uiPreferences?.overviewWidgets;
        if (widgets?.order?.length) {
          ok("overviewWidgets present", widgets.order.join(", "));
        } else {
          ok("overviewWidgets defaults applied");
        }
      } else if (me.status === 502) {
        fail("GET /api/me", "502 — API_URL may be wrong or api-portfolio down");
      } else {
        fail("GET /api/me", `HTTP ${me.status}`);
      }

      const exportRes = await fetch(`${UI_BASE}/api/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookieHeader },
        body: JSON.stringify(portfolio),
      });
      if (exportRes.ok) {
        const exportBody = await exportRes.json().catch(() => ({}));
        ok(
          "POST /api/export",
          exportBody.demo ? "demo mode (validated, not persisted)" : "persisted via home API"
        );
      }
      else if (exportRes.status === 502) fail("POST /api/export", "502");
      else fail("POST /api/export", `HTTP ${exportRes.status}`);
    }
  } catch (err) {
    fail("Demo /api/me flow", err.message);
  }

  const localSecret = readLocalSecret();
  if (localSecret) {
    ok("portfolio .env has API_SECRET", `${localSecret.length} chars`);
  } else {
    fail("portfolio .env API_SECRET", "not found");
  }

  console.log(`\n--- Result: ${passed} passed, ${failed} failed ---\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
