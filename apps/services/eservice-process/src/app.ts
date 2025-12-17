import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { eserviceRoutes } from "./routers/eserviceRouter.ts";
import openapiPlugin from "./openapiPlugin.ts";

const app = Fastify({
  logger: true, // TODO configure logger - winston? pino?
});

// openapiPlugin must be registered before any routes to ensure proper route discovery
app.register(openapiPlugin, {
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

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(eserviceRoutes);

export default app;
