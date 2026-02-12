import { CopyIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { TooltipTrigger } from "react-aria-components";

import { InteractiveIcon, type InteractiveIconProps } from "./InteractiveIcon";
import { Tooltip } from "./Tooltip";

type CopyButtonProps = Omit<InteractiveIconProps, "children"> & {
  /** Tooltip text shown after copying (defaults to "Copied to clipboard") */
  copiedTooltipText?: string;
  /** The text to copy to clipboard */
  textToCopy: string;
};

export function CopyButton({
  textToCopy,
  copiedTooltipText = "Copied to clipboard",
  ...props
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <TooltipTrigger delay={0} isOpen={isCopied}>
      <InteractiveIcon {...props} onPress={handleCopy}>
        <CopyIcon />
      </InteractiveIcon>
      <Tooltip>{copiedTooltipText}</Tooltip>
    </TooltipTrigger>
  );
}
