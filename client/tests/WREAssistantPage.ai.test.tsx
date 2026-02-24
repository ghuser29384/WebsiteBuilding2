import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import WREAssistantPage from "../src/components/WREAssistantPage";
import type { Session } from "../src/lib/wreClient";

const createSessionMock = jest.fn();
const loadSessionMock = jest.fn();
const addJudgmentMock = jest.fn();
const addPrincipleMock = jest.fn();
const runCoherenceMock = jest.fn();
const exportSessionMock = jest.fn();

const summarizeJudgmentMock = jest.fn();
const generatePrinciplesMock = jest.fn();
const suggestRevisionsMock = jest.fn();

jest.mock("../src/lib/wreClient", () => {
  return {
    createWREClient: () => ({
      createSession: createSessionMock,
      loadSession: loadSessionMock,
      addJudgment: addJudgmentMock,
      addPrinciple: addPrincipleMock,
      runCoherence: runCoherenceMock,
      exportSession: exportSessionMock,
    }),
  };
});

jest.mock("../src/lib/wreAiClient", () => {
  return {
    createWREAiClient: () => ({
      summarizeJudgment: summarizeJudgmentMock,
      generatePrinciples: generatePrinciplesMock,
      suggestRevisions: suggestRevisionsMock,
    }),
  };
});

const sessionWithData: Session = {
  id: "wre_ai_test",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  judgments: [
    {
      id: "j1",
      text: "It is permissible to divert the trolley in this case.",
      confidence: 80,
      tags: ["trolley"],
      sourceNote: "seed",
      rejected: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  principles: [
    {
      id: "p1",
      text: "Always avoid intentional harm.",
      scope: "universal",
      plausibility: 0.9,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  links: [
    {
      id: "l1",
      fromType: "judgment",
      fromId: "j1",
      toType: "principle",
      toId: "p1",
      relation: "conflicts",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  revisionLog: [],
};

describe("WREAssistantPage AI actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createSessionMock.mockResolvedValue(sessionWithData);
    addJudgmentMock.mockResolvedValue(sessionWithData);
    addPrincipleMock.mockResolvedValue(sessionWithData);
    runCoherenceMock.mockResolvedValue({
      coherenceScore: 52,
      breakdown: {
        agreementRatio: 0.5,
        avgConfidenceSupported: 0.6,
        parsimonyPenalty: 0.2,
        weights: {
          agreementRatio: 0.5,
          avgConfidenceSupported: 0.35,
          parsimonyPenalty: 0.15,
        },
      },
      minimalConflicts: [
        { ids: ["j1", "p1"], reason: "conflict", size: 2 },
      ],
      suggestions: [],
      timedOut: false,
      durationMs: 22,
    });
    summarizeJudgmentMock.mockResolvedValue({
      summary: "Summary for j1",
      assumptions: ["Assumes trolley facts are accurate."],
    });
    generatePrinciplesMock.mockResolvedValue([]);
    suggestRevisionsMock.mockResolvedValue([
      {
        action_type: "lower_confidence",
        target_id: "j1",
        change: "confidence:-20",
        rationale: "Lower confidence to reduce contradiction pressure.",
        expected_effect_delta: 2.1,
        confidence_estimate: 0.68,
      },
    ]);
    exportSessionMock.mockReturnValue("{}");
  });

  it("shows AI summary output in the side panel", async () => {
    render(<WREAssistantPage currentUserId="tester" apiBaseUrl="" />);

    await waitFor(() => {
      expect(createSessionMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByLabelText("Summarize judgment with AI"));

    await waitFor(() => {
      expect(summarizeJudgmentMock).toHaveBeenCalled();
    });

    expect(screen.getByText("Summary for j1")).toBeInTheDocument();
    expect(screen.getByText("Assumes trolley facts are accurate.")).toBeInTheDocument();
  });

  it("applies AI suggestion and updates judgment confidence", async () => {
    render(<WREAssistantPage currentUserId="tester" apiBaseUrl="" />);

    await waitFor(() => {
      expect(createSessionMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByLabelText("Run coherence engine"));
    await waitFor(() => {
      expect(runCoherenceMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByLabelText("Run AI suggestions"));

    await waitFor(() => {
      expect(suggestRevisionsMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByLabelText("Apply AI suggestion j1"));

    const confidenceSlider = screen.getByLabelText("Judgment confidence j1") as HTMLInputElement;
    expect(confidenceSlider.value).toBe("60");
    expect(screen.getByText(/ACCEPT_AI_SUGGESTION/)).toBeInTheDocument();
  });
});
