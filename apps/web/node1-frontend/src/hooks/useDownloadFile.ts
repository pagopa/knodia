import { useCallback } from "react";

export const useDownloadFile = (file: File | null | undefined) => {
  const downloadFile = useCallback(() => {
    if (!file) return;

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  }, [file]);

  return { downloadFile };
};
