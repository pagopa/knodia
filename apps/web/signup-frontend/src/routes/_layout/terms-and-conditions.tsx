import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/terms-and-conditions")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="mx-auto w-full max-w-(--header-shell-max) flex-1 px-(--header-inline-padding) pt-(--header-height) pb-16">
      <h1 className="text-style-section-title text-neutral-graphite">
        Terms & Conditions
      </h1>
      {/* TODO: replace with the finalized terms & conditions content */}
      <p className="text-style-intro mt-6 text-neutral-graphite">
        The terms & conditions content will be published here.
      </p>
    </section>
  );
}
