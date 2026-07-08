import { z } from "zod";

import { emailSchema } from "@/utils/validation";

export const changeEmailFormSchema = z.object({
  email: emailSchema,
});

type ChangeEmailFormValues = z.infer<typeof changeEmailFormSchema>;

export const changeEmailFormDefaultValues: ChangeEmailFormValues = {
  email: "",
};
