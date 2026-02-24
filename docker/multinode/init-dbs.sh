#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE orion;
    GRANT ALL PRIVILEGES ON DATABASE orion TO root;
    CREATE DATABASE lynx;
    GRANT ALL PRIVILEGES ON DATABASE lynx TO root;
EOSQL
