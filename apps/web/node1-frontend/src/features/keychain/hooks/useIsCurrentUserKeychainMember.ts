import { getCurrentUserConsumerKeychainMembershipOptions } from "@knodia/bff-client/tanstack-query";
import { useQuery } from "@tanstack/react-query";

import { client } from "@/libs/axios";

export function useIsCurrentUserKeychainMember(keychainId: string) {
  const { data: isMember } = useQuery({
    ...getCurrentUserConsumerKeychainMembershipOptions({
      client,
      path: { consumerKeychainId: keychainId },
    }),
    initialData: { isMember: false },
    select: (data) => data.isMember,
  });

  return isMember;
}
