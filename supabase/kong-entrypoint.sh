#!/bin/sh
set -e

sed \
  -e "s|\${ANON_KEY}|$ANON_KEY|g" \
  -e "s|\${SERVICE_ROLE_KEY}|$SERVICE_ROLE_KEY|g" \
  /home/kong/kong.yml > /usr/local/kong/kong.yml

exec /entrypoint.sh kong docker-start
