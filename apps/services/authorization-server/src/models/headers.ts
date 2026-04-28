import { DpopHeader } from "@knodia/authorization-models/dpop";
import z from "zod";

export const AuthServerHeaders = z.looseObject({
  ...DpopHeader.shape,
});
