function stateLabel(state) {
  if (state === 1) return "Accepted";
  if (state === -1) return "Rejected";
  return "Undecided";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export class LessonCard {
  constructor(container, handlers) {
    this.container = container;
    this.handlers = handlers || {};
  }

  render(payload) {
    const options = Array.isArray(payload && payload.options) ? payload.options : [];
    const principles = Array.isArray(payload && payload.principles) ? payload.principles : [];
    const selectedAnswer = payload && payload.selectedAnswer ? String(payload.selectedAnswer) : "";
    const confidence = Number.isFinite(Number(payload && payload.confidence)) ? Number(payload.confidence) : 50;
    const revisionUsed = Boolean(payload && payload.revisionUsed);

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

    const principleHtml =
      principles.length === 0
        ? '<p class="lesson-hint">No principle nodes available for revision in this lesson graph.</p>'
        : principles
            .map(function (item) {
              return (
                '<button type="button" class="revision-item" data-revise-id="' +
                escapeHtml(item.id) +
                '" ' +
                (revisionUsed || !selectedAnswer ? "disabled" : "") +
                ">" +
                escapeHtml(item.label) +
                " - " +
                escapeHtml(stateLabel(item.state)) +
                "</button>"
              );
            })
            .join("");

    this.container.innerHTML =
      '<article class="lesson-card">' +
      "<h2>" +
      escapeHtml(payload && payload.lessonTitle ? payload.lessonTitle : "Lesson") +
      "</h2>" +
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
      "</div>" +
      '<div class="lesson-card-col lesson-card-col-interact">' +
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
      '<section class="revision-box">' +
      '<p class="label-lite">One-step revision</p>' +
      '<p class="lesson-hint">Toggle one principle after answering to test whether coherence improves.</p>' +
      '<div class="revision-list" aria-label="Revision principles">' +
      principleHtml +
      "</div>" +
      (revisionUsed ? '<p class="lesson-hint">Revision used for this attempt.</p>' : "") +
      "</section>" +
      "</div>" +
      "</div>" +
      "</article>";

    this.bindHandlers();
  }

  bindHandlers() {
    const onAnswer = this.handlers.onAnswer;
    const onConfidence = this.handlers.onConfidence;
    const onRevision = this.handlers.onRevision;

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

    const reviseButtons = this.container.querySelectorAll("[data-revise-id]");
    reviseButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        if (typeof onRevision !== "function") return;
        const id = String(button.getAttribute("data-revise-id") || "");
        if (!id) return;
        onRevision(id);
      });
    });
  }
}
