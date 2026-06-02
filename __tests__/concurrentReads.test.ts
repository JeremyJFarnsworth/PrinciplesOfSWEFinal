import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import {
  addBook,
  changeStatus,
  MAX_CONCURRENT_READING,
} from "@/lib/libraryService";
import { ConcurrentReadLimitError } from "@/lib/types";

let dataFile: string;

beforeEach(() => {
  // Point the repository at an isolated temp store for this test.
  dataFile = path.join(os.tmpdir(), `library-${randomUUID()}.json`);
  process.env.LIBRARY_DATA_PATH = dataFile;
});

afterEach(() => {
  delete process.env.LIBRARY_DATA_PATH;
  if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
});

// BOUNDARY TEST 2: the concurrent-reads limit edge (allow Nth, reject N+1).
describe("concurrent reading limit (boundary)", () => {
  test("allows up to the limit and rejects one over", () => {
    const ids = Array.from({ length: MAX_CONCURRENT_READING + 1 }, (_, i) =>
      addBook({ title: `Book ${i}`, author: "A" }).id,
    );

    // Moving exactly MAX books into `reading` is allowed.
    for (let i = 0; i < MAX_CONCURRENT_READING; i++) {
      expect(changeStatus(ids[i], "reading").status).toBe("reading");
    }

    // The (MAX + 1)th concurrent read is rejected.
    expect(() => changeStatus(ids[MAX_CONCURRENT_READING], "reading")).toThrow(
      ConcurrentReadLimitError,
    );

    // Freeing a slot (finish one) lets another book start reading.
    changeStatus(ids[0], "finished");
    expect(changeStatus(ids[MAX_CONCURRENT_READING], "reading").status).toBe(
      "reading",
    );
  });
});
