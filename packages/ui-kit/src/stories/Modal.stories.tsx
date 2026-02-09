import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";
import { DialogTrigger } from "react-aria-components";

import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";

const meta: Meta<typeof Modal> = {
  args: {
    title: "Modal Title",
    description: "This is a description that provides additional context.",
    actionLabel: "Action",
    kind: "default",
    isDismissable: true,
  },
  title: "Components/ui/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
        <Button>Open Modal</Button>
        <Modal
          {...args}
          onClose={() => setIsOpen(false)}
          onConfirm={() => setIsOpen(false)}
          onDismiss={() => setIsOpen(false)}
        >
          <p className="text-gray-700">
            This is a modal dialog. Click outside or press Escape to close.
          </p>
        </Modal>
      </DialogTrigger>
    );
  },
};

export const Destructive: Story = {
  args: {
    title: "Destructive Modal",
    kind: "destructive",
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
        <Button>Open Modal</Button>
        <Modal
          {...args}
          onClose={() => setIsOpen(false)}
          onConfirm={() => setIsOpen(false)}
          onDismiss={() => setIsOpen(false)}
        >
          <p className="text-gray-700">
            Are you sure you want to delete this item? This cannot be undone.
          </p>
        </Modal>
      </DialogTrigger>
    );
  },
};

export const NonDismissable: Story = {
  args: {
    title: "Non-Dismissable Modal",
    isDismissable: false,
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
        <Button>Open Modal</Button>
        <Modal
          {...args}
          isKeyboardDismissDisabled
          onClose={() => setIsOpen(false)}
          onConfirm={() => setIsOpen(false)}
        >
          <p className="text-gray-700">
            This modal requires explicit action. It cannot be closed by clicking
            outside or pressing Escape.
          </p>
        </Modal>
      </DialogTrigger>
    );
  },
};

export const WithDontShowAgain: Story = {
  args: {
    title: "Modal With Don't Show Again",
    showDontShowAgain: true,
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
        <Button>Open Modal</Button>
        <Modal
          {...args}
          onClose={() => setIsOpen(false)}
          onConfirm={() => setIsOpen(false)}
          onDismiss={() => setIsOpen(false)}
          onDontShowAgainChange={(checked) =>
            console.log("Don't show again:", checked)
          }
        >
          <p className="text-gray-700">
            This is a helpful tip that you can choose to hide in the future.
          </p>
        </Modal>
      </DialogTrigger>
    );
  },
};
