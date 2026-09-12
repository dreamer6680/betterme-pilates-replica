import { NextResponse } from "next/server";
import {
  createSelection,
  validateSelectionPayload,
} from "@/lib/selection";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_JSON",
          message:
            "Request body must contain valid JSON.",
        },
      },
      {
        status: 400,
      },
    );
  }

  const validation =
    validateSelectionPayload(payload);

  if (!validation.ok) {
    return NextResponse.json(
      {
        error: validation.error,
      },
      {
        status: validation.status,
      },
    );
  }

  const result = createSelection(validation.value);

  return NextResponse.json(result, {
    status: 201,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
