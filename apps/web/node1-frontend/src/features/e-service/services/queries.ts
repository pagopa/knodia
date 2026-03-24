import type { KnodeId } from "@knodia/common-models/ids";

import {
  getConsumerEserviceDetailsOptions,
  getProducerEserviceDetailsOptions,
  getProducerEservicesOptions,
} from "@knodia/bff-client/tanstack-query";

import { client } from "@/libs/axios";

export const consumerEserviceDetailsQuery = (
  eserviceId: string,
  knodeId: KnodeId,
) =>
  getConsumerEserviceDetailsOptions({
    client,
    path: { eserviceId },
    query: { knodeId },
  });

export const producerEserviceDetailsQuery = (eserviceId: string) =>
  getProducerEserviceDetailsOptions({
    client,
    path: { eserviceId },
  });

export const producerEservicesQuery = (offset: number) =>
  getProducerEservicesOptions({
    client,
    query: { limit: 10, offset },
  });
