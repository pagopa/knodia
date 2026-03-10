import { Avatar, Banner } from "@knodia/ui-kit/ui";
import { SealCheckIcon, WarningDiamondIcon } from "@phosphor-icons/react";

import type { ConsumptionEserviceSearchResult } from "@/features/e-service/models/consumption-eservice-search";

import { CategoryChip } from "../CategoryChip";
import {
  EserviceCard,
  EserviceCardFooter,
  EserviceCardHeader,
} from "../EserviceCard";

export function SearchResultCard({
  eservice,
  knodeId,
}: {
  eservice: ConsumptionEserviceSearchResult;
  knodeId: string;
}) {
  return (
    <EserviceCard>
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
          <Avatar
            className="bg-brand-dark text-white"
            fallback={eservice.organization.initials}
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
            showIcon={false}
          />
        ))}
      </EserviceCardFooter>
    </EserviceCard>
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
