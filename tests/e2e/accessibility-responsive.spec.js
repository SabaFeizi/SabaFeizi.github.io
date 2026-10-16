// Accessibility (axe, WCAG 2.1 AA) and responsive layout checks.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const TABS = ["about", "resume", "certificates", "blog"];

async function openTab(page, id) {
  await page.goto(`/#${id}`);
  await expect(page.locator(`article[data-page="${id}"]`)).toBeVisible();
  await page.waitForTimeout(600); // let the 0.5s fade-in finish before measuring colours
}

test.describe("accessibility", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "axe runs once, in Chromium");

  for (const id of TABS) {
    test(`${id} tab has no WCAG 2.1 AA violations`, async ({ page }) => {
      await openTab(page, id);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .include(`article[data-page="${id}"]`)
        .include(".sidebar")
        .include(".navbar")
        .analyze();
      const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} × ${v.nodes[0].target}`);
      expect(summary).toEqual([]);
    });
  }

  test("certificate dialog has no violations", async ({ page }) => {
    await openTab(page, "certificates");
    await page.locator("[data-dialog-open]").first().click();
    await page.waitForTimeout(400);
    const results = await new AxeBuilder({ page }).include("dialog[open]").analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  test("blog post page has no violations", async ({ page }) => {
    await page.goto("/#blog");
    const href = await page.locator('.blog-post-item > a[href^="/blog/"]').first().getAttribute("href");
    await page.goto(href);
    await page.waitForTimeout(600);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes[0].target}`)).toEqual([]);
  });
});

test.describe("responsive layout", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "layout widths are checked in Chromium");

  for (const width of [320, 375, 768, 1024, 1440]) {
    test(`no horizontal scrolling at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      for (const id of TABS) {
        await openTab(page, id);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${id} at ${width}px`).toBeLessThanOrEqual(0);
        await page.screenshot({ path: testInfo.outputPath(`${width}-${id}.png`), fullPage: true });
      }
    });
  }

  test("navbar is at the bottom on phones and top-right on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    const mobile = await page.locator(".navbar").boundingBox();
    expect(mobile.y + mobile.height).toBeGreaterThan(780);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const desktop = await page.locator(".navbar").boundingBox();
    const article = await page.locator("article.active").boundingBox();
    expect(Math.abs(desktop.y - article.y)).toBeLessThan(2);
    expect(Math.abs(desktop.x + desktop.width - (article.x + article.width))).toBeLessThan(2);
  });
});
