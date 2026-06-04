import { getCurrentSignupUserOptions } from "@knodia/signup-manager-client/tanstack-query";

import { client } from "@/libs/axios";

const currentSignupUserCorrelationId = crypto.randomUUID();

export const getCurrentSignupUserQuery = () =>
  getCurrentSignupUserOptions({
    client,
    headers: { "x-correlation-id": currentSignupUserCorrelationId }, // TODO: Remove
  });
