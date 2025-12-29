import {
  create,
  type DescMessage,
  fromBinary,
  type MessageInitShape,
  type MessageShape,
  toBinary,
  toJson,
} from "@bufbuild/protobuf";

/**
 * Create a new protobuf message instance based on the schema provided
 * @param schema Protobuf schema
 * @param init Optional json object to initialize the message
 * @returns Protobuf message
 */
export const createMessage = <T extends DescMessage>(
  schema: T,
  init?: MessageInitShape<T>
): MessageShape<T> => {
  return create<T>(schema, init);
};

/**
 * Serialize a protobuf message instance to binary data
 * @param schema Protobuf schema
 * @param message Protobuf message to serialize
 * @returns serialized message
 */
export const serializeProtobufMessage = <T extends DescMessage>(
  schema: T,
  message: MessageShape<T>
): Uint8Array<ArrayBuffer> => {
  return toBinary<T>(schema, message);
};

/**
 * Serialize a JSON value to binary data based on the schema provided
 * @param schema Protobuf schema
 * @param value JSON value
 * @returns serialized message
 */
export const serializeJsonValue = <T extends DescMessage>(
  schema: T,
  value: MessageInitShape<T>
): Uint8Array<ArrayBuffer> => {
  const message = createMessage(schema, value);
  return toBinary<T>(schema, message);
};

/**
 * Parse serialized binary message based on the schema provided
 * @param schema Protobuf schema
 * @param serialized Serialized message to parse
 * @returns
 */
export const parseMessage = <T extends DescMessage>(
  schema: T,
  serialized: Uint8Array<ArrayBuffer>
): MessageShape<T> => {
  return fromBinary<T>(schema, serialized);
};

/**
 * Serialize a protobuf message to JSON value
 * @param schema Schema of the message
 * @param message Message to serialize
 * @returns JSON value
 */
export const messageToJson = <T extends DescMessage>(
  schema: T,
  message: MessageShape<T>
) => {
  return toJson(schema, message);
};
