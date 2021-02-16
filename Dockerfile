# ---------- Base ----------
FROM node:14.2.0 as base
WORKDIR /app

# ---------- Builder ----------
FROM base AS builder
COPY package.json yarn.lock ./
RUN yarn --ignore-optional --frozen-lockfile
COPY ./src ./src

# ---------- Release ----------
FROM base AS release
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
USER root
CMD ["node", "./src/index.js"]
