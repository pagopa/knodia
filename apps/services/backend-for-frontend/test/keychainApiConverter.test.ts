import type { eserviceProcessApi } from "@knodia/eservice-process-client";
import type { keychainProcessApi } from "@knodia/keychain-process-client";

import { describe, expect, it } from "vitest";

import { toAPI_ProducerKeychainEservice } from "../src/models/keychain/apiConverter.ts";

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
  } as eserviceProcessApi.Eservice;

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
