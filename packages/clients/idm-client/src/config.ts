import { z } from "zod";

export const IdmClientConfig = z
  .object({
    COGNITO_USER_POOL_ID: z.string().min(1),
  })
  .transform((c) => ({
    cognitoUserPoolId: c.COGNITO_USER_POOL_ID,
  }));
export type IdmClientConfig = z.infer<typeof IdmClientConfig>;
