import generateOpenapi from "@knodia/fastify-zod-api-commons/generateOpenapi";

import {
  buildBearerAppFromConfig,
  buildBearerPocUc02CompaniesAppFromConfig,
  buildBearerPocUc03RelayAppFromConfig,
  buildBearerPocUc03SupervisoryBodyAppFromConfig,
  buildBearerReceiveDataAppFromConfig,
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
  generateOpenapi(
    buildBearerReceiveDataAppFromConfig(config),
    "openapi/openapi-bearer-receive-data.yaml",
  ),
  generateOpenapi(
    buildBearerPocUc03SupervisoryBodyAppFromConfig(config),
    "openapi/openapi-bearer-poc-uc03-supervisory-body.yaml",
  ),
  generateOpenapi(
    buildBearerPocUc03RelayAppFromConfig(config),
    "openapi/openapi-bearer-poc-uc03-relay.yaml",
  ),
]);
