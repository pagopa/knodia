export function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center gap-2 w-full">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div className="flex items-center gap-2 flex-1 last:flex-none" key={i}>
          {i < currentStep ? (
            <svg
              className="size-6 text-blue-600 shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          ) : i === currentStep ? (
            <svg
              className="size-6 text-blue-600 shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
            </svg>
          ) : (
            <svg
              className="size-6 text-slate-400 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="4" />
            </svg>
          )}
          {i < totalSteps - 1 && (
            <div
              className={`flex-1 h-0.5 ${i < currentStep ? "bg-blue-500" : "bg-slate-300"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
