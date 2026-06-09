import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import { Banner } from "@knodia/ui-kit/ui";
import { SelectionIcon, SelectionPlusIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { Section } from "@/components/Section";
import { useHasRole } from "@/contexts/auth";
import { ProducerKeychainsTable } from "@/features/keychain/components/ProducerKeychainsTable";

import { useProductionEserviceDetailsContext } from "../../contexts/useProductionEserviceDetailsContext";
import { eserviceLinkedProducerKeychainsQuery } from "../../services/queries";
import { LinkKeychainAction } from "../LinkKeychainAction";
import { UnlinkKeychainAction } from "../UnlinkKeychainAction";

export function ProductionEServiceKeychainsTab() {
  const eservice = useProductionEserviceDetailsContext();
  const eserviceId = unsafeBrandId<EserviceId>(eservice.id);
  const isAdmin = useHasRole("administrative");

  const { data, isLoading } = useQuery(
    eserviceLinkedProducerKeychainsQuery(eserviceId),
  );

  const keychains = data?.results ?? [];
  const linkedKeychainIds = keychains.map((keychain) => keychain.id);

  return (
    <Section
      actions={
        isAdmin ? (
          <LinkKeychainAction
            eserviceId={eserviceId}
            linkedKeychainIds={linkedKeychainIds}
          />
        ) : undefined
      }
      title="Keychains"
    >
      <ProducerKeychainsTable
        emptyState={<EserviceKeychainsEmptyState isAdmin={isAdmin} />}
        isLoading={isLoading}
        keychains={keychains}
        rowActions={
          isAdmin
            ? (keychain) => (
                <UnlinkKeychainAction
                  eserviceId={eserviceId}
                  keychain={keychain}
                />
              )
            : undefined
        }
      />
    </Section>
  );
}

function EserviceKeychainsEmptyState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <Banner
      icon={isAdmin ? <SelectionPlusIcon /> : <SelectionIcon />}
      kind="neutral"
    >
      {isAdmin
        ? "Link a Production Keychain to sign responses from the E-Service."
        : "There are no Keychains connected to this E-Service yet."}
    </Banner>
  );
}
