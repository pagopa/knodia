import { Button } from "@knodia/ui-kit/ui";

import { StepHeader } from "@/components/StepHeader";
import { useStepsContext } from "@/contexts/steps";
import { DetailsFieldsSection } from "@/features/purpose/components/CreatePurposeModal/steps/DetailsFieldsSection";
import { useDetailsStepForm } from "@/features/purpose/contexts/usePurposeFormContext";
import { useReceiveDataPurposeWizardContext } from "@/features/purpose/contexts/useReceiveDataPurposeFormContext";

interface Props {
  onCancel: () => void;
}

export function DetailsAndLawfulnessStep({ onCancel }: Props) {
  const {
    data,
    eservice,
    onDirty,
    purposeFormOptions,
    selectPurposeFormOption,
    updateDetailsStep,
  } = useReceiveDataPurposeWizardContext();
  const { nextStep } = useStepsContext();
  const maxDailyCallsPerConsumer = eservice.maxDailyCalls.perConsumer;

  const form = useDetailsStepForm({
    data,
    maxDailyCallsPerConsumer,
    onDirty,
    onSubmitSuccess: () => undefined,
    updateDetailsStep,
  });

  const handleSelect = async (optionId: string) => {
    await form.handleSubmit();
    if (form.state.isValid) {
      selectPurposeFormOption(optionId);
      nextStep();
    }
  };

  return (
    <>
      <div className="flex flex-col gap-10">
        <DetailsFieldsSection
          eserviceName={eservice.name}
          form={form}
          maxDailyCallsPerConsumer={maxDailyCallsPerConsumer}
        />

        <StepHeader
          description="Choose one of the Lawfulness of processing published by the Producer on this E-Service. Clicking a card advances you to the read-only review of its risk-analysis form."
          title="Lawfulness of processing"
        />

        <form.Subscribe selector={(state) => state.canSubmit}>
          {(canSubmit) => (
            <div className="flex flex-col gap-4">
              {purposeFormOptions.length === 0 ? (
                <p className="body-md text-primary-light-low-contrast">
                  No Lawfulness of processing has been published for this
                  E-Service.
                </p>
              ) : (
                purposeFormOptions.map((option) => (
                  <button
                    className="border-primary-light-low-contrast hover:border-primary-light-high-contrast flex items-center justify-between gap-4 rounded-md border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canSubmit}
                    key={option.id}
                    onClick={() => void handleSelect(option.id)}
                    type="button"
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="body-lg-bold truncate">
                        Lawfulness of {option.name.en}
                      </span>
                      <span className="body-md text-primary-light-low-contrast truncate">
                        {option.description.en}
                      </span>
                    </div>
                    <span aria-hidden className="body-lg-bold">
                      →
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </form.Subscribe>
      </div>

      <div className="flex justify-end gap-4">
        <Button hierarchy="neutral" kind="tonal" onPress={onCancel} size="lg">
          Cancel
        </Button>
      </div>
    </>
  );
}
