import { bffApi, type GetEservicesData } from "@knodia/bff-client";
import { queryOptions } from "@tanstack/react-query";

import { client } from "@/libs/axios";

export const eserviceQueries = {
  getEServices: (query: GetEservicesData["query"]) =>
    queryOptions({
      queryFn: () =>
        bffApi.getEservices({ client, query }).then((res) => res.data),
      queryKey: ["eservices", query],
    }),
};
