import {
  getConsumerKeychainMembershipOptions,
  getKnodeApiKeychainMembershipOptions,
} from "@knodia/bff-client/tanstack-query";
import { useQuery } from "@tanstack/react-query";
import { match } from "ts-pattern";

import { useAuth } from "@/contexts/auth";
import { client } from "@/libs/axios";

import type { SupportedKeychain } from "../models/commons";

export function useIsCurrentUserKeychainMember(keychain: SupportedKeychain) {
  const { userId } = useAuth();

  const options = match(keychain)
    .with({ type: "consumption" }, ({ keychainId }) =>
      getConsumerKeychainMembershipOptions({
        client,
        path: { consumerKeychainId: keychainId, userId: userId ?? "" },
      }),
    )
    .with({ type: "api" }, ({ keychainId }) =>
      getKnodeApiKeychainMembershipOptions({
        client,
        path: { knodeApiKeychainId: keychainId, userId: userId ?? "" },
      }),
    )
    .exhaustive();

  const { data } = useQuery({ ...options, enabled: Boolean(userId) });

  return Boolean(data?.isMember);
}
