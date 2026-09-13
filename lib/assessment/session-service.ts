import type { AssessmentStatus, Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { CURRENT_FLOW_REVISION, funnelStepKeySchema, pageStateKeySchema } from "@/lib/funnel/steps";
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

const savePageStateSchema = z
  .object({
    stepKey: pageStateKeySchema,
    value: z.unknown(),
    expectedVersion: z.number().int().min(0),
    nextStepKey: funnelStepKeySchema,
    clearStepKeys: z.array(pageStateKeySchema).max(20).optional(),
  })
  .strict();

const saveHealthAnswerSchema = z.discriminatedUnion("field", [
  z.object({ field: z.literal("sex"), value: z.enum(["FEMALE", "MALE", "OTHER"]), expectedVersion: z.number().int().min(0) }).strict(),
  z.object({ field: z.literal("age"), value: z.number().finite().int().min(18).max(100), expectedVersion: z.number().int().min(0) }).strict(),
  z.object({ field: z.literal("heightCm"), value: z.number().finite().min(90).max(243), expectedVersion: z.number().int().min(0) }).strict(),
  z.object({ field: z.literal("weightKg"), value: z.number().finite().min(35).max(300), expectedVersion: z.number().int().min(0) }).strict(),
  z.object({ field: z.literal("targetWeightKg"), value: z.number().finite().min(35).max(300), expectedVersion: z.number().int().min(0) }).strict(),
]);

export type AssessmentSessionSnapshot = {
  id: string;
  flow: string;
  flowRevision: string;
  ageRange: string | null;
  currentStep: number;
  currentStepKey: string | null;
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

export type SavePageStateInput = {
  stepKey: string;
  value: unknown;
  expectedVersion: number;
  nextStepKey: string;
  clearStepKeys?: string[];
};

function normalizeAnswers(answers: Array<{ stepKey: string; value: Prisma.JsonValue }>): Record<string, unknown> {
  return Object.fromEntries(answers.map((answer) => [answer.stepKey, answer.value]));
}

function toSnapshot(session: {
  id: string;
  flow: string;
  flowRevision: string;
  ageRange: string | null;
  currentStep: number;
  currentStepKey: string | null;
  version: number;
  status: AssessmentStatus;
  answers: Array<{ stepKey: string; value: Prisma.JsonValue }>;
}): AssessmentSessionSnapshot {
  return {
    id: session.id,
    flow: session.flow,
    flowRevision: session.flowRevision,
    ageRange: session.ageRange,
    currentStep: session.currentStep,
    currentStepKey: session.currentStepKey,
    version: session.version,
    status: session.status,
    answers: normalizeAnswers(session.answers),
  };
}

function validateAnswerValue(stepKey: string, stepIndex: number, answer: unknown) {
  const step = ONBOARDING_STEPS[stepIndex];

  if (!step || step.id !== stepKey) {
    throw new AppError(400, "INVALID_ANSWER_INPUT", "The answer does not match the requested questionnaire step.");
  }

  if (step.kind === "single") {
    const valid = typeof answer === "string" && step.options.some((option) => option.value === answer);
    if (!valid) throw new AppError(400, "INVALID_ANSWER_INPUT", "The answer is not a valid option for this step.");
    return answer as Prisma.InputJsonValue;
  }

  if (step.kind === "multi") {
    const valid = Array.isArray(answer) && answer.length >= step.minChoices && new Set(answer).size === answer.length && answer.every((value) => typeof value === "string" && step.options.some((option) => option.value === value));
    if (!valid) throw new AppError(400, "INVALID_ANSWER_INPUT", "The submitted choices are invalid for this step.");
    return answer as Prisma.InputJsonValue;
  }

  throw new AppError(400, "INVALID_ANSWER_INPUT", "This questionnaire step does not accept an answer.");
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === undefined) throw new AppError(400, "INVALID_PAGE_STATE", "Page state must be JSON serializable.");
  try {
    JSON.stringify(value);
  } catch {
    throw new AppError(400, "INVALID_PAGE_STATE", "Page state must be JSON serializable.");
  }
  return value as Prisma.InputJsonValue;
}

async function assertVersionedDraftSession(tx: Prisma.TransactionClient, visitorId: string, sessionId: string, expectedVersion: number) {
  const guarded = await tx.assessmentSession.updateMany({
    where: { id: sessionId, visitorId, status: "DRAFT", version: expectedVersion },
    data: { version: { increment: 1 } },
  });

  if (guarded.count === 1) return;

  const current = await tx.assessmentSession.findUnique({
    where: { id: sessionId },
    select: { visitorId: true, version: true, status: true },
  });

  if (!current) throw new AppError(404, "SESSION_NOT_FOUND", "The assessment session was not found.");
  if (current.visitorId !== visitorId) throw new AppError(403, "SESSION_FORBIDDEN", "This assessment session belongs to another visitor.");
  if (current.status !== "DRAFT") throw new AppError(409, "SESSION_COMPLETED", "Completed assessment sessions cannot be edited.");
  throw new AppError(409, "SESSION_VERSION_CONFLICT", "The session changed since this client loaded it.", { currentVersion: current.version });
}

export async function createAssessmentSession(visitorId: string, input: unknown): Promise<AssessmentSessionSnapshot> {
  const parsed = createSessionSchema.safeParse(input);
  if (!parsed.success) throw new AppError(400, "INVALID_SESSION_INPUT", "The session input is invalid.", parsed.error.flatten());

  const session = await prisma.assessmentSession.create({
    data: {
      visitorId,
      flow: parsed.data.flow,
      flowRevision: CURRENT_FLOW_REVISION,
      ageRange: parsed.data.ageRange,
    },
    include: { answers: { select: { stepKey: true, value: true } } },
  });

  return toSnapshot(session);
}

export async function getAssessmentSession(visitorId: string, sessionId: string): Promise<AssessmentSessionSnapshot> {
  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    include: { answers: { select: { stepKey: true, value: true } } },
  });

  if (!session) throw new AppError(404, "SESSION_NOT_FOUND", "The assessment session was not found.");
  if (session.visitorId !== visitorId) throw new AppError(403, "SESSION_FORBIDDEN", "This assessment session belongs to another visitor.");
  return toSnapshot(session);
}

