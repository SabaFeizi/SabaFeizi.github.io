// Validates the repository's content before the site is built. A failing check stops the build,
// so a broken or malicious edit (via the CMS, a commit or a pull request) never reaches the live site.
// This script never executes content: front matter is parsed as YAML only.
// Usage: npm run validate
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import matter from "gray-matter";
import markdownIt from "markdown-it";
import sharp from "sharp";
import { readFileSync, readdirSync, existsSync, openSync, readSync, closeSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".");
const SRC = path.join(ROOT, "src");
const DATA = path.join(SRC, "_data");
const BLOG = path.join(SRC, "blog");
const UPLOADS = path.join(SRC, "assets/uploads");
const ICONS = path.join(ROOT, "node_modules/ionicons/dist/svg");
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UPLOAD_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*\.(png|jpe?g|webp|avif)$/;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
for (const f of readdirSync(path.join(ROOT, "schemas"))) {
  ajv.addSchema(JSON.parse(readFileSync(path.join(ROOT, "schemas", f), "utf8")));
}

const errors = [];
const rel = (file) => path.relative(ROOT, file);
const fail = (file, msg) => errors.push(`${rel(file)}: ${msg}`);

// ---------------------------------------------------------------------------
// 1. Allow-list of every file under src/. Anything unexpected (e.g. a template or script
//    smuggled into the uploads folder) fails the build.
// ---------------------------------------------------------------------------
const ALLOWED = [
  /^src\/index\.njk$/,
  /^src\/robots\.txt$/,
  /^src\/_includes\/(layouts|partials|sections)\/[a-z0-9-]+\.njk$/,
  /^src\/_data\/(site|about|resume)\.json$/,
  /^src\/_data\/certificates\/[^/]+\.json$/,
  /^src\/blog\/blog\.11tydata\.js$/,
  /^src\/blog\/[^/]+\.md$/,
  /^src\/assets\/css\/[a-z0-9-]+\.css$/,
  /^src\/assets\/js\/[a-z0-9-]+\.js$/,
  /^src\/assets\/favicon\.png$/,
  /^src\/assets\/uploads\/[^/]+$/,
  /^src\/admin\/(index\.html|config\.yml|[a-z0-9.-]+\.(js|css))$/,
];
const IGNORED_NAMES = new Set([".DS_Store", ".gitkeep"]);

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) { fail(full, "symbolic links are not allowed"); continue; }
    if (entry.isDirectory()) { walk(full); continue; }
    if (IGNORED_NAMES.has(entry.name)) continue;
    const r = rel(full).split(path.sep).join("/");
    if (!ALLOWED.some((re) => re.test(r))) fail(full, "unexpected file (not allowed in this location)");
  }
}
walk(SRC);

// ---------------------------------------------------------------------------
// 2. Uploads: only real raster images with safe names and a sane size.
// ---------------------------------------------------------------------------
function sniffImage(file) {
  const buf = Buffer.alloc(16);
  const fd = openSync(file, "r");
  try { readSync(fd, buf, 0, 16, 0); } finally { closeSync(fd); }
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 4, 8) === "ftyp" && /^avi[fs]$/.test(buf.toString("ascii", 8, 12))) return "avif";
  return null;
}

for (const f of readdirSync(UPLOADS)) {
  if (IGNORED_NAMES.has(f)) continue;
  const file = path.join(UPLOADS, f);
  if (!UPLOAD_NAME.test(f)) { fail(file, "uploads must be .png, .jpg, .jpeg, .webp or .avif with a simple file name"); continue; }
  if (statSync(file).size > MAX_UPLOAD_BYTES) fail(file, `file is larger than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB`);
  const kind = sniffImage(file);
  const ext = f.split(".").pop().toLowerCase().replace("jpg", "jpeg");
  if (!kind) { fail(file, "file content is not a PNG, JPEG, WebP or AVIF image"); continue; }
  if (kind !== ext) fail(file, `file content is ${kind} but the name ends in .${ext}`);

  // Privacy: the admin panel strips photo metadata when it converts uploads, but it uploads
  // the original if conversion fails. Reject anything still carrying EXIF/XMP/IPTC
  // (GPS location, camera serial numbers, ...) so it is noticed and removed.
  try {
    const meta = await sharp(file).metadata();
    const found = ["exif", "xmp", "iptc"].filter((k) => meta[k]);
    if (found.length) {
      fail(file, `image contains ${found.join("/").toUpperCase()} metadata (may include location) — re-upload it through the admin panel or strip the metadata`);
    }
  } catch (e) {
    fail(file, `image cannot be decoded (${e.message})`);
  }
}

