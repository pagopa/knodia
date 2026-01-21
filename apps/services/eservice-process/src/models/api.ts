import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/fastify-zod-api-commons/models";
import { z } from "zod";

export const API_EservicesQueryParams = API_PaginationQueryParams; // TODO extend with filters
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

export const API_EserviceSeed = z
  .strictObject({
    name: z.string().min(4).describe("Name of the E-service"),
  })
  .meta({ id: "EserviceSeed" });
export type API_EserviceSeed = z.infer<typeof API_EserviceSeed>;
