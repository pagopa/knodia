import type { bffApi } from "@knodia/bff-client";

import { Banner } from "@knodia/ui-kit/ui";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";

import { KnodeAvatar } from "@/components/KnodeAvatar";
import { CategoryChip } from "@/features/e-service/components/CategoryChip";
import { EserviceModeChip } from "@/features/e-service/components/EserviceModeChip";
import { EserviceStateChip } from "@/features/e-service/components/EserviceStateChip";

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
    <ul className="flex flex-col divide-y divide-primary-light-decorative">
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
    <div className="flex items-center gap-4 py-4">
      <Link
        className="title-md-em text-primary-light-high-contrast hover:underline shrink-0"
        params={{ id: agreement.eservice.id }}
        search={{ knodeId: agreement.producer.knodeId }}
        to="/consumption/e-services/$id"
      >
        {agreement.eservice.name.en}
      </Link>

      <div className="flex flex-1 items-center gap-2">
        <EserviceStateChip state={agreement.eservice.state} />
        <EserviceModeChip mode={agreement.eservice.mode} />
        {agreement.eservice.categories.map((category) => (
          <CategoryChip
            code={category.code}
            key={category.code}
            scheme={category.scheme}
          />
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <KnodeAvatar
          className="bg-brand-dark text-white"
          knodeId={agreement.producer.knodeId}
          name={agreement.producer.name}
          size="sm"
        />
        <span className="label-md text-primary-light-low-contrast">
          {agreement.producer.name}
        </span>
      </div>
    </div>
  );
}
