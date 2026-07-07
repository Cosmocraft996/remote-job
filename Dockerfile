FROM node:20-bookworm-slim

ENV NODE_ENV=production \
    LOCAL=false \
    CHROME_EXECUTABLE_PATH=/usr/bin/chromium \
    PUPPETEER_SKIP_DOWNLOAD=true \
    TZ=Asia/Shanghai

WORKDIR /app

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates \
    chromium \
    dumb-init \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    tzdata \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml ./
RUN corepack enable \
  && pnpm install --prod --frozen-lockfile

COPY . .
RUN mkdir -p /app/debug \
  && chown -R node:node /app

USER node

ENTRYPOINT ["dumb-init", "--"]
CMD ["pnpm", "start"]
