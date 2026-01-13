import { z } from "zod";

const API_Pagination = z
  .strictObject({
    limit: z.number().min(1).max(50),
    offset: z.number().min(0),
    total: z.number().min(0),
  })
  .meta({ id: "Pagination" });
type API_Pagination = z.infer<typeof API_Pagination>;

export const API_EservicesQueryParams = z.strictObject({
  limit: z.coerce
    .number()
    .min(1)
    .max(50)
    .describe("Maximum number of items returned"),
  offset: z.coerce.number().min(0).describe("Pagination starting position"),
});
export type API_EservicesQueryParams = z.infer<typeof API_EservicesQueryParams>;

const API_Eservice = z
  .strictObject({
    id: z.string(),
  })
  .meta({ id: "Eservice" });
type API_Eservice = z.infer<typeof API_Eservice>;

export const API_Eservices = z
  .strictObject({
    items: z.array(API_Eservice),
    pagination: API_Pagination,
  })
  .meta({ id: "Eservices" });
export type API_Eservices = z.infer<typeof API_Eservices>;
