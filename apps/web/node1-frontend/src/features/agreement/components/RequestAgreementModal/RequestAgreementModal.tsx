import type { KnodeId } from "@knodia/common-models/ids";

import { Banner, Divider, Empty } from "@knodia/ui-kit/ui";
import { SealCheckIcon } from "@phosphor-icons/react";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";

import { AttributeGroupContainer } from "@/components/AttributeGroupContainer";
import { ModalFooter } from "@/components/ModalFooter";
import { SettingsCard } from "@/components/SettingCard";
import { useCreateAgreement } from "@/features/agreement/hooks/useCreateAgreement";
import { FullPageModal } from "@/layouts/FullPageModal";

// TODO: use real consumer organization info from BFF (same pattern as Navbar.tsx)
const CONSUMER_ORG_NAME = "Ursa";
const CONSUMER_KNODE_NAME = "Orion Knode";

interface RequestAgreementModalProps {
  eservice: ConsumptionEserviceDetail;
  knodeId: KnodeId;
  onClose: () => void;
}

export function RequestAgreementModal({
  eservice,
  knodeId,
  onClose,
}: RequestAgreementModalProps) {
  const { createAgreement, isError, isPending } = useCreateAgreement({
    eserviceId: eservice.id,
    knodeId,
  });

  const handleConfirm = () => {
    createAgreement(eservice.latestVersionId);
  };

  return (
    <FullPageModal onClose={onClose} title="Request Agreement">
      <div className="mx-auto max-w-[640px] px-6 py-10">
        {!isError ? (
          <FormContent
            eservice={eservice}
            isPending={isPending}
            onCancel={onClose}
            onConfirm={handleConfirm}
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
  isPending,
  onCancel,
  onConfirm,
}: {
  eservice: ConsumptionEserviceDetail;
  isPending: boolean;
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

        {eservice.hasRequiredAttributes ? (
          <Banner className="mt-6" icon={<SealCheckIcon />} kind="neutral">
            Your organization has the required attributes.
          </Banner>
        ) : (
          <Banner className="mt-6" kind="warning">
            Your organization does not have the required attributes.
          </Banner>
        )}
      </div>

      {eservice.identificationRequired && (
        <>
          <Divider />

          <div>
            <h3 className="headline-sm-em text-primary-light-high-contrast mb-4">
              Identification required
            </h3>
            <Banner kind="informative">
              <div className="flex flex-col gap-2">
                <div className="title-sm-em text-info-light-high-contrast">
                  To activate the agreement, you will be required to log in to
                  the Producer Knode
                </div>
                <span className="body-md text-secondary-light-mid-contrast">
                  You will find the login link on the Agreement page once the
                  Producer Knode confirms your Agreement request.
                </span>
              </div>
            </Banner>
          </div>
        </>
      )}

      <ModalFooter
        cancelLabel="Cancel"
        confirmLabel="Request agreement"
        isDisabled={isPending || !eservice.hasRequiredAttributes}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </div>
  );
}
