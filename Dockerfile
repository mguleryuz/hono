# use the official Bun image
FROM oven/bun:latest AS base
WORKDIR /usr/src/app

#--------------------------------
# Install stage

FROM base AS install
# Combine RUN commands and only install necessary packages
RUN apt-get update && apt-get install -y \
    python3-minimal \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/* \
    && bun add -g node-gyp@latest

# Copy package files and workspace structure first to leverage cache
COPY package.json bun.lock ./
COPY packages/sendpulse-whatsapp/package.json ./packages/sendpulse-whatsapp/

# Install all dependencies once instead of twice
# Skip setup script in Docker builds
RUN RUN_DEV_SETUP=false bun install --frozen-lockfile \
    && mv node_modules dev_modules \
    && RUN_DEV_SETUP=false bun install --frozen-lockfile --omit=dev --omit=optional \
    && mv node_modules prod_modules

#--------------------------------
# Build stage

FROM base AS build
COPY --from=install /usr/src/app/dev_modules ./node_modules
COPY package.json ./
COPY client ./client
COPY src ./src
RUN bun run build:client

#--------------------------------
# Production stage
FROM base AS release
WORKDIR /usr/src/app
COPY --from=install /usr/src/app/prod_modules ./node_modules
COPY --from=build /usr/src/app/client/dist ./client/dist
COPY packages ./packages
COPY src ./src
COPY static ./static
COPY tsconfig.json ./tsconfig.json

USER bun
EXPOSE 8080/tcp
CMD ["sh", "-c", "NODE_ENV=production bun src/index.ts"]
