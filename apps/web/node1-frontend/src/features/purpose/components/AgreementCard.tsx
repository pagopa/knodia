import type { bffApi } from "@knodia/bff-client";
import type { ReactNode } from "react";

import { AgreementStateChip } from "@/features/agreement/components/AgreementStateChip";

export function AgreementCard({
  action,
  agreement,
}: {
  action: ReactNode;
  agreement: bffApi.CompactAgreement;
}) {
  return (
    <article className="mt-10 p-4 flex items-center justify-between rounded-2xl elevation-1 border border-slate-100">
      <span className="flex items-center gap-4">
        <span className="body-lg-em">Agreement</span>
        <AgreementStateChip state={agreement.state} type="light" />
      </span>
      {action}
    </article>
  );
}
