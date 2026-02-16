import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/consumption/e-services_/search")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader title="Search New E-Services" />
      <p>todo: implement</p>
    </>
  );
}
