import { bffApi } from "@knodia/bff-client";
import { queryOptions, skipToken } from "@tanstack/react-query";

import type { client } from "@/libs/axios";

interface CatalogEservicesQueryParams {
  body: bffApi.GetCatalogEserviceSearchParams | null;
  client: typeof client;
  query: { limit: number; offset: number };
}

export const getCatalogEservicesQueryOptions = ({
  body,
  client,
  query,
}: CatalogEservicesQueryParams) =>
  queryOptions({
    queryFn: body
      ? async ({ signal }) => {
          const { data } = await bffApi.getCatalogEservices({
            body,
            client,
            query,
            signal,
            throwOnError: true,
          });
          return data;
        }
      : skipToken,
    queryKey: ["getCatalogEservices", { body, query }] as const,
  });
