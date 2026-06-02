import { NextResponse } from "next/server";
import { DomainError } from "./types";

/** Maps thrown errors to a JSON error response with the right HTTP status. */
export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof DomainError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof SyntaxError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
