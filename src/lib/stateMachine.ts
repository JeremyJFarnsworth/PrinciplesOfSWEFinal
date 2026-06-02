import { BookStatus, InvalidTransitionError } from "./types";

/**
 * Allowed status transitions for a book.
 *
 *   want_to_read -> reading
 *   reading      -> finished
 *   finished     -> reading   (re-reading a book)
 *
 * Note there is deliberately NO direct want_to_read -> finished edge, so a book
 * must pass through `reading` before it can be marked finished.
 */
export const ALLOWED_TRANSITIONS: Record<BookStatus, BookStatus[]> = {
  want_to_read: ["reading"],
  reading: ["finished"],
  finished: ["reading"],
};

/** Returns true if moving from `from` to `to` is a legal transition. */
export function canTransition(from: BookStatus, to: BookStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Throws InvalidTransitionError when the transition is not allowed. */
export function assertTransition(from: BookStatus, to: BookStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}
