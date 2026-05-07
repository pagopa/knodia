import { UserRole } from "@knodia/common-models/auth";
import { UserId } from "@knodia/common-models/ids";
import { CommaSeparatedArray } from "@knodia/common-models/types";
import z from "zod";

export const IdmUser = z.object({
  email: z.string(),
  id: UserId,
  roles: CommaSeparatedArray(UserRole).refine((roles) => roles.length > 0, {
    message: "User must have at least one role",
  }),
  username: z.string(),
});

export type IdmUser = z.infer<typeof IdmUser>;
