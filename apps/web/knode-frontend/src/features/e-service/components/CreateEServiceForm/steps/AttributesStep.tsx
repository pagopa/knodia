import { attributes } from "@knodia/attribute-models";
import { Banner, Button, Select } from "@knodia/ui-kit/ui";
import { BookOpenTextIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { AttributesListModal } from "@/components/AttributesListModal";
import { ModalFooter } from "@/components/ModalFooter";
import { StepHeader } from "@/components/StepHeader";
import { useStepsContext } from "@/contexts/steps";
import {
  useAttributesStepForm,
  useEServiceWizardContext,
} from "@/features/e-service/contexts/useEServiceFormContext";
import {
  parseSchemeRefKeys,
  renderSchemeRefItems,
  toSchemeRefKey,
} from "@/features/e-service/utils/schemeRef";
import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

import { DefinedByTemplateIconTooltip } from "../components/DefinedByTemplateIconTooltip";

type AttributesStepForm = ReturnType<typeof useAttributesStepForm>;

export function AttributesStep() {
  const { nextStep, prevStep } = useStepsContext();
  const form = useAttributesStepForm(nextStep);
  const { template } = useEServiceWizardContext();
  const [isAttributesListOpen, setIsAttributesListOpen] = useState(false);

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

  const areDefinedByTemplate = template !== undefined;

  return (
    <>
      <div className="flex flex-col gap-10">
        <StepHeader
          description="Choose which organizations can request an Agreement for your E-Service."
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

                      {!areDefinedByTemplate && groupIndex > 0 && (
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
                  <AttributesField
                    areDefinedByTemplate={areDefinedByTemplate}
                    form={form}
                    groupIndex={groupIndex}
                    onShowAttributesList={() => setIsAttributesListOpen(true)}
                  />
                </div>
              ))}
            </div>
          )}
        </form.Field>

        {!areDefinedByTemplate && (
          <Button
            className="self-start"
            hierarchy="neutral"
            kind="tonal"
            onPress={handleAddGroup}
          >
            Add group
          </Button>
        )}
      </div>

      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <ModalFooter
            isDisabled={!canSubmit}
            onCancel={prevStep}
            onConfirm={form.handleSubmit}
          />
        )}
      </form.Subscribe>

      <AttributesListModal
        isOpen={isAttributesListOpen}
        onOpenChange={setIsAttributesListOpen}
      />
    </>
  );
}

function AttributesField({
  areDefinedByTemplate,
  form,
  groupIndex,
  onShowAttributesList,
}: {
  areDefinedByTemplate: boolean;
  form: AttributesStepForm;
  groupIndex: number;
  onShowAttributesList: () => void;
}) {
  return (
    <form.Field name={`requiredAttributes[${groupIndex}]`}>
      {(groupField) => {
        const value = groupField.state.value ?? [];

        return (
          <div className="flex gap-4 justify-between items-end">
            <Select
              className="flex-1"
              endIcon={
                areDefinedByTemplate ? (
                  <DefinedByTemplateIconTooltip />
                ) : undefined
              }
              errorMessage={getFieldErrorMessage(groupField.state.meta.errors)}
              id={`${groupField.name}-${groupIndex}`}
              isInvalid={!groupField.state.meta.isValid}
              isReadOnly={areDefinedByTemplate}
              isRequired
              label="Attributes"
              name={groupField.name}
              onChange={(keys) =>
                groupField.handleChange(parseSchemeRefKeys(keys))
              }
              placeholder="Select one or more attributes"
              selectionListFormatType="disjunction"
              selectionMode="multiple"
              value={value.map(toSchemeRefKey)}
            >
              {renderSchemeRefItems(attributes)}
            </Select>
            <Button
              hierarchy="neutral"
              kind="ghost"
              onPress={onShowAttributesList}
              size="lg"
            >
              <BookOpenTextIcon />
              Attributes list
            </Button>
          </div>
        );
      }}
    </form.Field>
  );
}
