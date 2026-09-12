import { NextResponse } from "next/server";

import { getOrCreateVisitor } from "@/lib/auth/visitor";
import { AppError, toErrorPayload } from "@/lib/http/errors";
import { simulatePayment } from "@/lib/payments/payment-service";

export async function POST(request: Request) {
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
    const visitor = await getOrCreateVisitor();
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? "";
    const result = await simulatePayment(
      visitor.visitorId,
      body,
      idempotencyKey,
    );

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const payload = toErrorPayload(error);
    return NextResponse.json(payload.body, { status: payload.status });
  }
}
