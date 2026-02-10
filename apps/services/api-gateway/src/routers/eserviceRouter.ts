import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import type { EserviceProcessClient } from "../clients/clientsProvider.ts";

interface EserviceRouterOptions {
  eserviceProcessClient: EserviceProcessClient;
}

export const eserviceRouter: FastifyPluginAsyncZod<
  EserviceRouterOptions
> = async (fastify, { eserviceProcessClient }) => {
  fastify;
};
