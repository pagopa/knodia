import Fastify from "fastify";
import {
  createJsonSchemaTransform,
  createJsonSchemaTransformObject,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { eserviceRoutes } from "./routers/eserviceRouter.ts";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";

const app = Fastify({
  logger: true, // TODO configure logger - winston? pino?
});

const jsonSchemaTransform = createJsonSchemaTransform({
  zodToJsonConfig: { target: "draft-2020-12" },
});

const jsonSchemaTransformObject = createJsonSchemaTransformObject({
  zodToJsonConfig: { target: "draft-2020-12" },
});

const jsonSchemaTransformObjectWithoutInputSchemas: typeof jsonSchemaTransformObject =
  (swagger) => {
    const transformed = jsonSchemaTransformObject(swagger);
    const inputKeysToDelete = Object.keys(
      transformed.components.schemas
    ).filter((key) => key.endsWith("Input"));
    for (const key of inputKeysToDelete) {
      delete transformed.components.schemas[key];
    }
    return transformed;
  };

app.register(fastifySwagger, {
  openapi: {
    openapi: "3.1.2",
    info: {
      title: "Knodia E-Service Process API",
      description: "API for managing Knodia E-Services",
      version: "1.0.0",
    },
  },
  transform: jsonSchemaTransform,
  transformObject: jsonSchemaTransformObjectWithoutInputSchemas,
} satisfies fastifySwagger.FastifyDynamicSwaggerOptions);

app.register(fastifySwaggerUI, {
  routePrefix: "/docs",
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(eserviceRoutes);

export default app;
