import type { KeychainEventStoreWriter } from "@knodia/db-event-store-writer/keychain";
import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { ConsumerKeychain } from "@knodia/keychain-models";

import type { API_GetConsumerKeychainsQueryParams } from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

export type ConsumerKeychainService = ReturnType<
  typeof consumerKeychainServiceBuilder
>;

export function consumerKeychainServiceBuilder(
  _eventStoreWriter: KeychainEventStoreWriter,
  readmodelService: ReadmodelService,
) {
  return {
    async getConsumerKeychains(
      params: API_GetConsumerKeychainsQueryParams,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<ConsumerKeychain>> {
      logger.info({ params }, "Getting Consumer keychains with params");

      return await readmodelService.getConsumerKeychains(params);
    },
  };
}
