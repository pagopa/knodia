import type { UserRole } from "@knodia/common-models/auth";
import type { UserId } from "@knodia/common-models/ids";

export interface IdmUser {
  email: string;
  id: UserId;
  roles: UserRole[];
  username: string;
}
