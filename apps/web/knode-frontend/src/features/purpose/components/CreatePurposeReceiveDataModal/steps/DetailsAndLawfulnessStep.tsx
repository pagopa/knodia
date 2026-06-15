import { Button } from "@knodia/ui-kit/ui";

import { StepHeader } from "@/components/StepHeader";
import { useStepsContext } from "@/contexts/steps";
import { DetailsFieldsSection } from "@/features/purpose/components/CreatePurposeModal/steps/DetailsFieldsSection";
import { useDetailsStepForm } from "@/features/purpose/contexts/usePurposeFormContext";
import { useReceiveDataPurposeWizardContext } from "@/features/purpose/contexts/useReceiveDataPurposeFormContext";

import { LawfulnessOptionsList } from "./LawfulnessOptionsList";

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
            <LawfulnessOptionsList
              canSubmit={canSubmit}
              onSelect={(optionId) => void handleSelect(optionId)}
              options={purposeFormOptions}
            />
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
