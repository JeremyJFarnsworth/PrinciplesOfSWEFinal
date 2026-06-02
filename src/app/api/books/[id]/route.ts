import { NextRequest, NextResponse } from "next/server";
import {
  changeStatus,
  deleteBook,
  getBook,
  setRating,
  updateBookDetails,
} from "@/lib/libraryService";
import { toErrorResponse } from "@/lib/apiError";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

/** GET /api/books/:id — fetch a single book. */
export function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    return NextResponse.json(getBook(params.id));
  } catch (err) {
    return toErrorResponse(err);
  }
}

/**
 * PATCH /api/books/:id — update editable details, status, and/or rating.
 * Body: { title?: string, author?: string, status?: BookStatus, rating?: number | null }
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const body = await request.json();
    let book = getBook(params.id);

    if (body.title !== undefined || body.author !== undefined) {
      book = updateBookDetails(params.id, {
        title: body.title,
        author: body.author,
      });
    }
    if (body.status !== undefined) {
      book = changeStatus(params.id, body.status);
    }
    if ("rating" in body) {
      book = setRating(params.id, body.rating ?? undefined);
    }

    return NextResponse.json(book);
  } catch (err) {
    return toErrorResponse(err);
  }
}

/** DELETE /api/books/:id — remove a book. */
export function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    deleteBook(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
