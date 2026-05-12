import type { bffApi } from "@knodia/bff-client";

import { activateAgreementMutation } from "@knodia/bff-client/tanstack-query";
import { Banner, Button, toastQueue } from "@knodia/ui-kit/ui";
import { CheckSquareIcon } from "@phosphor-icons/react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { isAxiosError } from "axios";
import { match } from "ts-pattern";

import { OrganizationCard } from "@/components/OrganizationCard";
import { SettingsCard } from "@/components/SettingCard";
import { agreementActivationDetailsQuery } from "@/features/external-agreement-activation/queries";
import { ExternalLayout } from "@/layouts/ExternalLayout";
import { getExternalToken } from "@/libs/external-auth";
import { externalClient } from "@/libs/external-axios";

export const Route = createFileRoute("/agreement-activation/recap")({
  beforeLoad: async ({ context }) => {
    if (!getExternalToken()) {
      throw redirect({ to: "/agreement-activation" });
    }
    await context.queryClient.fetchQuery(agreementActivationDetailsQuery());
  },
  component: AgreementActivationRecapPage,
});

interface RecapCardProps {
  details: bffApi.AgreementActivationDetails;
  isActivating: boolean;
  onActivate: () => void;
}

export function AgreementActivationRecapPage() {
  const queryClient = useQueryClient();

  const detailsQuery = useSuspenseQuery(agreementActivationDetailsQuery());

  const { isPending: isActivating, mutate: activateAgreement } = useMutation({
    ...activateAgreementMutation({ client: externalClient }),
    onError: async (error) => {
      if (isAxiosError(error) && error.response?.status === 409) {
        // 409: agreement transitioned out of pending between load and click.
        // Refetch so the page re-renders with whatever the current state is.
        await detailsQuery.refetch();
        return;
      }
      toastQueue.add({
        description: "Please try again later.",
        kind: "error",
        title: "Unable to activate Agreement",
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries(agreementActivationDetailsQuery());
    },
  });

  const details = detailsQuery.data;

  return (
    <ExternalLayout>
      {match(details.agreement.state)
        .with("PendingConsumerOperatorIdentification", () => (
          <RecapCard
            details={details}
            isActivating={isActivating}
            onActivate={() => activateAgreement({})}
          />
        ))
        .with("Active", () => <ConfirmationCard />)
        .with("Suspended", "Archived", () => (
          <CenteredBox>
            <Banner kind="error" size="md" title="Cannot activate Agreement">
              This agreement is no longer in a state where it can be activated.
              Return to your Knode.
            </Banner>
          </CenteredBox>
        ))
        .exhaustive()}
    </ExternalLayout>
  );
}

function CenteredBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      {children}
    </div>
  );
}

function ConfirmationCard() {
  return (
    <div className="mx-auto flex w-full max-w-160 flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-light text-success-light-high-contrast">
        <CheckSquareIcon size={24} />
      </div>
      <h1 className="title-lg-em text-primary-light-high-contrast">
        Agreement activated!
      </h1>
      <p className="body-md text-primary-light-low-contrast">
        Your Agreement is now active. Return to your Knode to start creating
        Purposes.
      </p>
    </div>
  );
}

function RecapCard({ details, isActivating, onActivate }: RecapCardProps) {
  return (
    <div className="mx-auto flex w-full max-w-160 flex-col items-stretch gap-8 py-8">
      <h1 className="headline-md text-center text-on-primary-light-high-contrast">
        Activate your Agreement
      </h1>

      <SettingsCard label="E-Service">{details.eservice.name.en}</SettingsCard>

      <div className="grid grid-cols-2 gap-4">
        <OrganizationCard
          label="Producer"
          organization={details.producer}
          showContact={false}
        />
        <OrganizationCard
          label="Consumer"
          organization={details.consumer}
          showContact={false}
        />
      </div>

      <Button
        hierarchy="brand"
        isDisabled={isActivating}
        kind="filled"
        onClick={onActivate}
        size="lg"
        type="button"
      >
        Activate Agreement
      </Button>
    </div>
  );
}
