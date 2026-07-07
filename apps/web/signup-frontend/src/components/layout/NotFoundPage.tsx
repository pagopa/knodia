import { ButtonLink } from "../ui";
import { PageLayout } from "./PageLayout";

export function NotFoundPage() {
  return (
    <PageLayout>
      <section className="bg-primary-violet-surface flex-1 flex items-center justify-center">
        <div className="mx-auto max-w-172 px-12 text-center">
          <h1 className="text-style-section-title text-neutral-graphite">
            Looking for something specific?
          </h1>
          <p className="text-style-intro text-neutral-graphite mt-6">
            We couldn't find this page: the link might be broken or the page may
            have been moved.
            <br />
            You can continue from here.
          </p>

          <div className="mt-12">
            <ButtonLink to="/home">Go to the homepage</ButtonLink>
          </div>

          <p className="text-style-small text-neutral-graphite mt-6">
            Error code: 404
          </p>
        </div>
      </section>
    </PageLayout>
  );
}
