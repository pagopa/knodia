CREATE DATABASE orion_event_store;
CREATE DATABASE orion_readmodel;
CREATE DATABASE orion_remote_resource;
CREATE DATABASE orion_signal_hub;
CREATE DATABASE lynx_event_store;
CREATE DATABASE lynx_readmodel;
CREATE DATABASE lynx_remote_resource;
CREATE DATABASE lynx_signal_hub;
-- signup is a central subsystem shared by both knodes (one signup_user row spans
-- both), so it lives in a single non-namespaced database, not a per-knode one.
CREATE DATABASE signup;
