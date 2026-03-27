import type { KnodeId } from "@knodia/common-models/ids";

import {
  getConsumerPurposeFormSchemaOptions,
  getConsumerPurposeFormUiSchemaOptions,
} from "@knodia/bff-client/tanstack-query";
import { PurposeFormSchemaVersion } from "@knodia/purpose-models";
import { Steps } from "@knodia/ui-kit/ui";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";

import {
  type StepConfig,
  StepsProvider,
  useCurrentStep,
  useStepsContext,
} from "@/contexts/steps";
import { PurposeFormProvider } from "@/features/purpose/contexts/PurposeFormProvider";
import { loadSchema, loadUiSchema } from "@/features/purpose/engine/types";
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

const FORM_SCHEMA_VERSION = PurposeFormSchemaVersion.enum["1.0"];

export function CreatePurposeModal({ eservice, knodeId, onClose }: Props) {
  const { modal: leaveConfirmModal, onModalShow: handleShowLeaveConfirm } =
    useLeaveConfirmModal(onClose);

  const { data: jsonSchemaData } = useQuery(
    getConsumerPurposeFormSchemaOptions({
      client,
      path: { version: FORM_SCHEMA_VERSION },
      query: { knodeId },
    }),
  );

  const { data: uiSchemaData } = useQuery(
    getConsumerPurposeFormUiSchemaOptions({
      client,
      path: { version: FORM_SCHEMA_VERSION },
      query: { knodeId },
    }),
  );

  const jsonSchema = useMemo(
    () => (jsonSchemaData ? loadSchema(jsonSchemaData) : undefined),
    [jsonSchemaData],
  );

  const uiSchema = useMemo(
    () => (uiSchemaData ? loadUiSchema(uiSchemaData) : undefined),
    [uiSchemaData],
  );

  const dynamicSteps = useMemo(
    () => (uiSchema ? collectSteps(uiSchema) : []),
    [uiSchema],
  );

  if (!jsonSchema || !uiSchema) {
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
          <PurposeFormProvider eservice={eservice} knodeId={knodeId}>
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
      {content}
    </div>
  );
}
