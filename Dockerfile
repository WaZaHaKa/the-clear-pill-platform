FROM node:22-bookworm-slim AS base

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/planning-core/package.json packages/planning-core/package.json
COPY packages/planning-service/package.json packages/planning-service/package.json

RUN npm install --include=dev

COPY . .
RUN npm run db:generate

FROM base AS web-builder
RUN npm run build --workspace=@clearpill/web

FROM base AS web
COPY --from=web-builder /app/apps/web/.next /app/apps/web/.next
COPY --from=web-builder /app/apps/web/public /app/apps/web/public
COPY docker/entrypoint.sh /usr/local/bin/clear-pill-entrypoint
COPY docker/with-database-url.sh /usr/local/bin/clear-pill-with-db
RUN chmod 0755 /usr/local/bin/clear-pill-entrypoint /usr/local/bin/clear-pill-with-db
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/clear-pill-entrypoint"]
CMD ["npm", "run", "start", "--workspace=@clearpill/web"]

FROM base AS worker
COPY docker/entrypoint.sh /usr/local/bin/clear-pill-entrypoint
COPY docker/with-database-url.sh /usr/local/bin/clear-pill-with-db
RUN chmod 0755 /usr/local/bin/clear-pill-entrypoint /usr/local/bin/clear-pill-with-db
ENTRYPOINT ["/usr/local/bin/clear-pill-entrypoint"]
CMD ["npm", "run", "start", "--workspace=@clearpill/worker"]
