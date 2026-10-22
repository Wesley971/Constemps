#!/bin/sh
set -e

echo "Applying pending Prisma migrations..."
./node_modules/.bin/prisma migrate deploy

exec "$@"
