import { describe, it, expect } from "vitest";
import { validatePasswordComplexity } from "../../src/utils/passwordValidation.js";

describe("Password Complexity Validation Utility (UNIT-01, BR-07, FR-02)", () => {
  it("returns isValid: true for strong passwords meeting all complexity criteria", () => {
    const result = validatePasswordComplexity("StrongP@ss123");
    expect(result.isValid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("returns isValid: false when password length is less than 8 characters", () => {
    const result = validatePasswordComplexity("Sh0rt!");
    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/at least 8 characters/i);
  });

  it("returns isValid: false when uppercase letter is missing", () => {
    const result = validatePasswordComplexity("lowercase123!");
    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/uppercase/i);
  });

  it("returns isValid: false when lowercase letter is missing", () => {
    const result = validatePasswordComplexity("UPPERCASE123!");
    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/lowercase/i);
  });

  it("returns isValid: false when numeric digit is missing", () => {
    const result = validatePasswordComplexity("NoNumberHere!");
    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/numeric digit/i);
  });

  it("returns isValid: false when special character is missing", () => {
    const result = validatePasswordComplexity("NoSpecialChar123");
    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/special character/i);
  });
});
