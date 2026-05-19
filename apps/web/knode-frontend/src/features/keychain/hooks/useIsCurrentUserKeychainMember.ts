import type {
  ConsumerKeychainId,
  KnodeApiKeychainId,
} from "@knodia/common-models/ids";

import {
  getConsumerKeychainMembershipOptions,
  getKnodeApiKeychainMembershipOptions,
} from "@knodia/bff-client/tanstack-query";
import { useQuery } from "@tanstack/react-query";
import { match } from "ts-pattern";

import { useAuth } from "@/contexts/auth";
import { client } from "@/libs/axios";

import type { KeychainType } from "../models/commons";

export function useIsCurrentUserKeychainMember(
  keychainId: ConsumerKeychainId | KnodeApiKeychainId,
  type: Extract<KeychainType, "api" | "consumption">,
) {
  const { userId } = useAuth();

  const consumerQuery = useQuery({
    ...getConsumerKeychainMembershipOptions({
      client,
      path: { consumerKeychainId: keychainId, userId: userId ?? "" },
    }),
    enabled: type === "consumption" && Boolean(userId),
    initialData: { isMember: false },
  });

  const apiQuery = useQuery({
    ...getKnodeApiKeychainMembershipOptions({
      client,
      path: { knodeApiKeychainId: keychainId, userId: userId ?? "" },
    }),
    enabled: type === "api" && Boolean(userId),
    initialData: { isMember: false },
  });

  if (!userId) return false;

  return match(type)
    .with("consumption", () => consumerQuery.data.isMember)
    .with("api", () => apiQuery.data.isMember)
    .exhaustive();
}
