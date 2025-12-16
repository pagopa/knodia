import type { API_EService } from "./api.ts";

export const toAPI_EService = (eservice: { id: number }): API_EService => {
  return { id: eservice.id.toString() };
};
