import z from "zod";

export const protobufBytes: z.ZodType<Uint8Array<ArrayBufferLike>> =
  z.instanceof(Uint8Array);
interface ProtobufCodec<T> {
  decode: (input: Uint8Array) => T;
  encode: (value: T) => Uint8Array | { finish: () => Uint8Array };
}

export const protobufCodec = <T>(codec: ProtobufCodec<T>) =>
  z.codec(protobufBytes, z.custom<T>(), {
    decode: (value: Uint8Array): T => codec.decode(value),
    encode: (value: T): Uint8Array => {
      const encoded = codec.encode(value);
      return encoded instanceof Uint8Array ? encoded : encoded.finish();
    },
  });
