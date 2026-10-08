import { describe, expect, it } from "vitest";
import { formatTokenAmount, parseAmountToI128 } from "./tokenMath";

describe("parseAmountToI128", () => {
  it("scales whole and fractional amounts", () => {
    expect(parseAmountToI128("1.5", 8)).toBe(150000000n);
    expect(parseAmountToI128("0", 8)).toBe(0n);
    expect(parseAmountToI128("12", 7)).toBe(120000000n);
    expect(parseAmountToI128("0.001", 7)).toBe(10000n);
  });

  it("pads fractional digits without changing the value", () => {
    expect(parseAmountToI128("1.2", 4)).toBe(12000n);
    expect(parseAmountToI128("1.002", 4)).toBe(10020n);
    expect(parseAmountToI128(" 2.5 ", 2)).toBe(250n);
  });

  it("accepts exactly the maximum number of decimal places", () => {
    expect(parseAmountToI128("1.12345678", 8)).toBe(112345678n);
    expect(parseAmountToI128("1", 0)).toBe(1n);
  });

  it("rejects too many fractional digits", () => {
    expect(() => parseAmountToI128("1.123", 2)).toThrow("Use at most 2 decimal places.");
    expect(() => parseAmountToI128("0.1", 0)).toThrow("Use at most 0 decimal places.");
  });

  it.each(["abc", "1e3", "-1", "+1", "1,2", "1.", ".5", "1.2.3"])(
    "rejects invalid format %s",
    (input) => {
      expect(() => parseAmountToI128(input, 7)).toThrow("Invalid amount format.");
    },
  );

  it("rejects empty and whitespace-only input", () => {
    expect(() => parseAmountToI128("", 7)).toThrow("Enter an amount.");
    expect(() => parseAmountToI128("   ", 7)).toThrow("Enter an amount.");
  });
});

describe("formatTokenAmount", () => {
  it("returns a placeholder for undefined", () => {
    expect(formatTokenAmount(undefined, 7)).toBe("-");
  });

  it("formats whole numbers and trims trailing fractional zeros", () => {
    expect(formatTokenAmount(150000000n, 8)).toBe("1.5");
    expect(formatTokenAmount(100000000n, 8)).toBe("1");
    expect(formatTokenAmount(10020n, 4)).toBe("1.002");
    expect(formatTokenAmount(0n, 7)).toBe("0");
  });

  it("round-trips representative nonnegative values", () => {
    for (const decimals of [0, 2, 7, 8]) {
      for (const input of decimals === 0
        ? ["0", "1", "123456"]
        : ["0", "1", "1.5", "12.01", "999.12345678"].filter(
            (value) => (value.split(".")[1]?.length ?? 0) <= decimals,
          )) {
        const parsed = parseAmountToI128(input, decimals);
        expect(parseAmountToI128(formatTokenAmount(parsed, decimals), decimals)).toBe(parsed);
      }
    }
  });
});
