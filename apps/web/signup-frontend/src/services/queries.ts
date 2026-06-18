import {
  changeEmailMutation,
  confirmOnboardingMutation,
  getCurrentSignupUserOptions,
} from "@knodia/signup-manager-client/tanstack-query";

import { client } from "@/libs/axios";

export const getCurrentSignupUserQuery = () =>
  getCurrentSignupUserOptions({
    client,
  });

export const confirmOnboardingMutationOptions = () =>
  confirmOnboardingMutation({
    client,
  });

export const changeEmailMutationOptions = () =>
  changeEmailMutation({
    client,
  });
