import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tab, TabList, TabPanel, Tabs } from "../components/ui/Tabs";

const meta: Meta<typeof Tabs> = {
  title: "Components/ui/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

const labels = ["Label", "Label", "Label", "Label", "Label"] as const;

function renderTabs(kind: "hug" | "fill") {
  return (
    <div className="w-[800px]">
      <Tabs defaultSelectedKey="tab-1" kind={kind}>
        <TabList aria-label="Tabs">
          {labels.map((label, index) => (
            <Tab id={`tab-${index + 1}`} key={label + index}>
              {label}
            </Tab>
          ))}
        </TabList>
        {labels.map((label, index) => (
          <TabPanel id={`tab-${index + 1}`} key={label + index}>
            <div className="body-md mt-4">Panel {index + 1}</div>
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
}

export const Hug: Story = {
  render: () => renderTabs("hug"),
};

export const Fill: Story = {
  render: () => renderTabs("fill"),
};
