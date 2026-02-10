import { createEserviceMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import type { EServiceFormData } from "@/features/e-service/types/eserviceCreateForm";

import { client } from "@/libs/axios";

const CONTENT_TYPES: Record<string, string> = {
  json: "application/json",
  xml: "application/xml",
  yaml: "application/x-yaml",
  yml: "application/x-yaml",
};

export function usePublishEService() {
  const navigate = useNavigate();

  const { isPending, mutate } = useMutation({
    ...createEserviceMutation({ client }),
    onSuccess: () => {
      navigate({ to: "/production/e-services" });
    },
  });

  const publish = async (data: Partial<EServiceFormData>) => {
    const body = await buildRequestBody(data as EServiceFormData);
    mutate({ body });
  };

  return { isPending, publish };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join(
    "",
  );
  return btoa(binary);
}

async function buildRequestBody(data: EServiceFormData) {
  const { interfaceDocument } = data;
  if (!interfaceDocument) throw new Error("Interface document is required");

  const arrayBuffer = await interfaceDocument.arrayBuffer();
  const content = arrayBufferToBase64(arrayBuffer);

  const sha256Buffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const checksumBase64 = arrayBufferToBase64(sha256Buffer);

  return {
    accessTokenAudience: [data.accessTokenAudience],
    accessTokenDuration: data.accessTokenDuration,
    accessTokenType: data.accessTokenType,
    categories: data.categories,
    description: { en: data.description },
    interfaceDocument: {
      checksum: checksumBase64,
      content,
      contentType: getContentType(interfaceDocument),
      name: interfaceDocument.name,
      prettyName: { en: interfaceDocument.name },
    },
    isSignalHubEnabled: data.isSignalHubEnabled,
    maxDailyCallsPerConsumer: data.maxDailyCallsPerConsumer,
    maxDailyCallsPerKnode: data.maxDailyCallsPerKnode,
    mode: data.mode,
    name: { en: data.name },
    requiredAttributes: data.requiredAttributes,
  };
}

function getContentType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}
