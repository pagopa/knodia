export const downloadFile = (file: File | null | undefined) => {
  if (!file) return;

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadResponseAsFile = (
  data: unknown,
  fileName: string,
  contentType: unknown,
) => {
  const content =
    typeof data === "string" ? data : JSON.stringify(data, null, 2);

  const file = new File([content], fileName, {
    type: typeof contentType === "string" ? contentType : "",
  });
  downloadFile(file);
};
