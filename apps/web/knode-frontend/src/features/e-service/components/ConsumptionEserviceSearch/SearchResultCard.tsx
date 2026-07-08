import { Banner } from "@knodia/ui-kit/ui";
import { SealCheckIcon, WarningDiamondIcon } from "@phosphor-icons/react";

import type { ConsumptionEserviceSearchResult } from "@/features/e-service/models/consumption-eservice-search";

import { KnodeAvatar } from "@/components/KnodeAvatar";
import { ServiceCard } from "@/components/ServiceCard";

import { CategoryChip } from "../CategoryChip";
import { EserviceCardFooter, EserviceCardHeader } from "../EserviceCard";

export function SearchResultCard({
  eservice,
  knodeId,
}: {
  eservice: ConsumptionEserviceSearchResult;
  knodeId: string;
}) {
  return (
    <ServiceCard>
      <EserviceCardHeader
        description={eservice.description}
        id={eservice.id}
        search={{ knodeId }}
        title={eservice.name}
        to="/consumption/e-services/$id"
      />

      <AttributesBanner
        hasRequiredAttributes={eservice.hasRequiredAttributes}
      />

      <EserviceCardFooter
        mode={eservice.mode}
        state={eservice.state}
        trailing={
          <KnodeAvatar
            className="bg-brand-dark text-white"
            knodeId={eservice.organization.knodeId}
            name={eservice.organization.name}
            size="sm"
          />
        }
      >
        {eservice.categories.map((category) => (
          <CategoryChip
            code={category.code}
            key={category.code}
            scheme={category.scheme}
          />
        ))}
      </EserviceCardFooter>
    </ServiceCard>
  );
}

function AttributesBanner({
  hasRequiredAttributes,
}: {
  hasRequiredAttributes: boolean;
}) {
  if (hasRequiredAttributes) {
    return (
      <Banner icon={<SealCheckIcon />} kind="neutral">
        Your organization has the required attributes.
      </Banner>
    );
  }

  return (
    <Banner icon={<WarningDiamondIcon />} kind="error">
      Your organization doesn't have the required attributes.
    </Banner>
  );
}
