import { Loader } from "@/components/ui";

export function CreatingCredentialsLoader() {
  return (
    <div className="flex flex-col items-center gap-6">
      <Loader size={40} />
      <h2 className="text-style-section-title text-neutral-graphite">
        Creating your credentials…
      </h2>
      <div className="h-1 w-12 rounded-full bg-primary-violet" />
      <p className="text-style-body text-neutral-medium-gray">
        You will receive them by email.
      </p>
    </div>
  );
}
