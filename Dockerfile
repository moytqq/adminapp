# Build stage
FROM node:lts-alpine AS builder

USER node
WORKDIR /app

COPY package*.json .
RUN npm ci

COPY --chown=node:node . .

ARG NEXT_PUBLIC_ROUNDCUBE_URL
ENV NEXT_PUBLIC_ROUNDCUBE_URL=$NEXT_PUBLIC_ROUNDCUBE_URL

RUN npm run build && npm prune --omit=dev


# Final run stage
FROM node:lts-alpine

ENV NODE_ENV=production

USER node
WORKDIR /app

COPY --from=builder --chown=node:node /app/package*.json .
COPY --from=builder --chown=node:node /app/node_modules/ ./node_modules
COPY --from=builder --chown=node:node /app/.next/ ./.next

CMD ["npm", "start"] 