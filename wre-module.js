(function () {
  "use strict";

  const REFLECTION_SECONDS = 120;
  const STORAGE_KEY = "normativity-wre-module-v1";

  const PRINCIPLES = [
    {
      id: "act_utilitarianism",
      label: "Act Utilitarianism",
      description: "Each of us should do whatever is expected to make the outcome best.",
    },
    {
      id: "rule_utilitarianism",
      label: "Rule Utilitarianism",
      description: "Each of us should act on the principles whose acceptance would make things go best.",
    },
    {
      id: "kantian_ethics",
      label: "Kantian Ethics",
      description: "Each of us should act on the principles whose universal acceptance everyone could rationally will.",
    },
    {
      id: "scanlon_contractualism",
      label: "Scanlon's Contractualism",
      description:
        "An act is wrong if and only if, and because, such acts are disallowed by some principle that no one could reasonably reject.",
    },
  ];

  const CASES = [
    {
      id: "transplant_case",
      title: "Transplant Case",
      scenario:
        "You are a doctor with four patients each needing a different organ (heart, lung, kidney, liver). A healthy patient with a mild cold has all organs intact. If you kill the healthy patient and transplant the organs, the four live. If you do not, the four die.",
      actionA: "Kill the healthy patient and transplant organs to save the four.",
      actionB: "Do not kill the healthy patient, even though the four die.",
      commonIntuition: "B",
      principleImplications: {
        act_utilitarianism: "A",
        rule_utilitarianism: "B",
        kantian_ethics: "B",
        scanlon_contractualism: "B",
      },
    },
    {
      id: "framing_innocent_case",
      title: "Framing the Innocent Case",
      scenario:
        "A riot will likely kill several people unless police quickly convict someone. You can fabricate evidence against an innocent person, ending the riot immediately. Otherwise, multiple people will probably die.",
      actionA: "Frame and punish the innocent person to stop the riot deaths.",
      actionB: "Refuse to frame the innocent person, even with expected deaths.",
      commonIntuition: "B",
      principleImplications: {
        act_utilitarianism: "A",
        rule_utilitarianism: "B",
        kantian_ethics: "B",
        scanlon_contractualism: "B",
      },
    },
    {
      id: "murderer_at_door_case",
      title: "Murderer at the Door Case",
      scenario:
        "A murderer asks where your friend is hiding. If you tell the truth, your friend is killed. If you lie, your friend survives.",
      actionA: "Lie to the murderer to protect your friend.",
      actionB: "Tell the truth to avoid lying.",
      commonIntuition: "A",
      principleImplications: {
        act_utilitarianism: "A",
        rule_utilitarianism: "A",
        kantian_ethics: "B",
        scanlon_contractualism: "A",
      },
    },
    {
      id: "promise_vs_rescue_case",
      title: "Promise vs Rescue Case",
      scenario:
        "You promised to meet a friend at the hospital. On your way, you encounter a rescue situation where several strangers will die unless you help immediately. You cannot do both.",
      actionA: "Break the promise and perform the rescue.",
      actionB: "Keep the promise and do not perform the rescue.",
      commonIntuition: "A",
      principleImplications: {
        act_utilitarianism: "A",
        rule_utilitarianism: "B",
        kantian_ethics: "B",
        scanlon_contractualism: "A",
      },
    },
    {
      id: "property_emergency_case",
      title: "Property Emergency Case",
      scenario:
        "A child will die tonight without medicine. A closed pharmacy contains the medicine. You can break in, take only what is needed, and later pay for all damages.",
      actionA: "Break in and take the medicine to save the child.",
      actionB: "Do not break in; respect property rules strictly.",
      commonIntuition: "A",
      principleImplications: {
        act_utilitarianism: "A",
        rule_utilitarianism: "B",
        kantian_ethics: "B",
        scanlon_contractualism: "A",
      },
    },
    {
      id: "numbers_rescue_case",
      title: "Numbers Rescue Case",
      scenario:
        "You can save either one person or five people from equally severe, imminent harm, but not both.",
      actionA: "Save the five.",
      actionB: "Save the one.",
      commonIntuition: "A",
      principleImplications: {
        act_utilitarianism: "A",
        rule_utilitarianism: "A",
        kantian_ethics: "B",
        scanlon_contractualism: "B",
      },
    },
  ];

  const state = {
    currentCaseId: CASES[0].id,
    step: 1,
    answers: {},
    history: [],
    recommendedCaseId: "",
    timer: {
      remaining: REFLECTION_SECONDS,
      running: false,
      done: false,
      intervalId: 0,
    },
  };

  const el = {
    casePicker: document.getElementById("casePicker"),
    caseTitle: document.getElementById("caseTitle"),
    caseSummary: document.getElementById("caseSummary"),
    caseActionA: document.getElementById("caseActionA"),
    caseActionB: document.getElementById("caseActionB"),
    commonIntuition: document.getElementById("commonIntuition"),
    questionTitle: document.getElementById("questionTitle"),
    questionProgress: document.getElementById("questionProgress"),
    questionForm: document.getElementById("questionForm"),
    questionLegend: document.getElementById("questionLegend"),
    questionOptions: document.getElementById("questionOptions"),
    questionStatus: document.getElementById("questionStatus"),
    backQuestionBtn: document.getElementById("backQuestionBtn"),
    nextQuestionBtn: document.getElementById("nextQuestionBtn"),
    reflectionTimerWrap: document.getElementById("reflectionTimerWrap"),
    reflectionTime: document.getElementById("reflectionTime"),
    timerToggleBtn: document.getElementById("timerToggleBtn"),
    timerDoneBtn: document.getElementById("timerDoneBtn"),
    roundSummaryPanel: document.getElementById("roundSummaryPanel"),
    summaryCaseTitle: document.getElementById("summaryCaseTitle"),
    summaryRows: document.getElementById("summaryRows"),
    recommendationCard: document.getElementById("recommendationCard"),
    startRecommendedBtn: document.getElementById("startRecommendedBtn"),
    startCurrentBtn: document.getElementById("startCurrentBtn"),
    roundHistoryList: document.getElementById("roundHistoryList"),
  };

  init();

  function init() {
    hydrateState();
    bindEvents();
    renderCasePicker();
    renderCurrentCase();
    renderQuestionStep();
    renderHistory();
    renderSummary();
  }

  function bindEvents() {
    if (el.casePicker) {
      el.casePicker.addEventListener("change", function (event) {
        const nextId = String(event.target.value || "");
        if (!getCaseById(nextId)) return;
        startRound(nextId);
      });
    }

    if (el.questionForm) {
      el.questionForm.addEventListener("submit", function (event) {
        event.preventDefault();
        onNextQuestion();
      });
    }

    if (el.backQuestionBtn) {
      el.backQuestionBtn.addEventListener("click", onBackQuestion);
    }

    if (el.timerToggleBtn) {
      el.timerToggleBtn.addEventListener("click", toggleTimer);
    }

    if (el.timerDoneBtn) {
      el.timerDoneBtn.addEventListener("click", function () {
        state.timer.done = true;
        state.timer.running = false;
        clearTimerInterval();
        renderReflectionTimer();
      });
    }

    if (el.startRecommendedBtn) {
      el.startRecommendedBtn.addEventListener("click", function () {
        const targetId = state.recommendedCaseId || state.currentCaseId;
        startRound(targetId);
      });
    }

    if (el.startCurrentBtn) {
      el.startCurrentBtn.addEventListener("click", function () {
        startRound(state.currentCaseId);
      });
    }
  }

  function renderCasePicker() {
    if (!el.casePicker) return;
    el.casePicker.innerHTML = CASES.map(function (lessonCase) {
      return '<option value="' + escapeHtml(lessonCase.id) + '">' + escapeHtml(lessonCase.title) + "</option>";
    }).join("");
    el.casePicker.value = state.currentCaseId;
  }

  function renderCurrentCase() {
    const lessonCase = getCurrentCase();
    if (!lessonCase) return;
    if (el.caseTitle) el.caseTitle.textContent = lessonCase.title;
    if (el.caseSummary) el.caseSummary.textContent = lessonCase.scenario;
    if (el.caseActionA) el.caseActionA.textContent = "A. " + lessonCase.actionA;
    if (el.caseActionB) el.caseActionB.textContent = "B. " + lessonCase.actionB;
    if (el.commonIntuition) {
      const intuitionAction = lessonCase.commonIntuition === "A" ? lessonCase.actionA : lessonCase.actionB;
      el.commonIntuition.textContent = "Common intuition typically favors: " + intuitionAction;
    }
  }

  function getQuestionModel(step) {
    const lessonCase = getCurrentCase();
    const q1Principle = state.answers.q1;
    const q1Label = getPrincipleLabel(q1Principle);
    if (!lessonCase) return null;

    if (step === 1) {
      return {
        title: "Question 1",
        legend: "Which moral principle do you currently believe is correct?",
        options: PRINCIPLES.map(function (principle) {
          return { value: principle.id, label: principle.label, description: principle.description };
        }),
      };
    }

    if (step === 2) {
      return {
        title: "Question 2",
        legend: "In 2 minutes, consider the following: What seems to you the right thing to do?",
        options: [
          { value: "A", label: "A", description: lessonCase.actionA },
          { value: "B", label: "B", description: lessonCase.actionB },
        ],
      };
    }

    if (step === 3) {
      return {
        title: "Question 3",
        legend: 'If "' + q1Label + '" is correct, what should be done?',
        options: [
          { value: "A", label: "A", description: lessonCase.actionA },
          { value: "B", label: "B", description: lessonCase.actionB },
        ],
      };
    }

    if (step === 4) {
      return {
        title: "Question 4",
        legend:
          "Is what seems to you the right thing to do evidence against the moral principle that you believe?",
        options: [
          { value: "yes", label: "A. Yes", description: "" },
          { value: "no", label: "B. No", description: "" },
        ],
      };
    }

    if (step === 5) {
      return {
        title: "Question 5",
        legend: "Which moral principle do you currently believe is correct?",
        options: PRINCIPLES.map(function (principle) {
          return { value: principle.id, label: principle.label, description: principle.description };
        }),
      };
    }

    return null;
  }

  function renderQuestionStep() {
    const model = getQuestionModel(state.step);
    if (!model) return;

    if (el.questionTitle) el.questionTitle.textContent = model.title;
    if (el.questionProgress) el.questionProgress.textContent = "Question " + state.step + " of 5";
    if (el.questionLegend) el.questionLegend.textContent = model.legend;
    if (el.questionStatus) el.questionStatus.textContent = "";
    if (el.backQuestionBtn) el.backQuestionBtn.disabled = state.step === 1;
    if (el.nextQuestionBtn) el.nextQuestionBtn.disabled = false;

    if (el.questionOptions) {
      const answerKey = "q" + state.step;
      const selectedValue = state.answers[answerKey] || "";
      el.questionOptions.innerHTML = model.options
        .map(function (option, index) {
          const id = "opt-" + state.step + "-" + index;
          const checked = selectedValue === option.value ? " checked" : "";
          const desc = option.description ? "<p>" + escapeHtml(option.description) + "</p>" : "";
          return (
            '<div class="choice-option">' +
            '<label for="' +
            id +
            '">' +
            '<input type="radio" id="' +
            id +
            '" name="questionChoice" value="' +
            escapeHtml(option.value) +
            '"' +
            checked +
            ">" +
            "<span><strong>" +
            escapeHtml(option.label) +
            "</strong>" +
            desc +
            "</span></label></div>"
          );
        })
        .join("");
    }

    renderReflectionTimer();
    renderSummary();
    persistState();
  }

  function renderReflectionTimer() {
    const onReflectionStep = state.step === 2;
    if (!el.reflectionTimerWrap || !el.reflectionTime || !el.timerToggleBtn || !el.timerDoneBtn || !el.nextQuestionBtn) return;

    if (!onReflectionStep) {
      el.reflectionTimerWrap.hidden = true;
      return;
    }

    el.reflectionTimerWrap.hidden = false;
    el.reflectionTime.textContent = formatTime(state.timer.remaining);
    el.timerToggleBtn.textContent = state.timer.running ? "Pause timer" : "Start timer";
    el.timerDoneBtn.disabled = state.timer.done;

    const selected = getSelectedChoiceValue();
    const canAdvance = Boolean(selected) && state.timer.done;
    el.nextQuestionBtn.disabled = !canAdvance;
  }

  function onNextQuestion() {
    const selected = getSelectedChoiceValue();
    if (!selected) {
      setQuestionStatus("Select one option before continuing.");
      return;
    }

    if (state.step === 2 && !state.timer.done) {
      setQuestionStatus("Complete reflection first (timer end or 'I am ready to answer now').");
      return;
    }

    state.answers["q" + state.step] = selected;

    if (state.step < 5) {
      state.step += 1;
      renderQuestionStep();
      return;
    }

    completeRound();
  }

  function onBackQuestion() {
    if (state.step <= 1) return;
    state.step -= 1;
    renderQuestionStep();
  }

  function toggleTimer() {
    if (state.timer.done) return;
    if (state.timer.running) {
      state.timer.running = false;
      clearTimerInterval();
      renderReflectionTimer();
      return;
    }

    state.timer.running = true;
    clearTimerInterval();
    state.timer.intervalId = window.setInterval(function () {
      if (!state.timer.running) return;
      state.timer.remaining -= 1;
      if (state.timer.remaining <= 0) {
        state.timer.remaining = 0;
        state.timer.running = false;
        state.timer.done = true;
        clearTimerInterval();
      }
      renderReflectionTimer();
    }, 1000);
    renderReflectionTimer();
  }

  function clearTimerInterval() {
    if (state.timer.intervalId) {
      window.clearInterval(state.timer.intervalId);
      state.timer.intervalId = 0;
    }
  }

  function completeRound() {
    const lessonCase = getCurrentCase();
    if (!lessonCase) return;

    const q1 = state.answers.q1 || "";
    const q2 = state.answers.q2 || "";
    const q3 = state.answers.q3 || "";
    const q4 = state.answers.q4 || "";
    const q5 = state.answers.q5 || "";

    const impliedByPrinciple = lessonCase.principleImplications[q1] || "";
    const intuitionAction = q2 === "A" ? lessonCase.actionA : lessonCase.actionB;
    const impliedAction = impliedByPrinciple === "A" ? lessonCase.actionA : lessonCase.actionB;

    const roundEntry = {
      id: makeId("round"),
      caseId: lessonCase.id,
      caseTitle: lessonCase.title,
      q1: q1,
      q2: q2,
      q3: q3,
      q4: q4,
      q5: q5,
      impliedByPrinciple: impliedByPrinciple,
      recordedAt: new Date().toISOString(),
      note:
        q2 && impliedByPrinciple && q2 !== impliedByPrinciple
          ? "Intuition and chosen principle implication diverged."
          : "Intuition and chosen principle implication aligned.",
      intuitionAction: intuitionAction,
      impliedAction: impliedAction,
    };

    state.history.unshift(roundEntry);
    state.recommendedCaseId = recommendNextCase(q5, lessonCase.id, state.history);
    state.step = 5;
    clearTimerInterval();
    state.timer.running = false;
    state.timer.done = true;
    renderSummary();
    renderHistory();
    persistState();
  }

  function renderSummary() {
    if (!el.roundSummaryPanel || !el.summaryRows || !el.summaryCaseTitle || !el.recommendationCard) return;

    if (!state.answers.q5) {
      el.roundSummaryPanel.hidden = true;
      return;
    }

    const lessonCase = getCurrentCase();
    if (!lessonCase) return;
    el.roundSummaryPanel.hidden = false;
    el.summaryCaseTitle.textContent = lessonCase.title;

    const q1 = state.answers.q1 || "";
    const q2 = state.answers.q2 || "";
    const q3 = state.answers.q3 || "";
    const q4 = state.answers.q4 || "";
    const q5 = state.answers.q5 || "";

    const implied = lessonCase.principleImplications[q1] || "";
    const intuitionText = q2 === "A" ? lessonCase.actionA : lessonCase.actionB;
    const principleText = q3 === "A" ? lessonCase.actionA : lessonCase.actionB;
    const impliedText = implied === "A" ? lessonCase.actionA : lessonCase.actionB;
    const evidenceText = q4 === "yes" ? "Yes" : "No";

    const summaryRows = [
      { label: "Q1 principle", value: getPrincipleLabel(q1) },
      { label: "Q2 intuition", value: intuitionText },
      { label: "Q3 your principle-implied answer", value: principleText },
      { label: "Model implication for your Q1 principle", value: impliedText || "No mapping for this case." },
      { label: "Q4 evidence against your principle?", value: evidenceText },
      { label: "Q5 updated principle", value: getPrincipleLabel(q5) },
    ];

    el.summaryRows.innerHTML = summaryRows
      .map(function (row) {
        return '<div class="summary-row"><strong>' + escapeHtml(row.label) + ":</strong> " + escapeHtml(row.value) + "</div>";
      })
      .join("");

    const recommendedCase = getCaseById(state.recommendedCaseId);
    if (!recommendedCase) {
      el.recommendationCard.innerHTML =
        "<h3>No recommendation available yet</h3><p>Complete more rounds to build recommendation coverage.</p>";
      return;
    }

    const principleId = q5;
    const principleName = getPrincipleLabel(principleId);
    const impliedRecommendation = recommendedCase.principleImplications[principleId];
    const commonRecommendation = recommendedCase.commonIntuition;
    const impliedActionText = impliedRecommendation === "A" ? recommendedCase.actionA : recommendedCase.actionB;
    const commonActionText = commonRecommendation === "A" ? recommendedCase.actionA : recommendedCase.actionB;

    el.recommendationCard.innerHTML =
      "<h3>Recommended Next Case: " +
      escapeHtml(recommendedCase.title) +
      "</h3>" +
      "<p>" +
      escapeHtml(recommendedCase.scenario) +
      "</p>" +
      "<p><strong>Why this recommendation:</strong> Given your Q5 principle (" +
      escapeHtml(principleName) +
      "), this case is often treated as pressure because the model implication and common intuition diverge.</p>" +
      "<p><strong>" +
      escapeHtml(principleName) +
      " implies:</strong> " +
      escapeHtml(impliedActionText) +
      "</p>" +
      "<p><strong>Common intuition often favors:</strong> " +
      escapeHtml(commonActionText) +
      "</p>";
  }

  function renderHistory() {
    if (!el.roundHistoryList) return;
    if (!Array.isArray(state.history) || state.history.length === 0) {
      el.roundHistoryList.innerHTML = '<li class="empty">No rounds completed yet.</li>';
      return;
    }

    el.roundHistoryList.innerHTML = state.history
      .slice(0, 20)
      .map(function (entry) {
        const q1 = getPrincipleLabel(entry.q1);
        const q5 = getPrincipleLabel(entry.q5);
        const time = formatDate(entry.recordedAt);
        return (
          "<li><strong>" +
          escapeHtml(entry.caseTitle) +
          "</strong> · " +
          escapeHtml(time) +
          "<br>Start: " +
          escapeHtml(q1) +
          " → End: " +
          escapeHtml(q5) +
          "<br><span class=\"hint\">" +
          escapeHtml(entry.note || "") +
          "</span></li>"
        );
      })
      .join("");
  }

  function recommendNextCase(principleId, currentCaseId, history) {
    const targetPrinciple = String(principleId || "");
    if (!targetPrinciple) return currentCaseId;

    const seen = {};
    (Array.isArray(history) ? history : []).forEach(function (entry) {
      if (!entry || !entry.caseId) return;
      seen[entry.caseId] = true;
    });

    const pressureCases = CASES.filter(function (lessonCase) {
      const implied = lessonCase.principleImplications[targetPrinciple];
      return implied && implied !== lessonCase.commonIntuition;
    });
    if (pressureCases.length === 0) return currentCaseId;

    for (let i = 0; i < pressureCases.length; i += 1) {
      const candidate = pressureCases[i];
      if (candidate.id !== currentCaseId && !seen[candidate.id]) {
        return candidate.id;
      }
    }

    for (let j = 0; j < pressureCases.length; j += 1) {
      const fallback = pressureCases[j];
      if (fallback.id !== currentCaseId) return fallback.id;
    }

    return pressureCases[0].id;
  }

  function startRound(caseId) {
    const lessonCase = getCaseById(caseId);
    if (!lessonCase) return;
    clearTimerInterval();
    state.currentCaseId = lessonCase.id;
    state.step = 1;
    state.answers = {};
    state.recommendedCaseId = "";
    state.timer.remaining = REFLECTION_SECONDS;
    state.timer.running = false;
    state.timer.done = false;
    if (el.casePicker) {
      el.casePicker.value = lessonCase.id;
    }
    renderCurrentCase();
    renderQuestionStep();
    renderSummary();
    persistState();
  }

  function getSelectedChoiceValue() {
    if (!el.questionOptions) return "";
    const checked = el.questionOptions.querySelector('input[name="questionChoice"]:checked');
    return checked ? String(checked.value || "") : "";
  }

  function setQuestionStatus(text) {
    if (!el.questionStatus) return;
    el.questionStatus.textContent = text;
  }

  function getCaseById(caseId) {
    return CASES.find(function (lessonCase) {
      return lessonCase.id === caseId;
    });
  }

  function getCurrentCase() {
    return getCaseById(state.currentCaseId);
  }

  function getPrincipleLabel(principleId) {
    const found = PRINCIPLES.find(function (principle) {
      return principle.id === principleId;
    });
    return found ? found.label : "No selection";
  }

  function makeId(prefix) {
    return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
  }

  function formatTime(totalSeconds) {
    const safe = Math.max(0, Number(totalSeconds) || 0);
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  }

  function formatDate(iso) {
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return "Unknown time";
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function persistState() {
    const snapshot = {
      currentCaseId: state.currentCaseId,
      step: state.step,
      answers: state.answers,
      history: state.history.slice(0, 40),
      recommendedCaseId: state.recommendedCaseId,
      timer: {
        remaining: state.timer.remaining,
        done: state.timer.done,
      },
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }

  function hydrateState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      if (getCaseById(parsed.currentCaseId)) {
        state.currentCaseId = parsed.currentCaseId;
      }
      if (Number.isFinite(parsed.step) && parsed.step >= 1 && parsed.step <= 5) {
        state.step = parsed.step;
      }
      if (parsed.answers && typeof parsed.answers === "object") {
        state.answers = parsed.answers;
      }
      if (Array.isArray(parsed.history)) {
        state.history = parsed.history;
      }
      if (getCaseById(parsed.recommendedCaseId)) {
        state.recommendedCaseId = parsed.recommendedCaseId;
      }
      if (parsed.timer && typeof parsed.timer === "object") {
        state.timer.remaining = clamp(Number(parsed.timer.remaining), 0, REFLECTION_SECONDS);
        state.timer.done = Boolean(parsed.timer.done);
      }
    } catch (_error) {
      /* no-op */
    }
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
