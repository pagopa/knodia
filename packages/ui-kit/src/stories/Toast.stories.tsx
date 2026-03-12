import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../components/ui/Button";
import {
  type ToastContent,
  toastQueue,
  ToastRegion,
} from "../components/ui/Toast";

const meta: Meta = {
  title: "Components/ui/Toast",
  decorators: [
    (Story) => (
      <>
        <Story />
        <ToastRegion />
      </>
    ),
  ],
};

export default meta;
type Story = StoryObj;

function ToastTrigger({
  content,
  label,
}: {
  content: ToastContent;
  label: string;
}) {
  return (
    <Button onPress={() => toastQueue.add(content, { timeout: 5000 })}>
      {label}
    </Button>
  );
}

export const Neutral: Story = {
  render: () => (
    <ToastTrigger
      content={{
        title: "Neutral toast",
        description: "This is a neutral message",
      }}
      label="Show Neutral Toast"
    />
  ),
};

export const Informative: Story = {
  render: () => (
    <ToastTrigger
      content={{
        title: "Info toast",
        description: "Here is some info",
        kind: "informative",
      }}
      label="Show Informative Toast"
    />
  ),
};

export const Success: Story = {
  render: () => (
    <ToastTrigger
      content={{
        title: "Success!",
        description: "Operation completed",
        kind: "success",
      }}
      label="Show Success Toast"
    />
  ),
};

export const Warning: Story = {
  render: () => (
    <ToastTrigger
      content={{
        title: "Warning",
        description: "Something needs attention",
        kind: "warning",
      }}
      label="Show Warning Toast"
    />
  ),
};

export const Error: Story = {
  render: () => (
    <ToastTrigger
      content={{
        title: "Error",
        description: "Something went wrong",
        kind: "error",
      }}
      label="Show Error Toast"
    />
  ),
};

export const MultipleToasts: Story = {
  render: () => (
    <div className="flex gap-2">
      <ToastTrigger
        content={{ title: "Success!", description: "Saved", kind: "success" }}
        label="Success"
      />
      <ToastTrigger
        content={{ title: "Error", description: "Failed", kind: "error" }}
        label="Error"
      />
      <ToastTrigger
        content={{ title: "Info", description: "FYI", kind: "informative" }}
        label="Info"
      />
    </div>
  ),
};
