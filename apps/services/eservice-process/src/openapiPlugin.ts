import fastifySwagger from "@fastify/swagger";
import fastifyPlugin from "fastify-plugin";
import {
  createJsonSchemaTransform,
  createJsonSchemaTransformObject,
} from "fastify-type-provider-zod";

const openapiVersion = "3.1.2";
const zodToJsonConfigTarget = "draft-2020-12"; // OpenAPI 3.1

const jsonSchemaTransform = createJsonSchemaTransform({
  zodToJsonConfig: {
    target: zodToJsonConfigTarget,
  },
});

const jsonSchemaTransformObject = createJsonSchemaTransformObject({
  zodToJsonConfig: {
    target: zodToJsonConfigTarget,
  },
});

/**
 * Remove all schemas ending with "Input" from the generated OpenAPI spec.
 * This is a workaround, waiting for a proper solution in fastify-type-provider-zod.
 * See: https://github.com/turkerdev/fastify-type-provider-zod/issues/214
 */
const removeZodInputSchemasFromSwagger = (
  openapi: ReturnType<typeof jsonSchemaTransformObject> & {
    components?: { schemas?: Record<string, unknown> };
  }
): ReturnType<typeof jsonSchemaTransformObject> => {
  if (openapi.components && openapi.components.schemas) {
    const inputKeysToDelete = Object.keys(openapi.components.schemas).filter(
      (key) => key.endsWith("Input")
    );
    for (const key of inputKeysToDelete) {
      delete openapi.components.schemas[key];
    }
  }

  return openapi;
};

const jsonSchemaTransformObjectWithoutInputSchemas: typeof jsonSchemaTransformObject =
  (swagger) =>
    removeZodInputSchemasFromSwagger(jsonSchemaTransformObject(swagger));

const openapiPlugin =
  fastifyPlugin<fastifySwagger.FastifyDynamicSwaggerOptions>(
    // Use fastify-plugin so the swagger decorator setup by fastify-swagger
    // is attached to the parent instance (app.swagger()), and can be used
    // to serve/generate the OpenAPI spec.
    async (fastify, opts: fastifySwagger.FastifyDynamicSwaggerOptions) => {
      fastify.register(fastifySwagger, {
        ...opts,
        openapi: {
          ...opts.openapi,
          openapi: openapiVersion,
        },
        transform: jsonSchemaTransform,
        transformObject: jsonSchemaTransformObjectWithoutInputSchemas,
      } satisfies fastifySwagger.FastifyDynamicSwaggerOptions);
    }
  );

export default openapiPlugin;
