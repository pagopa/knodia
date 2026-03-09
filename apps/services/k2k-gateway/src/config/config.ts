import { HTTPServerConfig } from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const K2KGatewayConfig = LoggerConfig.and(HTTPServerConfig).and(
  z
    .object({
      AGREEMENT_PROCESS_URL: z.url(),
      ESERVICE_PROCESS_URL: z.url(),
      INTERNAL_JWT_AUDIENCE: z.string(),
      INTERNAL_JWT_ISSUER: z.string(),
      INTERNAL_JWT_KID: z.string(),
      INTERNAL_JWT_SECONDS_DURATION: z.coerce
        .number()
        .int()
        .positive()
        .default(3600),
      INTERNAL_JWT_SUBJECT: z.string(),
    })
    .transform((c) => ({
      agreementProcessUrl: c.AGREEMENT_PROCESS_URL,
      eserviceProcessUrl: c.ESERVICE_PROCESS_URL,
      internalJwt: {
        audience: c.INTERNAL_JWT_AUDIENCE,
        issuer: c.INTERNAL_JWT_ISSUER,
        kid: c.INTERNAL_JWT_KID,
        secondsDuration: c.INTERNAL_JWT_SECONDS_DURATION,
        subject: c.INTERNAL_JWT_SUBJECT,
      },
    })),
);

export type K2KGatewayConfig = z.infer<typeof K2KGatewayConfig>;

export const config = K2KGatewayConfig.parse(process.env);
