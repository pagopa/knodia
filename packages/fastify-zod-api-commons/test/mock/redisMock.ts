import { vi } from "vitest";

vi.mock("ioredis", async () => {
  const Mock = (await import("ioredis-mock")).default;
  return { default: Mock, Redis: Mock };
});
