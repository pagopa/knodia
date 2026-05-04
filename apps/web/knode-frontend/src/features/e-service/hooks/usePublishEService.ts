import type { bffApi } from "@knodia/bff-client";

import {
  createEserviceFromTemplateMutation,
  createEserviceMutation,
} from "@knodia/bff-client/tanstack-query";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import type {
  EServiceFromScratchFormData,
  EServiceFromTemplateFormData,
} from "@/features/e-service/types/eserviceCreateForm";

import {
  toEserviceFromScratchSeed,
  toEserviceFromTemplateSeed,
} from "@/features/e-service/services/api-converters";
import { client } from "@/libs/axios";

export function usePublishEService() {
  const navigate = useNavigate();

  const onSuccess = (response: bffApi.CreatedResource) => {
    navigate({
      params: { id: response.id },
      replace: true,
      to: "/production/e-services/$id",
    });
  };

  const createFromScratchMutation = useMutation({
    ...createEserviceMutation({ client }),
    onSuccess,
  });

  const createFromTemplateMutation = useMutation({
    ...createEserviceFromTemplateMutation({ client }),
    onSuccess,
  });

  const publish = async (
    data: EServiceFromScratchFormData,
    checksum: string,
  ) => {
    const body = await toEserviceFromScratchSeed(data, checksum);
    createFromScratchMutation.mutate({ body });
  };

  const publishFromTemplate = (
    data: EServiceFromTemplateFormData,
    template: bffApi.EserviceTemplateDetails,
  ) => {
    const body = toEserviceFromTemplateSeed(data, template);
    createFromTemplateMutation.mutate({ body });
  };

  return {
    isError:
      createFromScratchMutation.isError || createFromTemplateMutation.isError,
    isPending:
      createFromScratchMutation.isPending ||
      createFromTemplateMutation.isPending,
    publish,
    publishFromTemplate,
  };
}