// ---------------------------------------------------------------------------
// 3. Structured content against JSON Schemas, plus referenced images/icons exist.
// ---------------------------------------------------------------------------
function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    fail(file, `invalid JSON (${e.message})`);
    return null;
  }
}

function check(schemaId, data, file) {
  const validate = ajv.getSchema(schemaId);
  if (!validate(data)) {
    for (const e of validate.errors) fail(file, `${e.instancePath || "(root)"} ${e.message}`);
    return false;
  }
  return true;
}

function checkReferences(value, file) {
  if (Array.isArray(value)) return value.forEach((v) => checkReferences(v, file));
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (k === "icon" && typeof v === "string" && !existsSync(path.join(ICONS, `${v}.svg`))) {
        fail(file, `unknown icon "${v}"`);
      }
      if (typeof v === "string" && v.startsWith("/assets/uploads/") && !existsSync(path.join(SRC, v))) {
        fail(file, `missing image ${v}`);
      }
      checkReferences(v, file);
    }
  }
}

for (const [name, schema] of [["site", "site.schema.json"], ["about", "about.schema.json"], ["resume", "resume.schema.json"]]) {
  const file = path.join(DATA, `${name}.json`);
  if (!existsSync(file)) { fail(file, "file is missing"); continue; }
  const data = readJson(file);
  if (data && check(schema, data, file)) checkReferences(data, file);
}

const certDir = path.join(DATA, "certificates");
for (const f of readdirSync(certDir)) {
  if (IGNORED_NAMES.has(f)) continue;
  const file = path.join(certDir, f);
  if (!SLUG.test(f.replace(/\.json$/, ""))) fail(file, "file name must be lowercase-with-dashes");
  const data = readJson(file);
  if (data && check("certificate.schema.json", data, file)) checkReferences(data, file);
}

// ---------------------------------------------------------------------------
// 4. Blog posts: YAML front matter only (never "---js"), schema-checked, and images in the
//    body must be uploads (no remote images, which the CSP would block anyway).
// ---------------------------------------------------------------------------
const refuse = () => { throw new Error("JavaScript front matter is not allowed"); };
const md = markdownIt({ html: false, linkify: true });

for (const f of readdirSync(BLOG)) {
  if (f === "blog.11tydata.js" || IGNORED_NAMES.has(f)) continue;
  const file = path.join(BLOG, f);
  if (!SLUG.test(f.replace(/\.md$/, ""))) fail(file, "file name must be lowercase-with-dashes");

  const raw = readFileSync(file, "utf8");
  if (!/^---\r?\n/.test(raw)) { fail(file, 'must start with YAML front matter ("---" on the first line)'); continue; }

  let parsed;
  try {
    parsed = matter(raw, { language: "yaml", engines: { js: refuse, javascript: refuse } });
  } catch (e) {
    fail(file, `invalid front matter (${e.message})`);
    continue;
  }
  const fm = { ...parsed.data };
  if (fm.date instanceof Date) fm.date = fm.date.toISOString().slice(0, 10);
  if (!check("post.schema.json", fm, file)) continue;
  checkReferences(fm, file);

  if (!fm.external_url && !fm.draft && !parsed.content.trim()) {
    fail(file, "a post without an external link needs body text");
  }

  for (const [, src] of md.render(parsed.content).matchAll(/<img src="([^"]*)"/g)) {
    if (!/^\/assets\/uploads\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(src)) fail(file, `image "${src}" must be an uploaded image`);
    else if (!existsSync(path.join(SRC, src))) fail(file, `missing image ${src}`);
  }
}

if (errors.length) {
  console.error(`\n✖ Content validation failed (${errors.length} problem${errors.length > 1 ? "s" : ""}):\n`);
  for (const e of errors) console.error(`  • ${e}`);
  console.error("");
  process.exit(1);
}
console.log("✔ Content is valid");
