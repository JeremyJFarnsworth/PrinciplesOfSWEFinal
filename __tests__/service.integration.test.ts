import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { addBook, changeStatus, searchBooks } from "@/lib/libraryService";
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

function readFileBooks(): Book[] {
  return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
}

// INTEGRATION TEST: service + state machine + validation + repository (JSON file)
// all working together across a full want_to_read -> reading -> finished path.
describe("library service integration", () => {
  test("persists a book through the full lifecycle to the JSON file", () => {
    const created = addBook({ title: "The Hobbit", author: "Tolkien" });
    expect(created.status).toBe("want_to_read");

    changeStatus(created.id, "reading");
    changeStatus(created.id, "finished");

    // Read the raw file back from disk to prove persistence across modules.
    const onDisk = readFileBooks();
    expect(onDisk).toHaveLength(1);
    expect(onDisk[0]).toMatchObject({
      id: created.id,
      title: "The Hobbit",
      author: "Tolkien",
      status: "finished",
    });
  });

  test("search filters persisted data by title and status together", () => {
    const dune = addBook({ title: "Dune", author: "Herbert" });
    addBook({ title: "Dune Messiah", author: "Herbert" });
    addBook({ title: "Foundation", author: "Asimov" });

    changeStatus(dune.id, "reading");

    // status-only filter
    expect(searchBooks({ status: "reading" }).map((b) => b.title)).toEqual([
      "Dune",
    ]);

    // title substring matches both Dune titles
    expect(searchBooks({ q: "dune" })).toHaveLength(2);

    // combined title + status (AND) narrows to the single reading "Dune"
    const combined = searchBooks({ q: "dune", status: "reading" });
    expect(combined).toHaveLength(1);
    expect(combined[0].id).toBe(dune.id);
  });
});
