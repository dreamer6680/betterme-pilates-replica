import type { AssessmentStatus, Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/http/errors";
import { ONBOARDING_STEPS } from "@/lib/onboarding";

const createSessionSchema = z
  .object({
    flow: z.literal("2117"),
    ageRange: z.enum(["18-29", "30-39", "40-49", "50+"]),
  })
  .strict();

const saveAnswerSchema = z
  .object({
    stepKey: z.string().min(1),
    answer: z.unknown(),
    stepIndex: z.number().int().min(0).max(ONBOARDING_STEPS.length - 1),
    expectedVersion: z.number().int().min(0),
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

export type SaveAssessmentAnswerInput = {
  stepKey: string;
  answer: unknown;
  stepIndex: number;
  expectedVersion: number;
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

function validateAnswerValue(stepKey: string, stepIndex: number, answer: unknown) {
  const step = ONBOARDING_STEPS[stepIndex];

  if (!step || step.id !== stepKey) {
    throw new AppError(
      400,
      "INVALID_ANSWER_INPUT",
      "The answer does not match the requested questionnaire step.",
    );
  }

  if (step.kind === "single") {
    const valid =
      typeof answer === "string" &&
      step.options.some((option) => option.value === answer);

    if (!valid) {
      throw new AppError(
        400,
        "INVALID_ANSWER_INPUT",
        "The answer is not a valid option for this step.",
      );
    }

    return answer as Prisma.InputJsonValue;
  }

  if (step.kind === "multi") {
    const valid =
      Array.isArray(answer) &&
      answer.length >= step.minChoices &&
      new Set(answer).size === answer.length &&
      answer.every(
        (value) =>
          typeof value === "string" &&
          step.options.some((option) => option.value === value),
      );

    if (!valid) {
      throw new AppError(
        400,
        "INVALID_ANSWER_INPUT",
        "The submitted choices are invalid for this step.",
      );
    }

    return answer as Prisma.InputJsonValue;
  }

  throw new AppError(
    400,
    "INVALID_ANSWER_INPUT",
    "This questionnaire step does not accept an answer.",
  );
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

export async function saveAssessmentAnswer(
  visitorId: string,
  sessionId: string,
  input: SaveAssessmentAnswerInput,
): Promise<AssessmentSessionSnapshot> {
  const parsed = saveAnswerSchema.safeParse(input);

  if (!parsed.success) {
    throw new AppError(
      400,
      "INVALID_ANSWER_INPUT",
      "The answer request is invalid.",
      parsed.error.flatten(),
    );
  }

  const answerValue = validateAnswerValue(
    parsed.data.stepKey,
    parsed.data.stepIndex,
    parsed.data.answer,
  );

  return prisma.$transaction(async (tx) => {
    const guarded = await tx.assessmentSession.updateMany({
      where: {
        id: sessionId,
        visitorId,
        status: "DRAFT",
        version: parsed.data.expectedVersion,
      },
      data: {
        version: { increment: 1 },
      },
    });

    if (guarded.count !== 1) {
      const current = await tx.assessmentSession.findUnique({
        where: { id: sessionId },
        select: {
          visitorId: true,
          version: true,
          status: true,
        },
      });

      if (!current) {
        throw new AppError(
          404,
          "SESSION_NOT_FOUND",
          "The assessment session was not found.",
        );
      }

      if (current.visitorId !== visitorId) {
        throw new AppError(
          403,
          "SESSION_FORBIDDEN",
          "This assessment session belongs to another visitor.",
        );
      }

      if (current.status !== "DRAFT") {
        throw new AppError(
          409,
          "SESSION_COMPLETED",
          "Completed assessment sessions cannot be edited.",
        );
      }

      throw new AppError(
        409,
        "SESSION_VERSION_CONFLICT",
        "The session changed since this client loaded it.",
        { currentVersion: current.version },
      );
    }

    await tx.assessmentAnswer.upsert({
      where: {
        sessionId_stepKey: {
          sessionId,
          stepKey: parsed.data.stepKey,
        },
      },
      create: {
        sessionId,
        stepKey: parsed.data.stepKey,
        value: answerValue,
        revision: 1,
      },
      update: {
        value: answerValue,
        revision: { increment: 1 },
      },
    });

    const current = await tx.assessmentSession.findUniqueOrThrow({
      where: { id: sessionId },
      select: { currentStep: true },
    });

    return tx.assessmentSession
      .update({
        where: { id: sessionId },
        data: {
          currentStep: Math.max(
            current.currentStep,
            parsed.data.stepIndex + 1,
          ),
        },
        include: {
          answers: {
            select: {
              stepKey: true,
              value: true,
            },
          },
        },
      })
      .then(toSnapshot);
  });
}
