import { createEserviceMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import type { EServiceFormData } from "@/features/e-service/types/eserviceCreateForm";

import { toEserviceSeed } from "@/features/e-service/services/api-converters";
import { client } from "@/libs/axios";

export function usePublishEService() {
  const navigate = useNavigate();

  const { isError, isPending, mutate } = useMutation({
    ...createEserviceMutation({ client }),
    onSuccess: (response) => {
      navigate({
        params: { id: response.id },
        to: "/production/e-services/$id",
      });
    },
  });

  const publish = async (data: EServiceFormData) => {
    const body = await toEserviceSeed(data);
    mutate({ body });
  };

  return { isError, isPending, publish };
}
