ARG NODE_REGISTRY="docker.io"
ARG SERVICE_NAME="api-gateway"
ARG SERVICE_PATH="apps/services/api-gateway"

FROM ${NODE_REGISTRY}/node:24-slim@sha256:bf22df20270b654c4e9da59d8d4a3516cce6ba2852e159b27288d645b7a7eedc AS pruner
ARG SERVICE_NAME
ENV TURBO_TELEMETRY_DISABLED=1
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm dlx turbo prune --scope=@knodia/${SERVICE_NAME} --docker --out-dir=/repo/out

FROM ${NODE_REGISTRY}/node:24-slim@sha256:bf22df20270b654c4e9da59d8d4a3516cce6ba2852e159b27288d645b7a7eedc AS installer
WORKDIR /repo
RUN corepack enable
COPY --from=pruner /repo/out/json/ ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=pruner /repo/out/full/ ./

FROM ${NODE_REGISTRY}/node:24-slim@sha256:bf22df20270b654c4e9da59d8d4a3516cce6ba2852e159b27288d645b7a7eedc AS runner
ARG SERVICE_PATH
WORKDIR /app
COPY --from=installer /repo ./

RUN groupadd -r app && useradd -rm -g app app
RUN chown -R app:app /app && chmod -R 700 /app
USER app

WORKDIR /app/${SERVICE_PATH}
EXPOSE 3000
CMD ["node", "src/index.ts"]
