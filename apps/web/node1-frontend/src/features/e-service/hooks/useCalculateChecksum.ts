import { useEffect, useState } from "react";

export const useCalculateChecksum = (
  document: File | null | undefined,
): { sha256Checksum: string } => {
  const [sha256Checksum, setSha256Checksum] = useState<string>("");

  useEffect(() => {
    if (!document) {
      return;
    }

    const f = async () => {
      const arrayBuffer = await document.arrayBuffer();
      const sha256Buffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const bytes = new Uint8Array(sha256Buffer);
      const checksum = Array.from(bytes, (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      setSha256Checksum(checksum);
    };

    f();
  }, [document]);

  return { sha256Checksum };
};
