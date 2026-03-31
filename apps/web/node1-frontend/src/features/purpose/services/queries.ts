import type { PurposeId } from "@knodia/common-models/ids";

import {
  // TODO: rename to getProducerPurposesOptions when endpoint changes to /producer/purposes
  getConsumerPurposesOptions,
  getProducerPurposeDetailsOptions,
} from "@knodia/bff-client/tanstack-query";

import { client } from "@/libs/axios";

const PURPOSES_PAGE_LIMIT = 9;

export const producerPurposeDetailsQuery = (purposeId: PurposeId) =>
  getProducerPurposeDetailsOptions({ client, path: { purposeId } });

export const producerPurposesQuery = (offset: number) =>
  getConsumerPurposesOptions({
    client,
    query: { limit: PURPOSES_PAGE_LIMIT, offset },
  });
