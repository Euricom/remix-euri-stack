# syntax=docker/dockerfile:1.4

# Arguments with default value (for build).
ARG RUN_IMAGE=gcr.io/distroless/nodejs20-debian12
ARG PLATFORM=linux/amd64
ARG NODE_VERSION=20

# -----------------------------------------------------------------------------
# Base image with pnpm package manager.
# -----------------------------------------------------------------------------
FROM --platform=${PLATFORM} node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME="/pnpm" PATH="$PNPM_HOME:$PATH" COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@latest-9 --activate
WORKDIR /srv

# -----------------------------------------------------------------------------
# Install dependencies and some toolchains.
# -----------------------------------------------------------------------------
FROM base AS builder
ENV LEFTHOOK=0 CI=true PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true

# Copy the source files
COPY --chown=node:node . .

# RUN apt update && apt -yqq install tini jq
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install \
    --ignore-scripts && pnpm build

# -----------------------------------------------------------------------------
# Compile the application and install production only dependencies.
# -----------------------------------------------------------------------------
FROM base AS pruner
ENV LEFTHOOK=0 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true NODE_ENV=production

# Required source files
COPY --from=builder /srv/package.json /srv/package.json
COPY --from=builder /srv/.npmrc /srv/.npmrc

# Generated files
COPY --from=builder /srv/pnpm-lock.yaml /srv/pnpm-lock.yaml
COPY --from=builder /srv/build /srv/build

# Install production dependencies and cleanup node_modules.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod \
    --frozen-lockfile --ignore-scripts && pnpm prune --prod \
    --ignore-scripts && pnpm dlx clean-modules clean --yes "!**/@libsql/**" 

# -----------------------------------------------------------------------------
# Production image, copy build output files and run the application.
# -----------------------------------------------------------------------------
FROM base AS runner

# Don't run production as root.
RUN addgroup --system --gid 1001 nonroot && adduser --system --uid 1001 nonroot

# Copy the build output files from the pruner stage.
COPY --chown=nonroot:nonroot --from=pruner /pnpm /pnpm
COPY --chown=nonroot:nonroot --from=pruner /srv /srv

# Define the host and port to listen on.
ARG NODE_ENV=production HOST=0.0.0.0 PORT=3000
ENV PNPM_HOME="/pnpm" PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=$NODE_ENV HOST=$HOST PORT=$PORT

USER nonroot:nonroot
EXPOSE $PORT

CMD ["node", "/srv/build/server/index.js"]
