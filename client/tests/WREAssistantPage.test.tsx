import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import WREAssistantPage from "../src/components/WREAssistantPage";
import type { CoherenceReport, Session } from "../src/lib/wreClient";

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

const baseSession: Session = {
  id: "wre_test",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  judgments: [],
  principles: [],
  links: [],
  revisionLog: [],
};

const coherenceReport: CoherenceReport = {
  coherenceScore: 72.4,
  breakdown: {
    agreementRatio: 0.72,
    avgConfidenceSupported: 0.69,
    parsimonyPenalty: 0.22,
    weights: {
      agreementRatio: 0.5,
      avgConfidenceSupported: 0.35,
      parsimonyPenalty: 0.15,
    },
  },
  minimalConflicts: [],
  suggestions: [],
  timedOut: false,
  durationMs: 34,
};

describe("WREAssistantPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createSessionMock.mockResolvedValue(baseSession);
    addJudgmentMock.mockImplementation(async (_id: string, payload: { judgment: { text: string } }) => {
      return {
        ...baseSession,
        judgments: [
          {
            id: "j_1",
            text: payload.judgment.text,
            confidence: 65,
            tags: ["trolley"],
            sourceNote: "test",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      };
    });
    runCoherenceMock.mockResolvedValue(coherenceReport);
    exportSessionMock.mockReturnValue("{}");

    summarizeJudgmentMock.mockResolvedValue({
      summary: "Judgment summary",
      assumptions: ["Assumption A"],
    });
    generatePrinciplesMock.mockResolvedValue([]);
    suggestRevisionsMock.mockResolvedValue([]);
  });

  it("adds a judgment and renders it", async () => {
    render(<WREAssistantPage currentUserId="tester" apiBaseUrl="" />);

    await waitFor(() => {
      expect(createSessionMock).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByLabelText("New judgment text"), {
      target: { value: "Diverting is permissible in trolley case." },
    });

    fireEvent.click(screen.getByLabelText("Add judgment"));

    await waitFor(() => {
      expect(addJudgmentMock).toHaveBeenCalled();
    });

    expect(screen.getByDisplayValue("Diverting is permissible in trolley case.")).toBeInTheDocument();
  });

  it("runs coherence engine and updates panel", async () => {
    render(<WREAssistantPage currentUserId="tester" apiBaseUrl="" />);

    await waitFor(() => {
      expect(createSessionMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByLabelText("Run coherence engine"));

    await waitFor(() => {
      expect(runCoherenceMock).toHaveBeenCalled();
    });

    expect(screen.getByText(/Coherence score: 72.40 \/ 100/)).toBeInTheDocument();
  });
});
