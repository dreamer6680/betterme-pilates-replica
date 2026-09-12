import { NextResponse } from "next/server";

import { getResultForVisitor } from "@/lib/assessment/result-access";
import { getOrCreateVisitor } from "@/lib/auth/visitor";
import { toErrorPayload } from "@/lib/http/errors";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const visitor = await getOrCreateVisitor();
    const result = await getResultForVisitor(visitor.visitorId, sessionId);

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const payload = toErrorPayload(error);
    return NextResponse.json(payload.body, { status: payload.status });
  }
}
