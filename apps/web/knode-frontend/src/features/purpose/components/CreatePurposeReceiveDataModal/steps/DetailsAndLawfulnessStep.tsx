import { Button, NumberField, TextArea, TextField } from "@knodia/ui-kit/ui";
import { useState } from "react";

import { SettingsCard } from "@/components/SettingCard";
import { StepHeader } from "@/components/StepHeader";
import { useStepsContext } from "@/contexts/steps";
import { useReceiveDataPurposeWizardContext } from "@/features/purpose/contexts/useReceiveDataPurposeFormContext";

interface Props {
  onCancel: () => void;
}

export function DetailsAndLawfulnessStep({ onCancel }: Props) {
  const {
    eservice,
    purposeFormOptions,
    selectPurposeFormOption,
    updateDetailsStep,
  } = useReceiveDataPurposeWizardContext();
  const { nextStep } = useStepsContext();

  const maxDailyCalls = eservice.maxDailyCalls.perConsumer;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dailyCalls, setDailyCalls] = useState(0);

  const isNameValid = name.length >= 5 && name.length <= 60;
  const isDescriptionValid =
    description.length >= 10 && description.length <= 250;
  const isDailyCallsValid =
    Number.isFinite(dailyCalls) &&
    dailyCalls >= 1 &&
    dailyCalls <= maxDailyCalls;
  const canSelectLawfulness =
    isNameValid && isDescriptionValid && isDailyCallsValid;

  const handleSelect = (purposeFormOptionId: string) => {
    updateDetailsStep({ dailyCalls, description, name });
    selectPurposeFormOption(purposeFormOptionId);
    nextStep();
  };

  return (
    <>
      <div className="flex flex-col gap-10">
        <StepHeader
          description="Provide details about why you need to access this E-Service, then choose a Lawfulness of processing published by the Producer."
          title="Purpose details"
        />

        <SettingsCard label="E-Service">{eservice.name}</SettingsCard>

        <div className="flex flex-col gap-6">
          <TextField
            description="Min 5 characters, max 60 characters"
            errorMessage={
              !isNameValid && name.length > 0
                ? "Name must be between 5 and 60 characters."
                : undefined
            }
            isInvalid={!isNameValid && name.length > 0}
            isRequired
            label="Name"
            name="name"
            onChange={setName}
            value={name}
          />
          <TextArea
            description="Min 10 characters, max 250 characters"
            errorMessage={
              !isDescriptionValid && description.length > 0
                ? "Description must be between 10 and 250 characters."
                : undefined
            }
            isInvalid={!isDescriptionValid && description.length > 0}
            isRequired
            label="Description"
            name="description"
            onChange={setDescription}
            value={description}
          />
          <NumberField
            description={`This E-Service allows up to ${maxDailyCalls} API calls/day. If you need more calls, contact the Producer.`}
            errorMessage={
              !isDailyCallsValid && dailyCalls > 0
                ? `Please enter a value between 1 and ${maxDailyCalls}.`
                : undefined
            }
            isInvalid={!isDailyCallsValid && dailyCalls > 0}
            isRequired
            label="How many API calls do you plan to make per day?"
            minValue={0}
            onChange={setDailyCalls}
            value={dailyCalls}
          />
        </div>

        <StepHeader
          description="Choose one of the Lawfulness of processing published by the Producer on this E-Service. Clicking a card advances you to the read-only review of its risk-analysis form."
          title="Lawfulness of processing"
        />

        <div className="flex flex-col gap-4">
          {purposeFormOptions.length === 0 ? (
            <p className="body-md text-primary-light-low-contrast">
              No Lawfulness of processing has been published for this E-Service.
            </p>
          ) : (
            purposeFormOptions.map((option) => (
              <button
                className="border-primary-light-low-contrast hover:border-primary-light-high-contrast flex items-center justify-between gap-4 rounded-md border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canSelectLawfulness}
                key={option.id}
                onClick={() => handleSelect(option.id)}
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
      </div>

      <div className="flex justify-end gap-4">
        <Button hierarchy="neutral" kind="tonal" onPress={onCancel} size="lg">
          Cancel
        </Button>
      </div>
    </>
  );
}
