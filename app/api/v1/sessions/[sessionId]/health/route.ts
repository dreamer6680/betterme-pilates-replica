import { NextResponse } from "next/server";

import { saveHealthAnswer } from "@/lib/assessment/session-service";
import { getOrCreateVisitor } from "@/lib/auth/visitor";
import { AppError, toErrorPayload } from "@/lib/http/errors";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    const payload = toErrorPayload(
      new AppError(
        400,
        "INVALID_JSON",
        "Request body must contain valid JSON.",
      ),
    );
    return NextResponse.json(payload.body, { status: payload.status });
  }

  try {
    const { sessionId } = await context.params;
    const visitor = await getOrCreateVisitor();
    const session = await saveHealthAnswer(
      visitor.visitorId,
      sessionId,
      body as {
        field: "sex" | "age" | "heightCm" | "weightKg" | "targetWeightKg";
        value: unknown;
        expectedVersion: number;
      },
    );

    return NextResponse.json(session, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const payload = toErrorPayload(error);
    return NextResponse.json(payload.body, { status: payload.status });
  }
}
