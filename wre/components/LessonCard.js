function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isUnsureOption(value) {
  const text = String(value || "")
    .trim()
    .toLowerCase();
  return text === "unsure" || text === "not sure";
}

function stageTitle(stage) {
  if (stage === 0) return "Step 1: Make a considered judgment";
  if (stage === 1) return "Step 2: Revise and test coherence";
  return "Step 3: Reflection";
}

export class LessonCard {
  constructor(container, handlers) {
    this.container = container;
    this.handlers = handlers || {};
  }

  render(payload) {
    const options = (Array.isArray(payload && payload.options) ? payload.options : [])
      .map(function (option) {
        return String(option || "").trim();
      })
      .filter(function (option) {
        return option && !isUnsureOption(option);
      });
    const selectedAnswerRaw = payload && payload.selectedAnswer ? String(payload.selectedAnswer) : "";
    const selectedAnswer = isUnsureOption(selectedAnswerRaw) ? "" : selectedAnswerRaw;
    const confidence = Number.isFinite(Number(payload && payload.confidence)) ? Number(payload.confidence) : 50;
    const interactionStage = Number.isFinite(Number(payload && payload.interactionStage)) ? Number(payload.interactionStage) : 0;
    const stage = Math.max(0, Math.min(2, interactionStage));
    const answerSummary = String((payload && payload.answerSummary) || "").trim();
    const revisionUsed = Boolean(payload && payload.revisionUsed);
    const revisionTargetLabel = String((payload && payload.revisionTargetLabel) || "a connected principle");

    const answersHtml = options
      .map(function (option) {
        const isSelected = option === selectedAnswer;
        return (
          '<button type="button" class="btn answer-btn"' +
          ' data-answer="' +
          escapeHtml(option) +
          '" aria-pressed="' +
          String(isSelected) +
          '">' +
          escapeHtml(option) +
          "</button>"
        );
      })
      .join("");

    const stageZeroHtml =
      '<section class="answer-row" aria-label="Answer choices">' +
      answersHtml +
      "</section>" +
      '<section class="confidence-row">' +
      '<div class="confidence-meta">' +
      '<p class="label-lite">Confidence</p>' +
      '<p class="confidence-value" id="confidenceValue">' +
      Math.round(confidence) +
      "%</p>" +
      "</div>" +
      '<input class="confidence-input" id="confidenceInput" type="range" min="0" max="100" step="1" value="' +
      String(Math.round(confidence)) +
      '" aria-label="Confidence from 0 to 100"/>' +
      "</section>" +
      (selectedAnswer
        ? '<section class="lesson-step-controls">' +
          '<button type="button" class="btn btn-primary" data-continue-step>Continue</button>' +
          "</section>"
        : "");

    const stageOneHtml =
      '<section class="revision-box">' +
      '<p class="label-lite">Revise your view</p>' +
      '<p class="lesson-hint">Toggle a connected principle and observe whether coherence improves immediately.</p>' +
      '<button type="button" class="btn ' +
      (revisionUsed ? "btn-ghost" : "btn-primary") +
      '" data-auto-revision ' +
      (revisionUsed ? "disabled" : "") +
      ">" +
      (revisionUsed ? "Revision applied to " : "Revise connected principle: ") +
      escapeHtml(revisionTargetLabel) +
      "</button>" +
      "</section>" +
      '<section class="lesson-step-controls">' +
      '<button type="button" class="btn btn-primary" data-continue-step>Continue</button>' +
      "</section>";

    const stageTwoHtml =
      '<section class="revision-box">' +
      '<p class="label-lite">Reflection</p>' +
      '<p class="lesson-hint">Compare your initial judgment with the revised network and explanation panel.</p>' +
      "</section>";

    this.container.innerHTML =
      '<article class="lesson-card">' +
      "<h2>" +
      escapeHtml(payload && payload.lessonTitle ? payload.lessonTitle : "Lesson") +
      "</h2>" +
      '<p class="lesson-stage-label">' +
      escapeHtml(stageTitle(stage)) +
      "</p>" +
      '<div class="lesson-card-grid" aria-label="Lesson interaction grid">' +
      '<div class="lesson-card-col lesson-card-col-primary">' +
      '<section class="lesson-case">' +
      '<p class="label-lite">Case</p>' +
      "<p><strong>" +
      escapeHtml(payload && payload.caseTitle ? payload.caseTitle : "Scenario") +
      "</strong></p>" +
      "<p>" +
      escapeHtml(payload && payload.caseText ? payload.caseText : "No case text provided.") +
      "</p>" +
      "</section>" +
      '<section class="lesson-prompt" aria-label="Question">' +
      '<p class="label-lite">Prompt</p>' +
      '<p class="question-text">' +
      escapeHtml(payload && payload.prompt ? payload.prompt : "No prompt in this lesson.") +
      "</p>" +
      "</section>" +
      (answerSummary ? '<p class="answer-summary">' + escapeHtml(answerSummary) + "</p>" : "") +
      "</div>" +
      '<div class="lesson-card-col lesson-card-col-interact">' +
      (stage === 0 ? stageZeroHtml : "") +
      (stage === 1 ? stageOneHtml : "") +
      (stage >= 2 ? stageTwoHtml : "") +
      "</div>" +
      "</div>" +
      "</article>";

    this.bindHandlers();
  }

  bindHandlers() {
    const onAnswer = this.handlers.onAnswer;
    const onConfidence = this.handlers.onConfidence;
    const onAutoRevision = this.handlers.onAutoRevision;
    const onContinue = this.handlers.onContinue;

    const answerButtons = this.container.querySelectorAll("[data-answer]");
    answerButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        if (typeof onAnswer !== "function") return;
        const answer = String(button.getAttribute("data-answer") || "");
        const slider = button.closest(".lesson-card") && button.closest(".lesson-card").querySelector("#confidenceInput");
        const confidence = slider ? Number(slider.value) : 50;
        onAnswer(answer, confidence);
      });
    });

    const confidenceInput = this.container.querySelector("#confidenceInput");
    const confidenceValue = this.container.querySelector("#confidenceValue");
    if (confidenceInput && confidenceValue) {
      confidenceInput.addEventListener("input", function () {
        confidenceValue.textContent = String(confidenceInput.value) + "%";
        if (typeof onConfidence === "function") {
          onConfidence(Number(confidenceInput.value));
        }
      });
    }

    const autoRevision = this.container.querySelector("[data-auto-revision]");
    if (autoRevision) {
      autoRevision.addEventListener("click", function () {
        if (typeof onAutoRevision !== "function") return;
        onAutoRevision();
      });
    }

    const continueButton = this.container.querySelector("[data-continue-step]");
    if (continueButton) {
      continueButton.addEventListener("click", function () {
        if (typeof onContinue !== "function") return;
        onContinue();
      });
    }
  }
}
