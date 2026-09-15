import { afterEach, describe, expect, it, vi } from "vitest";
import { appPath } from "../src/lib/paths";
import { rateKey } from "../src/lib/server";

afterEach(() => vi.unstubAllEnvs());
describe("deployment paths and gateway request limits", () => {
  it("keeps public URLs unchanged and prefixes direct media/API URLs for O2", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");
    expect(appPath("/api/media?id=one&motion=1")).toBe(
      "/api/media?id=one&motion=1",
    );
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/odd-lab");
    expect(appPath("/api/media?id=one&motion=1")).toBe(
      "/odd-lab/api/media?id=one&motion=1",
    );
    expect(appPath("/story/mars.webp")).toBe("/odd-lab/story/mars.webp");
  });
  it("does not put all O2 visitors into one shared production limit", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("ODD_CLIENT_IP_HEADER", "x-verified-client-ip");
    const request = (ip: string) =>
      new Request("https://example.test/odd-lab/api/arena", {
        headers: {
          "x-verified-client-ip": ip,
          "x-forwarded-for": "192.0.2.99",
        },
      });
    expect(rateKey(request("192.0.2.1"), "pair")).not.toBe(
      rateKey(request("192.0.2.2"), "pair"),
    );
    expect(rateKey(request("192.0.2.1"), "pair")).toBe(
      rateKey(request("192.0.2.1"), "pair"),
    );
    expect(() => rateKey(request("not-an-ip"), "pair")).toThrow(/header/);
    vi.stubEnv("ODD_CLIENT_IP_HEADER", "");
    expect(() => rateKey(request("192.0.2.1"), "pair")).toThrow(
      /ODD_CLIENT_IP_HEADER/,
    );
  });
  it("preserves Vercel's gateway header and the local development bucket", () => {
    vi.stubEnv("VERCEL", "1");
    const request = new Request("https://example.test/api/arena", {
      headers: { "x-forwarded-for": "2001:db8::1, 192.0.2.4" },
    });
    expect(rateKey(request, "pair")).toMatch(/^[a-f0-9]{64}$/);
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ODD_CLIENT_IP_HEADER", "");
    expect(rateKey(new Request("http://localhost/api/arena"), "pair")).toMatch(
      /^[a-f0-9]{64}$/,
    );
  });
});
