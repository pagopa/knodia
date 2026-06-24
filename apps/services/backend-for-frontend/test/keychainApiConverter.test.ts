import type { eserviceProcessApi } from "@knodia/eservice-process-client";
import type { keychainProcessApi } from "@knodia/keychain-process-client";

import { describe, expect, it } from "vitest";

import {
  toAPI_Keychain,
  toAPI_ProducerKeychainEservice,
} from "../src/models/keychain/apiConverter.ts";

describe("toAPI_Keychain", () => {
  const keychain = {
    createdAt: "2026-04-14T12:00:00.000Z",
    id: crypto.randomUUID(),
    name: { en: "Test Keychain" },
    updatedAt: "2026-04-14T12:00:00.000Z",
  } as keychainProcessApi.Keychain;

  it("always maps keys and members counts", () => {
    const result = toAPI_Keychain(keychain, {
      keysCount: 3,
      membersCount: 2,
    });

    expect(result).toEqual({
      id: keychain.id,
      keysCount: 3,
      membersCount: 2,
      name: { en: "Test Keychain" },
    });
  });

  it("includes purposesCount only when provided (Consumer Keychain)", () => {
    const result = toAPI_Keychain(keychain, {
      keysCount: 3,
      membersCount: 2,
      purposesCount: 5,
    });

    expect(result.purposesCount).toBe(5);
    expect(result).not.toHaveProperty("eservicesCount");
  });

  it("includes eservicesCount only when provided (Producer Keychain)", () => {
    const result = toAPI_Keychain(keychain, {
      eservicesCount: 7,
      keysCount: 3,
      membersCount: 2,
    });

    expect(result.eservicesCount).toBe(7);
    expect(result).not.toHaveProperty("purposesCount");
  });

  it("omits both linked-resource counts when neither is provided (Knode API Keychain)", () => {
    const result = toAPI_Keychain(keychain, {
      keysCount: 3,
      membersCount: 2,
    });

    expect(result).not.toHaveProperty("purposesCount");
    expect(result).not.toHaveProperty("eservicesCount");
  });
});

describe("toAPI_ProducerKeychainEservice", () => {
  const link: keychainProcessApi.ProducerKeychainEservice = {
    eserviceId: crypto.randomUUID(),
    linkedAt: "2026-04-14T12:00:00.000Z",
    producerKeychainId: crypto.randomUUID(),
  };

  const eservice = {
    categories: [{ code: "main-address", scheme: "eu-categories" }],
    id: crypto.randomUUID(),
    mode: "ProvideData",
    name: { en: "Test E-Service" },
  } as eserviceProcessApi.FlatEservice;

  it("maps e-service metadata, the link timestamp and the version state", () => {
    const result = toAPI_ProducerKeychainEservice(link, eservice, "Active");

    expect(result).toEqual({
      categories: eservice.categories,
      id: eservice.id,
      linkedAt: link.linkedAt,
      mode: "ProvideData",
      name: { en: "Test E-Service" },
      state: "Active",
    });
  });

  it("takes id, name, mode and categories from the e-service, not the link", () => {
    const result = toAPI_ProducerKeychainEservice(link, eservice, "Suspended");

    expect(result.id).toBe(eservice.id);
    expect(result.id).not.toBe(link.eserviceId);
    expect(result.state).toBe("Suspended");
  });
});
