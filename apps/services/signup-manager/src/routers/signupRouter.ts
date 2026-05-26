import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import type { SignupService } from "../services/signupService.ts";

interface SignupRouterOptions {
  signupService: SignupService;
}

export const signupRouter: FastifyPluginAsyncZod<
  SignupRouterOptions
> = async () => {
  /* empty */
};
