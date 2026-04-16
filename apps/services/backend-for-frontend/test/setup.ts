import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import "@knodia/test-commons/dynamodb";
import { afterAll, beforeAll, inject } from "vitest";

import { buildAppFromConfig } from "../src/app.ts";
import {
  createRefreshTokenStore,
  type RefreshTokenStore,
} from "../src/services/refreshTokenStore.ts";

// Must match a schema file under dynamo-tables/
export const refreshTokenTableName = "knodia-bff-refresh-tokens";

let app: ReturnType<typeof buildAppFromConfig>;
export let dynamoClient: DynamoDBClient;
export let refreshTokenStore: RefreshTokenStore;

beforeAll(async () => {
  dynamoClient = new DynamoDBClient({
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
    endpoint: inject("DYNAMODB_CONNECTION_STRING"),
    region: "eu-south-1",
  });
  refreshTokenStore = createRefreshTokenStore(
    refreshTokenTableName,
    dynamoClient,
  );

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
      dynamoDbRefreshTokensTable: refreshTokenTableName,
      eserviceInterfacesS3Bucket: "test-bucket",
      eserviceProcessUrl: "http://localhost:0",
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

afterAll(async () => {
  dynamoClient.destroy();
  await app.close();
});

export { app };
