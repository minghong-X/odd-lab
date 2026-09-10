import { describe, it, expect } from "vitest";
import {
  resources,
  translator,
  localeFromCookie,
  isErrorCode,
  numberFormatter,
} from "../src/i18n";
describe("language resources", () => {
  it("has the same complete keys and interpolation values in both languages", () => {
    for (const ns of Object.keys(
      resources.en,
    ) as (keyof typeof resources.en)[]) {
      const en = resources.en[ns] as Record<string, string>,
        zh = resources.zh[ns] as Record<string, string>;
      expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort());
      for (const key of Object.keys(en)) {
        expect(zh[key].trim().length).toBeGreaterThan(0);
        expect((zh[key].match(/\{\{\w+\}\}/g) || []).sort()).toEqual(
          (en[key].match(/\{\{\w+\}\}/g) || []).sort(),
        );
      }
    }
  });
  it("interpolates counts and defaults unsupported cookies to English", () => {
    expect(translator("zh")("arena.sessionVotes", { count: 4 })).toBe(
      "本次已投 4 票",
    );
    expect(
      translator("en")("story.progressLabel", { current: 3, total: 4 }),
    ).toBe("Chapter 3 of 4");
    expect(localeFromCookie("other=a; odd-lab-lang=zh")).toBe("zh");
    expect(localeFromCookie("odd-lab-lang=fr")).toBe("en");
    expect(localeFromCookie(null)).toBe("en");
    expect(isErrorCode("expired")).toBe(true);
    expect(isErrorCode("server stack trace")).toBe(false);
    expect(numberFormatter("en").format(1500)).toBe("1,500");
  });
});
