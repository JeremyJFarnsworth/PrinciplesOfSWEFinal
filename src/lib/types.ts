// Domain types and typed errors shared across the app.

export type BookStatus = "want_to_read" | "reading" | "finished";

export const BOOK_STATUSES: BookStatus[] = [
  "want_to_read",
  "reading",
  "finished",
];

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  /** Optional 1-5 rating. Absent when the book has not been rated. */
  rating?: Rating;
}

/** Input accepted when creating a book. status/rating are optional. */
export interface NewBookInput {
  title: string;
  author: string;
  status?: BookStatus;
  rating?: number;
}

/** Base class so route handlers can map domain errors to HTTP status codes. */
export class DomainError extends Error {
  /** HTTP status the API layer should respond with. */
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = new.target.name;
    this.status = status;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "Book not found") {
    super(message, 404);
  }
}

export class InvalidTransitionError extends DomainError {
  constructor(from: BookStatus, to: BookStatus) {
    super(`Invalid status transition: ${from} -> ${to}`, 400);
  }
}

export class ConcurrentReadLimitError extends DomainError {
  constructor(limit: number) {
    super(
      `Cannot have more than ${limit} books in 'reading' at the same time`,
      409,
    );
  }
}
