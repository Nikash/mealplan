# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
# basePath is inlined at build time. Override with --build-arg NEXT_PUBLIC_BASE_PATH=
# to serve from domain root instead of /mealplan.
ARG NEXT_PUBLIC_BASE_PATH=/mealplan
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Turbopack has no native bindings on 32-bit ARM; webpack works via SWC WASM.
RUN npm run build -- --webpack

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && mkdir -p /data \
  && chown nextjs:nodejs /data

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

VOLUME ["/data"]

CMD ["node", "server.js"]
