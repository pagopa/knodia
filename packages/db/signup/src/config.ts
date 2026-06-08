import { env } from "node:process";
import { z } from "zod";

export const SignupDbConfig = z
  .object({
    SIGNUP_DB_HOST: z.string(),
    SIGNUP_DB_NAME: z.string(),
    SIGNUP_DB_PASSWORD: z.string(),
    SIGNUP_DB_PORT: z.coerce.number().int().min(1024).max(65535),
    SIGNUP_DB_SCHEMA: z.string(),
    SIGNUP_DB_USE_SSL: z.stringbool(),
    SIGNUP_DB_USER: z.string(),
  })
  .transform((c) => ({
    signupDbHost: c.SIGNUP_DB_HOST,
    signupDbName: c.SIGNUP_DB_NAME,
    signupDbPassword: c.SIGNUP_DB_PASSWORD,
    signupDbPort: c.SIGNUP_DB_PORT,
    signupDbSchema: c.SIGNUP_DB_SCHEMA,
    signupDbUser: c.SIGNUP_DB_USER,
    signupDbUseSsl: c.SIGNUP_DB_USE_SSL,
  }));
export type SignupDbConfig = z.infer<typeof SignupDbConfig>;

export const signupDbConfig: SignupDbConfig = SignupDbConfig.parse(env);
