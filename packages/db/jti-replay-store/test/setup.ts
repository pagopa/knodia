import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import "@knodia/test-commons/dynamodb";
import {
  createJtiReplayStore,
  type JtiReplayStore,
} from "@knodia/db-jti-replay-store";
import { afterAll, beforeAll, inject } from "vitest";

// Must match a schema file under dynamo-tables/
const jtiReplayTableName = "knodia-bff-refresh-tokens";

let dynamoClient: DynamoDBClient;
let jtiReplayStore: JtiReplayStore;

beforeAll(async () => {
  dynamoClient = new DynamoDBClient({
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
    endpoint: inject("DYNAMODB_CONNECTION_STRING"),
    region: "eu-south-1",
  });
  jtiReplayStore = createJtiReplayStore(jtiReplayTableName, dynamoClient);
});

afterAll(async () => {
  dynamoClient.destroy();
});

export { dynamoClient, jtiReplayStore, jtiReplayTableName };
