import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "../../../src/infrastructure/http/utils/Sanitize";

describe("Sanitize Utility", () => {
  it("should escape HTML tags and special characters", () => {
    const input = "<script>alert('xss & phishing')</script>";
    const expected = "&lt;script&gt;alert(&#x27;xss &amp; phishing&#x27;)&lt;&#x2F;script&gt;";
    expect(sanitizeHtml(input)).toBe(expected);
  });

  it("should return the same string if it does not contain special characters", () => {
    const input = "Hola Mundo 123";
    expect(sanitizeHtml(input)).toBe(input);
  });

  it("should handle empty strings and falsy values", () => {
    expect(sanitizeHtml("")).toBe("");
  });
});
