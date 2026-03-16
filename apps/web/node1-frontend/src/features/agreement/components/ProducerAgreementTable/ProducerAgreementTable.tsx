import type { bffApi } from "@knodia/bff-client";

import { Avatar, ButtonLink, Empty, Loader } from "@knodia/ui-kit/ui";
import { ArrowRightIcon, SelectionIcon } from "@phosphor-icons/react";
import { createLink } from "@tanstack/react-router";

import type { ProducerAgreementState } from "@/features/agreement/models/types";

import { getOrganizationInitials } from "@/utils/getOrganizationInitials";

import { AgreementStateChip } from "./AgreementStateChip";

const ButtonLinkWithPreload = createLink(ButtonLink);

export function ProducerAgreementTable({
  agreements,
  isLoading,
}: {
  agreements: bffApi.ProducerAgreement[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (agreements.length === 0) {
    return (
      <Empty
        description="Agreements requested for your E-Services by Consumer Organizations will appear here."
        icon={<SelectionIcon />}
        title="There are no Agreements for your E-Services."
      />
    );
  }

  // TODO: Replace with React Aria Table component from ui-kit
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-slate-200 text-left">
          <th className="pb-3 label-md text-primary-light-low-contrast">
            E-Service
          </th>
          <th className="pb-3 label-md text-primary-light-low-contrast">
            Consumer
          </th>
          <th className="pb-3 label-md text-primary-light-low-contrast">
            Status
          </th>
          <th className="pb-3" />
        </tr>
      </thead>
      <tbody>
        {agreements.map((agreement) => (
          <tr
            className="border-b border-slate-100 align-middle"
            key={agreement.id}
          >
            <td className="py-3 body-md">{agreement.eservice.name.en}</td>
            <td className="py-3">
              <div className="flex items-center gap-2">
                <Avatar
                  className="bg-brand-dark text-white"
                  fallback={getOrganizationInitials(agreement.consumer.name)}
                  name={agreement.consumer.name}
                  size="sm"
                />
              </div>
            </td>
            <td className="py-3">
              <AgreementStateChip
                state={agreement.state as ProducerAgreementState}
              />
            </td>
            <td className="py-3 text-right">
              <ButtonLinkWithPreload
                aria-label="Go to agreement"
                hierarchy="neutral"
                kind="outlined"
                params={{ id: agreement.id }}
                size="icon-md"
                to="/production/agreements/$id"
              >
                <ArrowRightIcon />
              </ButtonLinkWithPreload>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
