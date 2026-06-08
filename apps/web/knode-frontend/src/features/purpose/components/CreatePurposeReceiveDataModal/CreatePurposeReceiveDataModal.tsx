import type { KnodeId } from "@knodia/common-models/ids";

import { getConsumerEservicePurposeFormOptionsOptions } from "@knodia/bff-client/tanstack-query";
import { Banner, Steps } from "@knodia/ui-kit/ui";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useCallback, useMemo, useRef, useState } from "react";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";

import {
  type StepConfig,
  StepsProvider,
  useCurrentStep,
  useScrollToTopOnStepChange,
  useStepsContext,
} from "@/contexts/steps";
import { ReceiveDataPurposeFormProvider } from "@/features/purpose/contexts/ReceiveDataPurposeFormProvider";
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
  const [isDirty, setIsDirty] = useState(false);
  const markDirty = useCallback(() => setIsDirty(true), []);
  const { modal: leaveConfirmModal, onModalShow: handleShowLeaveConfirm } =
    useLeaveConfirmModal(onClose, { isDirty, skipWhenClean: true });

  const { data: response, isError } = useQuery(
    getConsumerEservicePurposeFormOptionsOptions({
      client,
      path: { eserviceId: eservice.id },
      query: { knodeId },
    }),
  );

  const purposeFormOptions = useMemo(() => response?.items ?? [], [response]);

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

  const steps: StepConfig[] = [
    {
      content: <DetailsAndLawfulnessStep onCancel={handleShowLeaveConfirm} />,
      label: "Purpose Details",
    },
    {
      content: (
        <ReadOnlyGroupStep
          groupIndex={0}
          isLastStep={false}
          title="Lawfulness of Processing"
        />
      ),
      label: "Lawfulness of Processing",
    },
    {
      content: (
        <ReadOnlyGroupStep
          groupIndex={1}
          isLastStep={true}
          title="Risk Analysis"
        />
      ),
      label: "Risk Analysis",
    },
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
