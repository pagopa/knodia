import { Button } from "@knodia/ui-kit/ui";
import { ArrowRightIcon } from "@phosphor-icons/react";

import { ServiceCard, ServiceCardHeader } from "@/components/ServiceCard";
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

        <div className="flex flex-col gap-3">
          <h3 className="title-md text-primary-light-high-contrast">
            Lawfulness of Processing declarations for this E-Service
          </h3>
          <p className="body-md text-primary-light-mid-contrast whitespace-pre-line">
            For receive-data E-Services, the Producer fills in the declaration.
            Choose the declaration that applies.
          </p>
        </div>

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
                  <ServiceCard key={option.id}>
                    <ServiceCardHeader
                      description={option.description.en}
                      title={`Lawfulness of ${option.name.en}`}
                    >
                      <Button
                        aria-label={`Select lawfulness of ${option.name.en}`}
                        hierarchy="neutral"
                        isDisabled={!canSubmit}
                        kind="outlined"
                        onPress={() => void handleSelect(option.id)}
                        size="icon-md"
                      >
                        <ArrowRightIcon />
                      </Button>
                    </ServiceCardHeader>
                  </ServiceCard>
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
