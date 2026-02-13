import z from "zod";

export const API_Pagination = z
  .strictObject({
    limit: z.number().min(1).max(50).meta({ format: "int32" }),
    offset: z.number().min(0).meta({ format: "int32" }),
    total: z.number().min(0).meta({ format: "int32" }),
  })
  .meta({ id: "Pagination" });
export type API_Pagination = z.infer<typeof API_Pagination>;

export const API_PaginationQueryParams = z.strictObject({
  limit: z.coerce
    .number()
    .min(1)
    .max(50)
    .describe("Maximum number of items returned")
    .meta({ format: "int32" }),
  offset: z.coerce
    .number()
    .min(0)
    .describe("Pagination starting position")
    .meta({ format: "int32" }),
});
export type API_PaginationQueryParams = z.infer<
  typeof API_PaginationQueryParams
>;
