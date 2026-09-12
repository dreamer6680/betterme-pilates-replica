import type { Prisma } from "@prisma/client";

import { calculateAssessment } from "@/lib/assessment/engine";
import { projectAnswersToHealthProfile } from "@/lib/assessment/validation";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/http/errors";

function normalizeAnswerRows(
  answers: Array<{ stepKey: string; value: Prisma.JsonValue }>,
): Record<string, unknown> {
  return Object.fromEntries(
    answers.map((answer) => [answer.stepKey, answer.value]),
  );
}

export async function completeAssessment(
  visitorId: string,
  sessionId: string,
  now = new Date(),
): Promise<{ sessionId: string; resultId: string }> {
  return prisma.$transaction(async (tx) => {
    const session = await tx.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          select: { stepKey: true, value: true },
        },
        result: {
          select: { id: true },
        },
      },
    });

    if (!session) {
      throw new AppError(
        404,
        "SESSION_NOT_FOUND",
        "Assessment session was not found.",
      );
    }

    if (session.visitorId !== visitorId) {
      throw new AppError(
        403,
        "SESSION_FORBIDDEN",
        "This assessment session belongs to another visitor.",
      );
    }

    if (session.result) {
      return { sessionId, resultId: session.result.id };
    }

    const answers = normalizeAnswerRows(session.answers);
    const profileInput = projectAnswersToHealthProfile(
      answers,
      session.ageRange,
    );
    const computed = calculateAssessment(profileInput, now);

    await tx.healthProfile.upsert({
      where: { sessionId },
      create: {
        sessionId,
        sex: profileInput.sex,
        age: profileInput.age,
        heightCm: profileInput.heightCm,
        weightKg: profileInput.weightKg,
        targetWeightKg: profileInput.targetWeightKg,
        activityLevel: profileInput.activityLevel,
        goal: profileInput.goal,
      },
      update: {
        sex: profileInput.sex,
        age: profileInput.age,
        heightCm: profileInput.heightCm,
        weightKg: profileInput.weightKg,
        targetWeightKg: profileInput.targetWeightKg,
        activityLevel: profileInput.activityLevel,
        goal: profileInput.goal,
      },
    });

    const result = await tx.assessmentResult.upsert({
      where: { sessionId },
      create: {
        sessionId,
        bmi: computed.bmi,
        bmiCategory: computed.bmiCategory,
        bmr: computed.bmr,
        tdee: computed.tdee,
        recommendedCalories: computed.recommendedCalories,
        weeklyChangeKg: computed.weeklyChangeKg,
        targetDate: computed.targetDate,
        predictionCurve:
          computed.predictionCurve as unknown as Prisma.InputJsonValue,
        algorithmVersion: computed.algorithmVersion,
      },
      update: {},
      select: { id: true },
    });

    await tx.assessmentSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        completedAt: now,
      },
    });

    return { sessionId, resultId: result.id };
  });
}
