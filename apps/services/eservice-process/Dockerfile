ARG NODE_REGISTRY="docker.io"

FROM ${NODE_REGISTRY}/node:24-slim AS pruner
ENV TURBO_TELEMETRY_DISABLED=1
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm dlx turbo prune --scope=@knodia/eservice-process --docker --out-dir=/repo/out

FROM ${NODE_REGISTRY}/node:24-slim AS installer
WORKDIR /repo
RUN corepack enable
COPY --from=pruner /repo/out/json/ ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=pruner /repo/out/full/ ./

FROM ${NODE_REGISTRY}/node:24-slim AS runner
ENV NODE_ENV=production \
    NODE_OPTIONS="--experimental-strip-types" \
    TURBO_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=installer /repo ./

RUN groupadd -r app && useradd -rm -g app app
RUN chown -R app:app /app && chmod -R 700 /app
USER app

WORKDIR /app/apps/services/eservice-process
EXPOSE 3000
CMD ["node", "src/index.ts"]
