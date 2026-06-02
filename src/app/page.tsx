"use client";

import { useCallback, useEffect, useState } from "react";

type BookStatus = "want_to_read" | "reading" | "finished";

interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  rating?: number;
}

const STATUS_LABEL: Record<BookStatus, string> = {
  want_to_read: "Want to read",
  reading: "Reading",
  finished: "Finished",
};

// Mirrors the server state machine in src/lib/stateMachine.ts.
const NEXT_STATUSES: Record<BookStatus, BookStatus[]> = {
  want_to_read: ["reading"],
  reading: ["finished"],
  finished: ["reading"],
};

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | BookStatus>("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/books?${params.toString()}`);
    setBooks(await res.json());
  }, [query, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handle<T>(promise: Promise<Response>): Promise<void> {
    setError(null);
    const res = await promise;
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Request failed");
      return;
    }
    await load();
  }

  async function addBook(e: React.FormEvent) {
    e.preventDefault();
    await handle(
      fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author }),
      }),
    );
    setTitle("");
    setAuthor("");
  }

  function patch(id: string, body: Record<string, unknown>) {
    return handle(
      fetch(`/api/books/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  }

  async function remove(id: string) {
    await handle(fetch(`/api/books/${id}`, { method: "DELETE" }));
  }

  async function saveEdit(id: string) {
    await patch(id, { title: editTitle, author: editAuthor });
    setEditingId(null);
  }

  function startEdit(book: Book) {
    setEditingId(book.id);
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setError(null);
  }

  return (
    <main>
      <h1>📚 Library</h1>

      <form onSubmit={addBook} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          aria-label="Title"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ flex: 1, padding: 6 }}
        />
        <input
          aria-label="Author"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
          style={{ flex: 1, padding: 6 }}
        />
        <button type="submit">Add</button>
      </form>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          aria-label="Search title"
          placeholder="Search title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, padding: 6 }}
        />
        <select
          aria-label="Filter status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "" | BookStatus)}
        >
          <option value="">All statuses</option>
          <option value="want_to_read">Want to read</option>
          <option value="reading">Reading</option>
          <option value="finished">Finished</option>
        </select>
      </div>

      {error && (
        <p style={{ color: "#b00020", fontWeight: 600 }} role="alert">
          {error}
        </p>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {books.map((book) => (
          <li
            key={book.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
              marginBottom: 8,
            }}
          >
            {editingId === book.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveEdit(book.id);
                }}
                style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
              >
                <input
                  aria-label="Edit title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  style={{ flex: 1, padding: 6 }}
                />
                <input
                  aria-label="Edit author"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  required
                  style={{ flex: 1, padding: 6 }}
                />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <strong>{book.title}</strong> — {book.author}
                <div style={{ fontSize: 14, color: "#555", margin: "4px 0" }}>
                  {STATUS_LABEL[book.status]}
                  {book.rating ? ` · ${"★".repeat(book.rating)}` : ""}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {NEXT_STATUSES[book.status].map((next) => (
                    <button
                      key={next}
                      onClick={() => patch(book.id, { status: next })}
                    >
                      → {STATUS_LABEL[next]}
                    </button>
                  ))}
                  <select
                    aria-label={`Rate ${book.title}`}
                    value={book.rating ?? ""}
                    onChange={(e) =>
                      patch(book.id, {
                        rating: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">Rate…</option>
                    {[1, 2, 3, 4, 5].map((r) => (
                      <option key={r} value={r}>
                        {r} ★
                      </option>
                    ))}
                  </select>
                  <button onClick={() => startEdit(book)}>Edit</button>
                  <button
                    onClick={() => remove(book.id)}
                    style={{ color: "#b00020" }}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
        {books.length === 0 && <li>No books found.</li>}
      </ul>
    </main>
  );
}
