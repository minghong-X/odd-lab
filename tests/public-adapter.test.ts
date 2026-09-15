import { afterEach, expect, it, vi } from "vitest";
import { javaOrigin, javaArena } from "../src/lib/java-arena.public";

afterEach(() => vi.unstubAllEnvs());
it("cannot enable Java in a public build through runtime environment variables", () => {
  vi.stubEnv("ODD_INTERNAL_BUILD", "1");
  expect(javaOrigin()).toBeNull();
  expect(() => javaArena("https://java.example")).toThrow(
    "unavailable in public builds",
  );
});
