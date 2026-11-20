import { afterEach, describe, expect, it, vi } from "vitest";
import { isLocalDev } from "@/lib/local-dev";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isLocalDev", () => {
  it("is true for a normal local run", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL", "");
    expect(isLocalDev()).toBe(true);
  });

  it("is false in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "");
    expect(isLocalDev()).toBe(false);
  });

  it("is false when Vercel is set, even in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL", "1");
    expect(isLocalDev()).toBe(false);
  });
});
