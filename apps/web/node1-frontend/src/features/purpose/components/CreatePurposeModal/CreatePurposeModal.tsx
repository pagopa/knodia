import type { KnodeId } from "@knodia/common-models/ids";

import { getConsumerCurrentPurposeFormSchemasOptions } from "@knodia/bff-client/tanstack-query";
import { Banner, Steps } from "@knodia/ui-kit/ui";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useEffect, useMemo, useRef } from "react";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";

import {
  type StepConfig,
  StepsProvider,
  useCurrentStep,
  useStepsContext,
} from "@/contexts/steps";
import { PurposeFormProvider } from "@/features/purpose/contexts/PurposeFormProvider";
import { mergeTexts } from "@/features/purpose/engine/textsResolver";
import {
  loadSchema,
  loadTexts,
  loadUiSchema,
} from "@/features/purpose/engine/types";
import { collectSteps } from "@/features/purpose/engine/uischemaParser";
import { useLeaveConfirmModal } from "@/hooks/useLeaveConfirmModal";
import { FullPageModal } from "@/layouts/FullPageModal";
import { client } from "@/libs/axios";

import { DetailsStep } from "./steps/DetailsStep";
import { DynamicFormStep } from "./steps/DynamicFormStep";

interface Props {
  eservice: ConsumptionEserviceDetail;
  knodeId: KnodeId;
  onClose: () => void;
}

export function CreatePurposeModal({ eservice, knodeId, onClose }: Props) {
  const { modal: leaveConfirmModal, onModalShow: handleShowLeaveConfirm } =
    useLeaveConfirmModal(onClose);

  const { data: schemasResponse, isError: isSchemasError } = useQuery(
    getConsumerCurrentPurposeFormSchemasOptions({
      client,
      query: { knodeId },
    }),
  );

  const formSchemaVersion = schemasResponse?.version;

  const jsonSchema = useMemo(
    () => (schemasResponse ? loadSchema(schemasResponse.schema) : undefined),
    [schemasResponse],
  );

  const texts = useMemo(
    () =>
      schemasResponse
        ? loadTexts(
            mergeTexts(schemasResponse.texts.en, schemasResponse.uiTexts.en),
          )
        : undefined,
    [schemasResponse],
  );

  const uiSchema = useMemo(
    () =>
      schemasResponse ? loadUiSchema(schemasResponse.uiSchema) : undefined,
    [schemasResponse],
  );

  const dynamicSteps = useMemo(
    () => (uiSchema && texts ? collectSteps(uiSchema, texts) : []),
    [uiSchema, texts],
  );

  if (isSchemasError) {
    return (
      <FullPageModal onClose={onClose} title="Create Purpose">
        <div className="mx-auto flex max-w-160 flex-col items-center gap-6 p-10">
          <Banner kind="error">
            Failed to load the form. Please try again later.
          </Banner>
        </div>
      </FullPageModal>
    );
  }

  if (!jsonSchema || !texts || !uiSchema || !formSchemaVersion) {
    return (
      <FullPageModal onClose={onClose} title="Create Purpose">
        <div className="mx-auto flex max-w-160 items-center justify-center p-10">
          <span className="body-lg text-primary-light-low-contrast">
            Loading form...
          </span>
        </div>
      </FullPageModal>
    );
  }

  const baseSteps: StepConfig[] = [
    {
      content: <DetailsStep onCancel={handleShowLeaveConfirm} />,
      label: "Details",
    },
  ];

  const steps: StepConfig[] = [
    ...baseSteps,
    ...dynamicSteps.map((step, index) => ({
      content: (
        <DynamicFormStep
          isLastStep={index === dynamicSteps.length - 1}
          jsonSchema={jsonSchema}
          step={step}
          texts={texts}
          uischema={uiSchema}
        />
      ),
      label: step.label ?? `Step ${index + baseSteps.length + 1}`,
    })),
  ];

  return (
    <>
      <FullPageModal onClose={handleShowLeaveConfirm} title="Create Purpose">
        <StepsProvider stepConfig={steps}>
          <PurposeFormProvider
            eservice={eservice}
            formSchemaVersion={formSchemaVersion}
            knodeId={knodeId}
          >
            <ModalContent />
          </PurposeFormProvider>
        </StepsProvider>
      </FullPageModal>

      {leaveConfirmModal}
    </>
  );
}

function ModalContent() {
  const { currentStepIndex, stepLabels } = useStepsContext();
  const { content } = useCurrentStep();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.parentElement?.scrollTo?.(0, 0);
  }, [currentStepIndex]);

  return (
    <div
      className="mx-auto flex max-w-160 flex-col gap-16 p-10 pb-16"
      ref={containerRef}
    >
      <Steps
        ariaLabel="Purpose creation steps"
        current={currentStepIndex}
        steps={stepLabels}
      />
      <Fragment key={currentStepIndex}>{content}</Fragment>
    </div>
  );
}
