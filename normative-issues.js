(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initTheoryFilters();
    initStrategyMeters();
    initGuardrailTool();
  });

  function initTheoryFilters() {
    const buttons = Array.prototype.slice.call(document.querySelectorAll(".theory-filter-btn[data-theory-filter]"));
    const rows = Array.prototype.slice.call(document.querySelectorAll(".theory-table tbody tr[data-tags]"));
    if (buttons.length === 0 || rows.length === 0) return;

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        const filter = String(button.getAttribute("data-theory-filter") || "all").trim();
        buttons.forEach(function (other) {
          const active = other === button;
          other.classList.toggle("is-active", active);
          other.setAttribute("aria-pressed", active ? "true" : "false");
        });

        rows.forEach(function (row) {
          if (filter === "all") {
            row.classList.remove("is-hidden");
            return;
          }
          const tags = String(row.getAttribute("data-tags") || "").toLowerCase().split(/\s+/).filter(Boolean);
          row.classList.toggle("is-hidden", tags.indexOf(filter) === -1);
        });
      });
    });

    buttons.forEach(function (button) {
      const isActive = button.classList.contains("is-active");
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function initStrategyMeters() {
    const rows = Array.prototype.slice.call(document.querySelectorAll(".strategy-row[data-intensity]"));
    if (rows.length === 0) return;

    rows.forEach(function (row) {
      const raw = Number(row.getAttribute("data-intensity"));
      const value = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 50;
      row.style.setProperty("--strategy-intensity", String(value));
    });

    if (!("IntersectionObserver" in window)) {
      rows.forEach(function (row) {
        row.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2 }
    );

    rows.forEach(function (row) {
      observer.observe(row);
    });
  }

  function initGuardrailTool() {
    const confidenceInput = document.getElementById("guardrailConfidence");
    const confidenceValue = document.getElementById("guardrailConfidenceValue");
    const disagreementSelect = document.getElementById("guardrailDisagreement");
    const tensionSelect = document.getElementById("guardrailTension");
    const evaluateBtn = document.getElementById("guardrailEvaluateBtn");
    const result = document.getElementById("guardrailResult");

    if (!confidenceInput || !confidenceValue || !disagreementSelect || !tensionSelect || !evaluateBtn || !result) {
      return;
    }

    function syncConfidenceLabel() {
      const value = clamp(Number(confidenceInput.value), 50, 100);
      confidenceValue.textContent = value + "%";
    }

    function evaluateGuardrail() {
      const baseConfidence = clamp(Number(confidenceInput.value), 50, 100);
      const disagreement = String(disagreementSelect.value || "medium");
      const tension = String(tensionSelect.value || "medium");

      const disagreementPenalty = disagreement === "high" ? 13 : disagreement === "medium" ? 7 : 2;
      const tensionPenalty = tension === "high" ? 15 : tension === "medium" ? 8 : 3;
      const adjustedConfidence = Math.max(35, Math.min(100, baseConfidence - disagreementPenalty - tensionPenalty + 10));

      let stateClass = "state-balanced";
      let title = "Provisional hold with active testing";
      let lead =
        "Your current profile suggests keeping your verdict provisional while increasing cross-theory stress tests.";
      let steps = [
        "Run one new counterexample case that targets your principle's weakest implication.",
        "Check whether disagreement is about first-order facts, principle choice, or background-theory assumptions.",
        "Record one condition that would lower your confidence by at least 5 points.",
      ];

      if (adjustedConfidence < 60) {
        stateClass = "state-caution";
        title = "Revision pressure is high";
        lead =
          "Given tension and disagreement, SEP-style method favors revising the weakest node (judgment, principle, or background view) before increasing confidence.";
        steps = [
          "Lower confidence temporarily and treat your verdict as underdetermined.",
          "Revise whichever element is least supported: case judgment, general principle, or background assumption.",
          "Test a nearby theory family (for example, consequentialist vs deontological or vice versa) on the same case set.",
        ];
      } else if (adjustedConfidence >= 75 && disagreement === "low" && tension === "low") {
        stateClass = "state-confident";
        title = "Confidence can remain high, with safeguards";
        lead =
          "Your inputs support retaining a high credence, but still require adversarial testing to avoid overfitting to favored intuitions.";
        steps = [
          "Act on the verdict while explicitly tracking disconfirming cases.",
          "Pressure-test against at least one strong objection from a rival theory.",
          "Schedule a periodic re-check when new evidence or arguments appear.",
        ];
      }

      result.classList.remove("state-caution", "state-balanced", "state-confident");
      result.classList.add(stateClass);
      result.innerHTML =
        '<h3>' +
        escapeHtml(title) +
        "</h3>" +
        '<p><strong>Adjusted working confidence:</strong> ' +
        escapeHtml(String(adjustedConfidence)) +
        "%</p>" +
        "<p>" +
        escapeHtml(lead) +
        "</p>" +
        "<ul>" +
        steps
          .map(function (step) {
            return "<li>" + escapeHtml(step) + "</li>";
          })
          .join("") +
        "</ul>";
    }

    confidenceInput.addEventListener("input", syncConfidenceLabel);
    confidenceInput.addEventListener("change", syncConfidenceLabel);
    evaluateBtn.addEventListener("click", evaluateGuardrail);

    syncConfidenceLabel();
    evaluateGuardrail();
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
