/* eslint-disable max-lines-per-function */
import type {
  ConsumerKeychainId,
  EserviceId,
  KeyId,
  KnodeApiKeychainId,
  OrganizationId,
  ProducerKeychainId,
} from "@knodia/common-models/ids";
import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type {
  ConsumerKeychainPurpose,
  FlatConsumerKeychain,
  FlatKnodeApiKeychain,
  FlatProducerKeychain,
  KeychainKey,
  LocalizedName,
  ProducerKeychainEservice,
} from "@knodia/keychain-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  createOrderByFilters,
  getTableTotalCount,
  ilikeJsonB,
  ilikeJsonBExact,
} from "@knodia/db-readmodel-commons/utils";
import { eserviceReadmodelServiceBuilder } from "@knodia/db-readmodel-eservice/services";
import {
  readmodelConsumerKeychain,
  readmodelConsumerKeychainKey,
  readmodelConsumerKeychainPurpose,
  readmodelKnodeApiKeychain,
  readmodelKnodeApiKeychainKey,
  readmodelProducerKeychain,
  readmodelProducerKeychainEservice,
  readmodelProducerKeychainKey,
} from "@knodia/db-readmodel-keychain";
import {
  aggregateFlatConsumerKeychains,
  aggregateFlatKnodeApiKeychains,
  aggregateFlatProducerKeychains,
  toConsumerKeychainPurpose,
  toKeychainKey,
  toProducerKeychainEservice,
} from "@knodia/db-readmodel-keychain/converters";
import {
  consumerKeychainReadmodelServiceBuilder,
  knodeApiKeychainReadmodelServiceBuilder,
  producerKeychainReadmodelServiceBuilder,
} from "@knodia/db-readmodel-keychain/services";
import { and, desc, eq, exists } from "drizzle-orm";

