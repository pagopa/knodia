import z from "zod";

export const API_TestResponse = z
  .strictObject({
    status: z.literal("ok"),
  })
  .meta({
    description:
      "Static success response returned when the access token is valid",
    id: "TestResponse",
  });
export type API_TestResponse = z.infer<typeof API_TestResponse>;
