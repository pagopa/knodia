import { Banner } from "@knodia/ui-kit/ui";

import { ModalFooter } from "@/components/ModalFooter";
import { StepHeader } from "@/components/StepHeader";
import { useStepsContext } from "@/contexts/steps";
import { useReceiveDataPurposeWizardContext } from "@/features/purpose/contexts/useReceiveDataPurposeFormContext";
import { getVisibleFields } from "@/features/purpose/engine/dependencyResolver";
import { scopeToFieldName } from "@/features/purpose/engine/scope";
import {
  getGroupDescription,
  getGroupLabel,
  mergeTexts,
} from "@/features/purpose/engine/textsResolver";
import {
  type ControlElement,
  type FormValues,
  type JsonSchema,
  loadSchema,
  loadUiSchema,
  type UISchemaElement,
} from "@/features/purpose/engine/types";
import { useCreatePurposeReceiveData } from "@/features/purpose/hooks/useCreatePurposeReceiveData";

import { FieldRenderer } from "../../CreatePurposeModal/renderers/FieldRenderer";

interface Props {
  groupIndex: number;
  isLastStep: boolean;
  title: string;
}

interface SectionProps {
  answers: FormValues;
  element: UISchemaElement;
  jsonSchema: JsonSchema;
  texts: Record<string, string>;
  visibleFields: Set<string>;
}

export function ReadOnlyGroupStep({ groupIndex, isLastStep, title }: Props) {
  const { eservice, knodeId, purposeFormOptions, selectedPurposeFormOptionId } =
    useReceiveDataPurposeWizardContext();
  const { nextStep, prevStep } = useStepsContext();

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

  const uiSchema = loadUiSchema(selected.uiSchema);
  const jsonSchema = loadSchema(selected.schema);
  const texts = mergeTexts(selected.texts.en, selected.uiTexts.en);
  const answers = selected.formAnswersJson as FormValues;
  const visibleFields = getVisibleFields(uiSchema, answers);

  const topLevelGroup = uiSchema.elements.filter(isGroup).at(groupIndex);

  if (!topLevelGroup) {
    return (
      <Banner kind="error">
        The selected Lawfulness of processing does not declare any field for
        this step.
      </Banner>
    );
  }

  const groupDescription = topLevelGroup.i18n
    ? getGroupDescription(texts, topLevelGroup.i18n)
    : undefined;

  return (
    <>
      <div className="flex flex-col gap-10">
        <StepHeader description={groupDescription ?? ""} title={title} />

        <div className="flex flex-col gap-8">
          {topLevelGroup.elements.map((child, idx) => (
            <Section
              answers={answers}
              element={child}
              jsonSchema={jsonSchema}
              key={idx}
              texts={texts}
              visibleFields={visibleFields}
            />
          ))}
        </div>

        {isError && (
          <Banner kind="error">
            Failed to create the Purpose. Please try again.
          </Banner>
        )}
      </div>

      <ModalFooter
        cancelLabel="Previous"
        confirmLabel={
          isLastStep ? (isPending ? "Creating..." : "Create") : "Next"
        }
        isDisabled={isPending}
        onCancel={prevStep}
        onConfirm={isLastStep ? createPurpose : nextStep}
      />
    </>
  );
}

function isControl(element: UISchemaElement): element is ControlElement {
  return element.type === "Control";
}

function isGroup(
  element: UISchemaElement,
): element is Extract<UISchemaElement, { type: "Group" }> {
  return element.type === "Group";
}

function noop() {
  // Read-only fields don't propagate changes.
}

function Section({
  answers,
  element,
  jsonSchema,
  texts,
  visibleFields,
}: SectionProps) {
  if (isGroup(element)) {
    const label = element.i18n ? getGroupLabel(texts, element.i18n) : undefined;
    const description = element.i18n
      ? getGroupDescription(texts, element.i18n)
      : undefined;
    return (
      <section className="flex flex-col gap-4">
        {label && <h3 className="body-lg-bold">{label}</h3>}
        {description && (
          <p className="body-md text-primary-light-low-contrast">
            {description}
          </p>
        )}
        <div className="flex flex-col gap-6">
          {element.elements.map((child, idx) => (
            <Section
              answers={answers}
              element={child}
              jsonSchema={jsonSchema}
              key={idx}
              texts={texts}
              visibleFields={visibleFields}
            />
          ))}
        </div>
      </section>
    );
  }
  if (isControl(element)) {
    const fieldName = scopeToFieldName(element.scope);
    if (!visibleFields.has(fieldName)) return null;
    const value = answers[fieldName] ?? "";
    return (
      <FieldRenderer
        allValues={answers}
        control={element}
        isReadOnly
        jsonSchema={jsonSchema}
        onChange={noop}
        texts={texts}
        value={value}
      />
    );
  }
  return null;
}
