import { getConsumerKeychainsOptions } from "@knodia/bff-client/tanstack-query";

import { client } from "@/libs/axios";

export const consumerKeychainsQuery = (offset: number) =>
  getConsumerKeychainsOptions({
    client,
    query: { limit: 10, offset },
  });
