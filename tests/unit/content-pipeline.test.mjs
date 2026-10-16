// Security tests for the content pipeline (validator + Eleventy build).
// Each test runs in a throwaway copy of the project, so the real content is never touched.
// Run: docker compose run --rm dev npm run test:unit
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, writeFileSync, readFileSync, symlinkSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { safeUrl } from "../../eleventy.config.js";

const ROOT = path.resolve(import.meta.dirname, "../..");
const SKIP = new Set(["node_modules", "_site", ".git", ".cache", ".claude", "tests", "test-results", "playwright-report"]);

function sandbox() {
  const dir = mkdtempSync(path.join(tmpdir(), "site-"));
  cpSync(ROOT, dir, { recursive: true, filter: (src) => !SKIP.has(path.basename(src)) || src === ROOT });
  symlinkSync(path.join(ROOT, "node_modules"), path.join(dir, "node_modules"));
  return dir;
}

const run = (dir, args) => spawnSync(process.execPath, args, { cwd: dir, encoding: "utf8" });
const validate = (dir) => run(dir, ["scripts/validate-content.mjs"]);
const build = (dir) => run(dir, ["node_modules/@11ty/eleventy/cmd.cjs", "--output=_out", "--quiet"]);
const editJson = (dir, rel, fn) => {
  const file = path.join(dir, rel);
  const data = JSON.parse(readFileSync(file, "utf8"));
  fn(data);
  writeFileSync(file, JSON.stringify(data, null, 2));
};
// Any existing certificate file (tests must not depend on specific content, which the admin can change).
const CERT = `src/_data/certificates/${readdirSync(path.join(ROOT, "src/_data/certificates")).find((f) => f.endsWith(".json"))}`;

function expectRejected(t, mutate, reason) {
  const dir = sandbox();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mutate(dir);
  const res = validate(dir);
  assert.notEqual(res.status, 0, "validator should fail");
  assert.match(res.stderr, reason);
}

// ---------------------------------------------------------------------------

test("the real content passes validation", () => {
  const res = validate(ROOT);
  assert.equal(res.status, 0, res.stderr);
});

test("rejects javascript: links", (t) =>
  expectRejected(t, (d) => editJson(d, CERT, (c) => (c.verify_url = "javascript:alert(1)")), /verify_url/));

test("rejects data: and protocol-relative links in social links", (t) =>
  expectRejected(t, (d) => editJson(d, "src/_data/site.json", (s) => (s.socials[0].url = "//evil.example")), /socials/));

test("rejects image paths outside the uploads folder", (t) =>
  expectRejected(t, (d) => editJson(d, CERT, (c) => (c.image = "/assets/uploads/../../eleventy.config.js")), /image/));

test("rejects unknown keys (e.g. Eleventy's permalink) in content", (t) =>
  expectRejected(t, (d) => editJson(d, CERT, (c) => (c.permalink = "/evil/")), /additional properties/));

test("rejects icon names that are not plain identifiers", (t) =>
  expectRejected(t, (d) => editJson(d, "src/_data/about.json", (a) => (a.nutshell[0].icon = "../x")), /icon/));

test("rejects impossible dates", (t) =>
  expectRejected(t, (d) => editJson(d, CERT, (c) => (c.issue_date = "2025-02-31")), /issue_date/));

test("rejects JavaScript front matter without executing it", (t) => {
  const marker = path.join(tmpdir(), `pwned-${process.pid}-${Date.now()}`);
  expectRejected(
    t,
    (d) =>
      writeFileSync(
        path.join(d, "src/blog/evil.md"),
        `---js\n{ title: (require("fs").writeFileSync(${JSON.stringify(marker)}, "x"), "T") }\n---\nbody\n`,
      ),
    /YAML front matter/,
  );
  assert.equal(existsSync(marker), false, "front matter code must never run");
});

test("rejects remote images in blog posts", (t) =>
  expectRejected(
    t,
    (d) =>
      writeFileSync(
        path.join(d, "src/blog/remote-image.md"),
        "---\ntitle: T\ndate: 2025-01-01\ncover: /assets/uploads/blog-1.png\nexcerpt: x\n---\n![x](https://tracker.example/p.png)\n",
      ),
    /must be an uploaded image/,
  ));

