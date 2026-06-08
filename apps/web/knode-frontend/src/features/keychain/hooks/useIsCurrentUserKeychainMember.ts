import {
  type ConsumerKeychainId,
  type KnodeApiKeychainId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import { useQuery } from "@tanstack/react-query";
import { match } from "ts-pattern";

import { useAuth } from "@/contexts/auth";

import type { KeychainWithKeyMemberOps } from "../models/commons";

import {
  consumerKeychainMembershipQuery,
  knodeApiKeychainMembershipQuery,
} from "../services/queries";

export function useIsCurrentUserKeychainMember(
  keychain: KeychainWithKeyMemberOps,
) {
  const { userId } = useAuth();
  const safeUserId = userId ?? unsafeBrandUserId("");

  const consumerQuery = useQuery({
    ...consumerKeychainMembershipQuery(
      keychain.keychainId as ConsumerKeychainId,
      safeUserId,
    ),
    enabled: keychain.type === "consumption" && Boolean(userId),
    initialData: { isMember: false },
  });

  const apiQuery = useQuery({
    ...knodeApiKeychainMembershipQuery(
      keychain.keychainId as KnodeApiKeychainId,
      safeUserId,
    ),
    enabled: keychain.type === "api" && Boolean(userId),
    initialData: { isMember: false },
  });

  if (!userId) return false;

  return match(keychain.type)
    .with("consumption", () => consumerQuery.data.isMember)
    .with("api", () => apiQuery.data.isMember)
    .exhaustive();
}
