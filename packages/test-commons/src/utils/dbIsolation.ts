import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { AnyPgTable } from "drizzle-orm/pg-core";

import {
  DeleteItemCommand,
  type DynamoDBClient,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { sql } from "drizzle-orm";

export async function resetDynamoTable(
  tableName: string,
  keyColumn: string,
  dynamoClient: DynamoDBClient,
): Promise<void> {
  const { Items = [] } = await dynamoClient.send(
    new ScanCommand({ ProjectionExpression: keyColumn, TableName: tableName }),
  );
  await Promise.all(
    Items.filter((item) => item[keyColumn]).map((item) =>
      dynamoClient.send(
        new DeleteItemCommand({
          Key: {
            [keyColumn]: item[keyColumn] as NonNullable<(typeof item)[string]>,
          },
          TableName: tableName,
        }),
      ),
    ),
  );
}

export async function resetTestDatabase(
  db: NodePgDatabase,
  ...tables: AnyPgTable[]
): Promise<void> {
  if (tables.length === 0) {
    return;
  }

  await db.execute(
    sql`TRUNCATE TABLE ${sql.join(tables, sql.raw(", "))} RESTART IDENTITY CASCADE`,
  );
}
