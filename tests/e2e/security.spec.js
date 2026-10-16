// Runtime security checks against the production build.
import { test, expect } from "@playwright/test";

// Version check the admin bundle tries to make; blocked on purpose (the CMS version is pinned).
const EXPECTED_ADMIN_BLOCKS = [/^https:\/\/unpkg\.com\//];

async function collectViolations(page) {
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (e) =>
      window.__cspViolations.push(`${e.effectiveDirective} ${e.blockedURI}`),
    );
  });
}

async function postPageUrl(page) {
  await page.goto("/#blog");
  const hrefs = await page.locator(".blog-post-item > a").evaluateAll((els) => els.map((a) => a.getAttribute("href")));
  return hrefs.find((h) => h.startsWith("/blog/"));
}

test("public pages: no CSP violations and no third-party requests", async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  const foreign = [];
  page.on("request", (req) => {
    const url = req.url();
    if (!url.startsWith(origin) && !url.startsWith("data:")) foreign.push(url);
  });
  await collectViolations(page);

  const post = await postPageUrl(page);
  for (const url of ["/", "/#resume", "/#certificates", "/#blog", post]) {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    for (const id of ["resume", "certificates", "blog", "about"]) {
      const link = page.locator(`[data-nav-link="${id}"]`);
      if (url === "/" && (await link.isVisible())) await link.click();
    }
    expect(await page.evaluate(() => window.__cspViolations), `CSP violations on ${url}`).toEqual([]);
  }
  expect(foreign, "requests to other origins").toEqual([]);
});

test("every HTML page carries a strict Content-Security-Policy meta tag", async ({ page }) => {
  const post = await postPageUrl(page);
  for (const url of ["/", post]) {
    await page.goto(url);
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain("unsafe-inline");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
  }
});

test("external links never leak window.opener", async ({ page }) => {
  await page.goto("/");
  const unsafe = await page.$$eval('a[href^="http"]', (links) =>
    links.filter((a) => a.target === "_blank" && !/noopener/.test(a.rel)).map((a) => a.href),
  );
  expect(unsafe).toEqual([]);
});

test("original uploads are not published", async ({ request }) => {
  const res = await request.get("/assets/uploads/avatar.png");
  expect(res.status()).toBe(404);
});

test("admin: loads the self-hosted CMS with no unexpected CSP violations", async ({ page, baseURL }) => {
  await collectViolations(page);
  await page.goto("/admin/");
  // Sveltia wraps "GitHub" in invisible Unicode isolation marks (U+2068/U+2069).
  await expect(page.getByRole("button", { name: /Sign In with[\s\u2068\u2069]*GitHub/i })).toBeVisible({ timeout: 20000 });

  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
  expect(csp).toContain("script-src 'self';");
  expect(csp).not.toMatch(/script-src[^;]*(unpkg|jsdelivr|unsafe)/);

  const violations = await page.evaluate(() => window.__cspViolations);
  const unexpected = violations.filter((v) => !EXPECTED_ADMIN_BLOCKS.some((re) => re.test(v.split(" ")[1] || "")));
  expect(unexpected).toEqual([]);

  const scripts = await page.$$eval("script[src]", (els) => els.map((s) => s.src));
  for (const src of scripts) expect(new URL(src).origin).toBe(new URL(baseURL).origin);
});

test("public site refuses to be shown inside a frame (clickjacking)", async ({ page }) => {
  await page.goto("/robots.txt");
  const hidden = await page.evaluate(async () => {
    const frame = document.createElement("iframe");
    frame.src = "/";
    document.body.append(frame);
    await new Promise((r) => setTimeout(r, 3000));
    return frame.contentDocument.documentElement.hidden;
  });
  expect(hidden).toBe(true);
});

test("admin: refuses to run inside a frame (clickjacking)", async ({ page }) => {
  // robots.txt is a same-origin document with no CSP of its own, so it can host the frame.
  await page.goto("/robots.txt");
  const result = await page.evaluate(async () => {
    const frame = document.createElement("iframe");
    frame.src = "/admin/";
    document.body.append(frame);
    await new Promise((r) => setTimeout(r, 3000));
    return {
      cmsLoaded: typeof frame.contentWindow.CMS !== "undefined",
      scripts: [...frame.contentDocument.scripts].map((s) => s.getAttribute("src")),
    };
  });
  expect(result.cmsLoaded).toBe(false);
  expect(result.scripts).not.toContain("sveltia-cms.js");
});
