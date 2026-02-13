import { serviceName } from "@knodia/fastify-zod-api-commons/models";
import { OpenAPIV3 } from "openapi-types";

export const knodiaApiGatewayTag: OpenAPIV3.TagObject = {
  description: "Knodia API Gateway routes",
  name: serviceName.KNODIA_API_GATEWAY,
};
