import { buildCognitoIdmClient } from "@knodia/cognito-idm-client";
import { KnodeId } from "@knodia/common-models/ids";
import { signupDbServiceBuilder } from "@knodia/db-signup/services";
import { makeSignupDrizzleConnection } from "@knodia/db-signup/utils";
import { runConsumer } from "@knodia/kafka-commons";
import { createLogger } from "@knodia/logger";
import { createOrganizationProcessApiClient } from "@knodia/organization-process-client";
import { refreshableInternalTokenGenerator } from "@knodia/token-generator/refreshable";

import { config } from "./config/config.ts";
import { createProcessMessage, type SignupUpdaterDeps } from "./utils/utils.ts";

const logger = createLogger({ config });

const { db, pool } = makeSignupDrizzleConnection(config);

const buildNodeClient = (knodeId: KnodeId) => ({
  cognitoClient: buildCognitoIdmClient({
    cognitoUserPoolId: config.cognitoUserPoolIds[knodeId],
  }),
  internalTokenProvider: refreshableInternalTokenGenerator(
    config.internalJwt[knodeId],
  ),
  orgClient: createOrganizationProcessApiClient({
    baseURL: config.organizationProcessUrls[knodeId],
  }),
});

const deps: SignupUpdaterDeps = {
  nodeClients: {
    Lynx: buildNodeClient(KnodeId.enum.Lynx),
    Orion: buildNodeClient(KnodeId.enum.Orion),
  },
  signupDbService: signupDbServiceBuilder(db),
};

await runConsumer(
  [config.signupTopic],
  createProcessMessage(deps, logger),
  config,
  logger,
  () => pool.end(),
);
