import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { eserviceRoutes } from "./routers/eserviceRouter.ts";

const app = Fastify({
  logger: true, // TODO configure logger - winston? pino?
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(eserviceRoutes);

export default app;