export async function savePageState(visitorId: string, sessionId: string, input: SavePageStateInput): Promise<AssessmentSessionSnapshot> {
  const parsed = savePageStateSchema.safeParse(input);
  if (!parsed.success) throw new AppError(400, "INVALID_PAGE_STATE", "The page state request is invalid.", parsed.error.flatten());

  const value = toJsonValue(parsed.data.value);

  return prisma.$transaction(async (tx) => {
    await assertVersionedDraftSession(tx, visitorId, sessionId, parsed.data.expectedVersion);

    await tx.assessmentAnswer.upsert({
      where: { sessionId_stepKey: { sessionId, stepKey: parsed.data.stepKey } },
      create: { sessionId, stepKey: parsed.data.stepKey, value, revision: 1 },
      update: { value, revision: { increment: 1 } },
    });

    if (parsed.data.clearStepKeys?.length) {
      await tx.assessmentAnswer.deleteMany({ where: { sessionId, stepKey: { in: parsed.data.clearStepKeys } } });
    }

    const session = await tx.assessmentSession.update({
      where: { id: sessionId },
      data: { currentStepKey: parsed.data.nextStepKey },
      include: { answers: { select: { stepKey: true, value: true } } },
    });

    return toSnapshot(session);
  });
}

export async function saveHealthAnswer(visitorId: string, sessionId: string, input: unknown): Promise<AssessmentSessionSnapshot> {
  const parsed = saveHealthAnswerSchema.safeParse(input);
  if (!parsed.success) throw new AppError(400, "INVALID_HEALTH_ANSWER", "The health answer is invalid.", parsed.error.flatten());

  return prisma.$transaction(async (tx) => {
    await assertVersionedDraftSession(tx, visitorId, sessionId, parsed.data.expectedVersion);

    await tx.assessmentAnswer.upsert({
      where: { sessionId_stepKey: { sessionId, stepKey: parsed.data.field } },
      create: { sessionId, stepKey: parsed.data.field, value: parsed.data.value as Prisma.InputJsonValue, revision: 1 },
      update: { value: parsed.data.value as Prisma.InputJsonValue, revision: { increment: 1 } },
    });

    const session = await tx.assessmentSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { answers: { select: { stepKey: true, value: true } } },
    });

    return toSnapshot(session);
  });
}

export async function saveAssessmentAnswer(visitorId: string, sessionId: string, input: SaveAssessmentAnswerInput): Promise<AssessmentSessionSnapshot> {
  const parsed = saveAnswerSchema.safeParse(input);
  if (!parsed.success) throw new AppError(400, "INVALID_ANSWER_INPUT", "The answer request is invalid.", parsed.error.flatten());

  const answerValue = validateAnswerValue(parsed.data.stepKey, parsed.data.stepIndex, parsed.data.answer);

  return prisma.$transaction(async (tx) => {
    await assertVersionedDraftSession(tx, visitorId, sessionId, parsed.data.expectedVersion);

    await tx.assessmentAnswer.upsert({
      where: { sessionId_stepKey: { sessionId, stepKey: parsed.data.stepKey } },
      create: { sessionId, stepKey: parsed.data.stepKey, value: answerValue, revision: 1 },
      update: { value: answerValue, revision: { increment: 1 } },
    });

    const current = await tx.assessmentSession.findUniqueOrThrow({ where: { id: sessionId }, select: { currentStep: true } });

    return tx.assessmentSession.update({
      where: { id: sessionId },
      data: { currentStep: Math.max(current.currentStep, parsed.data.stepIndex + 1) },
      include: { answers: { select: { stepKey: true, value: true } } },
    }).then(toSnapshot);
  });
}
