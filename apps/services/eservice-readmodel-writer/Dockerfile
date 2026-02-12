ARG NODE_REGISTRY="docker.io"
ARG SERVICE_NAME="eservice-readmodel-writer"
ARG SERVICE_PATH="apps/services/eservice-readmodel-writer"

FROM ${NODE_REGISTRY}/node:24-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 AS pruner
ARG SERVICE_NAME
ENV TURBO_TELEMETRY_DISABLED=1
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm dlx turbo prune --scope=@knodia/${SERVICE_NAME} --docker --out-dir=/repo/out

FROM ${NODE_REGISTRY}/node:24-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 AS installer
WORKDIR /repo
RUN corepack enable
COPY --from=pruner /repo/out/json/ ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=pruner /repo/out/full/ ./

FROM ${NODE_REGISTRY}/node:24-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 AS runner
ARG SERVICE_PATH
WORKDIR /app
COPY --from=installer /repo ./

RUN groupadd -r app && useradd -rm -g app app
RUN chown -R app:app /app && chmod -R 700 /app
USER app

WORKDIR /app/${SERVICE_PATH}
EXPOSE 3000
CMD ["node", "src/index.ts"]
