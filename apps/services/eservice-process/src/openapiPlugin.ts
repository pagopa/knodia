import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import fastifyPlugin from "fastify-plugin";
import {
  createJsonSchemaTransform,
  createJsonSchemaTransformObject,
} from "fastify-type-provider-zod";

/*********************
TODO move to a package to be used by all services.
**********************/

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
const removeZodInputSchemasFromOpenapi = (
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
  (openapi) =>
    removeZodInputSchemasFromOpenapi(jsonSchemaTransformObject(openapi));

type OpenapiPluginOptions = fastifySwagger.FastifyDynamicSwaggerOptions & {
  openapiDocs: false | fastifySwaggerUI.FastifySwaggerUiOptions;
};

const openapiVersion = "3.1.2";
const openapiPlugin = fastifyPlugin<OpenapiPluginOptions>(
  // Use fastify-plugin so the swagger decorator setup by fastify-swagger
  // is attached to the parent instance (app.swagger()), and can be used
  // to serve/generate the OpenAPI spec.
  async (fastify, opts) => {
    const { openapiDocs, ...swaggerOptions } = opts;

    fastify.register(fastifySwagger, {
      ...swaggerOptions,
      openapi: {
        ...swaggerOptions.openapi,
        openapi: openapiVersion,
      },
      transform: jsonSchemaTransform,
      transformObject: jsonSchemaTransformObjectWithoutInputSchemas,
    } satisfies fastifySwagger.FastifyDynamicSwaggerOptions);

    if (openapiDocs !== false) {
      fastify.register(fastifySwaggerUI, openapiDocs);
    }
  }
);

export default openapiPlugin;
