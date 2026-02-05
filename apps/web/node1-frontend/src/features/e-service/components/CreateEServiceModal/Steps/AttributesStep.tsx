import { Banner, Button, Select, SelectItem } from "@knodia/ui-kit/ui";
import { TrashIcon } from "@phosphor-icons/react";

import { useStepsContext } from "@/contexts/steps";
import {
  useAttributesStepForm,
  useEServiceWizardContext,
} from "@/features/e-service/contexts/useEServiceFormContext";
import { getFieldErrorMessage } from "@/features/e-service/utils/getFieldErrorMessage";

import { Footer } from "../Footer";
import { StepHeader } from "../StepsHeader";

// TODO: use real data
const MOCK_ATTRIBUTES = Array.from({ length: 10 }, (_, i) => ({
  label: `NUTS${i + 1}`,
  value: `NUTS${i + 1}`,
}));

export function AttributesStep() {
  const { data, updateAttributesStep } = useEServiceWizardContext();
  const { nextStep, prevStep } = useStepsContext();

  const form = useAttributesStepForm(
    {
      requiredAttributes:
        data.requiredAttributes && data.requiredAttributes.length > 0
          ? data.requiredAttributes
          : [[]],
    },
    (stepData) => {
      updateAttributesStep(stepData);
      nextStep();
    },
  );

  const handleAddGroup = () => {
    const currentGroups = form.getFieldValue("requiredAttributes") ?? [];
    form.setFieldValue("requiredAttributes", [...currentGroups, []]);
  };

  const handleRemoveGroup = (index: number) => {
    const currentGroups = form.getFieldValue("requiredAttributes") ?? [];
    form.setFieldValue(
      "requiredAttributes",
      currentGroups.filter((_, i) => i !== index),
    );
  };

  return (
    <>
      <div className="flex flex-col gap-10">
        <StepHeader
          description="Choose which organization can request an Agreement for your E-Service."
          title="Attributes"
        >
          <Banner kind="informative">
            E-Services' attributes cannot be modified after publication.
          </Banner>
          <p className="body-md text-primary-dark">
            Organizations must have at least one attribute within a group to
            request an Agreement for your E-Service. If you want to request that
            Consumers have more than one attribute, create separate groups.
          </p>
        </StepHeader>

        <form.Field mode="array" name="requiredAttributes">
          {(field) => (
            <div className="flex flex-col gap-10">
              {field.state.value?.map((_, groupIndex) => (
                <div className="flex flex-col gap-6" key={groupIndex}>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3 justify-between">
                      <h3 className="headline-sm-em text-primary-light-high-contrast flex-1">
                        Group {groupIndex + 1}
                      </h3>

                      {groupIndex > 0 && (
                        <Button
                          hierarchy="danger"
                          kind="tonal"
                          onPress={() => handleRemoveGroup(groupIndex)}
                          size="icon-sm"
                        >
                          <TrashIcon />
                        </Button>
                      )}
                    </div>
                    <span className="body-md text-primary-light-high-contrast">
                      Organizations must have at least one attribute inside this
                      group.
                    </span>
                  </div>
                  <form.Field name={`requiredAttributes[${groupIndex}]`}>
                    {(groupField) => (
                      <Select
                        className="flex-1"
                        errorMessage={getFieldErrorMessage(
                          groupField.state.meta.errors,
                        )}
                        id="selectatttributes"
                        isInvalid={!groupField.state.meta.isValid}
                        isRequired
                        label="Attributes"
                        name={groupField.name}
                        onChange={(values) =>
                          groupField.handleChange(
                            values.map((v) => ({
                              code: String(v),
                              scheme: String(v),
                            })),
                          )
                        }
                        placeholder="Select one or more attributes"
                        selectionMode="multiple"
                        value={
                          groupField.state.value?.map((attr) => attr.code) ?? []
                        }
                      >
                        {MOCK_ATTRIBUTES.map(({ label, value }) => (
                          <SelectItem id={value} key={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  </form.Field>
                </div>
              ))}
            </div>
          )}
        </form.Field>

        <Button
          className="self-start"
          hierarchy="neutral"
          kind="tonal"
          onPress={handleAddGroup}
        >
          Add group
        </Button>
      </div>

      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <Footer
            isDisabled={!canSubmit}
            onCancel={prevStep}
            onConfirm={form.handleSubmit}
          />
        )}
      </form.Subscribe>
    </>
  );
}
