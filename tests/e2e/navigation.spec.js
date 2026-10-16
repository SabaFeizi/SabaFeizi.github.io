// Behaviour of the single-page tabs, sidebar, certificates and blog.
import { test, expect } from "@playwright/test";

const activeTab = (page) => page.locator("article[data-page].active").getAttribute("data-page");

test.describe("tabs and hash routing", () => {
  test("starts on About and switches tabs in place", async ({ page }) => {
    await page.goto("/");
    expect(await activeTab(page)).toBe("about");

    for (const id of ["resume", "certificates", "blog", "about"]) {
      await page.locator(`[data-nav-link="${id}"]`).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      expect(await activeTab(page)).toBe(id);
      await expect(page.locator(`[data-nav-link="${id}"]`)).toHaveAttribute("aria-current", "page");
      await expect(page.locator("article[data-page]:not(.active)").first()).toBeHidden();
    }
  });

  test("switching tabs moves focus to the new heading and updates the page title", async ({ page }) => {
    await page.goto("/");
    const base = await page.title();
    await page.locator('[data-nav-link="resume"]').click();
    await expect(page.locator('article[data-page="resume"] .article-title')).toBeFocused();
    await expect(page).toHaveTitle(`Resume — ${base}`);

    await page.goBack();
    await expect(page.locator('article[data-page="about"] .article-title')).toBeFocused();
    await expect(page).toHaveTitle(base);
  });

  test("deep links, Back and Forward work", async ({ page }) => {
    await page.goto("/#certificates");
    expect(await activeTab(page)).toBe("certificates");

    await page.locator('[data-nav-link="blog"]').click();
    await page.goBack();
    await expect.poll(() => activeTab(page)).toBe("certificates");
    await page.goForward();
    await expect.poll(() => activeTab(page)).toBe("blog");
  });

  test("unknown hashes and the skip link do not switch tabs", async ({ page }) => {
    await page.goto("/#resume");
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#content$/);
    expect(await activeTab(page)).toBe("resume");

    // A fresh load with an unknown hash shows About; an in-page change to an unknown hash
    // (e.g. a footnote link) leaves the current tab alone.
    await page.goto("about:blank");
    await page.goto("/#does-not-exist");
    expect(await activeTab(page)).toBe("about");
    await page.locator('[data-nav-link="resume"]').click();
    await page.evaluate(() => (location.hash = "#also-unknown"));
    expect(await activeTab(page)).toBe("resume");
  });
});

test.describe("sidebar", () => {
  test("Show Contacts toggles the contact details (below 1250px)", async ({ page }) => {
    await page.goto("/");
    const button = page.locator("[data-sidebar-btn]");
    if (!(await button.isVisible())) test.skip(true, "contacts are always visible on wide screens");

    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(".contacts-list")).toBeHidden();
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".contacts-list")).toBeVisible();
  });

  test("profile photo is protected from casual saving but still described", async ({ page }) => {
    await page.goto("/");
    const img = page.locator(".avatar-box img");
    await expect(img).toHaveAttribute("alt", /\S/);
    await expect(img).toHaveAttribute("draggable", "false");
    // A click or right-click on the photo lands on the shield, not the image.
    const hit = await img.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.tagName;
    });
    expect(hit).toBe("FIGURE");
    // Only small, re-encoded versions are served.
    const widths = await img.evaluate((el) => el.srcset.match(/\d+w/g).map((w) => parseInt(w, 10)));
    expect(Math.max(...widths)).toBeLessThanOrEqual(300);
  });

  test("social links have accessible names and safe attributes", async ({ page }) => {
    await page.goto("/");
    const links = page.locator(".social-link");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(links.nth(i)).toHaveAttribute("aria-label", /\S/);
      await expect(links.nth(i)).toHaveAttribute("rel", /noopener/);
      await expect(links.nth(i)).toHaveAttribute("href", /^(https?:|mailto:)/);
    }
  });
});

test.describe("certificates", () => {
  test("category filter shows only matching certificates", async ({ page }) => {
    await page.goto("/#certificates");
    const items = page.locator("[data-filter-item]");
    const total = await items.count();
    expect(total).toBeGreaterThan(1);

    const desktopFilter = page.locator("[data-filter-btn]").nth(1);
    if (await desktopFilter.isVisible()) {
      await desktopFilter.click();
      await expect(desktopFilter).toHaveAttribute("aria-pressed", "true");
    } else {
      const select = page.locator("[data-filter-select]");
      await select.selectOption({ index: 1 });
    }
    const shown = await page.locator("[data-filter-item].active").count();
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(total);
    await expect(page.locator("[data-filter-status]")).toHaveText(`${shown} certificate${shown === 1 ? "" : "s"} shown`);
  });

  test("certificate dialog opens, closes with Escape and returns focus", async ({ page }) => {
    await page.goto("/#certificates");
    const card = page.locator("[data-dialog-open]").first();
    await card.click();
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("h3")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(card).toBeFocused();
  });

  test("going Back while a dialog is open closes it", async ({ page }) => {
    await page.goto("/#about");
    await page.locator('[data-nav-link="certificates"]').click();
    await page.locator("[data-dialog-open]").first().click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await page.goBack();
    await expect.poll(() => activeTab(page)).toBe("about");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
  });
});

test.describe("blog", () => {
  test("external posts link out, written posts open their own page", async ({ page }) => {
    await page.goto("/#blog");
    const links = page.locator(".blog-post-item > a");
    const hrefs = await links.evaluateAll((els) => els.map((a) => a.getAttribute("href")));
    expect(hrefs.some((h) => /^https?:\/\//.test(h))).toBe(true);
    const internal = hrefs.find((h) => h.startsWith("/blog/"));
    expect(internal).toBeTruthy();

    await page.goto(internal);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator(".post-body")).not.toBeEmpty();
    await expect(page.locator('[data-nav-link="blog"]')).toHaveAttribute("aria-current", "true");

    await page.locator(".back-link").click();
    await expect(page).toHaveURL(/\/#blog$/);
    await expect.poll(() => activeTab(page)).toBe("blog");
  });
});
