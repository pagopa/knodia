import generateOpenapi from "@knodia/fastify-zod-api-commons/generateOpenapi";

import { buildAppFromConfig } from "../src/app.js";
import { config } from "../src/config/config.js";

await generateOpenapi(buildAppFromConfig(config));
