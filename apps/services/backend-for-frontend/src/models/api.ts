import { z } from "zod";

// TODO: same as eservice-process - maybe move to a shared location

const API_Pagination = z
  .strictObject({
    limit: z.number().min(1).max(50).meta({ format: "int32" }),
    offset: z.number().min(0).meta({ format: "int32" }),
    total: z.number().min(0).meta({ format: "int32" }),
  })
  .meta({ id: "Pagination" });
type API_Pagination = z.infer<typeof API_Pagination>;

export const API_EservicesQueryParams = z.strictObject({
  limit: z.coerce.number().min(1).max(50).meta({
    description: "Maximum number of items returned",
    format: "int32",
  }),
  offset: z.coerce.number().min(0).meta({
    description: "Pagination starting position",
    format: "int32",
  }),
});
export type API_EservicesQueryParams = z.infer<typeof API_EservicesQueryParams>;

export const API_Eservice = z
  .strictObject({
    id: z.string(),
  })
  .meta({ id: "Eservice" });
export type API_Eservice = z.infer<typeof API_Eservice>;

export const API_Eservices = z
  .strictObject({
    items: z.array(API_Eservice),
    pagination: API_Pagination,
  })
  .meta({ id: "Eservices" });
export type API_Eservices = z.infer<typeof API_Eservices>;
