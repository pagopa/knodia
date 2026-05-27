import type {
  ConsumerKeychainId,
  ProducerKeychainId,
} from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type {
  ConsumerKeychainPurpose,
  ProducerKeychainEservice,
} from "@knodia/keychain-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  readmodelConsumerKeychain,
  readmodelConsumerKeychainKey,
  readmodelConsumerKeychainPurpose,
  readmodelConsumerKeychainUser,
  readmodelKnodeApiKeychain,
  readmodelKnodeApiKeychainKey,
  readmodelKnodeApiKeychainUser,
  readmodelProducerKeychain,
  readmodelProducerKeychainEservice,
  readmodelProducerKeychainKey,
  readmodelProducerKeychainUser,
} from "@knodia/db-readmodel-keychain";
import {
  aggregateConsumerKeychains,
  aggregateKnodeApiKeychains,
  aggregateProducerKeychains,
  toConsumerKeychainPurpose,
  toProducerKeychainEservice,
} from "@knodia/db-readmodel-keychain/converters";
import { eq } from "drizzle-orm";

export async function getAllConsumerKeychains(readmodelDb: NodePgDatabase) {
  const queryRes = await readmodelDb
    .select({
      consumerKeychain: readmodelConsumerKeychain,
      key: readmodelConsumerKeychainKey,
      user: readmodelConsumerKeychainUser,
    })
    .from(readmodelConsumerKeychain)
    .leftJoin(
      readmodelConsumerKeychainUser,
      eq(
        readmodelConsumerKeychain.id,
        readmodelConsumerKeychainUser.consumerKeychainId,
      ),
    )
    .leftJoin(
      readmodelConsumerKeychainKey,
      eq(
        readmodelConsumerKeychain.id,
        readmodelConsumerKeychainKey.consumerKeychainId,
      ),
    );

  return aggregateConsumerKeychains(queryRes);
}

export async function getAllKnodeApiKeychains(readmodelDb: NodePgDatabase) {
  const queryRes = await readmodelDb
    .select({
      key: readmodelKnodeApiKeychainKey,
      knodeApiKeychain: readmodelKnodeApiKeychain,
      user: readmodelKnodeApiKeychainUser,
    })
    .from(readmodelKnodeApiKeychain)
    .leftJoin(
      readmodelKnodeApiKeychainUser,
      eq(
        readmodelKnodeApiKeychain.id,
        readmodelKnodeApiKeychainUser.knodeApiKeychainId,
      ),
    )
    .leftJoin(
      readmodelKnodeApiKeychainKey,
      eq(
        readmodelKnodeApiKeychain.id,
        readmodelKnodeApiKeychainKey.knodeApiKeychainId,
      ),
    );

  return aggregateKnodeApiKeychains(queryRes);
}

export async function getAllProducerKeychains(readmodelDb: NodePgDatabase) {
  const queryRes = await readmodelDb
    .select({
      key: readmodelProducerKeychainKey,
      producerKeychain: readmodelProducerKeychain,
      user: readmodelProducerKeychainUser,
    })
    .from(readmodelProducerKeychain)
    .leftJoin(
      readmodelProducerKeychainUser,
      eq(
        readmodelProducerKeychain.id,
        readmodelProducerKeychainUser.producerKeychainId,
      ),
    )
    .leftJoin(
      readmodelProducerKeychainKey,
      eq(
        readmodelProducerKeychain.id,
        readmodelProducerKeychainKey.producerKeychainId,
      ),
    );

  return aggregateProducerKeychains(queryRes);
}

export async function getConsumerKeychainPurposesByKeychainId(
  consumerKeychainId: ConsumerKeychainId,
  readmodelDb: NodePgDatabase,
): Promise<WithMetadata<ConsumerKeychainPurpose>[]> {
  const queryRes = await readmodelDb
    .select()
    .from(readmodelConsumerKeychainPurpose)
    .where(
      eq(
        readmodelConsumerKeychainPurpose.consumerKeychainId,
        consumerKeychainId,
      ),
    );

  return queryRes.map(toConsumerKeychainPurpose);
}

export async function getProducerKeychainEservicesByKeychainId(
  producerKeychainId: ProducerKeychainId,
  readmodelDb: NodePgDatabase,
): Promise<WithMetadata<ProducerKeychainEservice>[]> {
  const queryRes = await readmodelDb
    .select()
    .from(readmodelProducerKeychainEservice)
    .where(
      eq(
        readmodelProducerKeychainEservice.producerKeychainId,
        producerKeychainId,
      ),
    );

  return queryRes.map(toProducerKeychainEservice);
}
