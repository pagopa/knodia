import {
  maxDescriptionLength,
  maxNameLength,
  minDailyCalls,
  minDescriptionLength,
  minNameLength,
} from "@knodia/purpose-models";
import { z } from "zod";

import type { StepConfig } from "@/contexts/steps";

const purposeFieldSchemas = {
  dailyCalls: (max: number) =>
    z
      .number()
      .int("Must be a whole number.")
      .min(minDailyCalls, `Must be at least ${minDailyCalls}.`)
      .max(max, `Must be at most ${max}.`),
  description: z
    .string()
    .min(
      minDescriptionLength,
      `Description must be at least ${minDescriptionLength} characters.`,
    )
    .max(
      maxDescriptionLength,
      `Description must be at most ${maxDescriptionLength} characters.`,
    ),
  name: z
    .string()
    .min(minNameLength, `Name must be at least ${minNameLength} characters.`)
    .max(maxNameLength, `Name must be at most ${maxNameLength} characters.`),
};

export const detailsStepSchema = (maxDailyCallsPerConsumer: number) =>
  z.object({
    dailyCalls: purposeFieldSchemas.dailyCalls(maxDailyCallsPerConsumer),
    description: purposeFieldSchemas.description,
    name: purposeFieldSchemas.name,
  });

export type DetailsStepData = z.infer<ReturnType<typeof detailsStepSchema>>;

export type PurposeFormDraftData = DetailsStepData;

export const DETAILS_STEP_DEFAULTS: DetailsStepData = {
  dailyCalls: NaN,
  description: "",
  name: "",
};

/** @alias -- Will diverge from DETAILS_STEP_DEFAULTS when more steps are added */
export const PURPOSE_FORM_DEFAULTS: PurposeFormDraftData =
  DETAILS_STEP_DEFAULTS;

export const CREATE_PURPOSE_STEPS: StepConfig[] = [
  { label: "Details" },
  { label: "Step 2" },
  { label: "Step 3" },
];
