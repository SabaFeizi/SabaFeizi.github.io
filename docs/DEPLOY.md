# Launch runbook (Milestone 4)

## Launch record (16 Oct 2026)

| Item | Value |
|---|---|
| Live site | https://sabafeizi.github.io (GitHub Pages, source: **GitHub Actions**, HTTPS enforced) |
| Repository | https://github.com/SabaFeizi/SabaFeizi.github.io (public; Issues and Wiki off) |
| Admin | https://sabafeizi.github.io/admin/ — "Sign In with GitHub" |
| Sign-in app | GitHub **OAuth App** "Saba's website admin" on Saba's account; scope requested: `public_repo,user` (the account has no other repositories) |
| Sign-in helper | Cloudflare Worker `sveltia-cms-auth` on Saba's Cloudflare account — https://sveltia-cms-auth.sabafeizi1.workers.dev; code pinned in [`/auth-worker`](../auth-worker/README.md); `ALLOWED_DOMAINS=sabafeizi.github.io` |
| Repo protections | Ruleset "Protect main" (no force-push, no deletion); Actions: read-only token, GitHub-owned actions only, outside contributors need approval; `github-pages` environment deploys from `main` only |
| Security features | Dependabot alerts + security fixes, secret scanning + push protection, CodeQL (checks workflow) |
| Commit author | Saba's private no-reply address (`…+SabaFeizi@users.noreply.github.com`); no personal email in the history |
| Verified | Live site: 4 tabs, 10 certificates, CSP meta on every page, raw files (README, sources, original uploads) return 404. Admin: sign-in, edit, publish (~1–2 min) and revert tested end to end. |

The checklist below is the full procedure (kept for future re-deployments).

Step-by-step checklist for publishing the site to Saba's GitHub account and enabling the admin panel.
Every step that changes an account or a public setting is done **by, or with the explicit approval of, the account owner**.
Placeholders: `USER` = Saba's GitHub username, `WORKER` = the Cloudflare Worker host name.

---

## 0. Decisions to make first

| Decision | Recommended | Why |
|---|---|---|
| Sign-in app type | **GitHub App**, installed on the site repository only | An OAuth App token covers *all* of the account's repositories (scope `repo,user`) and can change repo settings; a GitHub App token is limited to the site repo's content and expires after 8 hours. Must be tested with Sveltia CMS first (step 4). Fallback: a dedicated editor account with **Write** (not Admin) access and `auth_scope: public_repo`. |
| Other GitHub Pages sites on the account | **None** | The admin's sign-in token is stored per origin (`https://USER.github.io`). Any other Pages project site on the same account shares that origin and could read it. Disable Pages on every other repo, or host `/admin` on a separate origin. |
| Custom domain | Optional, later | If added, verify the domain in GitHub settings (prevents takeover); Cloudflare in front can then add real security headers (`frame-ancestors`, HSTS). |

## 1. Account security (Saba)

- [ ] GitHub: two-factor authentication with a **passkey or security key** (no SMS); recovery codes stored offline.
- [ ] GitHub primary and recovery email: a **personal** address (university addresses get deprovisioned or recycled).
- [ ] Review *Settings → Applications* and *Settings → Developer settings → Tokens*; revoke anything unused.
- [ ] Cloudflare account (for the sign-in worker): 2FA on, no other members, no long-lived API tokens.

## 2. Repository

- [ ] Saba creates a **public** repository named exactly `USER.github.io` (empty: no README, no licence).
- [ ] Saba adds the developer as a collaborator (*Settings → Collaborators*), temporarily.
- [ ] Inventory the account's other repositories: *Settings → Pages* must be **off** on all of them (see decision table).
- [ ] Update the content placeholders before pushing:
  - `src/_data/site.json` → `"url": "https://USER.github.io/"`
  - `src/admin/config.yml` → `backend.repo: USER/USER.github.io`
