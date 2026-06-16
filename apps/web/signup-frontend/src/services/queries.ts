import { getCurrentSignupUserOptions } from "@knodia/signup-manager-client/tanstack-query";

import { client } from "@/libs/axios";

export const getCurrentSignupUserQuery = () =>
  getCurrentSignupUserOptions({
    client,
  });
