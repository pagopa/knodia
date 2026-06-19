import generateOpenapi from "@knodia/fastify-zod-api-commons/generateOpenapi";

import {
  buildBearerAppFromConfig,
  buildBearerIntegrityRest02AppFromConfig,
  buildBearerPocUc01QualificationsAppFromConfig,
  buildBearerPocUc01SetQualificationAppFromConfig,
  buildBearerPocUc02CompaniesAppFromConfig,
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
    buildBearerPocUc01QualificationsAppFromConfig(config),
    "openapi/openapi-bearer-poc-uc01-qualifications.yaml",
  ),
  generateOpenapi(
    buildBearerPocUc01SetQualificationAppFromConfig(config),
    "openapi/openapi-bearer-poc-uc01-set-qualification.yaml",
  ),
  generateOpenapi(
    buildBearerReceiveDataAppFromConfig(config),
    "openapi/openapi-bearer-receive-data.yaml",
  ),
  generateOpenapi(
    buildBearerIntegrityRest02AppFromConfig(config),
    "openapi/openapi-bearer-integrity-rest-02.yaml",
  ),
]);
