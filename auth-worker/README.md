# Sign-in helper for the admin panel (Cloudflare Worker)

This folder holds the exact code deployed as the Cloudflare Worker
`sveltia-cms-auth` on Saba's Cloudflare account (`https://sveltia-cms-auth.sabafeizi1.workers.dev`).
It exchanges GitHub's sign-in code for a token and hands it only to `sabafeizi.github.io`.
It is **not** part of the website build.

- Source: [sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth), file `src/index.js`
- Pinned commit: `4fd08b5d4e009a85fa473fd523824ca9dfee9533` (2026-09-21), MIT licence (`LICENSE.txt`)
- Worker settings (Cloudflare → Workers & Pages → sveltia-cms-auth → Settings → Variables and Secrets):
  - `GITHUB_CLIENT_ID` (text): the Client ID of the GitHub OAuth App "Saba's website admin"
  - `GITHUB_CLIENT_SECRET` (secret): generated in that OAuth App; never stored anywhere else
  - `ALLOWED_DOMAINS` (text): `sabafeizi.github.io` — exact host, no wildcard. If this is empty,
    any website could obtain a sign-in token.
- GitHub OAuth App callback URL: `https://sveltia-cms-auth.sabafeizi1.workers.dev/callback`

To update: review the new upstream `src/index.js`, replace `index.js` here, then paste it into the
Worker's code editor in Cloudflare and deploy.
