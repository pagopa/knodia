import { Banner, Divider, Empty } from "@knodia/ui-kit/ui";
import { SealCheckIcon } from "@phosphor-icons/react";
import { useState } from "react";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";

import { SettingsCard } from "@/components/SettingCard";
import { FullPageModal } from "@/layouts/FullPageModal";

import { AttributeGroupContainer } from "../AttributeGroupContainer";
import { ModalFooter } from "../ModalFooter";

// TODO: use real consumer organization info from BFF (same pattern as Navbar.tsx)
const CONSUMER_ORG_NAME = "Ursa";
const CONSUMER_KNODE_NAME = "Orion Knode";

type ModalState = "error" | "form";

interface RequestAgreementModalProps {
  eservice: ConsumptionEserviceDetail;
  onClose: () => void;
}

export function RequestAgreementModal({
  eservice,
  onClose,
}: RequestAgreementModalProps) {
  const [modalState, setModalState] = useState<ModalState>("form");

  return (
    <FullPageModal onClose={onClose} title="Request Agreement">
      <div className="mx-auto max-w-[640px] px-6 py-10">
        {modalState === "form" ? (
          <FormContent
            eservice={eservice}
            onCancel={onClose}
            onConfirm={() => handleRequestAgreement(eservice, setModalState)}
          />
        ) : (
          <ErrorContent onClose={onClose} />
        )}
      </div>
    </FullPageModal>
  );
}

function ErrorContent({ onClose }: { onClose: () => void }) {
  return (
    <Empty
      action={{
        as: "button",
        hierarchy: "brand",
        kind: "filled",
        label: "Close",
        onClick: onClose,
      }}
      description="This could be caused by a temporary malfunction in the Producer Knode. Please try again later."
      kind="error"
      title="The Agreement request went wrong"
    />
  );
}

function FormContent({
  eservice,
  onCancel,
  onConfirm,
}: {
  eservice: ConsumptionEserviceDetail;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-10">
      <h2 className="headline-md text-primary-light-high-contrast">
        {eservice.name}
      </h2>

      <div className="grid grid-cols-2 gap-6">
        <SettingsCard label="Producer">
          {eservice.producer.name} - {eservice.producer.knodeName}
        </SettingsCard>
        <SettingsCard label="Consumer">
          {CONSUMER_ORG_NAME} - {CONSUMER_KNODE_NAME}
        </SettingsCard>
      </div>

      <div>
        <h3 className="headline-sm-em text-primary-light-high-contrast mb-4">
          Attributes
        </h3>
        <ul className="gap-2 flex flex-col" role="list">
          {eservice.requiredAttributes.map((group, index) => (
            <li key={index}>
              <AttributeGroupContainer attributes={group} />
            </li>
          ))}
        </ul>

        <Banner className="mt-6" icon={<SealCheckIcon />} kind="neutral">
          Your organization has the required attributes.
        </Banner>
      </div>

      <Divider />

      <div>
        <h3 className="headline-sm-em text-primary-light-high-contrast mb-4">
          Identification required
        </h3>
        <Banner kind="informative">
          <div className="flex flex-col gap-2">
            <div className="title-sm-em text-info-light-high-contrast">
              To activate the agreement, you will be required to log in to the
              Producer Knode
            </div>
            <span className="body-md text-secondary-light-mid-contrast">
              You will find the login link on the Agreement page once the
              Producer Knode confirms your Agreement request.
            </span>
          </div>
        </Banner>
      </div>

      <ModalFooter
        cancelLabel="Cancel"
        confirmLabel="Request agreement"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </div>
  );
}

// TODO: replace with actual BFF agreement mutation when endpoint is available
async function handleRequestAgreement(
  _eservice: ConsumptionEserviceDetail,
  setModalState: (state: ModalState) => void,
): Promise<void> {
  try {
    // await bffApi.createAgreement({ client, body: { eserviceId: eservice.id } });
    // On success: navigate to agreement detail or show success state
    throw new Error("BFF agreement endpoint not implemented");
  } catch {
    setModalState("error");
  }
}
