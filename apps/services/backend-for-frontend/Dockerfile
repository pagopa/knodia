ARG NODE_REGISTRY="docker.io"
ARG SERVICE_NAME="backend-for-frontend"
ARG SERVICE_PATH="apps/services/backend-for-frontend"

FROM ${NODE_REGISTRY}/node:24-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 AS pruner
ARG SERVICE_NAME
ENV TURBO_TELEMETRY_DISABLED=1
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm dlx turbo prune --scope=@knodia/${SERVICE_NAME} --docker --out-dir=/repo/out

FROM ${NODE_REGISTRY}/node:24-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 AS installer
WORKDIR /repo
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
COPY --from=pruner /repo/out/json/ ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=pruner /repo/out/full/ ./

FROM ${NODE_REGISTRY}/node:24-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 AS runner
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
