import type { KnodeId } from "@knodia/common-models/ids";

import { Avatar, type AvatarProps } from "@knodia/ui-kit/ui";

import { getInitials } from "@/utils/getInitials";

type KnodeAvatarProps = Omit<AvatarProps, "fallback"> & {
  knodeId: KnodeId;
};

export function KnodeAvatar({ knodeId, ...props }: KnodeAvatarProps) {
  return <Avatar fallback={getInitials(`${knodeId} Knode`)} {...props} />;
}
