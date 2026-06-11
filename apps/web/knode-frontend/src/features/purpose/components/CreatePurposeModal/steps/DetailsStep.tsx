import { ModalFooter } from "@/components/ModalFooter";
import { useStepsContext } from "@/contexts/steps";
import {
  useDetailsStepForm,
  usePurposeWizardContext,
} from "@/features/purpose/contexts/usePurposeFormContext";

import { DetailsFieldsSection } from "./DetailsFieldsSection";

interface Props {
  onCancel: () => void;
}

export function DetailsStep({ onCancel }: Props) {
  const {
    data,
    eserviceName,
    maxDailyCallsPerConsumer,
    onDirty,
    updateDetailsStep,
  } = usePurposeWizardContext();
  const { nextStep } = useStepsContext();
  const form = useDetailsStepForm({
    data,
    maxDailyCallsPerConsumer,
    onDirty,
    onSubmitSuccess: () => nextStep(),
    updateDetailsStep,
  });

  return (
    <>
      <div className="flex flex-col gap-10">
        <DetailsFieldsSection
          eserviceName={eserviceName}
          form={form}
          maxDailyCallsPerConsumer={maxDailyCallsPerConsumer}
        />
      </div>

      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <ModalFooter
            cancelLabel="Cancel"
            confirmLabel="Next"
            isDisabled={!canSubmit}
            onCancel={onCancel}
            onConfirm={form.handleSubmit}
          />
        )}
      </form.Subscribe>
    </>
  );
}
