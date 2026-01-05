import generateOpenapi from "@knodia/fastify-plugin-openapi-zod/generateOpenapi";

import app from "../src/app.ts";

// TODO: maybe the BFF's openapi is unnecessary
await generateOpenapi(app);
