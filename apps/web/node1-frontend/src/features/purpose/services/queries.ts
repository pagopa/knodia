import type { PurposeId } from "@knodia/common-models/ids";

import {
  getProducerPurposeDetailsOptions,
  getProducerPurposesOptions,
} from "@knodia/bff-client/tanstack-query";

import { client } from "@/libs/axios";

const PURPOSES_PAGE_LIMIT = 9;

export const producerPurposeDetailsQuery = (purposeId: PurposeId) =>
  getProducerPurposeDetailsOptions({ client, path: { purposeId } });

export const producerPurposesQuery = (offset: number) =>
  getProducerPurposesOptions({
    client,
    query: { limit: PURPOSES_PAGE_LIMIT, offset },
  });
