import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/http/errors";

export type PreviewResultResponse = {
  access: "preview";
  result: {
    bmi: number;
    bmiCategory: string;
  };
  locked: readonly [
    "targetDate",
    "predictionCurve",
    "recommendedCalories",
    "weeklyPlan",
  ];
};

export type FullResultResponse = {
  access: "full";
  result: {
    bmi: number;
    bmiCategory: string;
    bmr: number;
    tdee: number;
    recommendedCalories: number;
    weeklyChangeKg: number;
    targetDate: string;
    predictionCurve: Prisma.JsonValue;
    algorithmVersion: string;
  };
};

export type ResultResponse = PreviewResultResponse | FullResultResponse;

const LOCKED_FIELDS = [
  "targetDate",
  "predictionCurve",
  "recommendedCalories",
  "weeklyPlan",
] as const;

export async function getResultForVisitor(
  visitorId: string,
  sessionId: string,
  now = new Date(),
): Promise<ResultResponse> {
  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    select: {
      visitorId: true,
      status: true,
      result: {
        select: {
          bmi: true,
          bmiCategory: true,
          bmr: true,
          tdee: true,
          recommendedCalories: true,
          weeklyChangeKg: true,
          targetDate: true,
          predictionCurve: true,
          algorithmVersion: true,
        },
      },
    },
  });

  if (!session) {
    throw new AppError(404, "RESULT_NOT_FOUND", "Assessment result was not found.");
  }

  if (session.visitorId !== visitorId) {
    throw new AppError(
      403,
      "RESULT_FORBIDDEN",
      "This assessment result belongs to another visitor.",
    );
  }

  if (session.status !== "COMPLETED" || !session.result) {
    throw new AppError(
      404,
      "RESULT_NOT_FOUND",
      "Assessment result was not found.",
    );
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      visitorId,
      status: "ACTIVE",
      startsAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { startsAt: "desc" },
    select: { id: true },
  });

  const result = session.result;

  if (!subscription) {
    return {
      access: "preview",
      result: {
        bmi: Number(result.bmi),
        bmiCategory: result.bmiCategory,
      },
      locked: LOCKED_FIELDS,
    };
  }

  return {
    access: "full",
    result: {
      bmi: Number(result.bmi),
      bmiCategory: result.bmiCategory,
      bmr: Number(result.bmr),
      tdee: Number(result.tdee),
      recommendedCalories: result.recommendedCalories,
      weeklyChangeKg: Number(result.weeklyChangeKg),
      targetDate: result.targetDate.toISOString(),
      predictionCurve: result.predictionCurve,
      algorithmVersion: result.algorithmVersion,
    },
  };
}
