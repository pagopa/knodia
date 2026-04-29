import { createEserviceMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import type { EServiceFormData } from "@/features/e-service/types/eserviceCreateForm";

import { toEserviceFromScratchSeed } from "@/features/e-service/services/api-converters";
import { client } from "@/libs/axios";

export function usePublishEService() {
  const navigate = useNavigate();

  const { isError, isPending, mutate } = useMutation({
    ...createEserviceMutation({ client }),
    onSuccess: (response) => {
      navigate({
        params: { id: response.id },
        replace: true,
        to: "/production/e-services/$id",
      });
    },
  });

  const publish = async (data: EServiceFormData, checksum: string) => {
    const body = await toEserviceFromScratchSeed(data, checksum);
    mutate({ body });
  };

  return { isError, isPending, publish };
}
