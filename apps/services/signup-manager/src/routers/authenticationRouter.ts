import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import type { AuthenticationService } from "../services/authenticationService.ts";

interface AuthenticationRouterOptions {
  authenticationService: AuthenticationService;
}

export const authenticationRouter: FastifyPluginAsyncZod<
  AuthenticationRouterOptions
> = async () => {
  /* empty */
};
