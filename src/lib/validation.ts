import {
  BOOK_STATUSES,
  BookStatus,
  NewBookInput,
  Rating,
  ValidationError,
} from "./types";

/**
 * Validates an optional rating. Returns the rating as a typed Rating, or
 * undefined when none was provided. Throws ValidationError for out-of-range
 * or non-integer values. Valid ratings are integers 1..5 inclusive.
 */
export function validateRating(rating: number | undefined): Rating | undefined {
  if (rating === undefined || rating === null) {
    return undefined;
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ValidationError("Rating must be an integer between 1 and 5");
  }
  return rating as Rating;
}

function validateStatus(status: string | undefined): BookStatus {
  if (status === undefined) {
    return "want_to_read";
  }
  if (!BOOK_STATUSES.includes(status as BookStatus)) {
    throw new ValidationError(
      `Status must be one of: ${BOOK_STATUSES.join(", ")}`,
    );
  }
  return status as BookStatus;
}

export interface ValidatedNewBook {
  title: string;
  author: string;
  status: BookStatus;
  rating?: Rating;
}

/**
 * Validates and normalizes input for a new book. Trims strings, applies the
 * default status, and validates the optional rating. Throws ValidationError
 * on empty title/author or invalid status/rating.
 */
export function validateNewBook(input: NewBookInput): ValidatedNewBook {
  const title = (input?.title ?? "").trim();
  const author = (input?.author ?? "").trim();

  if (title.length === 0) {
    throw new ValidationError("Title is required");
  }
  if (author.length === 0) {
    throw new ValidationError("Author is required");
  }

  return {
    title,
    author,
    status: validateStatus(input.status),
    rating: validateRating(input.rating),
  };
}
