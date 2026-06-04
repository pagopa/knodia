import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import { useQuery } from "@tanstack/react-query";

import { Section } from "@/components/Section";
import { useHasRole } from "@/contexts/auth";
import { ProducerKeychainsTable } from "@/features/keychain/components/ProducerKeychainsTable";

import { useProductionEserviceDetailsContext } from "../../contexts/useProductionEserviceDetailsContext";
import { eserviceLinkedProducerKeychainsQuery } from "../../services/queries";
import { EserviceKeychainsEmptyState } from "../EserviceKeychainsEmptyState";
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
        emptyState={<EserviceKeychainsEmptyState />}
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
