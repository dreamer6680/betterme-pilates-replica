import { NextResponse } from "next/server";

import { completeAssessment } from "@/lib/assessment/completion-service";
import { getOrCreateVisitor } from "@/lib/auth/visitor";
import { toErrorPayload } from "@/lib/http/errors";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const visitor = await getOrCreateVisitor();
    const completed = await completeAssessment(visitor.visitorId, sessionId);

    return NextResponse.json({
      sessionId: completed.sessionId,
      status: "COMPLETED",
      resultId: completed.resultId,
      resultUrl: `/results/${encodeURIComponent(completed.sessionId)}`,
    });
  } catch (error) {
    const payload = toErrorPayload(error);
    return NextResponse.json(payload.body, { status: payload.status });
  }
}
