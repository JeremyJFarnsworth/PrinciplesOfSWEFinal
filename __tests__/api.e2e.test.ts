import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { GET as listBooks, POST as createBook } from "@/app/api/books/route";
import { PATCH as patchBook } from "@/app/api/books/[id]/route";
// (handlers under test import their error mapper from @/lib/apiError)
import { Book } from "@/lib/types";

let dataFile: string;

beforeEach(() => {
  dataFile = path.join(os.tmpdir(), `library-${randomUUID()}.json`);
  process.env.LIBRARY_DATA_PATH = dataFile;
});

afterEach(() => {
  delete process.env.LIBRARY_DATA_PATH;
  if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
});

function jsonRequest(url: string, method: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

function readFileBooks(): Book[] {
  return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
}

// SYSTEM / E2E TEST: full path from API call -> service -> repository -> JSON file.
describe("books API end-to-end", () => {
  test("create then transition + rate via the API, persisted to disk", async () => {
    // POST /api/books
    const createRes = await createBook(
      jsonRequest("http://test/api/books", "POST", {
        title: "1984",
        author: "Orwell",
      }),
    );
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as Book;
    expect(created.status).toBe("want_to_read");

    const ctx = { params: { id: created.id } };

    // PATCH to reading, then finished (state machine path enforced by the API).
    await patchBook(
      jsonRequest(`http://test/api/books/${created.id}`, "PATCH", {
        status: "reading",
      }),
      ctx,
    );
    await patchBook(
      jsonRequest(`http://test/api/books/${created.id}`, "PATCH", {
        status: "finished",
      }),
      ctx,
    );

    // PATCH a rating.
    const ratedRes = await patchBook(
      jsonRequest(`http://test/api/books/${created.id}`, "PATCH", {
        rating: 5,
      }),
      ctx,
    );
    expect(ratedRes.status).toBe(200);

    // Verify the result is actually persisted in the JSON store on disk.
    const onDisk = readFileBooks();
    expect(onDisk).toHaveLength(1);
    expect(onDisk[0]).toMatchObject({
      title: "1984",
      author: "Orwell",
      status: "finished",
      rating: 5,
    });

    // And that GET (search) reflects the persisted state.
    const listRes = await listBooks(
      jsonRequest("http://test/api/books?status=finished", "GET"),
    );
    const finished = (await listRes.json()) as Book[];
    expect(finished.map((b) => b.title)).toEqual(["1984"]);
  });

  test("API rejects an illegal direct transition with HTTP 400", async () => {
    const createRes = await createBook(
      jsonRequest("http://test/api/books", "POST", {
        title: "Brave New World",
        author: "Huxley",
      }),
    );
    const created = (await createRes.json()) as Book;

    // want_to_read -> finished is not allowed (must pass through reading).
    const badRes = await patchBook(
      jsonRequest(`http://test/api/books/${created.id}`, "PATCH", {
        status: "finished",
      }),
      { params: { id: created.id } },
    );
    expect(badRes.status).toBe(400);
  });
});
