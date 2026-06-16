import generateOpenapi from "@knodia/fastify-zod-api-commons/generateOpenapi";

import {
  buildBearerAppFromConfig,
  buildBearerPocUc02CompaniesAppFromConfig,
  buildBearerSignalHubAppFromConfig,
  buildDpopAppFromConfig,
} from "../src/app.ts";
import { config } from "../src/config/config.ts";

await Promise.all([
  generateOpenapi(
    buildBearerAppFromConfig(config),
    "openapi/openapi-bearer.yaml",
  ),
  generateOpenapi(buildDpopAppFromConfig(config), "openapi/openapi-dpop.yaml"),
  generateOpenapi(
    buildBearerSignalHubAppFromConfig(config),
    "openapi/openapi-bearer-signal-hub.yaml",
  ),
  generateOpenapi(
    buildBearerPocUc02CompaniesAppFromConfig(config),
    "openapi/openapi-bearer-poc-uc02-companies.yaml",
  ),
]);
