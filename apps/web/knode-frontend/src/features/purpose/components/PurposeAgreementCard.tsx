import type { bffApi } from "@knodia/bff-client";
import type { ReactNode } from "react";

import { AgreementStateChip } from "@/features/agreement/components/AgreementStateChip";

export function PurposeAgreementCard({
  action,
  agreement,
}: {
  action: ReactNode;
  agreement: bffApi.CompactAgreement;
}) {
  return (
    <article className="mt-10 p-4 flex items-center justify-between rounded-card shadow-card border border-card-border">
      <span className="flex items-center gap-4">
        <span className="body-lg-em">Agreement</span>
        <AgreementStateChip state={agreement.state} type="light" />
      </span>
      {action}
    </article>
  );
}
