# Saba Famil Feizi — personal website

Static personal website (About · Resume · Certificates · Blog) built with [Eleventy](https://www.11ty.dev/).
All content lives in plain files in this repository and is edited through an admin panel ([Sveltia CMS](https://github.com/sveltia/sveltia-cms)).

## Run it locally (Docker)

```bash
docker compose up dev
```

Open http://localhost:8080. Edits to templates, CSS, JS or content reload the page automatically.

To check the production build exactly as GitHub Pages will serve it (nginx, no custom headers):

```bash
docker compose up --build preview
```

Open http://localhost:8081.

## Where the content lives

| What | File(s) |
|---|---|
| Name, photo, contacts, social links, SEO | `src/_data/site.json` |
| About tab (intro, news, "In a Nutshell" cards) | `src/_data/about.json` |
| Resume tab (sections with timeline entries) | `src/_data/resume.json` |
| Certificates tab (one file per certificate) | `src/_data/certificates/*.json` |
| Blog posts (external link or written here) | `src/blog/*.md` |
| Uploaded images | `src/assets/uploads/` |

Every build first runs `npm run validate`, which checks all content against the JSON Schemas in `schemas/`.
Invalid content (for example a `javascript:` link or an image outside `src/assets/uploads/`) stops the build.

## Admin panel

Open http://localhost:8080/admin/ in Chrome or Edge and choose **Work with Local Repository** (select this folder) to edit content locally.
On the live site, the admin is at `https://USER.github.io/admin/` with **Sign In with GitHub**. See [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md).

## Tests

Content-pipeline security tests (fast; also run on every deploy):

```bash
docker compose run --rm dev npm run test:unit
```

Browser tests in Chromium, Firefox and WebKit against the production build (behaviour, CSP, accessibility, responsive layout):

```bash
docker compose --profile test run --rm test
```

The HTML report is written to `playwright-report/`, screenshots to `test-results/`.

## Useful commands (inside the container)

```bash
docker compose run --rm dev npm run validate
```

```bash
docker compose run --rm dev npm run build
```

## Documentation

- [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) — how to edit the site (for Saba)
- [docs/DEPLOY.md](docs/DEPLOY.md) — launch runbook and GitHub settings checklist
- [docs/SECURITY.md](docs/SECURITY.md) — security controls, tests and known limits

## Credits

Design based on [vCard – Personal portfolio](https://github.com/codewithsadee/vcard-personal-portfolio) by codewithsadee (MIT).
Icons: [Ionicons](https://ionic.io/ionicons) (MIT). Font: Poppins (SIL OFL 1.1).
