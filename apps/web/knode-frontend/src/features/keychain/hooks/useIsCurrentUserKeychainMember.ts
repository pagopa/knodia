import { useSuspenseQuery } from "@tanstack/react-query";
import { match } from "ts-pattern";

import { useAuth } from "@/contexts/auth";

import type { SupportedKeychain } from "../models/commons";

import {
  consumerKeychainMembershipQuery,
  knodeApiKeychainMembershipQuery,
  producerKeychainMembershipQuery,
} from "../services/queries";

export function useIsCurrentUserKeychainMember(keychain: SupportedKeychain) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const userId = useAuth().userId!;

  const queryOpts = match(keychain)
    .with({ type: "consumption" }, ({ keychainId }) =>
      consumerKeychainMembershipQuery(keychainId, userId),
    )
    .with({ type: "api" }, ({ keychainId }) =>
      knodeApiKeychainMembershipQuery(keychainId, userId),
    )
    .with({ type: "production" }, ({ keychainId }) =>
      producerKeychainMembershipQuery(keychainId, userId),
    )
    .exhaustive() as ReturnType<typeof consumerKeychainMembershipQuery>;

  const { data } = useSuspenseQuery(queryOpts);

  return data.isMember;
}
