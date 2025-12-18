import type { API_Eservice } from "./api.ts";

export const toAPI_Eservice = (eservice: { id: number }): API_Eservice => {
  return { id: eservice.id.toString() };
};
