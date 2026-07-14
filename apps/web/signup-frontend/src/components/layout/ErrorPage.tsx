import { type ErrorComponentProps } from "@tanstack/react-router";
import { isAxiosError } from "axios";

import { PageLayout } from "./PageLayout";

export function ErrorPage({ error }: ErrorComponentProps) {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  return (
    <PageLayout>
      <section className="bg-primary-violet-surface flex-1 flex items-center justify-center pt-63.5 pb-41.5">
        <div className="mx-auto max-w-172 px-12 text-center">
          <h1 className="text-style-section-title text-neutral-graphite">
            Something went wrong
          </h1>
          <p className="text-style-intro text-neutral-graphite mt-6">
            Please try again later.
          </p>
          <p className="text-style-small text-neutral-graphite mt-6">
            Error code: {status ?? "Unknown"}
          </p>
        </div>
      </section>
    </PageLayout>
  );
}
