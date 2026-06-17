import type { bffApi } from "@knodia/bff-client";

import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import type { KeychainType } from "../models/commons";

import { KeychainTable } from "./KeychainTable";

function createKeychain(overrides?: Partial<bffApi.Keychain>): bffApi.Keychain {
  return {
    id: crypto.randomUUID(),
    keysCount: 3,
    membersCount: 1,
    name: { en: "Test Keychain" },
    ...overrides,
  };
}

function renderTable(type: KeychainType, keychains: bffApi.Keychain[]) {
  return renderWithProviders(
    <KeychainTable isLoading={false} keychains={keychains} type={type} />,
    {
      routes: [
        { path: "/keychains/consumption/$id" },
        { path: "/keychains/production/$id" },
        { path: "/keychains/api/$id" },
      ],
    },
  );
}

describe("KeychainTable", () => {
  it("shows a Purposes column with the count for Consumer Keychains", () => {
    renderTable("consumption", [createKeychain({ purposesCount: 5 })]);

    expect(screen.getByText("Purposes")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.queryByText("E-services")).not.toBeInTheDocument();
  });

  it("shows an E-services column with the count for Producer Keychains", () => {
    renderTable("production", [createKeychain({ eservicesCount: 7 })]);

    expect(screen.getByText("E-services")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.queryByText("Purposes")).not.toBeInTheDocument();
  });

  it("shows no linked-resource column for Knode API Keychains", () => {
    renderTable("api", [createKeychain()]);

    expect(screen.queryByText("Purposes")).not.toBeInTheDocument();
    expect(screen.queryByText("E-services")).not.toBeInTheDocument();
  });
});
