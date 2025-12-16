import { z } from "zod";

export const API_Pagination = z
  .strictObject({
    total: z.number().min(0),
    offset: z.number().min(0),
    limit: z.number().min(1).max(50),
  })
  .meta({ id: "Pagination" });
export type API_Pagination = z.infer<typeof API_Pagination>;

export const API_EServicesQueryParams = z.strictObject({
  offset: z.coerce.number().min(0).describe("Pagination starting position"),
  limit: z.coerce
    .number()
    .min(1)
    .max(50)
    .describe("Maximum number of items returned"),
});
export type API_EServicesQueryParams = z.infer<typeof API_EServicesQueryParams>;

export const API_EService = z
  .strictObject({
    id: z.string(),
  })
  .meta({ id: "EService" });
export type API_EService = z.infer<typeof API_EService>;

export const API_EServices = z
  .strictObject({
    items: z.array(API_EService),
    pagination: API_Pagination,
  })
  .meta({ id: "EServices" });
export type API_EServices = z.infer<typeof API_EServices>;
