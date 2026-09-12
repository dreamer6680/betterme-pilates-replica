import {
  createSelection,
  validateSelectionPayload,
} from "@/lib/selection";

describe("validateSelectionPayload", () => {
  it("accepts a supported selection", () => {
    const result =
      validateSelectionPayload({
        flow: "2117",
        ageRange: "30-39",
      });

    expect(result).toEqual({
      ok: true,
      value: {
        flow: "2117",
        ageRange: "30-39",
      },
    });
  });

  it("rejects a non-object payload with 400", () => {
    const result =
      validateSelectionPayload(null);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error.code).toBe(
        "INVALID_PAYLOAD",
      );
    }
  });

  it("rejects missing fields with 400", () => {
    const result =
      validateSelectionPayload({
        flow: "2117",
      });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error.code).toBe(
        "INVALID_PAYLOAD",
      );
    }
  });

  it("rejects unsupported flow with 422", () => {
    const result =
      validateSelectionPayload({
        flow: "9999",
        ageRange: "18-29",
      });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.status).toBe(422);
      expect(result.error.code).toBe(
        "UNSUPPORTED_FLOW",
      );
    }
  });

  it("rejects unsupported age range with 422", () => {
    const result =
      validateSelectionPayload({
        flow: "2117",
        ageRange: "60-69",
      });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.status).toBe(422);
      expect(result.error.code).toBe(
        "UNSUPPORTED_AGE_RANGE",
      );
    }
  });
});

describe("createSelection", () => {
  it("creates a local onboarding URL", () => {
    const result = createSelection(
      {
        flow: "2117",
        ageRange: "50+",
      },
      "test-order-id",
    );

    expect(result.orderId).toBe(
      "test-order-id",
    );

    expect(result.selection).toEqual({
      flow: "2117",
      ageRange: "50+",
    });

    expect(result.nextUrl).toBe(
      "/onboarding?flow=2117&order=test-order-id&age=50%2B",
    );
  });
});