- [ ] Push `main` (the developer, with Saba's approval).

## 3. Repository settings

**Pages** (*Settings → Pages*)
- [ ] Source: **GitHub Actions** (never "Deploy from a branch" — that would publish raw uploads and bypass validation).
- [ ] *Enforce HTTPS*: on.

**Environments** (*Settings → Environments → github-pages*)
- [ ] Deployment branches: **`main` only**.

**Actions** (*Settings → Actions → General*)
- [ ] *Workflow permissions*: **Read repository contents and packages permissions**.
- [ ] *Allow GitHub Actions to create and approve pull requests*: **off**.
- [ ] *Actions permissions*: allow only actions from `actions/*` and `github/codeql-action/*`.
- [ ] *Fork pull request workflows*: require approval for **all** outside contributors.

**Rules** (*Settings → Rules → Rulesets → New branch ruleset*, target `main`)
- [ ] Block force pushes. Restrict deletions. Bypass list: empty.
- [ ] Do **not** require pull requests or status checks — the admin commits straight to `main`.

**Security** (*Settings → Code security*)
- [ ] Dependabot alerts and security updates: on (version updates come from `.github/dependabot.yml`).
- [ ] Secret scanning and push protection: on.
- [ ] CodeQL: uses `.github/workflows/checks.yml` (do not also enable "default setup").

## 4. Sign-in ("Sign in with GitHub")

The admin uses the [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth), a small Cloudflare Worker that exchanges the GitHub login code for a token. It never stores tokens.

1. [ ] Deploy the worker to Saba's Cloudflare account **from a pinned commit** (record the SHA here: `__________`).
2. [ ] Create the app on Saba's account:
   - **GitHub App** (recommended): *Settings → Developer settings → GitHub Apps → New*
     - Callback URL: `https://WORKER/callback` · Webhook: **inactive** · "Expire user authorization tokens": **on**
     - Repository permissions: **Contents: Read and write**, **Metadata: Read** — nothing else (no Administration, no Workflows, no Pages, no account permissions)
     - "Where can this app be installed": **Only on this account**; install it on **`USER.github.io` only**
     - Do not generate or store a private key (the user sign-in flow does not need one)
   - *or* **OAuth App** (fallback): callback `https://WORKER/callback`, and set `auth_scope: public_repo` in `src/admin/config.yml`.
3. [ ] Worker secrets (`wrangler secret put`): `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
4. [ ] Worker variable **`ALLOWED_DOMAINS=USER.github.io`** — exact host, **no wildcard, no localhost**. If this is empty or a wildcard, any website could obtain a token.
5. [ ] `src/admin/config.yml` → `backend.base_url: https://WORKER`.
6. [ ] Test on a throwaway repository first if using a GitHub App (Sveltia's support for GitHub App user tokens is not documented).

## 5. Smoke test (Saba, with the developer)

- [ ] `https://USER.github.io/` loads; all four tabs, a blog post page and the certificate dialog work on a computer and a phone.
- [ ] `https://USER.github.io/admin/` → *Sign In with GitHub* → approve → the admin opens.
- [ ] Change one small thing (e.g. a news item), save, and see it live within ~2 minutes (*Actions* tab shows a green run).
- [ ] Switch a section off and on again.
- [ ] Sign out.
- [ ] Remove the developer's collaborator access when no longer needed.

## 6. If something goes wrong

| Symptom | Where to look | Fix |
|---|---|---|
| A save does not appear on the site | Repository → *Actions* → latest "Build and deploy" run | The failing step names the file and the rule that was broken; fix it in the admin and save again. The previous version stays live meanwhile. |
| Sign-in window says "not allowed" | Worker `ALLOWED_DOMAINS`, app callback URL | Must be exactly `USER.github.io` and `https://WORKER/callback`. |
| Suspected account compromise | GitHub *Settings → Security log*, repo *Insights → Activity* | Revoke the app's authorization, rotate the worker's client secret, change the password, review and revert recent commits. |
