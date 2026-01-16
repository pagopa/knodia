import generateOpenapi from "@knodia/fastify-zod-api-commons/generateOpenapi";

import app from "../src/app.ts";

await generateOpenapi(app);
