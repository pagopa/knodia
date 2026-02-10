import { useEffect, useState } from "react";
import SparkMD5 from "spark-md5";

export const useCalculateChecksum = (document: File | null | undefined) => {
  const [md5Checksum, setMd5Checksum] = useState<null | string>(null);

  useEffect(() => {
    if (!document) {
      return;
    }

    const file = document;
    const reader = new FileReader();

    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const spark = new SparkMD5.ArrayBuffer();
      spark.append(arrayBuffer);
      setMd5Checksum(spark.end());
    };

    reader.readAsArrayBuffer(file);
  }, [document]);

  return { md5Checksum };
};
