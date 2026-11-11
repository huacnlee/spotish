import { expect, test } from "nsh/test";
import { agoLabel } from "./friends";

const MIN = 60_000;

test("agoLabel says now, minutes, hours and days", () => {
  const now = 10 * 24 * 60 * MIN;
  expect(agoLabel(now - 30_000, now)).toBe("now");
  expect(agoLabel(now - 5 * MIN, now)).toBe("5m");
  expect(agoLabel(now - 59 * MIN, now)).toBe("59m");
  expect(agoLabel(now - 60 * MIN, now)).toBe("1h");
  expect(agoLabel(now - 23 * 60 * MIN, now)).toBe("23h");
  expect(agoLabel(now - 24 * 60 * MIN, now)).toBe("1d");
});
