import type { OpenAPIV3 } from "openapi-types";

export const bearerAuthSecurityScheme: Record<
  string,
  OpenAPIV3.SecuritySchemeObject
> = {
  bearerAuth: {
    bearerFormat: "JWT",
    description:
      "A JWT bearer token conforming to the best practices defined in RFC 8725 (https://www.rfc-editor.org/rfc/rfc8725.html)",
    scheme: "bearer",
    type: "http",
  },
};

export const bearerAuthSecurity: OpenAPIV3.SecurityRequirementObject[] = [
  { bearerAuth: [] },
];

// openapi-types does not model RFC 9449's DPoP auth scheme precisely.
// OpenAPI allows HTTP auth scheme names defined by HTTP authentication specs.
const dpopAuthorizationSecurityScheme: OpenAPIV3.SecuritySchemeObject = {
  description:
    "A DPoP-bound access token conforming to RFC 9449 (https://www.rfc-editor.org/rfc/rfc9449.html)",
  scheme: "DPoP",
  type: "http",
};
const dpopProofSecurityScheme: OpenAPIV3.SecuritySchemeObject = {
  description: "DPoP proof JWT conforming to RFC 9449",
  in: "header",
  name: "DPoP",
  type: "apiKey",
};
export const dpopAuthSecurityScheme: Record<
  string,
  OpenAPIV3.SecuritySchemeObject
> = {
  dpopAuth: dpopAuthorizationSecurityScheme,
  dpopProof: dpopProofSecurityScheme,
};
export const dpopAuthSecurity: OpenAPIV3.SecurityRequirementObject[] = [
  { dpopAuth: [], dpopProof: [] },
];
