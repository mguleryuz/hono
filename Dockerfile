# use the official Bun image
FROM oven/bun:latest AS base
WORKDIR /usr/src/app

#--------------------------------
# Install top level dependencies stage

FROM base AS install
# Combine RUN commands and only install necessary packages
RUN apt-get update && apt-get install -y \
    python3-minimal \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/* \
    && bun add -g node-gyp@latest

# Copy only package files first to leverage cache
COPY package.json bun.lock ./

# Install all dependencies once instead of twice
RUN bun install --frozen-lockfile \
    && mv node_modules dev_modules \
    && bun install --frozen-lockfile --omit=dev --omit=optional \
    && mv node_modules prod_modules

#--------------------------------
# Build stage

FROM base AS build
COPY --from=install /usr/src/app/dev_modules ./node_modules
COPY package.json tsconfig.json tsconfig.build.json ./
COPY src ./src
COPY client ./client
RUN bun run build

#--------------------------------
# Production stage
FROM base AS release
WORKDIR /usr/src/app
COPY --from=install /usr/src/app/prod_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/client/dist ./client/dist
COPY static ./static

USER bun
EXPOSE 8080/tcp
ENV NODE_ENV=production
CMD ["bun", "dist/index.js"]
