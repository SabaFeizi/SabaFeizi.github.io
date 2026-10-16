import { HtmlBasePlugin } from "@11ty/eleventy";
import Image, { generateHTML } from "@11ty/eleventy-img";
import markdownIt from "markdown-it";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const IS_DEV = process.env.ELEVENTY_ENV === "development";
const ICON_DIR = path.resolve("node_modules/ionicons/dist/svg");
const UPLOADS_PREFIX = "/assets/uploads/";

// ---------------------------------------------------------------------------
// Content Security Policy (delivered as <meta>, GitHub Pages cannot set headers)
// ---------------------------------------------------------------------------
const csp = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  // Dev server live-reload uses a same-origin WebSocket.
  IS_DEV ? "connect-src 'self' ws://localhost:8080" : "connect-src 'self'",
  "manifest-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join("; ");

// ---------------------------------------------------------------------------
// Markdown: raw HTML disabled so content can never inject markup or scripts.
// markdown-it's validateLink already rejects javascript:, vbscript:, file: and data: URLs.
// ---------------------------------------------------------------------------
const mdOptions = { html: false, linkify: true, typographer: true };
const md = markdownIt({ ...mdOptions, breaks: false });
const mdBreaks = markdownIt({ ...mdOptions, breaks: true });

// Only allow safe URL schemes in href attributes coming from data files.
export function safeUrl(value) {
  if (typeof value !== "string") return "#";
  const url = value.trim();
  if (url.startsWith("/")) {
    // Site-relative path: must stay on this origin ("//evil.com" and "/\\evil.com" do not).
    const base = "https://site.invalid";
    try {
      return new URL(url, base).origin === base && !url.includes("\\") ? url : "#";
    } catch {
      return "#";
    }
  }
  try {
    const { protocol } = new URL(url);
    return ["https:", "http:", "mailto:", "tel:"].includes(protocol) ? url : "#";
  } catch {
    return "#";
  }
}

// Inline SVG icons from the ionicons package (allow-listed names only — no path traversal).
const iconCache = new Map();
function iconSvg(name, className = "") {
  if (!/^[a-z0-9-]+$/.test(String(name))) throw new Error(`Invalid icon name: ${name}`);
  if (!iconCache.has(name)) {
    const file = path.join(ICON_DIR, `${name}.svg`);
    if (!existsSync(file)) throw new Error(`Unknown icon: ${name}`);
    const svg = readFileSync(file, "utf8")
      .replace(/<\?xml[^>]*>/, "")
      .replace(/\sclass="ionicon"/, "")
      .replace("<svg ", '<svg aria-hidden="true" focusable="false" ');
    iconCache.set(name, svg);
  }
  return `<span class="icon${className ? " " + className : ""}">${iconCache.get(name)}</span>`;
}

// Resolve a content image path (/assets/uploads/...) to a file inside src/assets/uploads.
function resolveUpload(src) {
  if (typeof src !== "string" || !src.startsWith(UPLOADS_PREFIX)) {
    throw new Error(`Images must live in ${UPLOADS_PREFIX} (got: ${src})`);
  }
  const root = path.resolve("src/assets/uploads");
  const file = path.resolve("src", "." + src);
  if (!file.startsWith(root + path.sep)) throw new Error(`Invalid image path: ${src}`);
  if (!existsSync(file)) throw new Error(`Image not found: ${src}`);
  return file;
}

// Responsive, re-encoded images. Only these derivatives are published — the original uploads
// are never copied to the site, and sharp drops EXIF/GPS metadata when re-encoding.
// outputDir follows Eleventy's real output folder (set in the eleventy.before hook below).
const IMAGE_OUTPUT = { outputDir: "./_site/assets/img/", urlPath: "/assets/img/" };

async function imageShortcode(src, alt = "", widths = [400, 800], sizes = "100vw", attrs = {}) {
  const metadata = await Image(resolveUpload(src), {
    widths,
    formats: ["avif", "webp", "jpeg"],
    ...IMAGE_OUTPUT,
  });
  return generateHTML(metadata, {
    alt,
    sizes,
    loading: "lazy",
    decoding: "async",
    ...attrs,
  });
}

// Social-share image: one re-encoded 1200px JPEG (no metadata); returns its site URL.
async function ogImage(src) {
  if (!src) return "";
  const metadata = await Image(resolveUpload(src), { widths: [1200], formats: ["jpeg"], ...IMAGE_OUTPUT });
  return metadata.jpeg[0].url;
}

// Blog post bodies: Markdown images (![alt](/assets/uploads/x.jpg)) are replaced with optimised
// <picture> elements. markdown-it escapes attributes, so decode alt before re-encoding it.
const decodeEntities = (s) =>
  s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&amp;/g, "&");

