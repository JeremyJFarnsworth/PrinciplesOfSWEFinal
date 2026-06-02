# Library App

A small reading-list library built with **Next.js (App Router)** and **JSON-file persistence** (no database). It demonstrates a validated state machine, a business rule, search, and a layered, testable architecture.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # run the full test suite (Jest)
npm run build    # production build
```

## Data model

A `Book` has `title`, `author`, `status`, and an optional `rating` (1–5).

`status` is one of `want_to_read`, `reading`, `finished`.

## Rules

### State transitions

```
want_to_read ──▶ reading ──▶ finished
                   ▲             │
                   └─────────────┘   (finished ──▶ reading = re-read)
```

- `want_to_read → reading`
- `reading → finished`
- `finished → reading` (re-reading)
- `want_to_read → finished` is **not** a direct transition — a book must pass
  through `reading` first. Attempting it returns HTTP `400`.

Defined in [src/lib/stateMachine.ts](src/lib/stateMachine.ts) and enforced by
[src/lib/libraryService.ts](src/lib/libraryService.ts).

### Concurrent-reads limit

At most **3** books may be in `reading` at the same time (global). A 4th
transition into `reading` is rejected with HTTP `409`. Enforced in
`changeStatus` / `addBook` in [src/lib/libraryService.ts](src/lib/libraryService.ts).

### Search

`GET /api/books?q=<title>&status=<status>` searches by **title** (case-insensitive
substring) and/or **status** (exact match), combined with AND.

## Architecture

Business logic and persistence are isolated from Next.js so they can be unit
tested directly:

| Layer | Files |
| --- | --- |
| Domain types & errors | [src/lib/types.ts](src/lib/types.ts) |
| State machine | [src/lib/stateMachine.ts](src/lib/stateMachine.ts) |
| Validation | [src/lib/validation.ts](src/lib/validation.ts) |
| Persistence (JSON file) | [src/lib/repository.ts](src/lib/repository.ts) |
| Business logic | [src/lib/libraryService.ts](src/lib/libraryService.ts) |
| API route handlers | [src/app/api/books/route.ts](src/app/api/books/route.ts), [src/app/api/books/[id]/route.ts](src/app/api/books/[id]/route.ts) |
| UI | [src/app/page.tsx](src/app/page.tsx) |

Data is stored in [data/library.json](data/library.json). Tests override the
store path via the `LIBRARY_DATA_PATH` environment variable so each run uses an
isolated temp file.

## Tests

Run with `npm test`. The suite covers the required categories:

| Type | File |
| --- | --- |
| Unit (state machine) | [\_\_tests\_\_/stateMachine.test.ts](__tests__/stateMachine.test.ts) |
| Unit (validation) | [\_\_tests\_\_/validation.test.ts](__tests__/validation.test.ts) |
| Boundary (rating 1–5 edges) | [\_\_tests\_\_/validation.test.ts](__tests__/validation.test.ts) |
| Boundary (3-reading limit) | [\_\_tests\_\_/concurrentReads.test.ts](__tests__/concurrentReads.test.ts) |
| Integration (service + state machine + repository + file) | [\_\_tests\_\_/service.integration.test.ts](__tests__/service.integration.test.ts) |
| System / E2E (API → service → repository → JSON file, incl. edit + delete) | [\_\_tests\_\_/api.e2e.test.ts](__tests__/api.e2e.test.ts) |
