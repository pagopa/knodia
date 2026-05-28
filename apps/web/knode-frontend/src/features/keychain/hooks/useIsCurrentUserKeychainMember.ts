import {
  type ConsumerKeychainId,
  type KnodeApiKeychainId,
  type ProducerKeychainId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import { useQuery } from "@tanstack/react-query";
import { match } from "ts-pattern";

import { useAuth } from "@/contexts/auth";

import type { SupportedKeychain } from "../models/commons";

import {
  consumerKeychainMembershipQuery,
  knodeApiKeychainMembershipQuery,
  producerKeychainMembershipQuery,
} from "../services/queries";

export function useIsCurrentUserKeychainMember(keychain: SupportedKeychain) {
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

  const producerQuery = useQuery({
    ...producerKeychainMembershipQuery(
      keychain.keychainId as ProducerKeychainId,
      safeUserId,
    ),
    enabled: keychain.type === "production" && Boolean(userId),
    initialData: { isMember: false },
  });

  if (!userId) return false;

  return match(keychain.type)
    .with("consumption", () => consumerQuery.data.isMember)
    .with("api", () => apiQuery.data.isMember)
    .with("production", () => producerQuery.data.isMember)
    .exhaustive();
}
