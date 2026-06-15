import type { KnodeId } from "@knodia/common-models/ids";

import { getConsumerEservicePurposeFormOptionsOptions } from "@knodia/bff-client/tanstack-query";
import { Banner, Steps } from "@knodia/ui-kit/ui";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useMemo, useRef } from "react";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";

import {
  type StepConfig,
  StepsProvider,
  useCurrentStep,
  useScrollToTopOnStepChange,
  useStepsContext,
} from "@/contexts/steps";
import { ReceiveDataPurposeFormProvider } from "@/features/purpose/contexts/ReceiveDataPurposeFormProvider";
import { mergeTexts } from "@/features/purpose/engine/textsResolver";
import { loadUiSchema } from "@/features/purpose/engine/types";
import { collectSteps } from "@/features/purpose/engine/uischemaParser";
import { useLeaveConfirmModal } from "@/hooks/useLeaveConfirmModal";
import { FullPageModal } from "@/layouts/FullPageModal";
import { client } from "@/libs/axios";

import { DetailsAndLawfulnessStep } from "./steps/DetailsAndLawfulnessStep";
import { ReadOnlyGroupStep } from "./steps/ReadOnlyGroupStep";

interface Props {
  eservice: ConsumptionEserviceDetail;
  knodeId: KnodeId;
  onClose: () => void;
}

export function CreatePurposeReceiveDataModal({
  eservice,
  knodeId,
  onClose,
}: Props) {
  const {
    markDirty,
    modal: leaveConfirmModal,
    onModalShow: handleShowLeaveConfirm,
  } = useLeaveConfirmModal(onClose, { skipWhenClean: true });

  const { data: response, isError } = useQuery(
    getConsumerEservicePurposeFormOptionsOptions({
      client,
      path: { eserviceId: eservice.id },
      query: { knodeId },
    }),
  );

  const purposeFormOptions = useMemo(() => response?.items ?? [], [response]);

  // All options published for the same E-service share the same form schema
  // (formSchemaVersion is fixed per Producer schema), so derive the dynamic
  // groups from the first option — mirrors the dynamicSteps logic used by the
  // provide-data wizard.
  const firstOption = purposeFormOptions.at(0);

  const uiSchema = useMemo(
    () => (firstOption ? loadUiSchema(firstOption.uiSchema) : undefined),
    [firstOption],
  );

  const texts = useMemo(
    () =>
      firstOption
        ? mergeTexts(firstOption.texts.en, firstOption.uiTexts.en)
        : undefined,
    [firstOption],
  );

  const dynamicSteps = useMemo(
    () => (uiSchema && texts ? collectSteps(uiSchema, texts) : []),
    [uiSchema, texts],
  );

  if (isError) {
    return (
      <FullPageModal
        onClose={handleShowLeaveConfirm}
        title="Create Purpose for Receive-data E-service"
      >
        <div className="mx-auto flex max-w-160 flex-col items-center gap-6 p-10">
          <Banner kind="error">
            Failed to load the Lawfulness of processing options. Please try
            again later.
          </Banner>
        </div>
        {leaveConfirmModal}
      </FullPageModal>
    );
  }

  if (!response) {
    return (
      <FullPageModal
        onClose={handleShowLeaveConfirm}
        title="Create Purpose for Receive-data E-service"
      >
        <div className="mx-auto flex max-w-160 items-center justify-center p-10">
          <span className="body-lg text-primary-light-low-contrast">
            Loading...
          </span>
        </div>
        {leaveConfirmModal}
      </FullPageModal>
    );
  }

  const baseSteps: StepConfig[] = [
    {
      content: <DetailsAndLawfulnessStep onCancel={handleShowLeaveConfirm} />,
      label: "Purpose Details",
    },
  ];

  const steps: StepConfig[] = [
    ...baseSteps,
    ...dynamicSteps.map((step, index) => {
      const label = step.label ?? `Step ${index + baseSteps.length + 1}`;
      return {
        content: (
          <ReadOnlyGroupStep
            groupIndex={index}
            isLastStep={index === dynamicSteps.length - 1}
            title={label}
          />
        ),
        label,
      };
    }),
  ];

  return (
    <>
      <FullPageModal
        onClose={handleShowLeaveConfirm}
        title="Create Purpose for Receive-data E-service"
      >
        <StepsProvider stepConfig={steps}>
          <ReceiveDataPurposeFormProvider
            eservice={eservice}
            knodeId={knodeId}
            onDirty={markDirty}
            purposeFormOptions={purposeFormOptions}
          >
            <ModalContent />
          </ReceiveDataPurposeFormProvider>
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

  useScrollToTopOnStepChange(containerRef);

  return (
    <div
      className="mx-auto flex max-w-160 flex-col gap-16 p-10 pb-16"
      ref={containerRef}
    >
      <Steps
        ariaLabel="Receive-data Purpose creation steps"
        current={currentStepIndex}
        steps={stepLabels}
      />
      <Fragment key={currentStepIndex}>{content}</Fragment>
    </div>
  );
}
