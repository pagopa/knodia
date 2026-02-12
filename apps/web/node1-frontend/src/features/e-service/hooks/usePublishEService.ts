import { createEserviceMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import type { EServiceFormData } from "@/features/e-service/types/eserviceCreateForm";

import { buildRequestBody } from "@/features/e-service/services/eserviceRequestBody";
import { eserviceFormSchema } from "@/features/e-service/types/eserviceCreateForm";
import { client } from "@/libs/axios";

export function usePublishEService() {
  const navigate = useNavigate();

  const { isError, isPending, mutate } = useMutation({
    ...createEserviceMutation({ client }),
    onSuccess: (response) => {
      navigate({ to: "/production/e-services/" + response.id });
    },
  });

  const publish = async (data: Partial<EServiceFormData>) => {
    const result = eserviceFormSchema.safeParse(data);
    if (!result.success) return;
    const body = await buildRequestBody(result.data);
    mutate({ body });
  };

  return { isError, isPending, publish };
}
