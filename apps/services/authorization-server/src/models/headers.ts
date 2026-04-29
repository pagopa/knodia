import { DpopHeader } from "@knodia/authorization-models/dpop";
import z from "zod";

export const AuthServerHeaders = z.looseObject({
  dpop: DpopHeader.shape.dpop.optional(),
});
