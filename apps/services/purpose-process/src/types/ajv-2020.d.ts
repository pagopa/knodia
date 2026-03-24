// ajv 8.x lacks an exports field in package.json, so node16 moduleResolution
// cannot resolve subpath imports like ajv/dist/2020.
// https://github.com/ajv-validator/ajv/issues/2047
// https://github.com/ajv-validator/ajv/issues/2132
declare module "ajv/dist/2020" {
  import { Ajv } from "ajv";

  export default Ajv;
  export type { ErrorObject, ValidateFunction } from "ajv";
}
