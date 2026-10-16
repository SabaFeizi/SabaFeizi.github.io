# Saba Famil Feizi — personal website

Static personal website (About · Resume · Certificates · Blog) built with [Eleventy](https://www.11ty.dev/).
All content lives in plain files in this repository and is edited through an admin panel (Sveltia CMS, coming in Milestone 2).

## Run it locally (Docker)

```bash
docker compose up dev
```

Open http://localhost:8080. Edits to templates, CSS, JS or content reload the page automatically.

To check the production build behind strict security headers (nginx):

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

## Useful commands (inside the container)

```bash
docker compose run --rm dev npm run validate
```

```bash
docker compose run --rm dev npm run build
```

## Credits

Design based on [vCard – Personal portfolio](https://github.com/codewithsadee/vcard-personal-portfolio) by codewithsadee (MIT).
Icons: [Ionicons](https://ionic.io/ionicons) (MIT). Font: Poppins (SIL OFL 1.1).
