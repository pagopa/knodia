SELECT 'CREATE DATABASE event_store' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'event_store')\gexec
SELECT 'CREATE DATABASE readmodel' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'readmodel')\gexec
SELECT 'CREATE DATABASE remote_resource' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'remote_resource')\gexec
