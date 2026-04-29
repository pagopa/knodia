import {
  ConditionalCheckFailedException,
  type DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";

import { storeJti } from "./utils/utils.ts";

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
     */
    async consume(
      jti: string,
      iat: number,
      expireAtSec: number,
    ): Promise<boolean> {
      try {
        await storeJti({ dynamoClient, expireAtSec, iat, jti, tableName });
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
