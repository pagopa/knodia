import { getConsumerKeychainMembershipOptions } from "@knodia/bff-client/tanstack-query";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/auth";
import { client } from "@/libs/axios";

export function useIsCurrentUserKeychainMember(keychainId: string) {
  const { userId } = useAuth();

  const { data: isMember } = useQuery({
    ...getConsumerKeychainMembershipOptions({
      client,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      path: { consumerKeychainId: keychainId, userId: userId! },
    }),
    enabled: Boolean(userId),
    initialData: { isMember: false },
    select: (data) => data.isMember,
  });

  return isMember;
}
