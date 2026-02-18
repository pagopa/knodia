import { serviceName } from "@knodia/fastify-zod-api-commons/models";
import { OpenAPIV3 } from "openapi-types";

export const k2kGatewayTag: OpenAPIV3.TagObject = {
  description: "K2K Gateway routes",
  name: serviceName.K2K_GATEWAY,
};
