import { generateId } from "@knodia/common-models/ids";
import { AxiosError, type AxiosResponse } from "axios";

export function makeAxiosError(
  status: number,
  title: string,
  code = "000-0000",
): AxiosError {
  const err = new AxiosError(`Request failed with status code ${status}`);
  err.response = {
    data: {
      correlationId: generateId(),
      errors: [{ code, detail: title }],
      status,
      title,
    },
    headers: {},
    status,
  } as AxiosResponse;
  return err;
}
