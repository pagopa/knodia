import type { ProducerEserviceDetails } from "@knodia/bff-client";

import { getProducerEserviceDetailsOptions } from "@knodia/bff-client/tanstack-query";
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Chip,
  Modal,
} from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";
import { DialogTrigger } from "react-aria-components";

import { CopyableValueField } from "@/components/CopyableValueField";
import { PageHeader } from "@/components/PageHeader";
import { EserviceModeChip } from "@/features/e-service/components/EserviceModeChip";
import { EserviceStateChip } from "@/features/e-service/components/EserviceStateChip";
import { ProductionEServiceDetailsTabs } from "@/features/e-service/components/ProductionEServiceDetailsTabs";
import { client } from "@/libs/axios";

const eserviceQuery = (eserviceId: string) =>
  getProducerEserviceDetailsOptions({
    client,
    path: { eserviceId },
  });

export const Route = createFileRoute("/production/e-services_/$id")({
  component: RouteComponent,
  loader: async ({ context: { queryClient }, params: { id } }) =>
    await Promise.resolve({
      agreements: {
        active: 3,
        total: 5,
      },
      categories: [
        {
          code: "citizen.residence.residence_place",
          scheme: "vc_example_eservice_categories",
        },
      ],
      createdAt: "2026-02-17T10:00:00.000Z",
      description: {
        en: "Service for validating company VAT registration status.",
      },
      id: "00000000-0000-4000-a000-000000000123",
      isConsumerOperatorIdentificationRequired: false,
      isSignalHubEnabled: true,
      mode: "ProvideData",
      name: {
        en: "Company VAT Validation Service",
      },
      producerId: "30000000-0000-4000-a000-000000000001",
      purposes: {
        active: 1,
        total: 2,
        totalApiCallsPerDay: 15000,
      },
      updatedAt: "2026-02-17T10:00:00.000Z",
      version: {
        accessTokenAudience: ["api://knodia/eservice/vat-validation"],
        accessTokenDuration: 3600,
        accessTokenType: "Bearer",
        createdAt: "2026-02-17T10:00:00.000Z",
        id: "10000000-0000-4000-a000-000000000001",
        maxDailyCallsPerConsumer: 100,
        maxDailyCallsPerKnode: 1000,
        requiredAttributes: [
          [{ code: "nuts1", scheme: "vc_territorial_units" }],
        ],
        state: "Active",
        updatedAt: "2026-02-17T10:00:00.000Z",
        versionNumber: 1,
      },
    } satisfies ProducerEserviceDetails),
});

function EServiceActions() {
  return (
    <>
      <DialogTrigger>
        <Button hierarchy="danger" kind="tonal" size="md">
          Suspend
        </Button>
        <Modal
          actionLabel="Suspend anyway"
          description="Suspending an E-Service causes malfunctioning in all the services that use it. Are you sure you want to suspend this E-Service? You will be able to reactivate it later."
          isDismissable
          kind="destructive"
          title="Suspend E-Service"
        />
      </DialogTrigger>
      <DialogTrigger>
        <Button hierarchy="brand" kind="filled" size="md">
          Edit
        </Button>
        <Modal actionLabel="Confirm" kind="default" title="Edit E-Service">
          TODO
        </Modal>
      </DialogTrigger>
    </>
  );
}

function RouteComponent() {
  const eservice = Route.useLoaderData();

  return (
    <>
      <Breadcrumbs className="mb-10">
        <Breadcrumb isDisabled>Production</Breadcrumb>
        <Breadcrumb href={{ to: "/production/e-services" }}>
          E-Services
        </Breadcrumb>
        <Breadcrumb>{eservice.name.en}</Breadcrumb>
      </Breadcrumbs>

      <PageHeader
        actions={<EServiceActions />}
        resourceStatusChip={
          <EserviceStateChip state={eservice.version.state} />
        }
        title={eservice.name.en}
      >
        <CopyableValueField className="mt-3" label="ID" value={eservice.id} />
        <p className="mt-6 body-md text-primary-light-low-contrast max-w-160">
          {eservice.description.en}
        </p>
      </PageHeader>

      <div className="mt-10 flex gap-2">
        <EserviceModeChip mode={eservice.mode} />
        {eservice.categories.map((category) => (
          <Chip
            key={category.code}
            kind="neutral"
            label={category.code}
            type="light"
          />
        ))}
      </div>

      <ProductionEServiceDetailsTabs eservice={eservice} />
    </>
  );
}
