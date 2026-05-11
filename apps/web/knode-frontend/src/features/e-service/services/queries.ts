import type { KnodeId } from "@knodia/common-models/ids";

import { API_AgreementState } from "@knodia/agreement-models/api";
import { bffApi } from "@knodia/bff-client";
import {
  getConsumerEserviceDetailsOptions,
  getConsumerEservicesOptions,
  getProducerEserviceDetailsOptions,
  getProducerEservicesOptions,
} from "@knodia/bff-client/tanstack-query";
import { queryOptions } from "@tanstack/react-query";

import type { ConsumptionEserviceListParams } from "@/features/e-service/models/search-params";

import { client } from "@/libs/axios";

const DEFAULT_PAGE_LIMIT = 10;

export const consumerEserviceDetailsQuery = (
  eserviceId: string,
  knodeId: KnodeId,
) =>
  queryOptions({
    ...getConsumerEserviceDetailsOptions({
      client,
      path: { eserviceId },
      query: { knodeId },
    }),
    // Stop window-focus refetches once the agreement leaves the pending state.
    refetchOnWindowFocus: (query) =>
      query.state.data?.agreement?.state ===
      API_AgreementState.enum.PendingConsumerOperatorIdentification,
  });

export const consumerEservicesQuery = (
  offset: number,
  agreementState: ConsumptionEserviceListParams["agreementState"],
) =>
  getConsumerEservicesOptions({
    client,
    query: { agreementState, limit: DEFAULT_PAGE_LIMIT, offset },
  });

export const producerEserviceDetailsQuery = (eserviceId: string) =>
  getProducerEserviceDetailsOptions({
    client,
    path: { eserviceId },
  });

export const producerEservicesQuery = (offset: number) =>
  getProducerEservicesOptions({
    client,
    query: {
      limit: DEFAULT_PAGE_LIMIT,
      offset,
      state: ["Active", "Suspended"],
    },
  });

export const archivedProducerEservicesQuery = (offset: number) =>
  getProducerEservicesOptions({
    client,
    query: {
      limit: DEFAULT_PAGE_LIMIT,
      offset,
      state: ["Archived"],
    },
  });

// TODO(KN-479): replace hardcoded limit with server-side search when the number of producer e-services grows
const ESERVICE_OPTIONS_LIMIT = 50;

export const producerEserviceOptionsQuery = () =>
  getProducerEservicesOptions({
    client,
    query: {
      limit: ESERVICE_OPTIONS_LIMIT,
      offset: 0,
      state: ["Active", "Suspended"],
    },
  });

export const consumerCatalogEservicesQuery = (
  body: bffApi.GetConsumerCatalogEserviceSearchParams,
  offset: number,
) =>
  queryOptions({
    queryFn: async ({ signal }) => {
      const { data } = await bffApi.getConsumerCatalogEservices({
        body,
        client,
        query: { limit: DEFAULT_PAGE_LIMIT, offset },
        signal,
        throwOnError: true,
      });
      return data;
    },
    queryKey: ["getConsumerCatalogEservices", { body, offset }] as const,
  });
