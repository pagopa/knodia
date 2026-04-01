import type { bffApi } from "@knodia/bff-client";

import { ButtonLink } from "@knodia/ui-kit/ui";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { createLink } from "@tanstack/react-router";
import { twMerge } from "tailwind-merge";

import { AgreementStateChip } from "./AgreementStateChip";

const RouterButtonLink = createLink(ButtonLink);

export function AgreementCard({
  agreement,
  className,
}: {
  agreement: bffApi.CompactAgreement;
  className?: string;
}) {
  return (
    <article
      className={twMerge(
        "p-4 flex items-center justify-between rounded-2xl elevation-1 border border-slate-100",
        className,
      )}
    >
      <span className="flex items-center gap-4">
        <span className="body-lg-em">Agreement</span>
        <AgreementStateChip state={agreement.state} type="light" />
      </span>
      <RouterButtonLink
        aria-label="Go to agreement"
        hierarchy="neutral"
        kind="tonal"
        params={{ id: agreement.id }}
        size="icon-md"
        to="/production/agreements/$id"
      >
        <ArrowRightIcon />
      </RouterButtonLink>
    </article>
  );
}
