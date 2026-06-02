import { NextRequest, NextResponse } from "next/server";
import { changeStatus, getBook, setRating } from "@/lib/libraryService";
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
 * PATCH /api/books/:id — update status and/or rating.
 * Body: { status?: BookStatus, rating?: number | null }
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const body = await request.json();
    let book = getBook(params.id);

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
