import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import fastifyPlugin from "fastify-plugin";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

import {
  zodToJsonSchemaTransform,
  zodToJsonSchemaTransformObjectWithoutInputSchemas,
} from "./zodToJsonSchema.ts";

type OpenapiZodPluginOptions = fastifySwagger.FastifyDynamicSwaggerOptions & {
  openapiDocs: false | fastifySwaggerUI.FastifySwaggerUiOptions;
};

const OPENAPI_VERSION = "3.1.2";
export default fastifyPlugin<OpenapiZodPluginOptions>(
  // Use fastify-plugin so the .swagger and .swaggerUI decorators setup here
  // bubble up to the fastify instance where this plugin is registered.
  async (fastify, opts) => {
    const { openapiDocs, ...swaggerOptions } = opts;

    // Set Zod validator and serializer compilers
    fastify.setValidatorCompiler(validatorCompiler);
    fastify.setSerializerCompiler(serializerCompiler);

    // Register fastify-swagger with OpenAPI spec generation
    fastify.register(fastifySwagger, {
      ...swaggerOptions,
      openapi: {
        ...swaggerOptions.openapi,
        openapi: OPENAPI_VERSION,
      },
      transform: zodToJsonSchemaTransform,
      transformObject: zodToJsonSchemaTransformObjectWithoutInputSchemas,
    } satisfies fastifySwagger.FastifyDynamicSwaggerOptions);

    // Optionally register fastify-swagger-ui to serve the OpenAPI docs
    if (openapiDocs !== false) {
      fastify.register(fastifySwaggerUI, openapiDocs);
    }
  },
);
