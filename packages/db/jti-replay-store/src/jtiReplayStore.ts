import {
  ConditionalCheckFailedException,
  type DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { dateToSeconds } from "@knodia/common-models/utils";

export type JtiReplayStore = ReturnType<typeof createJtiReplayStore>;

/**
 * Uses DynamoDB as a set of "seen" JTIs to prevent JWT replay.
 *
 * Each JTI is stored with a `ttl` attribute matching the token's `exp` claim,
 * so entries are automatically cleaned up by DynamoDB's native TTL.
 */
export function createJtiReplayStore(
  tableName: string,
  dynamoClient: DynamoDBClient,
) {
  return {
    /**
     * Marks a JTI as used. Returns `true` if this is the first use,
     * `false` if the JTI was already seen (replay attempt).
     *
     * Uses conditional put for atomicity. The `OR ttl < :now` clause
     * allows overwriting records whose TTL has expired but that DynamoDB
     * hasn't physically deleted yet (TTL cleanup is best-effort and can
     * lag behind), preventing stale records from blocking valid writes.
     */
    async consume(
      jti: string,
      iat: number,
      expireAtSec: number,
    ): Promise<boolean> {
      const nowSec = dateToSeconds(new Date());
      try {
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
      await dynamoClient.send(
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