import type {
  API_GetConsumerKeychainKeysQueryParams,
  API_GetConsumerKeychainPurposesQueryParams,
  API_GetConsumerKeychainsQueryParams,
  API_GetKnodeApiKeychainKeysQueryParams,
  API_GetKnodeApiKeychainsQueryParams,
  API_GetProducerKeychainEservicesQueryParams,
  API_GetProducerKeychainKeysQueryParams,
  API_GetProducerKeychainsQueryParams,
} from "../models/api.ts";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  const consumerKeychainReadmodelService =
    consumerKeychainReadmodelServiceBuilder(readmodelDb);
  const eserviceReadmodelService = eserviceReadmodelServiceBuilder(readmodelDb);
  const knodeApiKeychainReadmodelService =
    knodeApiKeychainReadmodelServiceBuilder(readmodelDb);
  const producerKeychainReadmodelService =
    producerKeychainReadmodelServiceBuilder(readmodelDb);

  return {
    async checkConsumerKeychainKeyExists(kid: KeyId) {
      const queryResult = await readmodelDb
        .select({ kid: readmodelConsumerKeychainKey.kid })
        .from(readmodelConsumerKeychainKey)
        .where(eq(readmodelConsumerKeychainKey.kid, kid))
        .limit(1);

      return queryResult.length > 0;
    },
    async checkKnodeApiKeychainKeyExists(kid: KeyId) {
      const queryResult = await readmodelDb
        .select({ kid: readmodelKnodeApiKeychainKey.kid })
        .from(readmodelKnodeApiKeychainKey)
        .where(eq(readmodelKnodeApiKeychainKey.kid, kid))
        .limit(1);

      return queryResult.length > 0;
    },
    async checkProducerKeychainKeyExists(kid: KeyId) {
      const queryResult = await readmodelDb
        .select({ kid: readmodelProducerKeychainKey.kid })
        .from(readmodelProducerKeychainKey)
        .where(eq(readmodelProducerKeychainKey.kid, kid))
        .limit(1);

      return queryResult.length > 0;
    },
    async consumerKeychainWithNameExists({
      name,
      ownerId,
    }: {
      name: LocalizedName;
      ownerId: OrganizationId;
    }): Promise<boolean> {
      const queryResult = await readmodelDb
        .select({ id: readmodelConsumerKeychain.id })
        .from(readmodelConsumerKeychain)
        .where(
          and(
            eq(readmodelConsumerKeychain.ownerId, ownerId),
            ilikeJsonBExact({
              column: readmodelConsumerKeychain.name,
              value: name.en,
            }),
          ),
        )
        .limit(1);

      return queryResult.length > 0;
    },
    async getConsumerKeychainById(consumerKeychainId: ConsumerKeychainId) {
      return await consumerKeychainReadmodelService.getConsumerKeychainById(
        consumerKeychainId,
      );
    },
    async getConsumerKeychainKeys(
      consumerKeychainId: ConsumerKeychainId,
      params: API_GetConsumerKeychainKeysQueryParams,
    ): Promise<ListResult<KeychainKey>> {
      const { limit, offset } = params;

      return await readmodelDb.transaction(async (tx) => {
        const createFilterQuery = () =>
          tx
            .select({ kid: readmodelConsumerKeychainKey.kid })
            .from(readmodelConsumerKeychainKey)
            .where(
              eq(
                readmodelConsumerKeychainKey.consumerKeychainId,
                consumerKeychainId,
              ),
            )
            .$dynamic();

        const [queryRes, totalCount] = await Promise.all([
          tx
            .select()
            .from(readmodelConsumerKeychainKey)
            .where(
              eq(
                readmodelConsumerKeychainKey.consumerKeychainId,
                consumerKeychainId,
              ),
            )
            .orderBy(desc(readmodelConsumerKeychainKey.createdAt))
            .limit(limit)
            .offset(offset),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        return {
          results: queryRes.map(toKeychainKey),
          totalCount,
        };
      });
    },
    async getConsumerKeychainPurpose(
      consumerKeychainPurpose: Omit<ConsumerKeychainPurpose, "linkedAt">,
    ) {
      return await consumerKeychainReadmodelService.getConsumerKeychainPurposeByFilter(
        and(
          eq(
            readmodelConsumerKeychainPurpose.consumerKeychainId,
            consumerKeychainPurpose.consumerKeychainId,
          ),
          eq(
            readmodelConsumerKeychainPurpose.purposeId,
            consumerKeychainPurpose.purpose.id,
          ),
          eq(
            readmodelConsumerKeychainPurpose.producerKnodeId,
            consumerKeychainPurpose.purpose.knodeId,
          ),
        ),
      );
    },
    async getConsumerKeychainPurposes(
      consumerKeychainId: ConsumerKeychainId,
      params: API_GetConsumerKeychainPurposesQueryParams,
    ): Promise<ListResult<ConsumerKeychainPurpose>> {
      const { limit, offset } = params;

      return await readmodelDb.transaction(async (tx) => {
        const orderByFilters = createOrderByFilters({
          sortBy: "linkedAt",
          sortOrder: "desc",
          table: readmodelConsumerKeychainPurpose,
        });

        const createFilterQuery = () =>
          tx
            .select()
            .from(readmodelConsumerKeychainPurpose)
            .where(
              eq(
                readmodelConsumerKeychainPurpose.consumerKeychainId,
                consumerKeychainId,
              ),
            )
            .$dynamic();

        const [queryRes, totalCount] = await Promise.all([
          createFilterQuery()
            .orderBy(...orderByFilters)
            .limit(limit)
            .offset(offset),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        const consumerKeychainPurposes = queryRes.map(
          toConsumerKeychainPurpose,
        );

        return {
          results: consumerKeychainPurposes.map((e) => e.data),
          totalCount,
        };
      });
    },
    async getConsumerKeychains(
      params: API_GetConsumerKeychainsQueryParams,
    ): Promise<ListResult<FlatConsumerKeychain>> {
      const { knodeId, limit, name, offset, ownerId, purposeId } = params;

      return await readmodelDb.transaction(async (tx) => {
        const orderByFilters = createOrderByFilters({
          sortBy: "updatedAt",
          sortOrder: "desc",
          table: readmodelConsumerKeychain,
        });

        const createFilterQuery = () =>
          tx
            .select({ keychainId: readmodelConsumerKeychain.id })
            .from(readmodelConsumerKeychain)
            .where(
              and(
                name
                  ? ilikeJsonB({
                      column: readmodelConsumerKeychain.name,
                      value: name,
                    })
                  : undefined,
                ownerId
                  ? eq(readmodelConsumerKeychain.ownerId, ownerId)
                  : undefined,
                purposeId && knodeId
                  ? exists(
                      tx
                        .select()
                        .from(readmodelConsumerKeychainPurpose)
                        .where(
                          and(
                            eq(
                              readmodelConsumerKeychainPurpose.consumerKeychainId,
                              readmodelConsumerKeychain.id,
                            ),
                            eq(
                              readmodelConsumerKeychainPurpose.purposeId,
                              purposeId,
                            ),
                            eq(
                              readmodelConsumerKeychainPurpose.producerKnodeId,
                              knodeId,
                            ),
                          ),
                        ),
                    )
                  : undefined,
              ),
            )
            .$dynamic();

        const paginatedIds = createFilterQuery()
          .orderBy(...orderByFilters)
          .limit(limit)
          .offset(offset)
          .as("paginatedIds");

        const [queryRes, totalCount] = await Promise.all([
          tx
            .select({
              consumerKeychain: readmodelConsumerKeychain,
            })
            .from(readmodelConsumerKeychain)
            .innerJoin(
              paginatedIds,
              eq(readmodelConsumerKeychain.id, paginatedIds.keychainId),
            )
            .orderBy(...orderByFilters),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        const keychains = aggregateFlatConsumerKeychains(queryRes);

        return {
          results: keychains.map((e) => e.data),
          totalCount,
        };
      });
    },
    async getEserviceById(eserviceId: EserviceId) {
      return await eserviceReadmodelService.getEserviceById(eserviceId);
    },
    async getFlatConsumerKeychainById(consumerKeychainId: ConsumerKeychainId) {
      return await consumerKeychainReadmodelService.getFlatConsumerKeychainById(
        consumerKeychainId,
      );
    },
    async getFlatKnodeApiKeychainById(knodeApiKeychainId: KnodeApiKeychainId) {
      return await knodeApiKeychainReadmodelService.getFlatKnodeApiKeychainById(
        knodeApiKeychainId,
      );
    },
    async getFlatProducerKeychainById(producerKeychainId: ProducerKeychainId) {
      return await producerKeychainReadmodelService.getFlatProducerKeychainById(
        producerKeychainId,
      );
    },
    async getKnodeApiKeychainById(knodeApiKeychainId: KnodeApiKeychainId) {
      return await knodeApiKeychainReadmodelService.getKnodeApiKeychainById(
        knodeApiKeychainId,
      );
    },
    async getKnodeApiKeychainKeys(
      knodeApiKeychainId: KnodeApiKeychainId,
      params: API_GetKnodeApiKeychainKeysQueryParams,
    ): Promise<ListResult<KeychainKey>> {
      const { limit, offset } = params;

      return await readmodelDb.transaction(async (tx) => {
        const createFilterQuery = () =>
          tx
            .select({ kid: readmodelKnodeApiKeychainKey.kid })
            .from(readmodelKnodeApiKeychainKey)
            .where(
              eq(
                readmodelKnodeApiKeychainKey.knodeApiKeychainId,
                knodeApiKeychainId,
              ),
            )
            .$dynamic();

        const [queryRes, totalCount] = await Promise.all([
          tx
            .select()
            .from(readmodelKnodeApiKeychainKey)
            .where(
              eq(
                readmodelKnodeApiKeychainKey.knodeApiKeychainId,
                knodeApiKeychainId,
              ),
            )
            .orderBy(desc(readmodelKnodeApiKeychainKey.createdAt))
            .limit(limit)
            .offset(offset),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        return {
          results: queryRes.map(toKeychainKey),
          totalCount,
        };
      });
    },
    async getKnodeApiKeychains(
      params: API_GetKnodeApiKeychainsQueryParams,
    ): Promise<ListResult<FlatKnodeApiKeychain>> {
      const { limit, name, offset, ownerId } = params;

      return await readmodelDb.transaction(async (tx) => {
        const orderByFilters = createOrderByFilters({
          sortBy: "updatedAt",
          sortOrder: "desc",
          table: readmodelKnodeApiKeychain,
        });

        const createFilterQuery = () =>
          tx
            .select({ keychainId: readmodelKnodeApiKeychain.id })
            .from(readmodelKnodeApiKeychain)
            .where(
              and(
                name
                  ? ilikeJsonB({
                      column: readmodelKnodeApiKeychain.name,
                      value: name,
                    })
                  : undefined,
                ownerId
                  ? eq(readmodelKnodeApiKeychain.ownerId, ownerId)
                  : undefined,
              ),
            )
            .$dynamic();

        const paginatedIds = createFilterQuery()
          .orderBy(...orderByFilters)
          .limit(limit)
          .offset(offset)
          .as("paginatedIds");

        const [queryRes, totalCount] = await Promise.all([
          tx
            .select({
              knodeApiKeychain: readmodelKnodeApiKeychain,
            })
            .from(readmodelKnodeApiKeychain)
            .innerJoin(
              paginatedIds,
              eq(readmodelKnodeApiKeychain.id, paginatedIds.keychainId),
            )
            .orderBy(...orderByFilters),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        const keychains = aggregateFlatKnodeApiKeychains(queryRes);

        return {
          results: keychains.map((e) => e.data),
          totalCount,
        };
      });
    },
    async getProducerKeyByKid(kid: KeyId) {
      return await producerKeychainReadmodelService.getProducerKeyByKid(kid);
    },
    async getProducerKeychainById(producerKeychainId: ProducerKeychainId) {
      return await producerKeychainReadmodelService.getProducerKeychainById(
        producerKeychainId,
      );
    },
    async getProducerKeychainEservice(
      producerKeychainEservice: Omit<ProducerKeychainEservice, "linkedAt">,
    ) {
      return await producerKeychainReadmodelService.getProducerKeychainEserviceByFilter(
        and(
          eq(
            readmodelProducerKeychainEservice.producerKeychainId,
            producerKeychainEservice.producerKeychainId,
          ),
          eq(
            readmodelProducerKeychainEservice.eserviceId,
            producerKeychainEservice.eserviceId,
          ),
        ),
      );
    },
    async getProducerKeychainEservices(
      producerKeychainId: ProducerKeychainId,
      params: API_GetProducerKeychainEservicesQueryParams,
    ): Promise<ListResult<ProducerKeychainEservice>> {
      const { limit, offset } = params;

      return await readmodelDb.transaction(async (tx) => {
        const orderByFilters = createOrderByFilters({
          sortBy: "linkedAt",
          sortOrder: "desc",
          table: readmodelProducerKeychainEservice,
        });

        const createFilterQuery = () =>
          tx
            .select()
            .from(readmodelProducerKeychainEservice)
            .where(
              eq(
                readmodelProducerKeychainEservice.producerKeychainId,
                producerKeychainId,
              ),
            )
            .$dynamic();

        const [queryRes, totalCount] = await Promise.all([
          createFilterQuery()
            .orderBy(...orderByFilters)
            .limit(limit)
            .offset(offset),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        const producerKeychainEservices = queryRes.map(
          toProducerKeychainEservice,
        );

        return {
          results: producerKeychainEservices.map((e) => e.data),
          totalCount,
        };
      });
    },
    async getProducerKeychainKeys(
      producerKeychainId: ProducerKeychainId,
      params: API_GetProducerKeychainKeysQueryParams,
    ): Promise<ListResult<KeychainKey>> {
      const { limit, offset } = params;

      return await readmodelDb.transaction(async (tx) => {
        const createFilterQuery = () =>
          tx
            .select({ kid: readmodelProducerKeychainKey.kid })
            .from(readmodelProducerKeychainKey)
            .where(
              eq(
                readmodelProducerKeychainKey.producerKeychainId,
                producerKeychainId,
              ),
            )
            .$dynamic();

        const [queryRes, totalCount] = await Promise.all([
          tx
            .select()
            .from(readmodelProducerKeychainKey)
            .where(
              eq(
                readmodelProducerKeychainKey.producerKeychainId,
                producerKeychainId,
              ),
            )
            .orderBy(desc(readmodelProducerKeychainKey.createdAt))
            .limit(limit)
            .offset(offset),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        return {
          results: queryRes.map(toKeychainKey),
          totalCount,
        };
      });
    },
    async getProducerKeychains(
      params: API_GetProducerKeychainsQueryParams,
    ): Promise<ListResult<FlatProducerKeychain>> {
      const { eserviceId, limit, name, offset, ownerId } = params;

      return await readmodelDb.transaction(async (tx) => {
        const orderByFilters = createOrderByFilters({
          sortBy: "updatedAt",
          sortOrder: "desc",
          table: readmodelProducerKeychain,
        });

        const createFilterQuery = () =>
          tx
            .select({ keychainId: readmodelProducerKeychain.id })
            .from(readmodelProducerKeychain)
            .where(
              and(
                name
                  ? ilikeJsonB({
                      column: readmodelProducerKeychain.name,
                      value: name,
                    })
                  : undefined,
                ownerId
                  ? eq(readmodelProducerKeychain.ownerId, ownerId)
                  : undefined,
                eserviceId
                  ? exists(
                      tx
                        .select()
                        .from(readmodelProducerKeychainEservice)
                        .where(
                          and(
                            eq(
                              readmodelProducerKeychainEservice.producerKeychainId,
                              readmodelProducerKeychain.id,
                            ),
                            eq(
                              readmodelProducerKeychainEservice.eserviceId,
                              eserviceId,
                            ),
                          ),
                        ),
                    )
                  : undefined,
              ),
            )
            .$dynamic();

        const paginatedIds = createFilterQuery()
          .orderBy(...orderByFilters)
          .limit(limit)
          .offset(offset)
          .as("paginatedIds");

        const [queryRes, totalCount] = await Promise.all([
          tx
            .select({
              producerKeychain: readmodelProducerKeychain,
            })
            .from(readmodelProducerKeychain)
            .innerJoin(
              paginatedIds,
              eq(readmodelProducerKeychain.id, paginatedIds.keychainId),
            )
            .orderBy(...orderByFilters),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        const keychains = aggregateFlatProducerKeychains(queryRes);

        return {
          results: keychains.map((e) => e.data),
          totalCount,
        };
      });
    },
    async knodeApiKeychainWithNameExists({
      name,
      ownerId,
    }: {
      name: LocalizedName;
      ownerId: OrganizationId;
    }): Promise<boolean> {
      const queryResult = await readmodelDb
        .select({ id: readmodelKnodeApiKeychain.id })
        .from(readmodelKnodeApiKeychain)
        .where(
          and(
            eq(readmodelKnodeApiKeychain.ownerId, ownerId),
            ilikeJsonBExact({
              column: readmodelKnodeApiKeychain.name,
              value: name.en,
            }),
          ),
        )
        .limit(1);

      return queryResult.length > 0;
    },
    async producerKeychainWithNameExists({
      name,
      ownerId,
    }: {
      name: LocalizedName;
      ownerId: OrganizationId;
    }): Promise<boolean> {
      const queryResult = await readmodelDb
        .select({ id: readmodelProducerKeychain.id })
        .from(readmodelProducerKeychain)
        .where(
          and(
            eq(readmodelProducerKeychain.ownerId, ownerId),
            ilikeJsonBExact({
              column: readmodelProducerKeychain.name,
              value: name.en,
            }),
          ),
        )
        .limit(1);

      return queryResult.length > 0;
    },
  };
}
