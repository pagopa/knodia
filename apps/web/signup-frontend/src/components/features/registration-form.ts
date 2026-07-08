import { z } from "zod";

import { emailSchema } from "@/utils/validation";

const REQUIRED_FIELD_MESSAGE = "Required field";

// Refine on boolean (not z.literal(true)) so the field value type stays
// `boolean`, matching the unchecked default the form starts from.
const requiredAcceptance = z
  .boolean()
  .refine((accepted) => accepted, REQUIRED_FIELD_MESSAGE);

export const registrationFormSchema = z.object({
  articlesAccepted: requiredAcceptance,
  email: emailSchema,
  termsAccepted: requiredAcceptance,
});

type RegistrationFormValues = z.infer<typeof registrationFormSchema>;

export const registrationFormDefaultValues: RegistrationFormValues = {
  articlesAccepted: false,
  email: "",
  termsAccepted: false,
};
