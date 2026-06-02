import fs from "fs";
import path from "path";
import { Book } from "./types";

/**
 * Resolves the JSON data file path. The LIBRARY_DATA_PATH env var override lets
 * tests point each run at an isolated temp file so they never clobber real data
 * and stay independent of one another.
 */
export function getDataPath(): string {
  return (
    process.env.LIBRARY_DATA_PATH ??
    path.join(process.cwd(), "data", "library.json")
  );
}

function ensureFile(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]", "utf-8");
  }
}

/** Reads all books from the JSON store, creating an empty store if missing. */
export function readAll(): Book[] {
  const filePath = getDataPath();
  ensureFile(filePath);
  const raw = fs.readFileSync(filePath, "utf-8").trim();
  if (raw.length === 0) {
    return [];
  }
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as Book[]) : [];
}

/** Overwrites the JSON store with the provided books. */
export function writeAll(books: Book[]): void {
  const filePath = getDataPath();
  ensureFile(filePath);
  fs.writeFileSync(filePath, JSON.stringify(books, null, 2), "utf-8");
}
