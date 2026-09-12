import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/http/errors";

const paymentInputSchema = z
  .object({
    sessionId: z.string().uuid(),
    plan: z.enum(["monthly", "quarterly"]),
  })
  .strict();

export type PaymentResult = {
  paymentStatus: "SUCCEEDED";
  subscriptionStatus: "ACTIVE";
  sessionId: string;
};

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export async function simulatePayment(
  visitorId: string,
  input: unknown,
  idempotencyKey: string,
  now = new Date(),
): Promise<PaymentResult> {
  const parsed = paymentInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new AppError(
      400,
      "INVALID_PAYMENT_INPUT",
      "The payment request is invalid.",
      parsed.error.flatten(),
    );
  }

  if (
    typeof idempotencyKey !== "string" ||
    idempotencyKey.trim().length < 1 ||
    idempotencyKey.length > 128
  ) {
    throw new AppError(
      400,
      "INVALID_IDEMPOTENCY_KEY",
      "A valid Idempotency-Key header is required.",
    );
  }

  const normalizedKey = idempotencyKey.trim();
  const existing = await prisma.paymentEvent.findUnique({
    where: { idempotencyKey: normalizedKey },
    select: {
      visitorId: true,
      sessionId: true,
      status: true,
    },
  });

  if (existing) {
    if (
      existing.visitorId !== visitorId ||
      existing.sessionId !== parsed.data.sessionId
    ) {
      throw new AppError(
        409,
        "IDEMPOTENCY_KEY_REUSED",
        "This idempotency key was already used for another payment.",
      );
    }

    if (existing.status === "SUCCEEDED") {
      return {
        paymentStatus: "SUCCEEDED",
        subscriptionStatus: "ACTIVE",
        sessionId: parsed.data.sessionId,
      };
    }
  }

  return prisma.$transaction(async (tx) => {
    const session = await tx.assessmentSession.findUnique({
      where: { id: parsed.data.sessionId },
      select: {
        visitorId: true,
        status: true,
        result: { select: { id: true } },
      },
    });

    if (!session) {
      throw new AppError(
        404,
        "PAYMENT_SESSION_NOT_FOUND",
        "Assessment session was not found.",
      );
    }

    if (session.visitorId !== visitorId) {
      throw new AppError(
        403,
        "PAYMENT_FORBIDDEN",
        "This assessment session belongs to another visitor.",
      );
    }

    if (session.status !== "COMPLETED" || !session.result) {
      throw new AppError(
        409,
        "ASSESSMENT_NOT_COMPLETED",
        "Complete the assessment before activating a subscription.",
      );
    }

    const days = parsed.data.plan === "monthly" ? 30 : 90;
    const expiresAt = addDays(now, days);
    const plan = parsed.data.plan === "monthly" ? "MONTHLY" : "QUARTERLY";

    const activeSubscription = await tx.subscription.findFirst({
      where: { visitorId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (activeSubscription) {
      await tx.subscription.update({
        where: { id: activeSubscription.id },
        data: {
          plan,
          startsAt: now,
          expiresAt,
          status: "ACTIVE",
        },
      });
    } else {
      await tx.subscription.create({
        data: {
          visitorId,
          plan,
          startsAt: now,
          expiresAt,
          status: "ACTIVE",
        },
      });
    }

    await tx.paymentEvent.create({
      data: {
        visitorId,
        sessionId: parsed.data.sessionId,
        idempotencyKey: normalizedKey,
        type: "MOCK_SUBSCRIPTION_PURCHASE",
        status: "SUCCEEDED",
        payload: {
          plan: parsed.data.plan,
          startsAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
        },
      },
    });

    return {
      paymentStatus: "SUCCEEDED",
      subscriptionStatus: "ACTIVE",
      sessionId: parsed.data.sessionId,
    };
  });
}