async function optimisePostImages(html) {
  const tags = [...html.matchAll(/<img src="([^"]*)" alt="([^"]*)"(?: title="[^"]*")?>/g)];
  for (const [tag, src, alt] of tags) {
    const picture = await imageShortcode(decodeEntities(src), decodeEntities(alt), [800, 1200], "(min-width: 1250px) 720px, 90vw");
    html = html.replace(tag, picture);
  }
  return html;
}

// Dates are stored as YYYY-MM-DD (or YAML dates); always format in UTC.
function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(`${value}`.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.on("eleventy.before", ({ directories }) => {
    IMAGE_OUTPUT.outputDir = path.join(directories.output, "assets/img/");
  });

  if (process.env.ELEVENTY_POLLING) {
    eleventyConfig.setChokidarConfig({ usePolling: true, interval: 400 });
  }

  // Never treat anything under assets/ or admin/ as a template (uploads are untrusted).
  eleventyConfig.ignores.add("src/assets/**");
  eleventyConfig.ignores.add("src/admin/**");

  // Front matter is YAML only — JavaScript front matter ("---js") would execute code at build time.
  const noJsFrontMatter = () => {
    throw new Error("JavaScript front matter is not allowed");
  };
  eleventyConfig.setFrontMatterParsingOptions({
    language: "yaml",
    engines: { js: noJsFrontMatter, javascript: noJsFrontMatter },
  });

  // Static assets. Uploaded originals are NOT copied: only re-encoded derivatives are published.
  eleventyConfig.addPassthroughCopy({ "src/assets/css/*.css": "assets/css" });
  eleventyConfig.addPassthroughCopy({ "src/assets/js/*.js": "assets/js" });
  eleventyConfig.addPassthroughCopy({ "src/assets/favicon.png": "assets/favicon.png" });
  eleventyConfig.addPassthroughCopy({
    "node_modules/@fontsource/poppins/files/poppins-latin-{300,400,500,600}-normal.woff2": "assets/fonts",
    "node_modules/@fontsource/poppins/files/poppins-latin-ext-{300,400,500,600}-normal.woff2": "assets/fonts",
  });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addWatchTarget("src/assets/");

  // Markdown for blog post bodies
  eleventyConfig.setLibrary("md", md);

  // Globals
  eleventyConfig.addGlobalData("csp", csp);
  eleventyConfig.addGlobalData("isDev", IS_DEV);
  eleventyConfig.addGlobalData("buildYear", new Date().getUTCFullYear());

  // Filters
  eleventyConfig.addFilter("md", (s) => md.render(s || ""));
  eleventyConfig.addFilter("mdBreaks", (s) => mdBreaks.render(s || ""));
  eleventyConfig.addFilter("mdInline", (s) => md.renderInline(s || ""));
  eleventyConfig.addFilter("safeUrl", safeUrl);
  eleventyConfig.addFilter("readableDate", (v) => {
    const d = toDate(v);
    return d ? d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }) : "";
  });
  eleventyConfig.addFilter("monthYear", (v) => {
    const d = toDate(v);
    return d ? d.toLocaleDateString("en-US", { year: "numeric", month: "short", timeZone: "UTC" }) : "";
  });
  eleventyConfig.addFilter("isoDate", (v) => {
    const d = toDate(v);
    return d ? d.toISOString().slice(0, 10) : "";
  });
  // Certificates are stored one file per certificate: { slug: {...} } -> sorted array
  eleventyConfig.addFilter("certificateList", (obj) =>
    Object.entries(obj || {})
      .map(([slug, c]) => ({ slug, ...c }))
      .filter((c) => c.visible !== false)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || `${b.issue_date}`.localeCompare(`${a.issue_date}`)),
  );
  eleventyConfig.addFilter("categories", (items) => [...new Set(items.map((i) => i.category).filter(Boolean))]);
  // Safe JSON for <script type="application/ld+json"> ("<" escaped so "</script>" can't break out)
  eleventyConfig.addFilter("personJsonLd", (site) =>
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name: site.name,
      jobTitle: (site.title_lines || []).join(" "),
      email: site.email ? `mailto:${site.email}` : undefined,
      address: site.location || undefined,
      sameAs: (site.socials || []).map((s) => safeUrl(s.url)).filter((u) => u !== "#"),
    }).replace(/</g, "\\u003c"),
  );

  // Shortcodes
  eleventyConfig.addShortcode("icon", iconSvg);
  eleventyConfig.addAsyncShortcode("image", imageShortcode);
  eleventyConfig.addAsyncFilter("ogImage", ogImage);

  // Optimise images inside blog post bodies
  eleventyConfig.addTransform("post-images", async function (html) {
    if (this.page.inputPath.startsWith("./src/blog/") && typeof this.page.outputPath === "string" && this.page.outputPath.endsWith(".html")) {
      return optimisePostImages(html);
    }
    return html;
  });

  // Collections
  eleventyConfig.addCollection("blogPosts", (api) =>
    api.getFilteredByTag("posts").sort((a, b) => b.date - a.date),
  );

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: false,
    pathPrefix: process.env.PATH_PREFIX || "/",
  };
}

// Nunjucks autoescape is on by default in Eleventy; only filters above emit trusted HTML.
