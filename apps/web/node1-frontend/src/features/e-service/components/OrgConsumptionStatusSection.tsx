import type { bffApi } from "@knodia/bff-client";
import type { EserviceId, KnodeId } from "@knodia/common-models/ids";

import { Banner } from "@knodia/ui-kit/ui";
import {
  CaretDownIcon,
  CaretUpIcon,
  SelectionIcon,
  SelectionPlusIcon,
} from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";
import { useContext } from "react";
import {
  Button,
  Disclosure,
  DisclosurePanel,
  DisclosureStateContext,
  Heading,
} from "react-aria-components";
import { match } from "ts-pattern";

import { useHasRole } from "@/contexts/auth";

export function OrgConsumptionStatusSection({
  agreement,
  eserviceId,
  knodeId,
}: {
  agreement: bffApi.EserviceAgreementDetail;
  eserviceId: EserviceId;
  knodeId: KnodeId;
}) {
  const canManageConsumption = useHasRole("administrative");
  const navigate = useNavigate();

  return (
    <Disclosure
      className="flex flex-col rounded-lg border border-primary-light-decorative px-6 pt-6 data-[expanded]:pb-6 elevation-2"
      defaultExpanded
    >
      <CollapseTrigger />

      <DisclosurePanel className="mt-6 flex flex-col gap-6">
        <AgreementStatusBanner
          canManageAgreement={canManageConsumption}
          state={agreement.state}
        />

        <div className="flex flex-col gap-4">
          <h3 className="title-md-em text-primary-light-low-contrast">
            Purposes
          </h3>
          <Banner
            action={
              canManageConsumption
                ? {
                    label: "Create Purpose",
                    onPress: () =>
                      navigate({
                        params: { id: eserviceId },
                        search: { knodeId },
                        to: "/consumption/e-services/$id/purposes/new",
                      }),
                  }
                : undefined
            }
            icon={<SelectionPlusIcon />}
            kind="neutral"
          >
            You don&apos;t have any Purpose for this E-Service.
          </Banner>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="title-md-em text-primary-light-low-contrast">
            Keychains
          </h3>
          <Banner icon={<SelectionIcon />} kind="neutral">
            To request an access token for this E-Service, associate a Keychain
            to a Purpose from the Purpose page. Associated Keychain will appear
            here.
          </Banner>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}

// TODO: implement the "Action needed" agreement state
function AgreementStatusBanner({
  canManageAgreement,
  state,
}: {
  canManageAgreement: boolean;
  state: bffApi.AgreementState;
}) {
  const banner = match(state)
    .with("Active", () => (
      <Banner
        action={
          canManageAgreement
            ? {
                label: "Suspend",
                // TODO: implement suspend agreement action
              }
            : undefined
        }
        kind="success"
      >
        Active
      </Banner>
    ))
    // TODO: this handles consumer-initiated suspension only.
    // Producer-initiated suspension is not handled yet.
    .with("Suspended", () => (
      <Banner
        action={
          canManageAgreement
            ? {
                label: "Archive",
                // TODO: implement archive agreement action
              }
            : undefined
        }
        kind="error"
        prominentAction={
          canManageAgreement
            ? {
                label: "Reactivate",
                // TODO: implement reactivate agreement action
              }
            : undefined
        }
      >
        Suspended
      </Banner>
    ))
    .with("Archived", () => {
      console.warn(
        "Unexpected Archived agreement in consumption status section",
      );
      return null;
    })
    .exhaustive();

  if (!banner) return null;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="title-md-em text-primary-light-low-contrast">Agreement</h3>
      {banner}
    </div>
  );
}

function CollapseTrigger() {
  const state = useContext(DisclosureStateContext);
  const isExpanded = state?.isExpanded ?? false;

  return (
    <Heading level={2}>
      <Button
        className="flex w-full cursor-pointer items-center justify-between"
        slot="trigger"
      >
        <span className="title-lg-em text-primary-light-high-contrast">
          Your Org&apos;s consumption status
        </span>
        <span className="flex items-center gap-4">
          {/* TODO: "Recent update" chip - not implemented yet, needs real update tracking */}
          <span
            aria-hidden
            className="flex items-center justify-center rounded-[7px] bg-slate-100 p-2"
          >
            {isExpanded ? (
              <CaretUpIcon size={20} />
            ) : (
              <CaretDownIcon size={20} />
            )}
          </span>
        </span>
      </Button>
    </Heading>
  );
}
