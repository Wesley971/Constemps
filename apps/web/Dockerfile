FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# L'image finale est Caddy, pas Node : ce service (voir docker-compose.prod.yml,
# nommé "web") sert le build statique ET fait reverse proxy HTTPS vers l'API,
# via le Caddyfile ci-dessous.
FROM caddy:2-alpine
COPY --from=build /app/dist /srv/web
COPY Caddyfile /etc/caddy/Caddyfile
