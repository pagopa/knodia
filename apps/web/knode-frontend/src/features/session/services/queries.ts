import { getSessionOrganizationOptions } from "@knodia/bff-client/tanstack-query";

import { client } from "@/libs/axios";

export const sessionOrganizationQuery = () => ({
  ...getSessionOrganizationOptions({ client }),
  staleTime: Infinity,
});
