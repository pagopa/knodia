import {
  CheckCircleIcon,
  CheckSquareIcon,
  CircleIcon,
  DotOutlineIcon,
  SelectionIcon,
  SquareLogoIcon,
  XCircleIcon,
  XSquareIcon,
} from "@phosphor-icons/react";
import { tv } from "tailwind-variants";

interface StepsProps {
  ariaLabel: string;
  current: number;
  isCurrentInvalid?: boolean;
  steps: string[];
}

type StepStatus = "completed" | "current" | "error" | "uncompleted";

export function Steps({
  ariaLabel,
  steps,
  current,
  isCurrentInvalid,
}: StepsProps) {
  const computedSteps = steps.map((step, idx) => {
    let status: StepStatus = "uncompleted";

    if (idx === current && isCurrentInvalid) status = "error";
    else if (idx === current) status = "current";
    else if (idx < current) status = "completed";

    return { idx, status, label: step };
  });

  return (
    <nav aria-label={ariaLabel}>
      <ol className="flex items-center gap-2 w-full" role="list">
        {computedSteps.map((step) => (
          <Step {...step} key={step.idx} />
        ))}
      </ol>
    </nav>
  );
}

function Step({
  idx,
  status,
  label,
}: {
  idx: number;
  label: string;
  status: StepStatus;
}) {
  const isFirst = idx === 0;
  return (
    <li className={"flex items-center gap-2 " + (isFirst ? "" : "flex-1")}>
      {!isFirst && <StepLine status={status} />}
      <div aria-current={status === "current" ? "step" : undefined}>
        <StepDot status={status} />
        <span className="sr-only">{label}</span>
      </div>
    </li>
  );
}

const stepDot = tv({
  base: "size-6 shrink-0",
  variants: {
    status: {
      completed: "text-brand-light-low-contrast",
      current: "text-primary-light-low-contrast",
      error: "text-error-light-low-contrast",
      uncompleted: "text-primary-light-low-contrast",
    },
  },
});

function LynxStepDot({
  className,
  status,
}: {
  className: string;
  status: StepStatus;
}) {
  switch (status) {
    case "completed":
      return <CheckSquareIcon className={className} weight="duotone" />;
    case "current":
      return <SquareLogoIcon className={className} />;
    case "error":
      return <XSquareIcon className={className} weight="light" />;
    case "uncompleted":
      return <SelectionIcon className={className} weight="light" />;
  }
}

function OrionStepDot({
  className,
  status,
}: {
  className: string;
  status: StepStatus;
}) {
  switch (status) {
    case "completed":
      return <CheckCircleIcon className={className} weight="fill" />;
    case "current":
      return <CircleIcon className={className} />;
    case "error":
      return <XCircleIcon className={className} />;
    case "uncompleted":
      return <DotOutlineIcon className={className} weight="fill" />;
  }
}

function StepDot({ status }: { status: StepStatus }) {
  const className = stepDot({ status });

  return (
    <>
      <OrionStepDot className={`${className} orion-only`} status={status} />
      <LynxStepDot className={`${className} lynx-only`} status={status} />
    </>
  );
}

const stepLine = tv({
  base: "flex-1 h-1",
  variants: {
    status: {
      completed: "bg-brand-light-low-contrast h-0.5",
      current: "bg-brand-light-low-contrast h-0.5",
      error: "bg-error-light-low-contrast h-px",
      uncompleted: "bg-primary-light-low-contrast h-px",
    },
  },
});

function StepLine({ status }: { status: StepStatus }) {
  return <div aria-hidden="true" className={stepLine({ status })} />;
}
