# use the official Bun image
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# install dependencies into temp folder
FROM base AS install
# Combine RUN commands and only install necessary packages
RUN apt-get update && apt-get install -y \
    python3-minimal \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/* \
    && bun add -g node-gyp@latest

# Copy only package files first to leverage cache
COPY package.json bun.lockb ./

# Install all dependencies once instead of twice
RUN bun install \
    && cp -r node_modules prod_modules \
    && bun install --production \
    && mv node_modules dev_modules

# Build stage
FROM base AS build
COPY --from=install /usr/src/app/dev_modules ./node_modules
COPY . .
RUN bun --cwd=client vite build

# Production stage
FROM base AS release
WORKDIR /usr/src/app
COPY --from=install /usr/src/app/prod_modules ./node_modules
COPY --from=build /usr/src/app/client/dist ./client/dist
COPY . .

USER bun
EXPOSE 8080/tcp
CMD ["bun", "run", "start"]
