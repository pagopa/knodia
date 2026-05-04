import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import type { KnodeApiKeychainService } from "../services/knodeApiKeychainService.ts";

interface KnodeApiKeychainRouterOptions {
  knodeApiKeychainService: KnodeApiKeychainService;
}

export const knodeApiKeychainRouter: FastifyPluginAsyncZod<
  KnodeApiKeychainRouterOptions
> = async () => {
  // Routes will be added in subsequent tasks.
};
