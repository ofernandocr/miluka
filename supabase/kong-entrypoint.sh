#!/bin/sh
set -e

export ANON_KEY=${ANON_KEY}
export SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}

envsubst < /home/kong/kong.yml > /usr/local/kong/kong.yml

exec /docker-entrypoint.sh kong docker-start
