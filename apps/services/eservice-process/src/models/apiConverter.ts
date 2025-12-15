import type { API_EService } from "./api.ts";

export function toAPI_EService(eservice: { id: number }): API_EService {
  return { id: eservice.id.toString() };
}
