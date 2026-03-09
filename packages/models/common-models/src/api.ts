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
    .meta({ description: "Maximum number of items returned", format: "int32" }),
  offset: z.coerce
    .number()
    .min(0)
    .meta({ description: "Pagination starting position", format: "int32" }),
});
export type API_PaginationQueryParams = z.infer<
  typeof API_PaginationQueryParams
>;

export const API_FileDownload = z.string().meta({
  description: "Binary file content",
  format: "binary",
  id: "FileDownload",
});

export const API_KnodeId = z
  .enum(["Orion", "Lynx"])
  .meta({ description: "Unique Knode identifier", id: "KnodeId" });

export const API_OrganizationId = z.uuid().meta({
  description: "Unique identifier of the Organization",
  id: "OrganizationId",
});
