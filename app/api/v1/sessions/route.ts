import { NextResponse } from "next/server";

import { createAssessmentSession } from "@/lib/assessment/session-service";
import { getOrCreateVisitor } from "@/lib/auth/visitor";
import { AppError, toErrorPayload } from "@/lib/http/errors";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    const error = new AppError(
      400,
      "INVALID_JSON",
      "Request body must contain valid JSON.",
    );
    const payload = toErrorPayload(error);
    return NextResponse.json(payload.body, { status: payload.status });
  }

  try {
    const visitor = await getOrCreateVisitor();
    const session = await createAssessmentSession(visitor.visitorId, body);
    const age = session.ageRange ?? "";

    return NextResponse.json(
      {
        sessionId: session.id,
        status: session.status,
        currentStep: session.currentStep,
        version: session.version,
        nextUrl: `/onboarding?sessionId=${encodeURIComponent(session.id)}&flow=${encodeURIComponent(session.flow)}&order=${encodeURIComponent(session.id)}&age=${encodeURIComponent(age)}`,
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    const payload = toErrorPayload(error);
    return NextResponse.json(payload.body, { status: payload.status });
  }
}
