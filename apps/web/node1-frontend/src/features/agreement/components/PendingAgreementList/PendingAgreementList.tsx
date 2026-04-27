import type { bffApi } from "@knodia/bff-client";

import { Banner } from "@knodia/ui-kit/ui";
import { CheckCircleIcon } from "@phosphor-icons/react";

import { KnodeAvatar } from "@/components/KnodeAvatar";
import { RecentlyUpdatedChip } from "@/components/RecentlyUpdatedChip";
import { CategoryChip } from "@/features/e-service/components/CategoryChip";
import {
  EserviceCard,
  EserviceCardFooter,
  EserviceCardHeader,
} from "@/features/e-service/components/EserviceCard";

export function PendingAgreementList({
  agreements,
}: {
  agreements: bffApi.PendingConsumerAgreement[];
}) {
  if (agreements.length === 0) {
    return (
      <Banner icon={<CheckCircleIcon />} kind="neutral">
        No actions are needed.
      </Banner>
    );
  }

  return (
    <ul className="flex flex-col gap-4" role="list">
      {agreements.map((agreement) => (
        <li key={agreement.id}>
          <PendingAgreementCard agreement={agreement} />
        </li>
      ))}
    </ul>
  );
}

function PendingAgreementCard({
  agreement,
}: {
  agreement: bffApi.PendingConsumerAgreement;
}) {
  return (
    <EserviceCard>
      <EserviceCardHeader
        badge={
          agreement.hasRecentlyBeenUpdated ? <RecentlyUpdatedChip /> : undefined
        }
        id={agreement.eservice.id}
        search={{ knodeId: agreement.producer.knodeId }}
        title={agreement.eservice.name.en}
        to="/consumption/e-services/$id"
      />
      <EserviceCardFooter
        mode={agreement.eservice.mode}
        state={agreement.eservice.state}
        trailing={
          <KnodeAvatar
            className="bg-brand-dark text-white"
            knodeId={agreement.producer.knodeId}
            name={agreement.producer.name}
            size="sm"
          />
        }
      >
        {agreement.eservice.categories.map((category) => (
          <CategoryChip
            code={category.code}
            key={category.code}
            scheme={category.scheme}
          />
        ))}
      </EserviceCardFooter>
    </EserviceCard>
  );
}
