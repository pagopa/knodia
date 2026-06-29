import {
  changeEmailMutation,
  confirmOnboardingMutation,
  deleteUserMutation,
  getCurrentSignupUserOptions,
  resetCredentialsMutation,
  suspendUserMutation,
} from "@knodia/signup-manager-client/tanstack-query";

import { client } from "@/libs/axios";

export const getCurrentSignupUserQuery = () => ({
  ...getCurrentSignupUserOptions({ client }),
  refetchOnWindowFocus: true,
});

export const confirmOnboardingMutationOptions = () =>
  confirmOnboardingMutation({
    client,
  });

export const changeEmailMutationOptions = () =>
  changeEmailMutation({
    client,
  });

export const deleteUserMutationOptions = () =>
  deleteUserMutation({
    client,
  });

export const resetCredentialsMutationOptions = () =>
  resetCredentialsMutation({
    client,
  });

export const suspendUserMutationOptions = () =>
  suspendUserMutation({
    client,
  });
