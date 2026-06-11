import {
  composeRenderProps,
  FieldError,
  Input,
  Label,
  TextField as RACTextField,
  type TextFieldProps as RACTextFieldProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";

import { ReportIcon } from "@/components/icons";

const textFieldStyles = tv({
  base: "group flex w-full flex-col gap-[2px]",
});

interface TextFieldProps extends RACTextFieldProps {
  errorMessage?: string;
  label: string;
}

export function TextField({ errorMessage, label, ...props }: TextFieldProps) {
  return (
    <RACTextField
      isInvalid={props.isInvalid ?? Boolean(errorMessage)}
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        textFieldStyles({ ...renderProps, className }),
      )}
    >
      <div className="relative flex h-12 w-full items-center gap-2 rounded-button border border-input-border bg-neutral-white px-3 transition group-data-invalid:border-status-error group-data-focused:border-primary-violet">
        {/* placeholder=" " keeps :placeholder-shown usable to drive the floating label */}
        <Input
          className="peer h-full min-w-0 flex-1 bg-transparent font-caption text-[16px] leading-[22px] font-semibold text-input-text outline-none placeholder-transparent"
          placeholder=" "
        />
        <Label className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 bg-neutral-white px-1 font-caption text-[16px] leading-[22px] font-semibold text-input-label transition-all peer-focus:top-0 peer-focus:text-[12px] peer-focus:leading-[18px] peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:text-[12px] peer-not-placeholder-shown:leading-[18px]">
          {label}
        </Label>
        <ReportIcon className="hidden size-6 shrink-0 text-status-error group-data-invalid:block" />
      </div>
      <FieldError className="px-[14px] font-caption text-[14px] leading-[20px] text-status-error">
        {errorMessage}
      </FieldError>
    </RACTextField>
  );
}
