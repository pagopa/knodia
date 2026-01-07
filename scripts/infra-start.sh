#!/bin/bash

docker compose -f docker/compose.yaml up -d --wait

turbo run db:migrate
