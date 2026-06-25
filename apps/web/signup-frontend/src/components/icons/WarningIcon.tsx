import { type IconProps, MaterialSymbolIcon } from "./MaterialSymbolIcon";

export function WarningIcon(props: IconProps) {
  return (
    <MaterialSymbolIcon
      {...props}
      d="M109-120q-11 0-20-5.5T75-140q-5-9-5.5-19.5T75-180l371-640q6-10 15.5-15t19.5-5q10 0 19.5 5t15.5 15l371 640q6 10 5.5 20.5T886-140q-5 9-14 14.5t-20 5.5H109Zm371-120q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm0-120q17 0 28.5-11.5T520-400v-120q0-17-11.5-28.5T480-560q-17 0-28.5 11.5T440-520v120q0 17 11.5 28.5T480-360Z"
    />
  );
}
