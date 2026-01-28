import z from "zod";

interface ProtobufCodec<T> {
  decode: (input: Uint8Array) => T;
  encode: (value: T) => Uint8Array | { finish: () => Uint8Array };
}

export const protobufBinaryCodec = <T>(codec: ProtobufCodec<T>) =>
  z.codec(
    z.string().transform((hex) => Buffer.from(hex, "hex")),
    z.custom<T>(),
    {
      decode: (value: Buffer<ArrayBuffer>): T => codec.decode(value),
      encode: (value: T): Buffer<ArrayBuffer> => {
        const encoded = codec.encode(value);
        const bytes =
          encoded instanceof Uint8Array ? encoded : encoded.finish();
        return Buffer.from(bytes);
      },
    },
  );
