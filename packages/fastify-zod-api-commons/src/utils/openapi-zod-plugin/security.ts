import type { OpenAPIV3 } from "openapi-types";

export const bearerAuthSecurityScheme: Record<
  string,
  OpenAPIV3.SecuritySchemeObject
> = {
  bearerAuth: {
    bearerFormat: "JWT",
    description:
      "A JWT bearer token conforming to the best practices defined in RFC 8725 (https://tools.ietf.org/html/RFC8725)",
    scheme: "bearer",
    type: "http",
  },
};

export const bearerAuthSecurity: OpenAPIV3.SecurityRequirementObject[] = [
  { bearerAuth: [] },
];
