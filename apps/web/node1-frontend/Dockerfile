ARG NODE_REGISTRY="docker.io"
ARG SERVICE_NAME="node1-frontend"
ARG SERVICE_PATH="apps/web/node1-frontend"

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
RUN pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ ./

FROM installer AS build
ARG SERVICE_NAME
RUN pnpm --filter @knodia/${SERVICE_NAME} build

FROM nginx:1.29.2@sha256:3b7732505933ca591ce4a6d860cb713ad96a3176b82f7979a8dfa9973486a0d6 AS runner
ARG SERVICE_PATH
RUN mkdir -p /usr/share/nginx/html/ui
COPY --from=build /repo/${SERVICE_PATH}/dist /usr/share/nginx/html/ui
