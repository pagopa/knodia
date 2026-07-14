import { type ErrorComponentProps } from "@tanstack/react-router";
import { isAxiosError } from "axios";

export function ErrorPage({ error }: ErrorComponentProps) {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  return (
    <section className="flex min-h-[756px] flex-1 flex-col items-center justify-center bg-[linear-gradient(to_bottom,var(--color-primary-violet-surface)_70%,var(--color-neutral-white))] px-(--header-inline-padding) pt-(--header-height) text-center">
      <div className="flex max-w-full flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-style-section-title text-neutral-graphite">
            Something went wrong
          </h1>
          <p className="text-style-intro text-neutral-graphite">
            Please try again later.
          </p>
        </div>
        <p className="text-style-small text-neutral-graphite">
          Error code: {status ?? "Unknown"}
        </p>
      </div>
    </section>
  );
}
