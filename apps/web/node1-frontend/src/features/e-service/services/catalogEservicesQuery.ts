import { bffApi } from "@knodia/bff-client";
import { queryOptions } from "@tanstack/react-query";

import type { client } from "@/libs/axios";

interface CatalogEservicesQueryParams {
  body: bffApi.GetConsumerCatalogEserviceSearchParams;
  client: typeof client;
  query: { limit: number; offset: number };
}

export const getConsumerCatalogEservicesQueryOptions = ({
  body,
  client,
  query,
}: CatalogEservicesQueryParams) =>
  queryOptions({
    queryFn: async ({ signal }) => {
      const { data } = await bffApi.getConsumerCatalogEservices({
        body,
        client,
        query,
        signal,
        throwOnError: true,
      });
      return data;
    },
    queryKey: ["getConsumerCatalogEservices", { body, query }] as const,
  });
