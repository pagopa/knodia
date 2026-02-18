import { categories } from "@knodia/category-models";
import { Avatar, Banner, Chip } from "@knodia/ui-kit/ui";
import { SealCheckIcon, WarningDiamondIcon } from "@phosphor-icons/react";

import type { ConsumptionEserviceSearchResult } from "@/routes/consumption/e-services_/consumption-eservice-search.mock";

import { getSchemeRefLabel } from "../../utils/schemeRef";
import {
  EserviceCard,
  EserviceCardFooter,
  EserviceCardHeader,
} from "../EserviceCard";

export function ConsumptionEserviceSearchResultCard({
  eservice,
}: {
  eservice: ConsumptionEserviceSearchResult;
}) {
  return (
    <EserviceCard>
      <EserviceCardHeader
        description={eservice.description}
        id={eservice.id}
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
          <div className="flex shrink-0 items-center gap-2">
            <Avatar fallback={eservice.organization.initials} size="sm" />
            <span className="label-md text-primary-light-high-contrast">
              {eservice.organization.name}
            </span>
          </div>
        }
      >
        {eservice.categories.map((category) => (
          <Chip
            key={category.code}
            kind="neutral"
            label={getSchemeRefLabel(categories, category.code)}
            type="light"
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
