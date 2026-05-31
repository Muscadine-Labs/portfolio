#!/usr/bin/env node
/**
 * Browser smoke tests (Playwright) — run: node scripts/e2e-smoke.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));

  try {
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    record("Dashboard loads", (await page.locator("text=Overview").count()) > 0);

    await page.goto(`${BASE}/plan?tab=wallets`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /add/i }).first().click();
    const drawer = page.locator('[data-slot="drawer-content"]');
    await drawer.waitFor({ timeout: 5000 });

    const typeSelect = drawer.locator("#wallet-type");
    await typeSelect.selectOption("bitcoin_cold");
    record(
      "Wallet Type native select",
      (await typeSelect.inputValue()) === "bitcoin_cold"
    );

    const statusSelect = drawer.locator("#wallet-status");
    await statusSelect.selectOption("planned");
    record(
      "Wallet Status native select",
      (await statusSelect.inputValue()) === "planned"
    );

    await page.keyboard.press("Escape");

    await page.goto(`${BASE}/cash`, { waitUntil: "networkidle" });
    const addCash = page.getByRole("button", { name: /add|new/i }).first();
    if ((await addCash.count()) > 0) {
      await addCash.click();
      await page.waitForSelector("#cash-section", { timeout: 5000 });
      const cashSection = page.locator("#cash-section");
      const opts = await cashSection.locator("option").count();
      record("Cash drawer section select", opts > 1);
    }

    await page.goto(`${BASE}/assets`, { waitUntil: "networkidle" });
    const filterTrigger = page.locator('[data-slot="select-trigger"]').first();
    await filterTrigger.click();
    const filterPopup = page.locator('[data-slot="select-content"][data-open]');
    await filterPopup.waitFor({ state: "visible", timeout: 5000 });
    record("Assets page filter select (Base UI)", await filterPopup.isVisible());
    await page.keyboard.press("Escape");

    await page.goto(`${BASE}/plan?tab=goals`, { waitUntil: "networkidle" });
    const addGoal = page.getByRole("button", { name: /add/i }).first();
    if ((await addGoal.count()) > 0) {
      await addGoal.click();
      await page.waitForSelector("#goal-status", { timeout: 5000 });
      await page.locator("#goal-status").selectOption("in_progress");
      record(
        "Goals drawer status select",
        (await page.locator("#goal-status").inputValue()) === "in_progress"
      );
    }

    record("No uncaught page errors", errors.length === 0, errors.join("; ") || "");
  } catch (err) {
    record("Test run", false, err.message);
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n--- Browser: ${results.length - failed}/${results.length} passed ---\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
