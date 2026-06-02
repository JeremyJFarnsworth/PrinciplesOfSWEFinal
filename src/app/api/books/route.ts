import { NextRequest, NextResponse } from "next/server";
import { addBook, searchBooks } from "@/lib/libraryService";
import { toErrorResponse } from "@/lib/apiError";

// fs-backed persistence requires the Node.js runtime, not the Edge runtime.
export const runtime = "nodejs";

/** GET /api/books?q=<title>&status=<status> — list with optional search. */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const books = searchBooks({
    q: params.get("q") ?? undefined,
    status: params.get("status") ?? undefined,
  });
  return NextResponse.json(books);
}

/** POST /api/books — create a book from a JSON body. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const book = addBook(body);
    return NextResponse.json(book, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
