import { z } from "zod";

export const CognitoIdmClientConfig = z
  .object({
    COGNITO_USER_POOL_ID: z.string().min(1),
  })
  .transform((c) => ({
    cognitoUserPoolId: c.COGNITO_USER_POOL_ID,
  }));
export type CognitoIdmClientConfig = z.infer<typeof CognitoIdmClientConfig>;
