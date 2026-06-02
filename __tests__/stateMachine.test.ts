import { canTransition, assertTransition } from "@/lib/stateMachine";
import { InvalidTransitionError } from "@/lib/types";

// UNIT TEST 1: state machine transition rules.
describe("state machine (unit)", () => {
  test("allows want_to_read -> reading", () => {
    expect(canTransition("want_to_read", "reading")).toBe(true);
  });

  test("rejects direct want_to_read -> finished (must pass through reading)", () => {
    expect(canTransition("want_to_read", "finished")).toBe(false);
    expect(() => assertTransition("want_to_read", "finished")).toThrow(
      InvalidTransitionError,
    );
  });

  test("allows finished -> reading (re-reading)", () => {
    expect(canTransition("finished", "reading")).toBe(true);
  });
});
