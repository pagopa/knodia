ARG NODE_REGISTRY="docker.io"
ARG SERVICE_NAME="mock-eservice"
ARG SERVICE_PATH="apps/services/mock-eservice"

FROM ${NODE_REGISTRY}/node:24-slim@sha256:cb4e8f7c443347358b7875e717c29e27bf9befc8f5a26cf18af3c3dec80e58c5 AS pruner
ARG SERVICE_NAME
ENV TURBO_TELEMETRY_DISABLED=1
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm dlx turbo@2.9.14 prune --scope=@knodia/${SERVICE_NAME} --docker --out-dir=/repo/out

FROM ${NODE_REGISTRY}/node:24-slim@sha256:cb4e8f7c443347358b7875e717c29e27bf9befc8f5a26cf18af3c3dec80e58c5 AS installer
WORKDIR /repo
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
COPY --from=pruner /repo/out/json/ ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=pruner /repo/out/full/ ./

FROM ${NODE_REGISTRY}/node:24-slim@sha256:cb4e8f7c443347358b7875e717c29e27bf9befc8f5a26cf18af3c3dec80e58c5 AS runner
ARG SERVICE_PATH
WORKDIR /app
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
COPY --from=installer /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=installer /repo ./

RUN groupadd -r app && useradd -rm -g app app
RUN chown -R app:app /app && chmod -R 700 /app
USER app

WORKDIR /app/${SERVICE_PATH}
EXPOSE 3000
CMD ["node", "src/index.ts"]
