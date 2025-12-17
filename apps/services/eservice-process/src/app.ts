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

app.register(openapiPlugin, {
  openapi: {
    info: {
      title: "Knodia E-Service Process API",
      description: "API for managing Knodia E-Services",
      version: "1.0.0",
    },
  },
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(eserviceRoutes);

export default app;
