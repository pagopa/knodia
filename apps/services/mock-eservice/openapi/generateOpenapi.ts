import generateOpenapi from "@knodia/fastify-zod-api-commons/generateOpenapi";

import {
  buildAppFromConfig,
  buildBearerAppFromConfig,
  buildDpopAppFromConfig,
} from "../src/app.ts";
import { config } from "../src/config/config.ts";

await Promise.all([
  generateOpenapi(buildAppFromConfig(config)),
  generateOpenapi(
    buildBearerAppFromConfig(config),
    "openapi/openapi-bearer.yaml",
  ),
  generateOpenapi(buildDpopAppFromConfig(config), "openapi/openapi-dpop.yaml"),
]);
