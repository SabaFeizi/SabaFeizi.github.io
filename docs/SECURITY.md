# Security overview

How this site is protected, what each control defends against, and the known limits.
For the launch settings, see [DEPLOY.md](DEPLOY.md). To report a problem, contact the site owner privately.

## Architecture in one paragraph

The public site is static HTML built by Eleventy from JSON/Markdown files in the repository and hosted on GitHub Pages — there is no server, database or login on the public site. The admin panel (`/admin`, Sveltia CMS) runs entirely in the editor's browser and saves changes as commits to the GitHub repository through GitHub's API, using the editor's own GitHub sign-in. GitHub Actions validates, tests and rebuilds the site on every commit.

## Controls

| Threat | Control | Where |
|---|---|---|
| Script injection through content (XSS) | Templates auto-escape; Markdown renders with raw HTML disabled; links limited to `https:`, `http:`, `mailto:`, `tel:` and same-origin paths; strict schemas reject unknown keys | `eleventy.config.js`, `schemas/` |
| Malicious files committed via the admin | File allow-list for everything under `src/`; uploads must be real PNG/JPEG/WebP/AVIF (magic bytes), ≤ 8 MB; nothing under `src/assets` or `src/admin` is ever treated as a template; JS front matter refused | `scripts/validate-content.mjs`, `eleventy.config.js` |
| Code execution at build time | YAML-only front matter in both the validator and Eleventy; Markdown is not run through a template engine; no executable data files allowed | same |
| Privacy (photo location data) | The admin re-encodes uploads (strips EXIF); the validator rejects any upload still carrying EXIF/XMP/IPTC; only sharp re-encodes are published, never the originals | `src/admin/config.yml`, validator, image pipeline |
| Third-party scripts / supply chain | No third-party requests on the public site (fonts and icons self-hosted); CMS bundle self-hosted from a pinned, lockfile-verified version; lockfile + `npm ci`; actions pinned to commit SHAs; Dependabot with a 14-day cool-down; `npm audit` + signature verification; CodeQL | `package-lock.json`, `.github/` |
| Browser-side attacks | Strict CSP on every page (`default-src 'none'`, `script-src 'self'`, no inline scripts or styles on the public site); separate tight CSP for the admin; `noopener` on external links; `no-referrer` on the admin | `eleventy.config.js`, `src/admin/index.html` |
| Clickjacking | The admin loads the CMS bundle only when it is the top-level window; public pages hide themselves when framed (GitHub Pages cannot send `frame-ancestors` / `X-Frame-Options`) | `src/admin/frame-guard.js`, `src/assets/js/main.js` |
| Stolen admin sign-in | Sign-in only via GitHub OAuth (no pasted tokens); recommended GitHub App limited to this repository's contents with 8-hour tokens; 2FA required; worker `ALLOWED_DOMAINS` set to the exact site host | `docs/DEPLOY.md` |
| Compromised CI | Build job: read-only, no secrets, no persisted git credentials; deploy job runs no repository code and uses a short-lived OIDC token; no `pull_request_target`; event data never interpolated into shell commands | `.github/workflows/` |

## Automated tests

- `npm run test:unit` — content-pipeline attacks (javascript: links, path traversal, unknown keys, JS front matter, smuggled templates, fake images, EXIF photos, symlinks, HTML in Markdown) must all be rejected; invalid content must fail the build. Runs on every deploy.
- `docker compose --profile test run --rm test` — browser tests in Chromium, Firefox and WebKit against the production build served like GitHub Pages (no custom headers, so only the in-page protections count): zero CSP violations, no third-party requests, originals not published, admin refuses to run in a frame, WCAG 2.1 AA (axe), no horizontal scrolling from 320 to 1440 px. Runs on pull requests and weekly.

## Known limits (GitHub Pages)

- GitHub Pages cannot send custom HTTP headers, so the CSP is delivered as a `<meta>` tag. `frame-ancestors`, `X-Frame-Options`, HSTS preload and CSP reporting are therefore unavailable; script-based frame guards compensate for clickjacking (they need JavaScript, which every visitor of the admin has). A custom domain behind Cloudflare would allow real headers.
- The admin's sign-in token is kept in the browser's local storage for the site's origin. This is why no other GitHub Pages site may run on the same account (see DEPLOY.md).
- Validation is a *deploy* gate, not a *commit* gate: anything committed stays in the repository history even if the build rejects it.
- The admin page allows `style-src 'unsafe-inline'` and fonts from `cdn.jsdelivr.net` because the CMS requires them; neither allows script execution.
