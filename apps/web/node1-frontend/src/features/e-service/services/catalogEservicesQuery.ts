import type { bffApi } from "@knodia/bff-client";

import { getCatalogEservices } from "@knodia/bff-client";
import { queryOptions } from "@tanstack/react-query";

import type { client } from "@/libs/axios";

interface CatalogEservicesQueryParams {
  body: bffApi.GetCatalogEserviceSearchParams;
  client: typeof client;
  query: { limit: number; offset: number };
}

export const getCatalogEservicesQueryOptions = ({
  body,
  client,
  query,
}: CatalogEservicesQueryParams) =>
  queryOptions({
    queryFn: async ({ signal }) => {
      const { data } = await getCatalogEservices({
        body,
        client,
        query,
        signal,
        throwOnError: true,
      });
      return data;
    },
    queryKey: ["getCatalogEservices", { body, query }] as const,
  });
