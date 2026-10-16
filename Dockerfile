# ---- base: Node toolchain used for dev, build and tests ----
FROM node:22-alpine AS base
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false

# ---- deps: reproducible install from the lockfile ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- dev: live-reloading Eleventy server (source is bind-mounted) ----
FROM deps AS dev
EXPOSE 8080
CMD ["npm", "run", "dev"]

# ---- build: validate content and produce the static site in /app/_site ----
FROM deps AS build
COPY . .
RUN npm run build

# ---- preview: production-like static server with full security headers ----
FROM nginx:1.27-alpine AS preview
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/_site /usr/share/nginx/html
EXPOSE 8081

# ---- test: Playwright (Chromium, Firefox, WebKit) runs against the preview server ----
FROM mcr.microsoft.com/playwright:v1.64.1-noble AS test
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false
COPY package.json package-lock.json ./
RUN npm ci
COPY playwright.config.js ./
COPY tests ./tests
CMD ["npx", "playwright", "test"]
