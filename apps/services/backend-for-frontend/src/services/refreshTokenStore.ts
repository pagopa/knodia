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
     * Uses conditional put (attribute_not_exists) for atomicity.
     */
    async consume(jti: string, expireAtSec: number): Promise<boolean> {
      try {
        await client.send(
          new PutItemCommand({
            ConditionExpression: "attribute_not_exists(jti)",
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
