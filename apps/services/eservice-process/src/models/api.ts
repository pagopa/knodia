import { z } from "zod";

const API_Offset = z.coerce.number().min(0);
const API_Limit = z.coerce.number().min(1).max(50);
export const API_Pagination = z.object({
  total: z.number().min(0),
  offset: API_Offset,
  limit: API_Limit,
});
export type API_Pagination = z.infer<typeof API_Pagination>;

export const API_EServicesQueryParams = z.object({
  offset: API_Offset,
  limit: API_Limit,
});
export type API_EServicesQueryParams = z.infer<typeof API_EServicesQueryParams>;

export const API_EService = z.object({
  id: z.string(),
});
export type API_EService = z.infer<typeof API_EService>;

export const API_EServices = z.object({
  items: z.array(API_EService),
  pagination: API_Pagination,
});
export type API_EServices = z.infer<typeof API_EServices>;
