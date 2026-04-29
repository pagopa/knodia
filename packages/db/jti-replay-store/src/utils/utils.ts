import { type DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { dateToSeconds } from "@knodia/common-models/utils";

/**
 * Uses conditional put for atomicity. The `OR ttl < :now` clause
 * allows overwriting records whose TTL has expired but that DynamoDB
 * hasn't physically deleted yet (TTL cleanup is best-effort and can
 * lag behind), preventing stale records from blocking valid writes.
 */
export async function storeJti({
  dynamoClient,
  expireAtSec,
  iat,
  jti,
  tableName,
}: {
  dynamoClient: DynamoDBClient;
  expireAtSec: number;
  iat: number;
  jti: string;
  tableName: string;
}): Promise<void> {
  const nowSec = dateToSeconds(new Date());

  await dynamoClient.send(
    new PutItemCommand({
      ConditionExpression: "attribute_not_exists(jti) OR #ttl < :now",
      // "ttl" is a DynamoDB reserved word — must use a #placeholder
      ExpressionAttributeNames: { "#ttl": "ttl" },
      ExpressionAttributeValues: { ":now": { N: String(nowSec) } },
      Item: {
        iat: { N: String(iat) },
        jti: { S: jti },
        ttl: { N: String(expireAtSec) },
      },
      TableName: tableName,
    }),
  );
}
