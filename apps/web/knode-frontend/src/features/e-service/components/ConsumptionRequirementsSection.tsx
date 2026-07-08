import type { bffApi } from "@knodia/bff-client";
import type { EserviceId, KnodeId } from "@knodia/common-models/ids";

import { Banner } from "@knodia/ui-kit/ui";
import { SealCheckIcon, WarningIcon } from "@phosphor-icons/react";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";

import { AttributeGroupContainer } from "@/components/AttributeGroupContainer";
import { ButtonLinkWithPreload } from "@/components/routerLinks";
import { Section } from "@/components/Section";

export function ConsumptionRequirementsSection({
  canRequestAgreement,
  eserviceId,
  eserviceState,
  hasAgreement,
  hasRequiredAttributes,
  identificationRequired,
  knodeId,
  requiredAttributes,
}: Pick<
  ConsumptionEserviceDetail,
  "hasRequiredAttributes" | "identificationRequired" | "requiredAttributes"
> & {
  canRequestAgreement: boolean;
  eserviceId: EserviceId;
  eserviceState: bffApi.EserviceVersionState;
  hasAgreement: boolean;
  knodeId: KnodeId;
}) {
  return (
    <Section title="Consumption requirements">
      <div className="grid grid-cols-2 gap-10">
        <div>
          <h3 className="title-sm-em text-primary-light-low-contrast mb-4">
            Attributes
          </h3>
          {requiredAttributes.length > 0 && (
            <ul className="gap-2 flex flex-col mb-6" role="list">
              {requiredAttributes.map((group, index) => (
                <li key={index}>
                  <AttributeGroupContainer attributes={group} />
                </li>
              ))}
            </ul>
          )}

          {/* An archived E-service can no longer be consumed, so the attribute
              status banner and its Request Agreement button are hidden. */}
          {eserviceState !== "Archived" && (
            <Banner
              className="[&>div:last-child]:flex-1"
              icon={hasRequiredAttributes ? <SealCheckIcon /> : <WarningIcon />}
              kind={hasRequiredAttributes ? "neutral" : "warning"}
            >
              <div className="flex items-center justify-between gap-4">
                <span>
                  {hasRequiredAttributes
                    ? "Your organization has the required attributes."
                    : "Your organization does not have the required attributes."}
                </span>
                {canRequestAgreement &&
                  hasRequiredAttributes &&
                  !hasAgreement && (
                    <ButtonLinkWithPreload
                      className="shrink-0"
                      hierarchy="brand"
                      kind="filled"
                      search={{ eserviceId, knodeId }}
                      size="md"
                      to="/consumption/e-services/request-agreement"
                    >
                      Request Agreement
                    </ButtonLinkWithPreload>
                  )}
              </div>
            </Banner>
          )}
        </div>

        <div>
          <h3 className="title-sm-em text-primary-light-low-contrast mb-4">
            Identification
          </h3>
          {identificationRequired ? (
            <Banner kind="informative">Identification required</Banner>
          ) : (
            <Banner kind="neutral">Identification not required</Banner>
          )}
        </div>
      </div>
    </Section>
  );
}
