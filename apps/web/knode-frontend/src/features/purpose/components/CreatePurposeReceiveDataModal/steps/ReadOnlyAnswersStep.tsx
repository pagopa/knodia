import { Banner, Chip } from "@knodia/ui-kit/ui";

const DECLARED_BY_PRODUCER_BADGE = "Declared by Producer";

import { ModalFooter } from "@/components/ModalFooter";
import { StepHeader } from "@/components/StepHeader";
import { useStepsContext } from "@/contexts/steps";
import { useReceiveDataPurposeWizardContext } from "@/features/purpose/contexts/useReceiveDataPurposeFormContext";
import {
  getFieldLabel,
  mergeTexts,
} from "@/features/purpose/engine/textsResolver";
import { useCreatePurposeReceiveData } from "@/features/purpose/hooks/useCreatePurposeReceiveData";

export function ReadOnlyAnswersStep() {
  const { eservice, knodeId, purposeFormOptions, selectedPurposeFormOptionId } =
    useReceiveDataPurposeWizardContext();
  const { prevStep } = useStepsContext();

  const { createPurpose, isError, isPending } = useCreatePurposeReceiveData(
    eservice.id,
    knodeId,
  );

  const selected = purposeFormOptions.find(
    (option) => option.id === selectedPurposeFormOptionId,
  );

  if (!selected) {
    return (
      <Banner kind="error">
        No Lawfulness of processing selected. Go back to Step 1.
      </Banner>
    );
  }

  const texts = mergeTexts(selected.texts.en, selected.uiTexts.en);
  const entries = Object.entries(selected.formAnswersJson) as [
    string,
    unknown,
  ][];

  return (
    <>
      <div className="flex flex-col gap-10">
        <div className="flex items-center gap-3">
          <StepHeader
            description={`Review the answers published by the Producer for the chosen Lawfulness of processing: "${selected.name.en}". You cannot edit them.`}
            title="Risk analysis (read-only)"
          />
          <Chip kind="informative" label={DECLARED_BY_PRODUCER_BADGE} />
        </div>

        <dl className="divide-primary-light-low-contrast flex flex-col divide-y">
          {entries.map(([key, value]) => (
            <div className="flex flex-col gap-1 py-3" key={key}>
              <dt className="body-md-bold">{getFieldLabel(texts, key)}</dt>
              <dd className="body-md text-primary-light-low-contrast">
                {formatValue(value)}
              </dd>
            </div>
          ))}
        </dl>

        {isError && (
          <Banner kind="error">
            Failed to create the Purpose. Please try again.
          </Banner>
        )}
      </div>

      <ModalFooter
        cancelLabel="Previous"
        confirmLabel={isPending ? "Creating..." : "Create"}
        isDisabled={isPending}
        onCancel={prevStep}
        onConfirm={createPurpose}
      />
    </>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
