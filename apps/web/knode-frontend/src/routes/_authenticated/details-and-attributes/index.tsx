import { TextField } from "@knodia/ui-kit/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AttributeGroupContainer } from "@/components/AttributeGroupContainer";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { sessionOrganizationQuery } from "@/features/session/services/queries";

export const Route = createFileRoute("/_authenticated/details-and-attributes/")(
  {
    component: DetailsAndAttributesPage,
  },
);

export function DetailsAndAttributesPage() {
  const { data: sessionOrganization } = useSuspenseQuery(
    sessionOrganizationQuery(),
  );

  return (
    <>
      <PageHeader
        copyableId={sessionOrganization.id}
        title="Details and attributes"
      />

      <div className="flex flex-col gap-10">
        <Section
          className="rounded-card border border-card-border p-6 shadow-card"
          description="This information will be visible to other people in Knodia."
          title="Contacts"
        >
          <div className="flex flex-col gap-6">
            {/* TODO(KN-884): replace with real data when contacts API is available */}
            <TextField isReadOnly label="E-mail address" value="-" />
            <TextField isReadOnly label="Notes" value="-" />
          </div>
        </Section>

        <Section
          description="Attributes are given to Organizations by authorized sources. If you think your attributes are incorrect or incomplete, please contact your Knode owner."
          title="Attributes"
        >
          <ul className="flex flex-col gap-2" role="list">
            {sessionOrganization.attributes.map((attr) => (
              <li key={`${attr.scheme}$${attr.code}`}>
                <AttributeGroupContainer
                  attributes={[{ ...attr, possessed: true }]}
                />
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </>
  );
}
