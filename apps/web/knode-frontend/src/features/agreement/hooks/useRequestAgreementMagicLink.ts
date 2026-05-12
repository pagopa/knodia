import type { AgreementId, KnodeId } from "@knodia/common-models/ids";

import { createAgreementConsumerActivationMagicLinkMutation } from "@knodia/bff-client/tanstack-query";
import { toastQueue } from "@knodia/ui-kit/ui";
import { useMutation } from "@tanstack/react-query";

import { client } from "@/libs/axios";

interface UseRequestAgreementMagicLinkParams {
  agreementId: AgreementId;
  knodeId: KnodeId;
}

export function useRequestAgreementMagicLink({
  agreementId,
  knodeId,
}: UseRequestAgreementMagicLinkParams) {
  const { isPending, mutate } = useMutation(
    createAgreementConsumerActivationMagicLinkMutation({ client }),
  );

  const requestMagicLink = () => {
    // Open the placeholder synchronously under the user activation that
    // triggered this handler — popup blockers will block any window.open
    // that runs after an `await`. We do NOT pass "noopener" here because
    // browsers honoring it return null and there would be no `win` handle
    // to navigate when the URL arrives. Setting `win.opener = null`
    // afterwards gives equivalent isolation.
    const win = window.open("about:blank", "_blank");
    if (win) win.opener = null;

    mutate(
      { path: { agreementId }, query: { knodeId } },
      {
        onError: () => {
          win?.close();
          toastQueue.add({
            description: "Please try again later.",
            kind: "error",
            title: "Unable to start activation",
          });
        },
        onSuccess: ({ url }) => {
          if (win && !win.closed) {
            win.location.href = url;
          } else {
            toastQueue.add({
              description: "Allow popups, then click again.",
              kind: "error",
              title: "Popup blocked",
            });
          }
        },
      },
    );
  };

  return { isPending, requestMagicLink };
}
