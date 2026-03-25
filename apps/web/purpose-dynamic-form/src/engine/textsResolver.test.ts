import { describe, expect, it } from "vitest";

import type { FormTexts } from "./types";

import {
  getBannerText,
  getFieldDescription,
  getFieldErrorMessages,
  getFieldLabel,
  getFieldOptionLabels,
  getGroupDescription,
  getGroupLabel,
} from "./textsResolver";

const texts: FormTexts = {
  banners: {
    dpiaReminder: "DPIA is mandatory",
  },
  fields: {
    emptyField: {},
    purpose: {
      description: "Select your purpose",
      errors: {
        maxLength: "Too long",
        required: "Required",
      },
      label: "Purpose of access",
      options: {
        INSTITUTIONAL: "Institutional",
        OTHER: "Other",
      },
    },
  },
  groups: {
    legalBasis: {
      description: "Declare the lawfulness",
      label: "Legal basis",
    },
    noDescription: {
      label: "Only label",
    },
  },
};

describe("getFieldLabel", () => {
  it("returns label for existing field", () => {
    expect(getFieldLabel(texts, "purpose")).toBe("Purpose of access");
  });

  it("returns undefined for missing field", () => {
    expect(getFieldLabel(texts, "nonexistent")).toBeUndefined();
  });

  it("returns undefined for field without label", () => {
    expect(getFieldLabel(texts, "emptyField")).toBeUndefined();
  });
});

describe("getFieldDescription", () => {
  it("returns description for existing field", () => {
    expect(getFieldDescription(texts, "purpose")).toBe("Select your purpose");
  });

  it("returns undefined for missing field", () => {
    expect(getFieldDescription(texts, "nonexistent")).toBeUndefined();
  });
});

describe("getFieldOptionLabels", () => {
  it("returns option labels for existing field", () => {
    expect(getFieldOptionLabels(texts, "purpose")).toEqual({
      INSTITUTIONAL: "Institutional",
      OTHER: "Other",
    });
  });

  it("returns empty object for missing field", () => {
    expect(getFieldOptionLabels(texts, "nonexistent")).toEqual({});
  });

  it("returns empty object for field without options", () => {
    expect(getFieldOptionLabels(texts, "emptyField")).toEqual({});
  });
});

describe("getFieldErrorMessages", () => {
  it("returns error messages for existing field", () => {
    expect(getFieldErrorMessages(texts, "purpose")).toEqual({
      maxLength: "Too long",
      required: "Required",
    });
  });

  it("returns empty object for missing field", () => {
    expect(getFieldErrorMessages(texts, "nonexistent")).toEqual({});
  });
});

describe("getGroupLabel", () => {
  it("returns label for existing group", () => {
    expect(getGroupLabel(texts, "legalBasis")).toBe("Legal basis");
  });

  it("returns undefined for missing group", () => {
    expect(getGroupLabel(texts, "nonexistent")).toBeUndefined();
  });

  it("returns undefined when key is undefined", () => {
    expect(getGroupLabel(texts, undefined)).toBeUndefined();
  });

  it("returns undefined when groups are not defined", () => {
    const noGroups: FormTexts = { fields: {} };
    expect(getGroupLabel(noGroups, "legalBasis")).toBeUndefined();
  });
});

describe("getGroupDescription", () => {
  it("returns description for existing group", () => {
    expect(getGroupDescription(texts, "legalBasis")).toBe(
      "Declare the lawfulness",
    );
  });

  it("returns undefined for group without description", () => {
    expect(getGroupDescription(texts, "noDescription")).toBeUndefined();
  });

  it("returns undefined when key is undefined", () => {
    expect(getGroupDescription(texts, undefined)).toBeUndefined();
  });
});

describe("getBannerText", () => {
  it("returns text for existing banner", () => {
    expect(getBannerText(texts, "dpiaReminder")).toBe("DPIA is mandatory");
  });

  it("returns undefined for missing banner", () => {
    expect(getBannerText(texts, "nonexistent")).toBeUndefined();
  });

  it("returns undefined when key is undefined", () => {
    expect(getBannerText(texts, undefined)).toBeUndefined();
  });

  it("returns undefined when banners are not defined", () => {
    const noBanners: FormTexts = { fields: {} };
    expect(getBannerText(noBanners, "dpiaReminder")).toBeUndefined();
  });
});
