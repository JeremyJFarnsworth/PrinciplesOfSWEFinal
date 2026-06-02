import { randomUUID } from "crypto";
import { readAll, writeAll } from "./repository";
import { assertTransition } from "./stateMachine";
import { validateNewBook, validateRating } from "./validation";
import {
  Book,
  BookStatus,
  ConcurrentReadLimitError,
  NewBookInput,
  NotFoundError,
  Rating,
  ValidationError,
} from "./types";

/** Maximum number of books allowed in the `reading` status at the same time. */
export const MAX_CONCURRENT_READING = 3;

/** Returns every book in the library. */
export function listBooks(): Book[] {
  return readAll();
}

/** Returns a single book by id, or throws NotFoundError. */
export function getBook(id: string): Book {
  const book = readAll().find((b) => b.id === id);
  if (!book) {
    throw new NotFoundError();
  }
  return book;
}

/**
 * Searches books by title (case-insensitive substring) and/or status (exact).
 * Both filters are combined with AND. With no criteria, returns all books.
 */
export function searchBooks(criteria: {
  q?: string;
  status?: string;
}): Book[] {
  const q = criteria.q?.trim().toLowerCase();
  const status = criteria.status?.trim();

  return readAll().filter((book) => {
    const titleMatch = !q || book.title.toLowerCase().includes(q);
    const statusMatch = !status || book.status === status;
    return titleMatch && statusMatch;
  });
}

/** Validates input, then creates and persists a new book. */
export function addBook(input: NewBookInput): Book {
  const valid = validateNewBook(input);
  const books = readAll();

  // If the new book starts in `reading`, it must respect the concurrency rule.
  if (valid.status === "reading") {
    assertReadingCapacity(books);
  }

  const book: Book = {
    id: randomUUID(),
    title: valid.title,
    author: valid.author,
    status: valid.status,
    ...(valid.rating !== undefined ? { rating: valid.rating } : {}),
  };

  books.push(book);
  writeAll(books);
  return book;
}

/**
 * Transitions a book to a new status, enforcing the state machine and the
 * concurrent-reads limit. Returns the updated book.
 */
export function changeStatus(id: string, to: BookStatus): Book {
  const books = readAll();
  const book = books.find((b) => b.id === id);
  if (!book) {
    throw new NotFoundError();
  }

  assertTransition(book.status, to);

  if (to === "reading") {
    assertReadingCapacity(books);
  }

  book.status = to;
  writeAll(books);
  return book;
}

/**
 * Updates a book's editable details (title and/or author). Trims and validates
 * any provided field; status and rating have their own dedicated operations.
 */
export function updateBookDetails(
  id: string,
  fields: { title?: string; author?: string },
): Book {
  const books = readAll();
  const book = books.find((b) => b.id === id);
  if (!book) {
    throw new NotFoundError();
  }

  if (fields.title !== undefined) {
    const title = fields.title.trim();
    if (title.length === 0) {
      throw new ValidationError("Title is required");
    }
    book.title = title;
  }
  if (fields.author !== undefined) {
    const author = fields.author.trim();
    if (author.length === 0) {
      throw new ValidationError("Author is required");
    }
    book.author = author;
  }

  writeAll(books);
  return book;
}

/** Deletes a book by id. Throws NotFoundError when it does not exist. */
export function deleteBook(id: string): void {
  const books = readAll();
  const next = books.filter((b) => b.id !== id);
  if (next.length === books.length) {
    throw new NotFoundError();
  }
  writeAll(next);
}

/** Sets (or clears) the rating on a book. Pass undefined to clear it. */
export function setRating(id: string, rating: number | undefined): Book {
  const valid: Rating | undefined = validateRating(rating);
  const books = readAll();
  const book = books.find((b) => b.id === id);
  if (!book) {
    throw new NotFoundError();
  }

  if (valid === undefined) {
    delete book.rating;
  } else {
    book.rating = valid;
  }

  writeAll(books);
  return book;
}

/** Throws when the library is already at the concurrent-reading limit. */
function assertReadingCapacity(books: Book[]): void {
  const reading = books.filter((b) => b.status === "reading").length;
  if (reading >= MAX_CONCURRENT_READING) {
    throw new ConcurrentReadLimitError(MAX_CONCURRENT_READING);
  }
}
