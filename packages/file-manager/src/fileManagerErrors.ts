import { InternalError } from "@knodia/common-models/errors";

type FileManagerErrorCode = "FILE_MANAGER_STORE_BYTES_ERROR";

export class FileManagerError extends InternalError<FileManagerErrorCode> {
  constructor({
    code,
    detail,
  }: {
    code: FileManagerErrorCode;
    detail: string;
  }) {
    super({ code, detail });
  }
}

export function fileManagerStoreBytesError(
  key: string,
  bucket: string,
  error: unknown,
): FileManagerError {
  return new FileManagerError({
    code: "FILE_MANAGER_STORE_BYTES_ERROR",
    detail: `Error storing file ${key} in bucket ${bucket}: ${JSON.stringify(error)}`,
  });
}
