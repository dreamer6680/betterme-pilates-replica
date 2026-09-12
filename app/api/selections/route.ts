import { NextResponse } from "next/server";

import { createAssessmentSession } from "@/lib/assessment/session-service";
import { getOrCreateVisitor } from "@/lib/auth/visitor";
import { toErrorPayload } from "@/lib/http/errors";
import { validateSelectionPayload } from "@/lib/selection";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_JSON",
          message: "Request body must contain valid JSON.",
        },
      },
      { status: 400 },
    );
  }

  const validation = validateSelectionPayload(payload);

  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status },
    );
  }

  try {
    const visitor = await getOrCreateVisitor();
    const session = await createAssessmentSession(
      visitor.visitorId,
      validation.value,
    );
    const age = session.ageRange ?? validation.value.ageRange;

    return NextResponse.json(
      {
        orderId: session.id,
        sessionId: session.id,
        nextUrl: `/onboarding?sessionId=${encodeURIComponent(session.id)}&flow=${encodeURIComponent(session.flow)}&order=${encodeURIComponent(session.id)}&age=${encodeURIComponent(age)}`,
        selection: validation.value,
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    const result = toErrorPayload(error);
    return NextResponse.json(result.body, { status: result.status });
  }
}
