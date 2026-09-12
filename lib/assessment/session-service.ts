import type { AssessmentStatus, Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/http/errors";

const createSessionSchema = z
  .object({
    flow: z.literal("2117"),
    ageRange: z.enum(["18-29", "30-39", "40-49", "50+"]),
  })
  .strict();

export type AssessmentSessionSnapshot = {
  id: string;
  flow: string;
  ageRange: string | null;
  currentStep: number;
  version: number;
  status: AssessmentStatus;
  answers: Record<string, unknown>;
};

function normalizeAnswers(
  answers: Array<{ stepKey: string; value: Prisma.JsonValue }>,
): Record<string, unknown> {
  return Object.fromEntries(
    answers.map((answer) => [answer.stepKey, answer.value]),
  );
}

function toSnapshot(session: {
  id: string;
  flow: string;
  ageRange: string | null;
  currentStep: number;
  version: number;
  status: AssessmentStatus;
  answers: Array<{ stepKey: string; value: Prisma.JsonValue }>;
}): AssessmentSessionSnapshot {
  return {
    id: session.id,
    flow: session.flow,
    ageRange: session.ageRange,
    currentStep: session.currentStep,
    version: session.version,
    status: session.status,
    answers: normalizeAnswers(session.answers),
  };
}

export async function createAssessmentSession(
  visitorId: string,
  input: unknown,
): Promise<AssessmentSessionSnapshot> {
  const parsed = createSessionSchema.safeParse(input);

  if (!parsed.success) {
    throw new AppError(
      400,
      "INVALID_SESSION_INPUT",
      "The session input is invalid.",
      parsed.error.flatten(),
    );
  }

  const session = await prisma.assessmentSession.create({
    data: {
      visitorId,
      flow: parsed.data.flow,
      ageRange: parsed.data.ageRange,
    },
    include: {
      answers: {
        select: {
          stepKey: true,
          value: true,
        },
      },
    },
  });

  return toSnapshot(session);
}

export async function getAssessmentSession(
  visitorId: string,
  sessionId: string,
): Promise<AssessmentSessionSnapshot> {
  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    include: {
      answers: {
        select: {
          stepKey: true,
          value: true,
        },
      },
    },
  });

  if (!session) {
    throw new AppError(
      404,
      "SESSION_NOT_FOUND",
      "The assessment session was not found.",
    );
  }

  if (session.visitorId !== visitorId) {
    throw new AppError(
      403,
      "SESSION_FORBIDDEN",
      "This assessment session belongs to another visitor.",
    );
  }

  return toSnapshot(session);
}
