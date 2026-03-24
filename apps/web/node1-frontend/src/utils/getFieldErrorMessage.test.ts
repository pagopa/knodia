import { describe, expect, it } from "vitest";

import { getFieldErrorMessage } from "./getFieldErrorMessage";

describe("getFieldErrorMessage", () => {
  it("returns an empty string for an empty errors array", () => {
    expect(getFieldErrorMessage([])).toBe("");
  });

  it("filters out errors without a message property", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getFieldErrorMessage([null, undefined, "string", 42] as any)).toBe(
      "",
    );
  });

  it("returns the message from a single error", () => {
    expect(getFieldErrorMessage([{ message: "Required" }])).toBe("Required");
  });

  it("joins multiple error messages with ', '", () => {
    expect(
      getFieldErrorMessage([
        { message: "Too short" },
        { message: "Must be unique" },
      ]),
    ).toBe("Too short, Must be unique");
  });

  it("applies numberFallback when the message matches /nvalid|input/i", () => {
    expect(
      getFieldErrorMessage([{ message: "Invalid input" }], {
        numberFallback: "Enter a valid number",
      }),
    ).toBe("Enter a valid number");
  });

  it("does not apply numberFallback for normal messages", () => {
    expect(
      getFieldErrorMessage([{ message: "Required" }], {
        numberFallback: "Must be a number",
      }),
    ).toBe("Required");
  });

  it("mixes fallback and normal messages in the same array", () => {
    expect(
      getFieldErrorMessage(
        [{ message: "Invalid input" }, { message: "Too long" }],
        { numberFallback: "Must be a number" },
      ),
    ).toBe("Must be a number, Too long");
  });
});
