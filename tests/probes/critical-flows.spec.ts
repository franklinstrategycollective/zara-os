/**
 * Zara OS — Critical Flow Probes
 * Synthetic users exercise the most important workflows post-deploy.
 * Per Part 0.95: any failure here BLOCKS live promotion.
 *
 * No real PHI. Synthetic test patients only.
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PROBE_BASE_URL ?? "http://localhost:3000";

test.describe("Probe 1: Marketing site loads", () => {
  test("landing page renders and shows all 5 agents", async ({ page }) => {
    await page.goto(BASE_URL);

    await expect(page.locator("h1")).toContainText("operating system");
    await expect(page.locator("h1")).toContainText("American healthcare");

    // All 5 PAZRM agents visible
    await expect(page.locator("text=Post-Visit Autopilot")).toBeVisible();
    await expect(page.locator("text=AI Scribe")).toBeVisible();
    await expect(page.locator("text=Zara Clinical")).toBeVisible();
    await expect(page.locator("text=Referral Specialist")).toBeVisible();
    await expect(page.locator("text=Medical Knowledge")).toBeVisible();
  });

  test("security headers are correct", async ({ request }) => {
    const response = await request.get(BASE_URL);
    const headers = response.headers();

    expect(headers["strict-transport-security"]).toContain("max-age=63072000");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });
});

test.describe("Probe 2: API health endpoints", () => {
  const apiUrl = process.env.PROBE_API_URL ?? "http://localhost:8000";

  test("core API /health returns ok", async ({ request }) => {
    const response = await request.get(`${apiUrl}/health`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("zara-os-api-core");
  });

  test("core API /ready returns ready", async ({ request }) => {
    const response = await request.get(`${apiUrl}/ready`);
    expect(response.ok()).toBeTruthy();
  });

  test("internal docs are hidden in production", async ({ request }) => {
    if (process.env.NODE_ENV !== "production") {
      test.skip();
      return;
    }
    const response = await request.get(`${apiUrl}/internal/docs`);
    expect(response.status()).toBe(404);
  });
});

test.describe("Probe 3: Auth wall on PHI endpoints", () => {
  const apiUrl = process.env.PROBE_API_URL ?? "http://localhost:8000";

  test("GET /api/v1/patients/{id} without auth returns 401 or 403", async ({ request }) => {
    const response = await request.get(`${apiUrl}/api/v1/patients/00000000-0000-0000-0000-000000000000`);
    expect([401, 403]).toContain(response.status());
  });

  test("POST /api/v1/patients without auth is blocked", async ({ request }) => {
    const response = await request.post(`${apiUrl}/api/v1/patients`, {
      data: {
        given_name: "Synthetic",
        family_name: "Patient",
        date_of_birth: "1990-01-01",
        gender: "unknown",
      },
    });
    expect([401, 403]).toContain(response.status());
  });
});

test.describe("Probe 4: Audit log immutability (database direct)", () => {
  test("audit_log table rejects UPDATE", async () => {
    // This probe requires direct DB access; run as a separate SQL probe in CI
    // See: tests/probes/audit-immutability.sql
    test.skip();
  });
});
