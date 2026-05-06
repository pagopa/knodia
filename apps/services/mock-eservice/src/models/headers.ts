import { DpopHeader } from "@knodia/authorization-models/dpop";
import z from "zod";

export const MockEserviceHeaders = z.looseObject({
  ...DpopHeader.shape,
});
