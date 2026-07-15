import {
  getAttributesFromGroups,
  listAttributes,
} from "@knodia/attribute-models";
import { Button } from "@knodia/ui-kit/ui";
import { DialogTrigger } from "react-aria-components";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  mockContentSize,
  renderWithProviders,
  screen,
  waitFor,
} from "@/test/utils";

import { AttributesListModal } from "./AttributesListModal";

describe("AttributesListModal", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the title, section labels, every catalog attribute and the info banner when open", () => {
    renderWithProviders(
      <DialogTrigger defaultOpen>
        <Button>Open</Button>
        <AttributesListModal attributes={listAttributes()} variant="scratch" />
      </DialogTrigger>,
    );

    expect(screen.getByText("Attributes list")).toBeInTheDocument();
    expect(screen.getByText("Main attributes")).toBeInTheDocument();
    expect(screen.getByText("Orgs personal attributes")).toBeInTheDocument();

    expect(screen.getByText("Testing Organization")).toBeInTheDocument();
    expect(screen.getByText("NUTS 3")).toBeInTheDocument();
    // one definition card per catalog attribute
    expect(screen.getAllByText(/^Organizations/)).toHaveLength(7);

    expect(
      screen.getByText(/each Organization has a unique identifying attribute/),
    ).toBeInTheDocument();
  });

  it("in template mode renders only the given attributes, without the section labels or the info banner", () => {
    const templateAttributes = getAttributesFromGroups([
      [{ code: "nuts1", scheme: "vc_territorial_units" }],
    ]);

    renderWithProviders(
      <DialogTrigger defaultOpen>
        <Button>Open</Button>
        <AttributesListModal
          attributes={templateAttributes}
          variant="template"
        />
      </DialogTrigger>,
    );

    expect(screen.getByText("Attributes list")).toBeInTheDocument();
    expect(screen.getByText("NUTS 1")).toBeInTheDocument();

    // only the template's attribute is shown, not the whole catalogue
    expect(screen.queryByText("Testing Organization")).not.toBeInTheDocument();
    expect(screen.getAllByText(/^Organizations/)).toHaveLength(1);

    // no section labels and no misleading banner in the template flow
    expect(screen.queryByText("Main attributes")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Orgs personal attributes"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        /each Organization has a unique identifying attribute/,
      ),
    ).not.toBeInTheDocument();
  });

  it("does not render the modal until the trigger is opened", () => {
    renderWithProviders(
      <DialogTrigger>
        <Button>Open</Button>
        <AttributesListModal attributes={listAttributes()} variant="scratch" />
      </DialogTrigger>,
    );

    expect(screen.queryByText("Attributes list")).not.toBeInTheDocument();
  });

  it("closes when the user presses Escape", async () => {
    const { user } = renderWithProviders(
      <DialogTrigger defaultOpen>
        <Button>Open</Button>
        <AttributesListModal attributes={listAttributes()} variant="scratch" />
      </DialogTrigger>,
    );

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByText("Attributes list")).not.toBeInTheDocument(),
    );
  });

  it("makes the scrollable list keyboard-focusable when its content overflows", () => {
    mockContentSize(500, 200);

    renderWithProviders(
      <DialogTrigger defaultOpen>
        <Button>Open</Button>
        <AttributesListModal attributes={listAttributes()} variant="scratch" />
      </DialogTrigger>,
    );

    const region = screen.getByRole("group", { name: "Attributes list" });
    expect(region).toHaveAttribute("tabindex", "0");
  });

  it("does not add a focus stop when the content fits", () => {
    mockContentSize(200, 200);

    renderWithProviders(
      <DialogTrigger defaultOpen>
        <Button>Open</Button>
        <AttributesListModal attributes={listAttributes()} variant="scratch" />
      </DialogTrigger>,
    );

    expect(
      screen.queryByRole("group", { name: "Attributes list" }),
    ).not.toBeInTheDocument();
  });
});
