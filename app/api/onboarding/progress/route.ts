import { NextResponse } from "next/server";

import {
  getAssessmentSession,
  saveAssessmentAnswer,
} from "@/lib/assessment/session-service";
import { getOrCreateVisitor } from "@/lib/auth/visitor";
import { PILATES_CONFIG } from "@/lib/config";
import { toErrorPayload } from "@/lib/http/errors";
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
      { error: "The request body must be valid JSON." },
      { status: 400 },
    );
  }

  const validation = validateProgressPayload(body, {
    expectedFlow: PILATES_CONFIG.flow,
    isValidAge: isAgeRange,
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 },
    );
  }

  const { age, answers, currentStep, order } = validation.data;
  const step = ONBOARDING_STEPS[currentStep];

  try {
    if (step?.kind === "single" || step?.kind === "multi") {
      const answer = answers[step.id];

      if (answer !== undefined) {
        const visitor = await getOrCreateVisitor();
        const session = await getAssessmentSession(visitor.visitorId, order);

        await saveAssessmentAnswer(visitor.visitorId, order, {
          stepKey: step.id,
          answer,
          stepIndex: currentStep,
          expectedVersion: session.version,
        });
      }
    }
  } catch (error) {
    const payload = toErrorPayload(error);
    return NextResponse.json(payload.body, { status: payload.status });
  }

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
