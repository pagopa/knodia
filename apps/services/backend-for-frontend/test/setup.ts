import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import "@knodia/test-commons/dynamodb";
import { resetDynamoTable } from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { buildAppFromConfig } from "../src/app.ts";

// Must match a schema file under dynamo-tables/
const refreshTokenTableName = "knodia-bff-refresh-tokens";
const magicLinkTokenTableName = "knodia-bff-magic-link-tokens";

let app: ReturnType<typeof buildAppFromConfig>;
let dynamoClient: DynamoDBClient;

beforeAll(async () => {
  dynamoClient = new DynamoDBClient({
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
    endpoint: inject("DYNAMODB_CONNECTION_STRING"),
    region: "eu-south-1",
  });

  app = buildAppFromConfig(
    {
      acceptedAudiences: ["test-audience"],
      agreementProcessUrl: "http://localhost:0",
      cognitoIssuer: "https://cognito-idp.eu-west-1.amazonaws.com/pool-id",
      cognitoJwksUrl:
        "https://cognito-idp.eu-west-1.amazonaws.com/pool-id/.well-known/jwks.json",
      cookie: {
        domain: undefined,
        pathPrefix: "",
        secure: false,
      },
      defaultPollingMaxRetries: 5,
      defaultPollingRetryDelay: 400,
      dynamoDbMagicLinkTokensTable: magicLinkTokenTableName,
      dynamoDbRefreshTokensTable: refreshTokenTableName,
      eserviceInterfacesS3Bucket: "test-bucket",
      eserviceProcessUrl: "http://localhost:0",
      externalUiSessionJwt: {
        audience: "test-external-ui-session-audience",
        issuer: "test-issuer",
        kid: "alias/test-kid",
        secondsDuration: 300,
      },
      externalUiSessionMagicLinkAccepted: {
        audience: "test-magic-link-audience",
        issuer: "test-issuer",
        wellKnownUrls: [
          "http://localhost:4502/knodia/.well-known/jwks.json",
          "http://localhost:4503/knodia/.well-known/jwks.json",
        ],
      },
      host: "0.0.0.0",
      isProduction: false,
      keychainProcessUrl: "http://localhost:0",
      knodeId: "Orion",
      logLevel: "silent",
      nodeEnv: "test",
      organizationProcessUrl: "http://localhost:0",
      port: 0,
      purposeProcessUrl: "http://localhost:0",
      recentUpdateDays: 3,
      refreshJwt: { secondsDuration: 86400 },
      remoteResourcesManagerUrl: "http://localhost:0",
      uiSessionJwt: {
        audience: "test-audience",
        issuer: "test-issuer",
        kid: "alias/test-kid",
        secondsDuration: 3600,
      },
      wellKnownUrls: [
        "http://localhost:4500/knodia/.well-known/jwks.json",
        "http://localhost:4501/knodia/.well-known/jwks.json",
      ],
    },
    dynamoClient,
  );

  await app.ready();
});

afterEach(async () => {
  await Promise.all([
    resetDynamoTable(refreshTokenTableName, "jti", dynamoClient),
    resetDynamoTable(magicLinkTokenTableName, "jti", dynamoClient),
  ]);
});

afterAll(async () => {
  dynamoClient.destroy();
  await app.close();
});

export { app };
