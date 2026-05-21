import { getConsumerKeychainMembershipOptions } from "@knodia/bff-client/tanstack-query";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/auth";
import { client } from "@/libs/axios";

export function useIsCurrentUserKeychainMember(keychainId: string) {
  const { userId } = useAuth();

  const { data: isMember } = useSuspenseQuery({
    ...getConsumerKeychainMembershipOptions({
      client,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      path: { consumerKeychainId: keychainId, userId: userId! },
    }),
    select: (data) => data.isMember,
  });

  return isMember;
}
