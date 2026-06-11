import type { bffApi } from "@knodia/bff-client";

import { Banner, Loader } from "@knodia/ui-kit/ui";
import { SelectionIcon } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";

import { CategoryChip } from "@/features/e-service/components/CategoryChip";
import {
  EserviceCard,
  EserviceCardFooter,
  EserviceCardHeader,
} from "@/features/e-service/components/EserviceCard";

interface LinkedEservicesListProps {
  eservices: bffApi.ProducerKeychainEservice[];
  isLoading: boolean;
}

export function LinkedEservicesList({
  eservices,
  isLoading,
}: LinkedEservicesListProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (eservices.length === 0) {
    return (
      <Banner
        action={{
          label: "Go to E-Services list",
          onPress: () => navigate({ to: "/production/e-services" }),
        }}
        icon={<SelectionIcon />}
        kind="neutral"
      >
        There are no E-Services linked to this Keychain yet.
      </Banner>
    );
  }

  return (
    <ul className="flex flex-col gap-4" role="list">
      {eservices.map((eservice) => (
        <li key={eservice.id}>
          <EserviceCard>
            <EserviceCardHeader
              id={eservice.id}
              title={eservice.name.en}
              to="/production/e-services/$id"
            />
            <EserviceCardFooter mode={eservice.mode} state={eservice.state}>
              {eservice.categories.map((category) => (
                <CategoryChip
                  code={category.code}
                  key={category.code}
                  scheme={category.scheme}
                />
              ))}
            </EserviceCardFooter>
          </EserviceCard>
        </li>
      ))}
    </ul>
  );
}
