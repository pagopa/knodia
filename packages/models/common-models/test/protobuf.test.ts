import { describe, expect, it } from "vitest";

import { protobufBinaryCodec } from "../src/protobuf.ts";

describe("protobufBinaryCodec", () => {
  const TestProtobufCodec = {
    decode: (input: Uint8Array) => {
      const json = new TextDecoder().decode(input);
      return JSON.parse(json) as { test: string };
    },
    encode: (value: { test: string }) => {
      const json = JSON.stringify(value);
      return new TextEncoder().encode(json);
    },
  };

  it("encodes and decodes binary data", () => {
    const codec = protobufBinaryCodec<{ test: string }>(TestProtobufCodec);
    const value = { test: "value" };
    const bytes = codec.encode(value);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(codec.decode(bytes)).toEqual(value);
  });
});
