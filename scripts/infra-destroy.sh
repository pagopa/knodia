#!/bin/bash

VOLUMES_FLAG=""
for arg in "$@"; do
  case "$arg" in
    --volumes) VOLUMES_FLAG="-v" ;;
  esac
done

docker compose -f docker/compose.yaml down $VOLUMES_FLAG
