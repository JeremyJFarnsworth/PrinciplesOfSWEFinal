import { validateNewBook, validateRating } from "@/lib/validation";
import { ValidationError } from "@/lib/types";

// UNIT TEST 2: new-book validation.
describe("validateNewBook (unit)", () => {
  test("accepts a valid book and trims whitespace", () => {
    const result = validateNewBook({ title: "  Dune  ", author: " Herbert " });
    expect(result).toEqual({
      title: "Dune",
      author: "Herbert",
      status: "want_to_read",
      rating: undefined,
    });
  });

  test("rejects empty title or author", () => {
    expect(() => validateNewBook({ title: "", author: "x" })).toThrow(
      ValidationError,
    );
    expect(() => validateNewBook({ title: "x", author: "   " })).toThrow(
      ValidationError,
    );
  });
});

// BOUNDARY TEST 1: rating range edges (1..5 inclusive, optional).
describe("validateRating (boundary)", () => {
  test("accepts the inclusive boundaries 1 and 5", () => {
    expect(validateRating(1)).toBe(1);
    expect(validateRating(5)).toBe(5);
  });

  test("rejects just-out-of-range values 0 and 6", () => {
    expect(() => validateRating(0)).toThrow(ValidationError);
    expect(() => validateRating(6)).toThrow(ValidationError);
  });

  test("treats undefined as a valid (unrated) value", () => {
    expect(validateRating(undefined)).toBeUndefined();
  });
});
