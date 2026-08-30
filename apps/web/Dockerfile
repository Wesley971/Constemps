FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Vite fige les variables VITE_* dans le bundle au moment du build (pas de
# lecture runtime possible dans le JS livré au navigateur) : doit donc être
# passée en build arg, pas en variable d'environnement du conteneur final.
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# L'image finale est Caddy, pas Node : ce service (voir docker-compose.prod.yml,
# nommé "web") sert le build statique ET fait reverse proxy HTTPS vers l'API,
# via le Caddyfile ci-dessous.
FROM caddy:2-alpine
COPY --from=build /app/dist /srv/web
COPY Caddyfile /etc/caddy/Caddyfile
