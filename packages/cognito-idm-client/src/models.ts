import { UserRole } from "@knodia/common-models/auth";
import { UserId } from "@knodia/common-models/ids";
import { CommaSeparatedList } from "@knodia/common-models/types";
import z from "zod";

export const IdmUser = z.object({
  email: z.string(),
  enabled: z.boolean().optional(),
  id: UserId,
  roles: CommaSeparatedList(UserRole).refine((roles) => roles.length > 0, {
    message: "User must have at least one role",
  }),
  username: z.string(),
});

export type IdmUser = z.infer<typeof IdmUser>;
