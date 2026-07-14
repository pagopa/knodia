import { type ErrorComponentProps } from "@tanstack/react-router";
import { isAxiosError } from "axios";

// Rendered as the router's defaultErrorComponent, so it appears inside the
// failing route's layout (mainly _layout, which already renders the
// header/footer shell). It must not add its own PageLayout or the chrome doubles.
export function ErrorPage({ error }: ErrorComponentProps) {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  return (
    <section className="bg-primary-violet-surface flex flex-1 flex-col items-center justify-center px-(--header-inline-padding) pt-(--header-height) text-center">
      <div className="flex max-w-full flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-style-section-title text-neutral-graphite">
            Something went wrong
          </h1>
          <p className="text-style-intro text-neutral-graphite">
            Please try again later.
          </p>
        </div>
        {status !== undefined && (
          <p className="text-style-small text-neutral-graphite">
            Error code: {status}
          </p>
        )}
      </div>
    </section>
  );
}
