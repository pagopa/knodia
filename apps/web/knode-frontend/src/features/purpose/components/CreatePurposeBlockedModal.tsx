import type { bffApi } from "@knodia/bff-client";

import { Banner, Modal } from "@knodia/ui-kit/ui";

export function CreatePurposeBlockedModal({
  agreementState,
  eserviceState,
  isOpen,
  onOpenChange,
}: {
  agreementState: bffApi.AgreementState;
  eserviceState: bffApi.EserviceVersionState;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const banner =
    eserviceState === "Archived"
      ? {
          description: "You can't create Purposes for an archived E-Service.",
          title: "This E-Service is Archived",
        }
      : agreementState === "Archived"
        ? {
            description:
              "To create a Purpose, you should have an active Agreement.",
            title: "Your Agreement is archived",
          }
        : agreementState === "PendingConsumerOperatorIdentification"
          ? {
              description:
                "To create a Purpose, an authorized operator from your organization must first confirm this Agreement on the Producer Knode.",
              title: "Your Agreement is pending confirmation",
            }
          : null;

  if (banner === null) return null;

  return (
    <Modal
      isDismissable
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Create Purpose"
    >
      <Banner kind="warning" size="md" title={banner.title}>
        {banner.description}
      </Banner>
    </Modal>
  );
}