test("rejects templates and HTML smuggled into the uploads folder", (t) =>
  expectRejected(
    t,
    (d) => {
      writeFileSync(path.join(d, "src/assets/uploads/evil.njk"), "{{ 7*7 }}");
      writeFileSync(path.join(d, "src/assets/uploads/evil.html"), "<script>alert(1)</script>");
    },
    /evil\.njk[\s\S]*|evil\.html/,
  ));

test("rejects files that pretend to be images", (t) =>
  expectRejected(t, (d) => writeFileSync(path.join(d, "src/assets/uploads/fake.png"), "<svg onload=alert(1)>"), /not a PNG/));

test("rejects photos that still carry EXIF/GPS metadata", async (t) => {
  const dir = sandbox();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  await sharp({ create: { width: 32, height: 32, channels: 3, background: "#888" } })
    .jpeg()
    .withExif({ IFD0: { Make: "Phone" } })
    .toFile(path.join(dir, "src/assets/uploads/phone.jpg"));
  const res = validate(dir);
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /EXIF/);
});

test("rejects unexpected files in the data folder (e.g. executable data files)", (t) =>
  expectRejected(t, (d) => writeFileSync(path.join(d, "src/_data/evil.js"), "export default 1"), /unexpected file/));

test("rejects symbolic links", (t) =>
  expectRejected(t, (d) => symlinkSync("/etc/passwd", path.join(d, "src/assets/uploads/link.png")), /symbolic links/));

// ---------------------------------------------------------------------------

test("the build fails (non-zero exit, no output) when content is invalid", (t) => {
  const dir = sandbox();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  editJson(dir, CERT, (c) => (c.verify_url = "javascript:alert(1)"));
  const res = build(dir);
  assert.notEqual(res.status, 0);
  assert.equal(existsSync(path.join(dir, "_out/index.html")), false);
});

test("all four tabs are built when switched on, and hidden ones are dropped", (t) => {
  const pages = (html) => [...html.matchAll(/<article[^>]*data-page="([a-z]+)"/g)].map((m) => m[1]);
  const navs = (html) => [...html.matchAll(/data-nav-link="([a-z]+)"/g)].map((m) => m[1]);

  const dir = sandbox();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  editJson(dir, "src/_data/site.json", (s) => (s.tabs = { resume: true, certificates: true, blog: true }));
  let res = build(dir);
  assert.equal(res.status, 0, res.stderr);
  let html = readFileSync(path.join(dir, "_out/index.html"), "utf8");
  assert.deepEqual(pages(html), ["about", "resume", "certificates", "blog"]);
  assert.deepEqual(navs(html), ["about", "resume", "certificates", "blog"]);
  assert.match(html, /data-dialog-open=/, "certificate cards are rendered");
  assert.match(html, /class="blog-post-item"/, "blog cards are rendered");

  editJson(dir, "src/_data/site.json", (s) => (s.tabs = { resume: true, certificates: false, blog: false }));
  res = build(dir);
  assert.equal(res.status, 0, res.stderr);
  html = readFileSync(path.join(dir, "_out/index.html"), "utf8");
  assert.deepEqual(pages(html), ["about", "resume"]);
  assert.deepEqual(navs(html), ["about", "resume"]);
});

test("Markdown cannot inject HTML or script into the built page", (t) => {
  const dir = sandbox();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  editJson(dir, "src/_data/about.json", (a) => {
    a.intro = '<script>alert(1)</script> <img src=x onerror=alert(2)> [x](javascript:alert(3))';
  });
  const res = build(dir);
  assert.equal(res.status, 0, res.stderr);
  const html = readFileSync(path.join(dir, "_out/index.html"), "utf8");
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /href="javascript:/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

// ---------------------------------------------------------------------------

test("safeUrl only allows safe schemes and same-origin paths", () => {
  const cases = {
    "https://ok.example/": "https://ok.example/",
    "mailto:a@b.c": "mailto:a@b.c",
    "/assets/x": "/assets/x",
    "javascript:alert(1)": "#",
    "data:text/html,x": "#",
    "//evil.example": "#",
    "/\\evil.example": "#",
    " vbscript:x": "#",
  };
  for (const [input, expected] of Object.entries(cases)) assert.equal(safeUrl(input), expected, input);
});
