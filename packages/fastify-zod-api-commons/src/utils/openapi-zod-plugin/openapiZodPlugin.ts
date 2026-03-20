import type { OpenAPIV3 } from "openapi-types";

import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import fastifyPlugin from "fastify-plugin";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

import { OPENAPI_VERSION } from "./constants.ts";
import { zodToJsonSchemaTransform } from "./zodToJsonSchemaTransform.ts";
import { zodToJsonSchemaTransformObject } from "./zodToJsonSchemaTransformObject.ts";

export const docsRoutePrefix = "/docs";

export type OpenapiZodPluginOptions =
  fastifySwagger.FastifyDynamicSwaggerOptions & {
    openapiDocs?: false | fastifySwaggerUI.FastifySwaggerUiOptions;
  };

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
        info: {
          ...defaultContactAndTos,
          ...swaggerOptions.openapi?.info,
        } as OpenAPIV3.InfoObject,
        openapi: OPENAPI_VERSION,
      },
      transform: zodToJsonSchemaTransform,
      transformObject: zodToJsonSchemaTransformObject,
    } satisfies fastifySwagger.FastifyDynamicSwaggerOptions);

    // Optionally register fastify-swagger-ui to serve the OpenAPI docs
    if (openapiDocs !== false) {
      fastify.register(
        fastifySwaggerUI,
        openapiDocs ?? {
          routePrefix: docsRoutePrefix,
        },
      );
    }
  },
);

const defaultContactAndTos: Pick<
  OpenAPIV3.InfoObject,
  "contact" | "termsOfService"
> = {
  contact: {
    url: "https://github.com/pagopa/knodia/issues",
  },
  termsOfService: "https://knodia.org/",
};
