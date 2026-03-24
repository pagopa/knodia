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

export function OrgConsumptionStatusSection({
  eserviceId,
  knodeId,
}: {
  eserviceId: EserviceId;
  knodeId: KnodeId;
}) {
  const navigate = useNavigate();

  return (
    <Disclosure
      className="flex flex-col gap-6 rounded-lg border border-primary-light-decorative p-6 elevation-2"
      defaultExpanded
    >
      <CollapseTrigger />

      <DisclosurePanel className="flex flex-col gap-6">
        {/* TODO(KN-287): add Agreement status section here.
            Show active state (success banner with Suspend action)
            or requested state (informative banner with "Go to IT Knode" action) */}

        <div className="flex flex-col gap-4">
          <h3 className="title-md-em text-primary-light-low-contrast">
            Purposes
          </h3>
          <Banner
            action={{
              label: "Create Purpose",
              onPress: () =>
                navigate({
                  params: { id: eserviceId },
                  search: { knodeId },
                  to: "/consumption/e-services/$id/purposes/new",
                }),
            }}
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
