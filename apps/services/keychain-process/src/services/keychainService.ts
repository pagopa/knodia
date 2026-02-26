import type { KeychainEventStoreWriter } from "@knodia/db-event-store-writer/keychain";
import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type { Keychain } from "@knodia/keychain-models";

import { type RequestContextData } from "@fastify/request-context";

import type { API_GetKeychainsQueryParams } from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

export type KeychainService = ReturnType<typeof keychainServiceBuilder>;

export function keychainServiceBuilder(
  _eventStoreWriter: KeychainEventStoreWriter,
  readmodelService: ReadmodelService,
) {
  return {
    async getKeychains(
      params: API_GetKeychainsQueryParams,
      { logger }: RequestContextData,
    ): Promise<ListResult<Keychain>> {
      logger.info({ params }, "Getting Keychains with params");

      return await readmodelService.getKeychains(params);
    },
  };
}
