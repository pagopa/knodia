import type { EserviceId, KnodeId, PurposeId } from "@knodia/common-models/ids";

import {
  getConsumerPurposeDetailsOptions,
  getConsumerPurposesOptions,
  getProducerPurposeDetailsOptions,
  getProducerPurposesOptions,
} from "@knodia/bff-client/tanstack-query";

import { client } from "@/libs/axios";

const PURPOSES_PAGE_LIMIT = 9;
const PURPOSES_PER_ESERVICE_LIMIT = 50;

export const consumerPurposeDetailsQuery = (
  purposeId: PurposeId,
  knodeId: KnodeId,
) =>
  getConsumerPurposeDetailsOptions({
    client,
    path: { purposeId },
    query: { knodeId },
  });

export const producerPurposeDetailsQuery = (purposeId: PurposeId) =>
  getProducerPurposeDetailsOptions({ client, path: { purposeId } });

export const consumerPurposesQuery = (offset: number) =>
  getConsumerPurposesOptions({
    client,
    query: { limit: PURPOSES_PAGE_LIMIT, offset },
  });

// TODO: replace hardcoded limit with pagination when the number of purposes per e-service grows
export const consumerPurposesByEserviceQuery = (eserviceId: EserviceId) =>
  getConsumerPurposesOptions({
    client,
    query: { eserviceId, limit: PURPOSES_PER_ESERVICE_LIMIT, offset: 0 },
  });

export const producerPurposesQuery = (offset: number) =>
  getProducerPurposesOptions({
    client,
    query: { limit: PURPOSES_PAGE_LIMIT, offset },
  });
