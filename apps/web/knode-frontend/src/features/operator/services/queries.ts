import { getOperatorsOptions } from "@knodia/bff-client/tanstack-query";

import { client } from "@/libs/axios";

export const operatorsQuery = () =>
  getOperatorsOptions({
    client,
  });
