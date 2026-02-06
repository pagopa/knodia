import { getEservicesOptions } from "@knodia/bff-client/tanstack-query";
import {
  Banner,
  Breadcrumb,
  Breadcrumbs,
  Button,
  Chip,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { GenericInfoCard } from "@/components/GenericInfoCard";
import { PageHeader } from "@/components/PageHeader";
import { ResourceId } from "@/components/ResourceId";
import { EserviceModeChip } from "@/features/e-service/components/EserviceModeChip";
import { EserviceStateChip } from "@/features/e-service/components/EserviceStateChip";
import { client } from "@/libs/axios";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const eserviceQuery = (_id: string) =>
  getEservicesOptions({
    client,
    query: { limit: 1, offset: 0 },
  });

export const Route = createFileRoute("/production/e-services_/$id")({
  component: RouteComponent,
  loader: async ({ context: { queryClient }, params: { id } }) =>
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    (await queryClient.ensureQueryData(eserviceQuery(id))).items[0]!,
});

const tabItems = [
  { content: <DetailsTab />, id: 1, title: "Details" },
  { content: "Tab body 2", id: 2, title: "Consumption" },
  { content: "Tab body 3", id: 3, title: "Keychains" },
] as const;

function DetailsTab() {
  return (
    <div>
      <section>
        <h2 className="headline-sm-em text-primary-light-high-contrast mb-6">
          Consumption requirements
        </h2>
        <div className="grid grid-cols-2 gap-10">
          <div>
            <h3 className="title-sm-em text-primary-light-low-contrast mb-4">
              Attributes
            </h3>
            <ul className="gap-2 flex flex-col" role="list">
              <li>
                <GenericInfoCard label="Attribute 1">-</GenericInfoCard>
              </li>
              <li>
                <GenericInfoCard label="Attribute 2">-</GenericInfoCard>
              </li>
              <li>
                <GenericInfoCard label="Attribute 3">-</GenericInfoCard>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="title-sm-em text-primary-light-low-contrast mb-4">
              Identification
            </h3>
            <Banner kind="informative">Identification required</Banner>
          </div>
        </div>
      </section>
    </div>
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
        actions={
          <>
            <Button hierarchy="danger" kind="tonal" size="md">
              Suspend
            </Button>
            <Button hierarchy="brand" kind="filled" size="md">
              Edit
            </Button>
          </>
        }
        resourceStatusChip={<EserviceStateChip state="Active" />}
        title={eservice.name.en}
      >
        <ResourceId className="mt-3" id={eservice.id} />
        <p className="mt-6 body-md text-primary-light-low-contrast">
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

      <Tabs className="mt-10" kind="hug">
        <TabList items={tabItems}>
          {(item) => (
            <Tab id={item.id} key={item.id}>
              {item.title}
            </Tab>
          )}
        </TabList>
        <TabPanels items={tabItems}>
          {(item) => (
            <TabPanel id={item.id} key={item.id}>
              {item.content}
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </>
  );
}
