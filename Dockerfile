# The tag MUST match the @playwright/test version in package.json. The image
# ships the browsers Playwright expects at $PLAYWRIGHT_BROWSERS_PATH, and a
# mismatch fails at runtime with "Executable doesn't exist".
FROM mcr.microsoft.com/playwright:v1.62.1-noble

WORKDIR /app

# Dependencies in their own layer, so editing a test does not reinstall them.
# CI=1 short-circuits the `is-ci || husky` postinstall: git hooks are useless
# in an image, and .git is not in the build context anyway.
COPY package.json package-lock.json ./
RUN CI=1 npm ci

COPY . .

# No `playwright install` — the base image already carries the browsers.
CMD ["npx", "playwright", "test"]
