import { expect, test } from "@playwright/test";

test("home, navigation and responsive layout", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Menos vueltas");
  await expect(page.locator(".hero-demo")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.getByRole("link", { name: "Ver todas las herramientas" }).click();
  await expect(page).toHaveURL(/\/herramientas$/);
  await expect(page.locator("a[href='/herramientas/calculadora-porcentajes']").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("percentage calculation, validation and reset", async ({ page }) => {
  await page.goto("/herramientas/calculadora-porcentajes");
  await page.getByLabel("Porcentaje", { exact: true }).fill("12,5");
  await page.getByLabel("Cantidad", { exact: true }).fill("80");
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await expect(page.locator(".result-primary .result-number")).toHaveText("10");
  await page.getByLabel("Cantidad", { exact: true }).fill("-1");
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await expect(page.getByLabel("Cantidad", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Porcentaje", { exact: true })).toHaveValue("12,5");
  await page.getByRole("button", { name: "Restablecer" }).click();
  await expect(page.getByLabel("Cantidad", { exact: true })).toHaveValue("200");
  await expect(page.locator(".result-primary .result-number")).toHaveText("30");
});

test("leap-year dates and length conversion", async ({ page }) => {
  await page.goto("/herramientas/diferencia-entre-fechas");
  await page.getByLabel("Primera fecha", { exact: true }).fill("2024-02-28");
  await page.getByLabel("Segunda fecha", { exact: true }).fill("2024-03-01");
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await expect(page.locator(".result-primary .result-number")).toContainText("2");
  await page.goto("/herramientas/conversor-longitud");
  await page.getByLabel("Longitud", { exact: true }).fill("750");
  await page.getByLabel("De", { exact: true }).selectOption("mm");
  await page.getByLabel("A", { exact: true }).selectOption("m");
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await expect(page.locator(".result-primary .result-number")).toContainText("0,75");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("admin is protected and unknown tools are 404", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.locator("meta[name='robots']")).toHaveAttribute("content", /noindex/);
  const response = await page.goto("/herramientas/herramienta-inexistente");
  expect(response?.status()).toBe(404);
});

test("search, empty results and category navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Buscar una herramienta").fill("FECHAS");
  await page.getByRole("button", { name: "Buscar herramientas" }).click();
  await expect(page).toHaveURL(/\/buscar\?q=FECHAS$/);
  await expect(page.locator(".tool-card")).toHaveCount(1);
  await expect(page.locator("meta[name='robots']")).toHaveAttribute("content", /noindex/);
  await page.getByLabel("Buscar una herramienta").fill("zzsincoincidencias");
  await page.getByRole("button", { name: "Buscar herramientas" }).click();
  await expect(page.getByRole("heading", { name: "No encontramos esa herramienta" })).toBeVisible();
  await page.getByRole("navigation", { name: "Filtrar por categoría" }).getByRole("link", { name: "Conversores" }).click();
  await expect(page.locator("a[href='/herramientas/conversor-longitud']")).toBeVisible();
});

test("copying and local events never include calculator inputs", async ({ page, context, baseURL }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    const events: unknown[] = [];
    Object.assign(window, { toolEvents: events });
    window.addEventListener("claro:tool-event", (event) => events.push((event as CustomEvent).detail));
  });
  await page.goto("/herramientas/calculadora-porcentajes");
  await page.getByLabel("Cantidad", { exact: true }).fill("80");
  await expect(page.getByRole("button", { name: "Copiar resultado" })).toBeDisabled();
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await page.getByRole("button", { name: "Copiar resultado" }).click();
  await expect(page.getByRole("button", { name: "Resultado copiado" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("12");
  await page.getByRole("button", { name: "Copiar enlace" }).click();
  await expect(page.getByRole("status")).toContainText("Enlace copiado");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(new URL("/herramientas/calculadora-porcentajes", baseURL).href);
  const events = await page.evaluate(() => (window as Window & { toolEvents?: Record<string, unknown>[] }).toolEvents ?? []);
  expect(events.map((event) => event.event)).toEqual(["tool_view", "tool_start", "tool_submit", "tool_complete", "result_copy", "share_click"]);
  for (const event of events) expect(Object.keys(event).sort()).toEqual(["category", "event", "tool_slug", "version"]);
});

test("SEO, sitemap and disabled external integrations", async ({ page, request }) => {
  await page.goto("/herramientas/calculadora-porcentajes");
  await expect(page.locator("link[rel='canonical']")).toHaveAttribute("href", /\/herramientas\/calculadora-porcentajes$/);
  await expect(page.locator("meta[name='description']")).toHaveAttribute("content", /porcentaje/i);
  await expect(page.locator("script[src*='googlesyndication'], script[src*='googletagmanager'], script[src*='tiktok']")).toHaveCount(0);
  const health = await request.get("/api/health");
  expect(health.ok()).toBeTruthy();
  expect(await health.json()).toMatchObject({ status: "ok" });
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const xml = await sitemap.text();
  expect(xml).not.toContain("/admin");
  expect(xml).not.toContain("draft");
});
