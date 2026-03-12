import { ToastQueue } from "@react-stately/toast";

export interface ToastContent {
  description: string;
  kind?: "error" | "informative" | "neutral" | "success" | "warning";
  title: string;
}

export const toastQueue = new ToastQueue<ToastContent>({
  maxVisibleToasts: 5,
});
