import "@knodia/test-commons/redis";
import { afterAll, beforeAll, inject } from "vitest";

import { buildAppFromConfig } from "../src/app.ts";

let app: ReturnType<typeof buildAppFromConfig>;

beforeAll(async () => {
  app = buildAppFromConfig({
    acceptedAudiences: ["test-audience"],
    agreementProcessUrl: "http://localhost:0",
    cognitoIssuer: "https://cognito-idp.eu-west-1.amazonaws.com/pool-id",
    cognitoJwksUrl:
      "https://cognito-idp.eu-west-1.amazonaws.com/pool-id/.well-known/jwks.json",
    cookie: {
      domain: undefined,
      secure: false,
    },
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
    redisUrl: inject("REDIS_CONNECTION_STRING"),
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
  });

  await app.ready();
});

afterAll(async () => {
  await app.close();
});

export { app };
