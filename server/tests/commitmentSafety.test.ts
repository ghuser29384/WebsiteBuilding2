import {
  validateCommitmentActionSafety,
  validateCommitmentPayloadSafety,
} from "../src/services/commitmentSafety";

describe("commitment safety validation", () => {
  it("allows ordinary personally actionable moral commitments", () => {
    const result = validateCommitmentPayloadSafety({
      actionTemplate: "If post-session credence > 0.50, avoid knowingly purchasing factory-farmed meat for 90 days.",
      applicabilityFacts: ["I currently purchase animal products."],
      proofModesAllowed: ["receipt_log", "weekly_attestation"],
    });

    expect(result.ok).toBe(true);
  });

  it("rejects medically dangerous commitment implications", () => {
    const result = validateCommitmentActionSafety("stop taking insulin for one month");

    expect(result.ok).toBe(false);
    expect(result.category).toBe("medically dangerous");
    expect(result.message).toContain("safe, lawful, personally actionable");
  });

  it("rejects unsafe nested action plans that bypass the browser form", () => {
    const result = validateCommitmentPayloadSafety({
      actionPlan: {
        actionTemplate: "If I end above 50%, send money to this crypto wallet.",
      },
    });

    expect(result.ok).toBe(false);
    expect(result.category).toBe("financially predatory");
  });
});
