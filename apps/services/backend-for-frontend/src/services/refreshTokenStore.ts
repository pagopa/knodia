import {
  ConditionalCheckFailedException,
  DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";

export type RefreshTokenStore = ReturnType<typeof createRefreshTokenStore>;

/**
 * Uses DynamoDB as a set of "seen" JTIs to prevent refresh token replay.
 *
 * Each JTI is stored with a `ttl` attribute matching the token's `exp` claim,
 * so entries are automatically cleaned up by DynamoDB's native TTL.
 */
export function createRefreshTokenStore(
  tableName: string,
  dynamoClient?: DynamoDBClient,
) {
  const client = dynamoClient ?? new DynamoDBClient();

  return {
    async close(): Promise<void> {
      client.destroy();
    },

    /**
     * Marks a JTI as used. Returns `true` if this is the first use,
     * `false` if the JTI was already seen (replay attempt).
     *
     * Uses conditional put for atomicity. The `OR ttl < :now` clause
     * allows overwriting records whose TTL has expired but that DynamoDB
     * hasn't physically deleted yet (TTL cleanup is best-effort and can
     * lag behind), preventing stale records from blocking valid writes.
     */
    async consume(jti: string, expireAtSec: number): Promise<boolean> {
      const nowSec = Math.floor(Date.now() / 1000);
      try {
        await client.send(
          new PutItemCommand({
            ConditionExpression: "attribute_not_exists(jti) OR #ttl < :now",
            // "ttl" is a DynamoDB reserved word — must use a #placeholder
            ExpressionAttributeNames: { "#ttl": "ttl" },
            ExpressionAttributeValues: { ":now": { N: String(nowSec) } },
            Item: {
              jti: { S: jti },
              ttl: { N: String(expireAtSec) },
            },
            TableName: tableName,
          }),
        );
        return true;
      } catch (err) {
        if (err instanceof ConditionalCheckFailedException) {
          return false;
        }
        throw err;
      }
    },

    /**
     * Unconditionally marks a JTI as used (e.g. on logout),
     * so any future consume attempt will fail.
     */
    async revoke(jti: string, expireAtSec: number): Promise<void> {
      await client.send(
        new PutItemCommand({
          Item: {
            jti: { S: jti },
            ttl: { N: String(expireAtSec) },
          },
          TableName: tableName,
        }),
      );
    },
  };
}
