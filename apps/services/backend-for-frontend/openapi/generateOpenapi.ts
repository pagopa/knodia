import generateOpenapi from "@knodia/fastify-plugin-openapi-zod/generateOpenapi";

import app from "../src/app.ts";

await generateOpenapi(app);
