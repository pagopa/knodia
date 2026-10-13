import { describe, expect, it } from "vitest";

import { buildPersonalData } from "./personalData";

const base = {
  dateOfBirth: "1990-01-01",
  email: "mario@mail.com",
  familyName: "Rossi",
  name: "Mario",
};

describe("buildPersonalData", () => {
  it("maps the personal fields to the download schema", () => {
    expect(buildPersonalData({ ...base, spidCode: "SPID-123" })).toEqual({
      dateOfBirth: "1990-01-01",
      email: "mario@mail.com",
      familyName: "Rossi",
      name: "Mario",
      uniqueIdentifier: "SPID-123",
    });
  });

  it("derives the unique identifier from the available IdP id", () => {
    expect(
      buildPersonalData({ ...base, fiscalNumber: "FN-1" }).uniqueIdentifier,
    ).toBe("FN-1");
  });

  it("omits the email when it is missing", () => {
    const { dateOfBirth, familyName, name } = base;
    expect(buildPersonalData({ dateOfBirth, familyName, name })).toEqual({
      dateOfBirth: "1990-01-01",
      familyName: "Rossi",
      name: "Mario",
      uniqueIdentifier: "",
    });
  });
});
