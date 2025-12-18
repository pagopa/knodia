import Fastify from "fastify";
import { eserviceRoutes } from "./routers/eserviceRouter.ts";
import openapiZodPlugin from "@knodia/fastify-plugin-openapi-zod";

const app = Fastify({
  logger: true, // TODO configure logger - winston? pino?
});

// openapiPlugin must be registered before any routes to ensure proper route discovery
app.register(openapiZodPlugin, {
  openapi: {
    info: {
      title: "Knodia E-service Process API",
      description: "API for managing Knodia E-services",
      version: "1.0.0",
    },
  },
  openapiDocs: {
    routePrefix: "/docs",
  },
});

app.register(eserviceRoutes);

export default app;
