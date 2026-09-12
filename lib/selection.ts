import {
  AGE_RANGES,
  PILATES_CONFIG,
  type AgeRange,
} from "@/lib/config";

export type SelectionInput = {
  flow: string;
  ageRange: AgeRange;
};

export type Selection = {
  flow: string;
  ageRange: AgeRange;
};

export type SelectionSuccess = {
  orderId: string;
  nextUrl: string;
  selection: Selection;
};

export type ValidationFailure = {
  ok: false;
  status: 400 | 422;
  error: {
    code:
      | "INVALID_PAYLOAD"
      | "UNSUPPORTED_FLOW"
      | "UNSUPPORTED_AGE_RANGE";
    message: string;
    details?: Record<string, unknown>;
  };
};

export type ValidationSuccess = {
  ok: true;
  value: SelectionInput;
};

export type ValidationResult = ValidationSuccess | ValidationFailure;

function isPlainRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function isAgeRange(value: string): value is AgeRange {
  return AGE_RANGES.includes(value as AgeRange);
}

export function validateSelectionPayload(
  payload: unknown,
): ValidationResult {
  if (!isPlainRecord(payload)) {
    return {
      ok: false,
      status: 400,
      error: {
        code: "INVALID_PAYLOAD",
        message: "Request body must be a JSON object.",
      },
    };
  }

  const { flow, ageRange } = payload;

  if (
    typeof flow !== "string" ||
    flow.trim() === "" ||
    typeof ageRange !== "string" ||
    ageRange.trim() === ""
  ) {
    return {
      ok: false,
      status: 400,
      error: {
        code: "INVALID_PAYLOAD",
        message:
          'Request body must contain non-empty string fields "flow" and "ageRange".',
      },
    };
  }

  if (flow !== PILATES_CONFIG.flow) {
    return {
      ok: false,
      status: 422,
      error: {
        code: "UNSUPPORTED_FLOW",
        message: `Unsupported flow "${flow}".`,
        details: {
          supportedFlows: [PILATES_CONFIG.flow],
        },
      },
    };
  }

  if (!isAgeRange(ageRange)) {
    return {
      ok: false,
      status: 422,
      error: {
        code: "UNSUPPORTED_AGE_RANGE",
        message: `Unsupported age range "${ageRange}".`,
        details: {
          supportedAgeRanges: AGE_RANGES,
        },
      },
    };
  }

  return {
    ok: true,
    value: {
      flow,
      ageRange,
    },
  };
}

export function createSelection(
  input: SelectionInput,
  orderId = crypto.randomUUID(),
): SelectionSuccess {
  const query = new URLSearchParams({
    flow: input.flow,
    order: orderId,
    age: input.ageRange,
  });

  return {
    orderId,
    nextUrl: `/onboarding?${query.toString()}`,
    selection: {
      flow: input.flow,
      ageRange: input.ageRange,
    },
  };
}
