import type { KnodeId } from "@knodia/common-models/ids";

import {
  getConsumerEserviceDetailsOptions,
  getConsumerEservicesOptions,
  getProducerEserviceDetailsOptions,
  getProducerEservicesOptions,
} from "@knodia/bff-client/tanstack-query";

import type { ConsumptionEserviceListParams } from "@/features/e-service/models/search-params";

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

export const consumerEservicesQuery = (
  offset: number,
  agreementState: ConsumptionEserviceListParams["agreementState"],
) =>
  getConsumerEservicesOptions({
    client,
    query: { agreementState, limit: 10, offset },
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
