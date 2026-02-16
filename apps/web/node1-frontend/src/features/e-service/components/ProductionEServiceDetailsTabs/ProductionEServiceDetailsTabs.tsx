import type { EserviceDetails } from "@knodia/bff-client";

import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@knodia/ui-kit/ui";

import { ProductionEserviceDetailsProvider } from "../../contexts/ProductionEserviceDetailsProvider";
import { ProductionEServiceConsumptionTab } from "./ProductionEServiceConsumptionTab";
import { ProductionEServiceDetailsTab } from "./ProductionEServiceDetailsTab";
import { ProductionEServiceKeychainsTab } from "./ProductionEServiceKeychainsTab";

const tabItems = [
  { content: <ProductionEServiceDetailsTab />, id: 1, title: "Details" },
  {
    content: <ProductionEServiceConsumptionTab />,
    id: 2,
    title: "Consumption",
  },
  { content: <ProductionEServiceKeychainsTab />, id: 3, title: "Keychains" },
] as const;

export function ProductionEServiceDetailsTabs({
  eservice,
}: {
  eservice: EserviceDetails;
}) {
  return (
    <ProductionEserviceDetailsProvider eservice={eservice}>
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
    </ProductionEserviceDetailsProvider>
  );
}
