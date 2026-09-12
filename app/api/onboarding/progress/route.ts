import { NextResponse } from "next/server";

import { PILATES_CONFIG } from "@/lib/config";
import {
  derivePlanSummary,
  getProgressPercent,
  ONBOARDING_STEPS,
  validateProgressPayload,
} from "@/lib/onboarding";
import { isAgeRange } from "@/lib/selection";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "The request body must be valid JSON.",
      },
      {
        status: 400,
      },
    );
  }

  const validation = validateProgressPayload(body, {
    expectedFlow: PILATES_CONFIG.flow,
    isValidAge: isAgeRange,
  });

  if (!validation.success) {
    return NextResponse.json(
      {
        error: validation.error,
      },
      {
        status: 400,
      },
    );
  }

  const { age, answers, currentStep } = validation.data;

  const resultsIndex = ONBOARDING_STEPS.length - 1;
  const nextStep = Math.min(currentStep + 1, resultsIndex);

  return NextResponse.json({
    progress: {
      completedStep: currentStep,
      currentStep: nextStep,
      percent: getProgressPercent(nextStep),
      totalSteps: ONBOARDING_STEPS.length,
    },
    summary: derivePlanSummary(age, answers),
  });
}
