import generateOpenapi from "@knodia/fastify-zod-api-commons/generateOpenapi";

import {
  buildAppFromConfig,
  buildBearerAppFromConfig,
  buildDpopAppFromConfig,
} from "../src/app.ts";
import { config } from "../src/config/config.ts";

await generateOpenapi(buildAppFromConfig(config));
await generateOpenapi(
  buildBearerAppFromConfig(config),
  "openapi/openapi-bearer.yaml",
);
await generateOpenapi(
  buildDpopAppFromConfig(config),
  "openapi/openapi-dpop.yaml",
);
