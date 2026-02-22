(function () {
  "use strict";

  const STORAGE_KEY = "normativity-dialogue-state-v1";
  const THEME_STORAGE_KEY = "normativity-theme";

  const TOPICS = {
    animal_welfare: {
      label: "Animal welfare",
      keywords: ["animal", "meat", "factory", "farm", "vegan", "dairy"],
    },
    climate: {
      label: "Climate and consumption",
      keywords: ["climate", "carbon", "emission", "fossil", "flight", "energy"],
    },
    global_poverty: {
      label: "Global poverty",
      keywords: ["poverty", "charity", "aid", "donate", "global", "hunger"],
    },
    criminal_justice: {
      label: "Criminal justice",
      keywords: ["prison", "police", "crime", "punishment", "death penalty", "justice"],
    },
    free_speech: {
      label: "Free speech and censorship",
      keywords: ["speech", "censor", "cancel", "platform", "expression", "harmful speech"],
    },
    bioethics: {
      label: "Bioethics",
      keywords: ["abortion", "euthanasia", "gene", "ivf", "embryo", "consent"],
    },
    ai_governance: {
      label: "AI governance",
      keywords: ["ai", "alignment", "automation", "surveillance", "model", "safety"],
    },
    general: {
      label: "General ethics",
      keywords: [],
    },
  };

  const MATCH_WEIGHTS = {
    challenge: { disagreement: 0.6, topicFit: 0.2, frameworkDiversity: 0.1, reliability: 0.1 },
    balanced: { disagreement: 0.45, topicFit: 0.3, frameworkDiversity: 0.15, reliability: 0.1 },
    bridge: { disagreement: 0.3, topicFit: 0.3, frameworkDiversity: 0.15, reliability: 0.25 },
  };

  const COUNTERPARTS = [
    {
      id: "cp-lena",
      name: "Lena V.",
      framework: "utilitarian",
      style: "Consequence-first, data-heavy",
      reliability: 92,
      positions: {
        animal_welfare: 94,
        climate: 83,
        global_poverty: 88,
        criminal_justice: 38,
        free_speech: 54,
        bioethics: 63,
        ai_governance: 90,
      },
    },
    {
      id: "cp-thomas",
      name: "Thomas R.",
      framework: "deontological",
      style: "Principle-first, rights constraints",
      reliability: 85,
      positions: {
        animal_welfare: 41,
        climate: 68,
        global_poverty: 52,
        criminal_justice: 58,
        free_speech: 72,
        bioethics: 34,
        ai_governance: 57,
      },
    },
    {
      id: "cp-anita",
      name: "Anita C.",
      framework: "rights",
      style: "Civil-liberty emphasis",
      reliability: 88,
      positions: {
        animal_welfare: 62,
        climate: 57,
        global_poverty: 64,
        criminal_justice: 44,
        free_speech: 85,
        bioethics: 71,
        ai_governance: 49,
      },
    },
    {
      id: "cp-kofi",
      name: "Kofi A.",
      framework: "care",
      style: "Relational and harm-sensitive",
      reliability: 81,
      positions: {
        animal_welfare: 79,
        climate: 61,
        global_poverty: 76,
        criminal_justice: 29,
        free_speech: 47,
        bioethics: 78,
        ai_governance: 52,
      },
    },
    {
      id: "cp-mei",
      name: "Mei T.",
      framework: "contractarian",
      style: "Institutional, incentive-focused",
      reliability: 77,
      positions: {
        animal_welfare: 35,
        climate: 74,
        global_poverty: 46,
        criminal_justice: 66,
        free_speech: 69,
        bioethics: 56,
        ai_governance: 71,
      },
    },
    {
      id: "cp-samir",
      name: "Samir D.",
      framework: "virtue",
      style: "Character and civic habits",
      reliability: 83,
      positions: {
        animal_welfare: 67,
        climate: 55,
        global_poverty: 59,
        criminal_justice: 51,
        free_speech: 46,
        bioethics: 64,
        ai_governance: 60,
      },
    },
    {
      id: "cp-jordan",
      name: "Jordan P.",
      framework: "pluralist",
      style: "Tradeoff mapping and synthesis",
      reliability: 90,
      positions: {
        animal_welfare: 58,
        climate: 62,
        global_poverty: 70,
        criminal_justice: 42,
        free_speech: 61,
        bioethics: 52,
        ai_governance: 66,
      },
    },
  ];

  const DELIBERATION_REFERENCE_LEVEL = 18;
  const DELIBERATION_HISTORY_LIMIT = 16;
  const DELIBERATION_PARTICIPANTS = [
    { id: "dl-consequentialist", name: "Consequentialist theories", color: "#b96845", reliability: 0.86, belief: 21 },
    { id: "dl-deontological", name: "Deontological theories", color: "#4f84ad", reliability: 0.84, belief: 16 },
    { id: "dl-contractualist", name: "Contractualist theories", color: "#6e78bb", reliability: 0.8, belief: 12 },
    { id: "dl-virtue-based", name: "Virtue-based theories", color: "#8a6cb8", reliability: 0.78, belief: 11 },
    { id: "dl-relational", name: "Relational theories", color: "#39986d", reliability: 0.8, belief: 10 },
    { id: "dl-proceduralist", name: "Proceduralist theories", color: "#bb7c3d", reliability: 0.76, belief: 9 },
    { id: "dl-hybrid", name: "Hybrid theories", color: "#d27877", reliability: 0.74, belief: 8 },
    { id: "dl-particularist", name: "Particularist theories", color: "#6f8f4a", reliability: 0.72, belief: 6 },
    { id: "dl-error", name: "Error theories", color: "#8a7b67", reliability: 0.71, belief: 4 },
    { id: "dl-noncognitivist", name: "Non-cognitivist theories", color: "#3c6b7d", reliability: 0.73, belief: 3 },
  ];
  const DELIBERATION_LEAD_SHARE_ANCHORS = [
    { round: 1, share: 21 },
    { round: 10, share: 19 },
    { round: 100, share: 20 },
    { round: 1000, share: 40 },
    { round: 10000, share: 50 },
    { round: 100000, share: 67 },
    { round: 1000000, share: 90 },
  ];
  const MORAL_PROGRESS_START_YEAR = 1850;
  const MORAL_PROGRESS_END_YEAR = 2150;
  const MORAL_PROGRESS_ANCHORS = [
    { year: 1850, adequacy: 5, difficulty: 24 },
    { year: 1900, adequacy: 8, difficulty: 36 },
    { year: 2026, adequacy: 15, difficulty: 74 },
    { year: 2150, adequacy: 33, difficulty: 93 },
  ];
  const MORAL_PROGRESS_MILESTONES = [
    { year: 1865, label: "19th c slavery normalized" },
    { year: 2026, label: "21st c present" },
    { year: 2125, label: "Future judgment" },
  ];
  const MORAL_PROGRESS_PRESENT_YEAR = 2026;
  const MORAL_BASELINE_LOG_SHAPE = 12;
  const MORAL_ZOOM_TRIGGER_YEAR = 2075;
  const MORAL_LONG_HORIZON_YEAR = 700000;
  const MORAL_LONG_HORIZON_ADEQUACY = 98;
  const MORAL_LONG_HORIZON_DIFFICULTY = 96;
  const COMPARISON_START_YEAR = 1800;
  const COMPARISON_END_YEAR = 2150;
  const COMPARISON_PRESENT_YEAR = 2026;
  const COMPARISON_ZOOM_TRIGGER_YEAR = 2075;
  const COMPARISON_LONG_HORIZON_YEAR = MORAL_LONG_HORIZON_YEAR;
  const MATH_COMPARISON_ANCHORS = [
    { year: 1800, progress: 1, difficulty: 24 },
    { year: 1900, progress: 2, difficulty: 38 },
    { year: 2026, progress: 5, difficulty: 72 },
    { year: 2150, progress: 9, difficulty: 86 },
  ];
  const ETHICS_COMPARISON_ANCHORS = [
    { year: 1800, progress: 2, difficulty: 24 },
    { year: 1900, progress: 4, difficulty: 40 },
    { year: 2026, progress: 10, difficulty: 79 },
    { year: 2150, progress: 20, difficulty: 92 },
  ];
  const COMPARISON_LONG_HORIZON_TARGETS = {
    math: { progress: 99, difficulty: 97 },
    ethics: { progress: 98, difficulty: 96 },
  };
  const MATH_COMPARISON_MILESTONES = [
    { year: 1872, label: "Rigorized analysis" },
    { year: 1931, label: "Incompleteness" },
    { year: 1994, label: "FLT proved" },
  ];
  const ETHICS_COMPARISON_MILESTONES = [
    { year: 1865, label: "Abolition momentum" },
    { year: 1948, label: "Human rights era" },
    { year: 1971, label: "Justice theory revival" },
  ];

  const formStatus = {
    conviction: null,
    session: null,
  };

  const prefersReducedMotion =
    typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let state = loadState();
  let currentMatches = [];

  const el = {
    themeToggle: document.getElementById("themeToggle"),
    pledgeForm: document.getElementById("pledgeForm"),
    pledgeName: document.getElementById("pledgeName"),
    pledgeStatus: document.getElementById("pledgeStatus"),
    gateBanner: document.getElementById("gateBanner"),
    studioContent: document.getElementById("studioContent"),
    confidenceInput: document.getElementById("confidenceInput"),
    confidenceValue: document.getElementById("confidenceValue"),
    postConfidenceInput: document.getElementById("postConfidenceInput"),
    postConfidenceValue: document.getElementById("postConfidenceValue"),
    thresholdNotice: document.getElementById("thresholdNotice"),
    convictionForm: document.getElementById("convictionForm"),
    convictionList: document.getElementById("convictionList"),
    claimInput: document.getElementById("claimInput"),
    reasonInput: document.getElementById("reasonInput"),
    implicationInput: document.getElementById("implicationInput"),
    topicInput: document.getElementById("topicInput"),
    frameworkInput: document.getElementById("frameworkInput"),
    activeConvictionSummary: document.getElementById("activeConvictionSummary"),
    matchModeInput: document.getElementById("matchModeInput"),
    matchRationale: document.getElementById("matchRationale"),
    counterpartList: document.getElementById("counterpartList"),
    sessionForm: document.getElementById("sessionForm"),
    sessionPartnerSummary: document.getElementById("sessionPartnerSummary"),
    counterArgumentInput: document.getElementById("counterArgumentInput"),
    replyInput: document.getElementById("replyInput"),
    actionCommitmentBlock: document.getElementById("actionCommitmentBlock"),
    actionPlanInput: document.getElementById("actionPlanInput"),
    startDateInput: document.getElementById("startDateInput"),
    checkinDateInput: document.getElementById("checkinDateInput"),
    sessionStatus: document.getElementById("sessionStatus"),
    ledgerList: document.getElementById("ledgerList"),
    resetDemoBtn: document.getElementById("resetDemoBtn"),
    statValues: document.querySelectorAll(".stat-value[data-count-to]"),
    deliberationChart: document.getElementById("deliberationChart"),
    deliberationRound: document.getElementById("deliberationRound"),
    consensusValue: document.getElementById("consensusValue"),
    truthValue: document.getElementById("truthValue"),
    spreadValue: document.getElementById("spreadValue"),
    beliefChips: document.getElementById("beliefChips"),
    progressChart: document.getElementById("progressChart"),
    progressYear: document.getElementById("progressYear"),
    progressNarrative: document.getElementById("progressNarrative"),
    moralProgressValue: document.getElementById("moralProgressValue"),
    moralDifficultyValue: document.getElementById("moralDifficultyValue"),
    deliberationLiftValue: document.getElementById("deliberationLiftValue"),
    progressEraList: document.getElementById("progressEraList"),
    progressLongCaption: document.getElementById("progressLongCaption"),
    comparisonYear: document.getElementById("comparisonYear"),
    mathProgressChart: document.getElementById("mathProgressChart"),
    ethicsProgressChart: document.getElementById("ethicsProgressChart"),
    mathProgressValue: document.getElementById("mathProgressValue"),
    ethicsProgressValue: document.getElementById("ethicsProgressValue"),
    comparisonGapValue: document.getElementById("comparisonGapValue"),
    comparisonNarrative: document.getElementById("comparisonNarrative"),
    mathStageNote: document.getElementById("mathStageNote"),
    ethicsStageNote: document.getElementById("ethicsStageNote"),
  };

  init();

  function init() {
    initTheme();
    bindRevealAnimation();
    bindCountUpAnimation();
    bindScrollTriggeredAnimations();
    bindEvents();
    el.confidenceInput.value = "50";
    updateConfidenceText(el.confidenceInput, el.confidenceValue);
    updateConfidenceText(el.postConfidenceInput, el.postConfidenceValue);
    updateThresholdState();
    render();
  }

  function bindScrollTriggeredAnimations() {
    startAnimationWhenVisible(
      document.getElementById("deliberation") || (el.deliberationChart && el.deliberationChart.closest(".section")) || el.deliberationChart,
      initDeliberationAnimation,
      { threshold: 0.22, rootMargin: "0px 0px -10% 0px" }
    );

    startAnimationWhenVisible(
      document.getElementById("progress") || (el.progressChart && el.progressChart.closest(".section")) || el.progressChart,
      initMoralProgressAnimation,
      { threshold: 0.22, rootMargin: "0px 0px -10% 0px" }
    );

    startAnimationWhenVisible(
      document.getElementById("comparison") ||
        (el.mathProgressChart && el.mathProgressChart.closest(".section")) ||
        el.mathProgressChart,
      initComparisonProgressAnimation,
      { threshold: 0.22, rootMargin: "0px 0px -10% 0px" }
    );
  }

  function startAnimationWhenVisible(target, startFn, options) {
    if (typeof startFn !== "function") return;
    if (!target) {
      startFn();
      return;
    }

    if (!("IntersectionObserver" in window)) {
      startFn();
      return;
    }

    let started = false;
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (started || !entry.isIntersecting) return;
          started = true;
          observer.unobserve(entry.target);
          startFn();
        });
      },
      options || { threshold: 0.2 }
    );

    observer.observe(target);
  }

  function initTheme() {
    if (!el.themeToggle) return;

    const mediaQuery =
      typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const savedTheme = readStoredTheme();
    const initialTheme = savedTheme || (mediaQuery && mediaQuery.matches ? "dark" : "light");
    applyTheme(initialTheme, false);

    el.themeToggle.addEventListener("click", function () {
      const current = document.documentElement.getAttribute("data-theme");
      const nextTheme = current === "dark" ? "light" : "dark";
      applyTheme(nextTheme, true);
    });

    if (!savedTheme && mediaQuery) {
      const onThemeChange = function (event) {
        if (readStoredTheme()) return;
        applyTheme(event.matches ? "dark" : "light", false);
      };

      if (typeof mediaQuery.addEventListener === "function") {
        mediaQuery.addEventListener("change", onThemeChange);
      } else if (typeof mediaQuery.addListener === "function") {
        mediaQuery.addListener(onThemeChange);
      }
    }
  }

  function readStoredTheme() {
    try {
      const theme = localStorage.getItem(THEME_STORAGE_KEY);
      return theme === "dark" || theme === "light" ? theme : null;
    } catch (error) {
      return null;
    }
  }

  function applyTheme(theme, persist) {
    const normalized = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", normalized);
    updateThemeToggle(normalized);

    if (!persist) return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, normalized);
    } catch (error) {
      // Ignore localStorage failures in restricted browsing modes.
    }
  }

  function updateThemeToggle(theme) {
    if (!el.themeToggle) return;
    const darkActive = theme === "dark";
    el.themeToggle.textContent = darkActive ? "Light mode" : "Dark mode";
    el.themeToggle.setAttribute("aria-pressed", String(darkActive));
    el.themeToggle.setAttribute("aria-label", darkActive ? "Switch to light mode" : "Switch to dark mode");
  }

  function bindEvents() {
    el.pledgeForm.addEventListener("submit", onPledgeSubmit);
    el.convictionForm.addEventListener("submit", onConvictionSubmit);
    el.sessionForm.addEventListener("submit", onSessionSubmit);
    el.confidenceInput.addEventListener("input", function () {
      updateConfidenceText(el.confidenceInput, el.confidenceValue);
    });
    el.postConfidenceInput.addEventListener("input", function () {
      updateConfidenceText(el.postConfidenceInput, el.postConfidenceValue);
      updateThresholdState();
    });
    el.matchModeInput.addEventListener("change", renderMatching);

    el.convictionList.addEventListener("click", function (event) {
      const button = event.target.closest("button[data-conviction-id]");
      if (!button) return;
      const convictionId = button.getAttribute("data-conviction-id");
      if (!convictionId) return;
      state.activeConvictionId = convictionId;
      state.selectedCounterpartId = null;
      saveState();
      renderMatching();
      renderConvictionList();
      renderSessionPartner();
      setSessionStatus("");
    });

    el.counterpartList.addEventListener("click", function (event) {
      const button = event.target.closest("button[data-counterpart-id]");
      if (!button) return;
      const counterpartId = button.getAttribute("data-counterpart-id");
      if (!counterpartId) return;
      state.selectedCounterpartId = counterpartId;
      saveState();
      renderMatching();
      renderSessionPartner();
      setSessionStatus("Counterpart selected. Start your dialogue and log the outcome.");
    });

    el.ledgerList.addEventListener("click", function (event) {
      const button = event.target.closest("button[data-ledger-id]");
      if (!button) return;
      const ledgerId = button.getAttribute("data-ledger-id");
      if (!ledgerId) return;
      const entry = state.ledger.find(function (row) {
        return row.id === ledgerId;
      });
      if (!entry) return;
      entry.status = entry.status === "done" ? "pending" : "done";
      entry.updatedAt = new Date().toISOString();
      saveState();
      renderLedger();
    });

    el.resetDemoBtn.addEventListener("click", function () {
      localStorage.removeItem(STORAGE_KEY);
      state = createDefaultState();
      currentMatches = [];
      resetConvictionForm();
      resetSessionForm();
      setSessionStatus("");
      formStatus.conviction = "";
      render();
    });
  }

  function onPledgeSubmit(event) {
    event.preventDefault();
    const formData = new FormData(el.pledgeForm);
    const name = String(formData.get("pledgeName") || "").trim();
    if (!name) {
      el.pledgeStatus.textContent = "Please add a name or handle.";
      return;
    }
    state.pledge.signed = true;
    state.pledge.name = name;
    state.pledge.signedAt = new Date().toISOString();
    saveState();
    renderGate();
    el.pledgeStatus.textContent = name + " signed the pledge on " + formatDate(state.pledge.signedAt) + ".";
  }

  function onConvictionSubmit(event) {
    event.preventDefault();
    if (!state.pledge.signed) {
      formStatus.conviction = "Sign the pledge first to publish convictions.";
      renderMatching();
      return;
    }

    const formData = new FormData(el.convictionForm);
    const claim = String(formData.get("claim") || "").trim();
    const reason = String(formData.get("reason") || "").trim();
    const implication = String(formData.get("implication") || "").trim();
    const confidence = clamp(Number(formData.get("confidence")), 0, 100);
    const framework = String(formData.get("framework") || "pluralist");
    const rawTopic = String(formData.get("topic") || "auto");

    if (!claim || !reason || !implication) {
      formStatus.conviction = "Complete all conviction fields before publishing.";
      renderMatching();
      return;
    }

    const topic = rawTopic === "auto" ? inferTopic(claim + " " + reason) : rawTopic;
    const conviction = {
      id: uid("cv"),
      claim: claim,
      reason: reason,
      implication: implication,
      confidence: confidence,
      topic: topic,
      framework: framework,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    state.convictions.unshift(conviction);
    state.activeConvictionId = conviction.id;
    state.selectedCounterpartId = null;
    formStatus.conviction = "Conviction published. Choose a counterpart with strong disagreement.";
    saveState();

    resetConvictionForm();
    renderConvictionList();
    renderMatching();
    renderSessionPartner();
    setSessionStatus("");
  }

  function onSessionSubmit(event) {
    event.preventDefault();
    if (!state.pledge.signed) {
      setSessionStatus("Sign the pledge first.");
      return;
    }
    const activeConviction = getActiveConviction();
    if (!activeConviction) {
      setSessionStatus("Publish and select a conviction first.");
      return;
    }
    if (!state.selectedCounterpartId) {
      setSessionStatus("Select a counterpart before logging the dialogue.");
      return;
    }
    const selectedCounterpart = getSelectedCounterpart();
    if (!selectedCounterpart) {
      setSessionStatus("Re-select a counterpart from the current match list before submitting.");
      return;
    }

    const formData = new FormData(el.sessionForm);
    const counterArgument = String(formData.get("counterArgument") || "").trim();
    const reply = String(formData.get("reply") || "").trim();
    const postConfidence = clamp(Number(formData.get("postConfidence")), 0, 100);
    const actionPlan = String(formData.get("actionPlan") || "").trim();
    const startDate = String(formData.get("startDate") || "");
    const checkinDate = String(formData.get("checkinDate") || "");

    if (!counterArgument || !reply) {
      setSessionStatus("Record both the strongest counterargument and your strongest reply.");
      return;
    }
    if (postConfidence > 50) {
      if (!actionPlan || !startDate || !checkinDate) {
        setSessionStatus("Confidence is over 50%, so action plan and dates are required.");
        return;
      }
      if (checkinDate < startDate) {
        setSessionStatus("Check-in date must be on or after the start date.");
        return;
      }
    }

    const session = {
      id: uid("ss"),
      convictionId: activeConviction.id,
      counterpartId: selectedCounterpart.id,
      counterArgument: counterArgument,
      reply: reply,
      postConfidence: postConfidence,
      createdAt: new Date().toISOString(),
    };
    state.sessions.unshift(session);

    const convictionRef = state.convictions.find(function (item) {
      return item.id === activeConviction.id;
    });
    if (convictionRef) {
      convictionRef.confidence = postConfidence;
      convictionRef.updatedAt = new Date().toISOString();
    }

    if (postConfidence > 50) {
      state.ledger.unshift({
        id: uid("lg"),
        convictionId: activeConviction.id,
        counterpartId: selectedCounterpart.id,
        claim: activeConviction.claim,
        implication: activeConviction.implication,
        actionPlan: actionPlan,
        startDate: startDate,
        checkinDate: checkinDate,
        confidenceAtDecision: postConfidence,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      setSessionStatus("Dialogue logged. You crossed 50%, so this action is now in your ledger.");
    } else {
      setSessionStatus("Dialogue logged. Confidence is at or below 50%, so no mandatory action entry was created.");
    }

    saveState();
    resetSessionForm();
    renderConvictionList();
    renderMatching();
    renderSessionPartner();
    renderLedger();
  }

  function render() {
    renderGate();
    renderConvictionList();
    renderMatching();
    renderSessionPartner();
    renderLedger();
  }

  function initDeliberationAnimation() {
    if (!el.deliberationChart || !el.beliefChips) return;

    const participants = DELIBERATION_PARTICIPANTS.map(function (item) {
      return {
        id: item.id,
        name: item.name,
        color: item.color,
        reliability: item.reliability,
        belief: item.belief,
      };
    });

    const chipRefs = buildBeliefChips(participants);
    const initial = normalizeCredenceDistribution(
      participants.map(function (item) {
        return item.belief;
      })
    );
    let history = [initial.slice()];
    let round = 1;
    let historyRounds = [round];
    let inspectIndex = -1;
    let pointerInspecting = false;
    let inspectBeliefs = initial.slice();
    let inspectRound = round;
    let inspectReducedMode = prefersReducedMotion;

    function trimDeliberationHistory() {
      while (history.length > DELIBERATION_HISTORY_LIMIT) {
        history.shift();
        historyRounds.shift();
        if (inspectIndex >= 0) {
          inspectIndex = Math.max(-1, inspectIndex - 1);
        }
      }
    }

    function renderDeliberationState(snapshot, snapshotRound, reducedMode) {
      const currentSnapshot = normalizeCredenceDistribution(snapshot);
      inspectBeliefs = currentSnapshot.slice();
      inspectRound = snapshotRound;
      inspectReducedMode = reducedMode;

      const series = history.slice();
      series.push(currentSnapshot);
      const roundSeries = historyRounds.slice();
      roundSeries.push(snapshotRound);

      let shownBeliefs = currentSnapshot;
      let shownRound = snapshotRound;
      let activeInspectIndex = -1;

      if (inspectIndex >= 0 && series.length > 0) {
        activeInspectIndex = clamp(Math.round(inspectIndex), 0, series.length - 1);
        shownBeliefs = series[activeInspectIndex];
        shownRound = roundSeries[activeInspectIndex];
      }

      renderBeliefChips(chipRefs, participants, shownBeliefs);
      updateDeliberationMetrics(shownBeliefs, shownRound, reducedMode);
      renderDeliberationChart(
        participants,
        history,
        historyRounds,
        currentSnapshot,
        snapshotRound,
        activeInspectIndex
      );
    }

    function inspectFromClientX(clientX) {
      const rect = el.deliberationChart.getBoundingClientRect();
      if (!rect || rect.width <= 0) return;
      const points = history.length + 1;
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      inspectIndex = Math.round(ratio * Math.max(0, points - 1));
      renderDeliberationState(inspectBeliefs, inspectRound, inspectReducedMode);
    }

    function clearInspection() {
      if (inspectIndex < 0) return;
      inspectIndex = -1;
      renderDeliberationState(inspectBeliefs, inspectRound, inspectReducedMode);
    }

    el.deliberationChart.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      pointerInspecting = true;
      if (typeof el.deliberationChart.setPointerCapture === "function") {
        try {
          el.deliberationChart.setPointerCapture(event.pointerId);
        } catch (error) {
          // Pointer capture can fail in some browsers; selection still works.
        }
      }
      inspectFromClientX(event.clientX);
    });

    el.deliberationChart.addEventListener("pointermove", function (event) {
      if (pointerInspecting || event.pointerType === "mouse") {
        inspectFromClientX(event.clientX);
      }
    });

    el.deliberationChart.addEventListener("pointerleave", function (event) {
      if (event.pointerType === "mouse" && !pointerInspecting) {
        clearInspection();
      }
    });

    window.addEventListener("pointerup", function () {
      pointerInspecting = false;
    });
    window.addEventListener("pointercancel", function () {
      pointerInspecting = false;
    });
    el.deliberationChart.addEventListener("dblclick", function () {
      pointerInspecting = false;
      clearInspection();
    });

    renderDeliberationState(initial, round, prefersReducedMotion);

    if (prefersReducedMotion) {
      let staticSnapshot = initial.slice();
      let staticRound = round;
      while (staticRound < 1000000) {
        const nextRound = nextDeliberationRound(staticRound);
        staticSnapshot = advanceDeliberationBeliefs(participants, staticSnapshot, staticRound, nextRound);
        staticRound = nextRound;
        history.push(staticSnapshot.slice());
        historyRounds.push(staticRound);
        trimDeliberationHistory();
      }
      round = staticRound;
      renderDeliberationState(staticSnapshot, round, true);
      bindDeliberationCredenceDrag(
        chipRefs,
        function () {
          return staticSnapshot;
        },
        function (adjusted) {
          staticSnapshot = adjusted.slice();
          history.push(staticSnapshot.slice());
          historyRounds.push(round);
          trimDeliberationHistory();
          renderDeliberationState(staticSnapshot, round, true);
        }
      );
      return;
    }

    let from = initial.slice();
    let targetRound = nextDeliberationRound(round);
    let to = advanceDeliberationBeliefs(participants, from, round, targetRound);
    let phaseStart = performance.now();
    let holdUntil = 0;
    let timing = getDeliberationTiming(round, targetRound);
    let currentSnapshot = from.slice();

    bindDeliberationCredenceDrag(
      chipRefs,
      function () {
        return currentSnapshot;
      },
      function (adjusted) {
        currentSnapshot = normalizeCredenceDistribution(adjusted);
        from = currentSnapshot.slice();
        to = currentSnapshot.slice();
        phaseStart = performance.now();
        holdUntil = phaseStart + Math.max(280, timing.hold * 0.75);
        history.push(currentSnapshot.slice());
        historyRounds.push(round);
        trimDeliberationHistory();
        renderDeliberationState(currentSnapshot, round, false);
      }
    );

    function tick(now) {
      let current;

      if (holdUntil && now < holdUntil) {
        current = from.slice();
      } else {
        if (holdUntil && now >= holdUntil) {
          holdUntil = 0;
          phaseStart = now;
          targetRound = nextDeliberationRound(round);
          to = advanceDeliberationBeliefs(participants, from, round, targetRound);
          timing = getDeliberationTiming(round, targetRound);
        }

        const progress = clamp((now - phaseStart) / timing.duration, 0, 1);
        const eased = easeInOutCubic(progress);

        current = from.map(function (value, index) {
          return value + (to[index] - value) * eased;
        });

        if (progress >= 1) {
          from = to.slice();
          round = targetRound;
          history.push(from.slice());
          historyRounds.push(round);
          trimDeliberationHistory();
          holdUntil = now + timing.hold;
          phaseStart = now;
        }
      }

      currentSnapshot = current.slice();
      renderDeliberationState(currentSnapshot, round, false);
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function nextDeliberationRound(round) {
    const current = Math.max(1, Math.round(Number(round) || 1));
    if (current < 10) return current + 1;
    if (current === 10) return 100;
    if (current < 1000) return current * 10;
    if (current < 10000) return current + 1000;
    if (current < 1000000) return current + 10000;
    return current + 100000;
  }

  function getDeliberationTiming(fromRound, toRound) {
    const from = Math.max(1, Math.round(Number(fromRound) || 1));
    if (from <= 9) {
      return { duration: 1050, hold: 210 };
    }
    if (from === 10 && toRound === 100) {
      return { duration: 420, hold: 300 };
    }
    return { duration: 2100, hold: 420 };
  }

  function advanceDeliberationBeliefs(participants, beliefs, fromRound, toRound) {
    const from = normalizeCredenceDistribution(beliefs);
    const projected = targetDeliberationDistribution(participants, toRound);
    const isAnchorRound = DELIBERATION_LEAD_SHARE_ANCHORS.some(function (anchor) {
      return anchor.round === Math.round(toRound);
    });
    const span = Math.log10(Math.max(10, toRound)) - Math.log10(Math.max(1, fromRound));
    const blend = isAnchorRound ? 1 : clamp(0.58 + span * 0.32, 0.6, 1);
    const blended = from.map(function (value, index) {
      return value + (projected[index] - value) * blend;
    });
    return normalizeCredenceDistribution(blended);
  }

  function targetDeliberationDistribution(participants, round) {
    if (!Array.isArray(participants) || participants.length === 0) return [];
    const leaderIndex = 0;
    const leaderShare = deliberationLeadShareForRound(round);
    const remaining = Math.max(0, 100 - leaderShare);
    const roundWave = Math.log10(Math.max(10, Number(round) || 10));
    const weights = participants.map(function (participant, index) {
      if (index === leaderIndex) return 0;
      const base = Math.max(0.2, Number(participant.belief) || 0.2);
      const reliability = 0.82 + (Number(participant.reliability) || 0) * 0.35;
      const wave = 1 + Math.sin(roundWave * 1.41 + index * 0.9) * 0.06;
      return base * reliability * wave;
    });
    const weightTotal = weights.reduce(function (sum, value) {
      return sum + value;
    }, 0);
    const distribution = weights.map(function (weight, index) {
      if (index === leaderIndex) return leaderShare;
      if (weightTotal <= 0) return remaining / Math.max(1, participants.length - 1);
      return (remaining * weight) / weightTotal;
    });
    return normalizeCredenceDistribution(distribution);
  }

  function deliberationLeadShareForRound(round) {
    const value = Math.max(1, Number(round) || 1);
    const anchors = DELIBERATION_LEAD_SHARE_ANCHORS;
    if (value <= anchors[0].round) return anchors[0].share;

    for (let index = 1; index < anchors.length; index += 1) {
      const next = anchors[index];
      if (value > next.round) continue;
      const previous = anchors[index - 1];
      const prevLog = Math.log10(previous.round);
      const nextLog = Math.log10(next.round);
      const ratio = clamp((Math.log10(value) - prevLog) / Math.max(0.000001, nextLog - prevLog), 0, 1);
      const eased = easeInOutCubic(ratio);
      return previous.share + (next.share - previous.share) * eased;
    }

    const last = anchors[anchors.length - 1];
    const extra = Math.log10(value / last.round);
    return clamp(last.share + extra * 4, 0, 97);
  }

  function buildBeliefChips(participants) {
    el.beliefChips.innerHTML = "";

    return participants.map(function (participant) {
      const item = document.createElement("li");
      item.className = "belief-chip";

      const head = document.createElement("div");
      head.className = "belief-chip-head";

      const name = document.createElement("span");
      name.className = "belief-chip-name";

      const dot = document.createElement("span");
      dot.className = "belief-dot";
      dot.style.background = participant.color;

      const label = document.createElement("span");
      label.textContent = participant.name;

      name.appendChild(dot);
      name.appendChild(label);

      const value = document.createElement("span");
      value.className = "belief-chip-value";
      value.textContent = "0%";

      head.appendChild(name);
      head.appendChild(value);

      const track = document.createElement("div");
      track.className = "belief-track";

      const fill = document.createElement("span");
      fill.className = "belief-fill";
      fill.style.background = participant.color;
      fill.style.width = "0%";

      const handle = document.createElement("span");
      handle.className = "belief-handle";
      handle.style.borderColor = participant.color;
      handle.style.left = "0%";

      track.appendChild(fill);
      track.appendChild(handle);
      item.appendChild(head);
      item.appendChild(track);
      el.beliefChips.appendChild(item);

      return {
        item: item,
        value: value,
        fill: fill,
        track: track,
        handle: handle,
      };
    });
  }

  function renderBeliefChips(chipRefs, participants, beliefs) {
    const rounded = roundDistributionToHundred(beliefs);
    chipRefs.forEach(function (chip, index) {
      const value = clamp(rounded[index] || 0, 0, 100);
      const rawValue = clamp(Number(beliefs[index] || 0), 0, 100);
      chip.value.textContent = value + "%";
      chip.fill.style.width = rawValue.toFixed(2) + "%";
      if (chip.handle) {
        chip.handle.style.left = rawValue.toFixed(2) + "%";
      }
      chip.item.setAttribute("aria-label", participants[index].name + " currently at " + value + "% credence");
    });
  }

  function bindDeliberationCredenceDrag(chipRefs, getBeliefs, onChange) {
    if (!Array.isArray(chipRefs) || chipRefs.length === 0) return;
    if (typeof getBeliefs !== "function" || typeof onChange !== "function") return;

    const dragState = {
      active: false,
      index: -1,
      pointerId: null,
    };

    function clearDragVisuals() {
      chipRefs.forEach(function (chip) {
        chip.item.classList.remove("dragging");
      });
    }

    function updateFromClientX(clientX) {
      if (!dragState.active) return;
      const chip = chipRefs[dragState.index];
      if (!chip || !chip.track) return;
      const rect = chip.track.getBoundingClientRect();
      if (!rect || rect.width <= 0) return;
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const desired = ratio * 100;
      const adjusted = rebalanceCredenceDistribution(getBeliefs(), dragState.index, desired);
      onChange(adjusted);
    }

    function onPointerMove(event) {
      if (!dragState.active) return;
      updateFromClientX(event.clientX);
    }

    function endDrag() {
      if (!dragState.active) return;
      dragState.active = false;
      dragState.index = -1;
      dragState.pointerId = null;
      clearDragVisuals();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    }

    function onPointerUp(event) {
      if (!dragState.active) return;
      if (dragState.pointerId !== null && event.pointerId !== dragState.pointerId) return;
      endDrag();
    }

    chipRefs.forEach(function (chip, index) {
      if (!chip.track) return;
      chip.track.addEventListener("pointerdown", function (event) {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.preventDefault();
        dragState.active = true;
        dragState.index = index;
        dragState.pointerId = event.pointerId;
        clearDragVisuals();
        chip.item.classList.add("dragging");
        if (typeof chip.track.setPointerCapture === "function") {
          try {
            chip.track.setPointerCapture(event.pointerId);
          } catch (error) {
            // Pointer capture may fail in some environments; dragging still works via window events.
          }
        }
        updateFromClientX(event.clientX);
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);
      });
    });
  }

  function rebalanceCredenceDistribution(values, focusIndex, focusedValue) {
    const normalized = normalizeCredenceDistribution(values);
    if (focusIndex < 0 || focusIndex >= normalized.length) return normalized;
    if (normalized.length === 1) return [100];

    const target = clamp(Number(focusedValue), 0, 100);
    const remainder = Math.max(0, 100 - target);
    const result = normalized.slice();
    let othersTotal = 0;

    for (let i = 0; i < normalized.length; i += 1) {
      if (i === focusIndex) continue;
      othersTotal += normalized[i];
    }

    if (othersTotal <= 0) {
      const even = remainder / (normalized.length - 1);
      for (let i = 0; i < normalized.length; i += 1) {
        if (i === focusIndex) continue;
        result[i] = even;
      }
    } else {
      for (let i = 0; i < normalized.length; i += 1) {
        if (i === focusIndex) continue;
        result[i] = (normalized[i] / othersTotal) * remainder;
      }
    }

    result[focusIndex] = target;
    return normalizeCredenceDistribution(result);
  }

  function updateDeliberationMetrics(beliefs, round, reducedMotionMode) {
    const consensus = Math.max.apply(null, beliefs);
    const spread = Math.max.apply(null, beliefs) - Math.min.apply(null, beliefs);

    if (el.deliberationRound) {
      el.deliberationRound.textContent = reducedMotionMode
        ? "Round " + formatLargeYear(round) + " snapshot (reduced motion)."
        : "Round " + formatLargeYear(round) + " of deliberation";
    }
    if (el.consensusValue) {
      el.consensusValue.textContent = Math.round(consensus) + "%";
    }
    if (el.truthValue) {
      el.truthValue.textContent = DELIBERATION_REFERENCE_LEVEL + "%";
    }
    if (el.spreadValue) {
      el.spreadValue.textContent = Math.round(spread) + " pts";
    }
  }

  function renderDeliberationChart(participants, history, historyRounds, currentBeliefs, currentRound, inspectIndex) {
    if (!el.deliberationChart) return;

    const width = 720;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 26, left: 38 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const series = history.slice();
    series.push(currentBeliefs);
    const roundSeries = Array.isArray(historyRounds) ? historyRounds.slice() : [];
    roundSeries.push(currentRound);
    const pointsCount = series.length;

    function x(index) {
      if (pointsCount <= 1) return margin.left + chartWidth;
      return margin.left + (index / (pointsCount - 1)) * chartWidth;
    }

    function y(value) {
      return margin.top + ((100 - value) / 100) * chartHeight;
    }

    const gridLevels = [100, 75, 50, 25, 0];
    const gridLayer = gridLevels
      .map(function (level) {
        const py = y(level);
        return (
          '<line class="del-grid" x1="' +
          margin.left +
          '" y1="' +
          py +
          '" x2="' +
          (margin.left + chartWidth) +
          '" y2="' +
          py +
          '"></line>' +
          '<text class="del-axis-label" x="' +
          (margin.left - 8) +
          '" y="' +
          (py + 4) +
          '" text-anchor="end">' +
          level +
          "</text>"
        );
      })
      .join("");

    const truthY = y(DELIBERATION_REFERENCE_LEVEL);
    const truthLayer =
      '<line class="del-truth" x1="' +
      margin.left +
      '" y1="' +
      truthY +
      '" x2="' +
      (margin.left + chartWidth) +
      '" y2="' +
      truthY +
      '"></line>' +
      '<text class="del-axis-label" x="' +
      (margin.left + 8) +
      '" y="' +
      (truthY - 6) +
      '">Reference level</text>';

    const lastX = x(pointsCount - 1);
    const consensusSeries = series.map(function (values) {
      return Math.max.apply(null, values);
    });
    const consensusPath = linePath(
      consensusSeries.map(function (value, index) {
        return [x(index), y(value)];
      })
    );
    const consensusCurrent = consensusSeries[consensusSeries.length - 1];
    const consensusY = y(consensusCurrent);

    const participantLayers = participants
      .map(function (participant, participantIndex) {
        const points = series.map(function (values, index) {
          return [x(index), y(values[participantIndex])];
        });
        const latestY = points[points.length - 1][1];

        return (
          '<path class="del-belief-path" d="' +
          linePath(points) +
          '" style="stroke:' +
          participant.color +
          ';"></path>' +
          '<line class="del-connector" x1="' +
          lastX +
          '" y1="' +
          latestY +
          '" x2="' +
          lastX +
          '" y2="' +
          consensusY +
          '"></line>' +
          '<circle class="del-belief-dot" cx="' +
          lastX +
          '" cy="' +
          latestY +
          '" r="4.2" fill="' +
          participant.color +
          '"></circle>'
        );
      })
      .join("");

    const consensusLayer =
      '<path class="del-consensus-path" d="' +
      consensusPath +
      '"></path>' +
      '<circle class="del-consensus-dot" cx="' +
      lastX +
      '" cy="' +
      consensusY +
      '" r="5.1"></circle>';

    const inspected = Number.isFinite(inspectIndex) ? Math.round(inspectIndex) : -1;
    const inspectLayer =
      inspected >= 0 && inspected < pointsCount
        ? '<line class="del-inspect-line" x1="' +
          x(inspected) +
          '" y1="' +
          margin.top +
          '" x2="' +
          x(inspected) +
          '" y2="' +
          (margin.top + chartHeight) +
          '"></line>' +
          '<text class="del-inspect-label" x="' +
          x(inspected) +
          '" y="' +
          (margin.top + 14) +
          '" text-anchor="middle">Round ' +
          formatLargeYear(roundSeries[inspected]) +
          "</text>"
        : "";

    const axisTail =
      '<text class="del-axis-label" x="' +
      margin.left +
      '" y="' +
      (height - 6) +
      '">Earlier rounds</text>' +
      '<text class="del-axis-label" x="' +
      (margin.left + chartWidth) +
      '" y="' +
      (height - 6) +
      '" text-anchor="end">Current round</text>';

    el.deliberationChart.innerHTML = gridLayer + truthLayer + participantLayers + consensusLayer + inspectLayer + axisTail;
  }

  function initMoralProgressAnimation() {
    if (!el.progressChart) return;

    let year = MORAL_PROGRESS_START_YEAR;
    let mode = "near";
    let zoomProgress = 0;
    let holdUntil = 0;
    let lastTick = performance.now();

    renderMoralProgressFrame(year, prefersReducedMotion, {
      rangeEndYear: MORAL_PROGRESS_END_YEAR,
      zoomedOut: false,
      zoomMix: 0,
    });

    if (prefersReducedMotion) {
      renderMoralProgressFrame(MORAL_LONG_HORIZON_YEAR, true, {
        rangeEndYear: MORAL_LONG_HORIZON_YEAR,
        zoomedOut: true,
        zoomMix: 1,
      });
      return;
    }

    function tick(now) {
      const elapsedSeconds = (now - lastTick) / 1000;
      lastTick = now;

      if (mode === "hold" && now >= holdUntil) {
        mode = "near";
        year = MORAL_PROGRESS_START_YEAR;
        zoomProgress = 0;
        holdUntil = 0;
      }

      if (mode === "near") {
        year += elapsedSeconds * 58;
        if (year >= MORAL_ZOOM_TRIGGER_YEAR) {
          year = MORAL_ZOOM_TRIGGER_YEAR;
          mode = "zoom";
          zoomProgress = 0;
        }
      } else if (mode === "zoom") {
        zoomProgress = clamp(zoomProgress + elapsedSeconds * 0.34, 0, 1);
        if (zoomProgress >= 1) {
          mode = "long";
        }
      } else if (mode === "long") {
        year += elapsedSeconds * 47000;
        if (year >= MORAL_LONG_HORIZON_YEAR) {
          year = MORAL_LONG_HORIZON_YEAR;
          mode = "hold";
          holdUntil = now + 2600;
        }
      }

      const zoomMix = mode === "near" ? 0 : mode === "zoom" ? easeInOutCubic(zoomProgress) : 1;
      const rangeEndYear = MORAL_PROGRESS_END_YEAR + (MORAL_LONG_HORIZON_YEAR - MORAL_PROGRESS_END_YEAR) * zoomMix;

      renderMoralProgressFrame(year, false, {
        rangeEndYear: rangeEndYear,
        zoomedOut: zoomMix > 0.001,
        zoomMix: zoomMix,
      });
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function renderMoralProgressFrame(year, reducedMotionMode, viewState) {
    const snapshot = getMoralProgressSnapshot(year);
    const rangeEndYear =
      viewState && Number.isFinite(viewState.rangeEndYear) ? viewState.rangeEndYear : MORAL_PROGRESS_END_YEAR;
    const zoomedOut = Boolean(viewState && viewState.zoomedOut);
    const zoomMix = clamp(viewState && Number.isFinite(viewState.zoomMix) ? Number(viewState.zoomMix) : 0, 0, 1);
    renderMoralProgressChart(snapshot.year, rangeEndYear, zoomedOut, zoomMix);
    updateMoralProgressText(snapshot, reducedMotionMode, zoomedOut);
    updateMoralProgressEra(snapshot.year);
    if (el.progressLongCaption) {
      el.progressLongCaption.hidden = !zoomedOut;
    }
  }

  function getMoralProgressSnapshot(year) {
    const clampedYear = clamp(Number(year), MORAL_PROGRESS_START_YEAR, MORAL_LONG_HORIZON_YEAR);
    const baselineAdequacy = interpolateMoralProgress(clampedYear, "adequacy");
    const difficulty = interpolateMoralProgress(clampedYear, "difficulty");
    const deliberationLift = computeDeliberationLift(clampedYear, difficulty);
    const adjustedAdequacy = clamp(baselineAdequacy + deliberationLift, 2, 99);

    return {
      year: clampedYear,
      baselineAdequacy: baselineAdequacy,
      adjustedAdequacy: adjustedAdequacy,
      difficulty: difficulty,
      deliberationLift: deliberationLift,
    };
  }

  function interpolateMoralProgress(year, metric) {
    const endYear = MORAL_PROGRESS_END_YEAR;
    const longHorizonYear = MORAL_LONG_HORIZON_YEAR;

    if (metric === "adequacy") {
      const startYear = MORAL_PROGRESS_START_YEAR;
      const presentYear = MORAL_PROGRESS_PRESENT_YEAR;
      const startAdequacy = MORAL_PROGRESS_ANCHORS[0].adequacy;
      const presentAdequacy = interpolateAnchoredMetric(MORAL_PROGRESS_ANCHORS, presentYear, "adequacy");
      const endAdequacy = MORAL_PROGRESS_ANCHORS[MORAL_PROGRESS_ANCHORS.length - 1].adequacy;

      if (year <= startYear) return startAdequacy;
      if (year <= presentYear) {
        const t = clamp((year - startYear) / Math.max(1, presentYear - startYear), 0, 1);
        const logT = Math.log1p(MORAL_BASELINE_LOG_SHAPE * t) / Math.log1p(MORAL_BASELINE_LOG_SHAPE);
        return startAdequacy + (presentAdequacy - startAdequacy) * logT;
      }

      if (year <= endYear) {
        const postT = clamp((year - presentYear) / Math.max(1, endYear - presentYear), 0, 1);
        return presentAdequacy + (endAdequacy - presentAdequacy) * postT;
      }

      if (year >= longHorizonYear) return MORAL_LONG_HORIZON_ADEQUACY;
      const longT = clamp((year - endYear) / Math.max(1, longHorizonYear - endYear), 0, 1);
      const easedLongT = Math.log1p(18 * longT) / Math.log1p(18);
      return endAdequacy + (MORAL_LONG_HORIZON_ADEQUACY - endAdequacy) * easedLongT;
    }

    if (metric === "difficulty") {
      const endDifficulty = MORAL_PROGRESS_ANCHORS[MORAL_PROGRESS_ANCHORS.length - 1].difficulty;
      if (year <= endYear) {
        return interpolateAnchoredMetric(MORAL_PROGRESS_ANCHORS, year, metric);
      }
      if (year >= longHorizonYear) return MORAL_LONG_HORIZON_DIFFICULTY;
      const longT = clamp((year - endYear) / Math.max(1, longHorizonYear - endYear), 0, 1);
      const eased = Math.pow(longT, 0.55);
      return endDifficulty + (MORAL_LONG_HORIZON_DIFFICULTY - endDifficulty) * eased;
    }

    return interpolateAnchoredMetric(MORAL_PROGRESS_ANCHORS, year, metric);
  }

  function interpolateAnchoredMetric(anchors, year, metric) {
    if (!Array.isArray(anchors) || anchors.length === 0) return 0;
    if (year <= anchors[0].year) return anchors[0][metric];

    const last = anchors[anchors.length - 1];
    if (year >= last.year) return last[metric];

    for (let index = 1; index < anchors.length; index += 1) {
      const next = anchors[index];
      if (year > next.year) continue;
      const previous = anchors[index - 1];
      const span = next.year - previous.year;
      const progress = span <= 0 ? 0 : (year - previous.year) / span;
      const eased = easeInOutCubic(progress);
      return previous[metric] + (next[metric] - previous[metric]) * eased;
    }

    return last[metric];
  }

  function computeDeliberationLift(year, difficulty) {
    const span = Math.max(1, MORAL_LONG_HORIZON_YEAR - MORAL_PROGRESS_START_YEAR);
    const normalized = clamp((year - MORAL_PROGRESS_START_YEAR) / span, 0, 1);
    const pulse = (Math.sin(normalized * Math.PI * 6) + 1) / 2;
    const concentratedPulse = Math.pow(pulse, 2.4);
    const difficultyDamping = 1 - difficulty / 150;
    const lift = 1.6 + concentratedPulse * 7.2 * difficultyDamping;
    return Math.max(1.2, lift);
  }

  function updateMoralProgressText(snapshot, reducedMotionMode, zoomedOut) {
    if (el.progressYear) {
      el.progressYear.textContent = reducedMotionMode
        ? "Snapshot at year 700,000 (reduced motion)"
        : "Year " + formatLargeYear(snapshot.year) + (zoomedOut ? " (700,000-year horizon)" : "");
    }

    if (el.moralProgressValue) {
      el.moralProgressValue.textContent = Math.round(snapshot.adjustedAdequacy) + "%";
    }
    if (el.moralDifficultyValue) {
      el.moralDifficultyValue.textContent = Math.round(snapshot.difficulty) + "%";
    }
    if (el.deliberationLiftValue) {
      el.deliberationLiftValue.textContent = snapshot.deliberationLift.toFixed(1) + " pts";
    }

    if (!el.progressNarrative) return;

    if (snapshot.year < 1900) {
      el.progressNarrative.textContent =
        "Many societies still treat slavery as normal, showing how moral blind spots can dominate an era.";
      return;
    }
    if (snapshot.year < 2000) {
      el.progressNarrative.textContent =
        "Across the 20th century, formal abolition expands, yet coercion and exclusion remain deeply entrenched.";
      return;
    }
    if (snapshot.year < 2100) {
      el.progressNarrative.textContent =
        "The 21st century condemns slavery but may still normalize harms that later generations reject.";
      return;
    }
    el.progressNarrative.textContent =
      "Future generations keep correcting inherited norms; progress continues, but remaining issues are harder.";
  }

  function updateMoralProgressEra(year) {
    if (!el.progressEraList) return;
    const items = el.progressEraList.querySelectorAll("li[data-era]");
    let activeEra = "";
    if (year < 1900) {
      activeEra = "nineteenth";
    } else if (year >= 2000 && year < 2100) {
      activeEra = "twentyfirst";
    } else if (year >= 2100) {
      activeEra = "future";
    }

    items.forEach(function (item) {
      const era = item.getAttribute("data-era");
      item.classList.toggle("active", era === activeEra);
    });
  }

  function renderMoralProgressChart(year, rangeEndYear, zoomedOut, zoomMixOverride) {
    if (!el.progressChart) return;

    const width = 720;
    const height = 320;
    const margin = { top: 22, right: 20, bottom: 30, left: 38 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const endYear = clamp(Number(rangeEndYear), MORAL_PROGRESS_END_YEAR, MORAL_LONG_HORIZON_YEAR);
    const splitYear = MORAL_ZOOM_TRIGGER_YEAR;
    const splitRatio = 0.4;
    const leftX = margin.left;
    const rightX = margin.left + chartWidth;
    const splitX = leftX + chartWidth * splitRatio;
    const postStartYear = splitYear + 1;
    const zoomMix = clamp(Number.isFinite(zoomMixOverride) ? Number(zoomMixOverride) : zoomedOut ? 1 : 0, 0, 1);

    function xLinear(value) {
      const clamped = clamp(Number(value), MORAL_PROGRESS_START_YEAR, endYear);
      return margin.left + ((clamped - MORAL_PROGRESS_START_YEAR) / Math.max(1, endYear - MORAL_PROGRESS_START_YEAR)) * chartWidth;
    }

    function xSplit(value) {
      const clamped = clamp(Number(value), MORAL_PROGRESS_START_YEAR, endYear);
      if (endYear <= splitYear) return xLinear(clamped);
      if (clamped <= splitYear) {
        return (
          leftX +
          ((clamped - MORAL_PROGRESS_START_YEAR) / Math.max(1, splitYear - MORAL_PROGRESS_START_YEAR)) * (splitX - leftX)
        );
      }

      const logProgress = Math.log1p(clamped - postStartYear) / Math.log1p(Math.max(1, endYear - postStartYear));
      return splitX + logProgress * (rightX - splitX);
    }

    function x(value) {
      const linearX = xLinear(value);
      if (zoomMix <= 0) return linearX;
      const splitXValue = xSplit(value);
      return linearX + (splitXValue - linearX) * zoomMix;
    }

    function y(value) {
      return margin.top + ((100 - value) / 100) * chartHeight;
    }

    const sampleYears = [];
    if (zoomMix < 0.5 || endYear <= splitYear + 1) {
      const sampleCount = 130;
      const step = (endYear - MORAL_PROGRESS_START_YEAR) / sampleCount;
      for (let i = 0; i <= sampleCount; i += 1) {
        sampleYears.push(MORAL_PROGRESS_START_YEAR + step * i);
      }
    } else {
      const preCount = 140;
      const postCount = 220;
      for (let i = 0; i <= preCount; i += 1) {
        const t = i / preCount;
        sampleYears.push(MORAL_PROGRESS_START_YEAR + (splitYear - MORAL_PROGRESS_START_YEAR) * t);
      }
      const postSpanLog = Math.log1p(Math.max(1, endYear - postStartYear));
      for (let j = 1; j <= postCount; j += 1) {
        const t = j / postCount;
        sampleYears.push(postStartYear + Math.expm1(postSpanLog * t));
      }
    }
    if (Math.abs(sampleYears[sampleYears.length - 1] - endYear) > 0.0001) {
      sampleYears.push(endYear);
    }

    const baselinePoints = sampleYears.map(function (sampleYear) {
      return [x(sampleYear), y(interpolateMoralProgress(sampleYear, "adequacy"))];
    });
    const adjustedPoints = sampleYears.map(function (sampleYear) {
      return [x(sampleYear), y(getMoralProgressSnapshot(sampleYear).adjustedAdequacy)];
    });
    const difficultyPoints = sampleYears.map(function (sampleYear) {
      return [x(sampleYear), y(interpolateMoralProgress(sampleYear, "difficulty"))];
    });

    const gridLevels = [100, 75, 50, 25, 0];
    const gridLayer = gridLevels
      .map(function (level) {
        const py = y(level);
        return (
          '<line class="mp-grid" x1="' +
          margin.left +
          '" y1="' +
          py +
          '" x2="' +
          (margin.left + chartWidth) +
          '" y2="' +
          py +
          '"></line>' +
          '<text class="mp-axis-label" x="' +
          (margin.left - 8) +
          '" y="' +
          (py + 4) +
          '" text-anchor="end">' +
          level +
          "</text>"
        );
      })
      .join("");

    const current = getMoralProgressSnapshot(year);
    const currentX = x(current.year);
    const currentY = y(current.adjustedAdequacy);
    const currentDifficultyY = y(current.difficulty);

    const paths =
      '<path class="mp-base-path" d="' +
      linePath(baselinePoints) +
      '"></path>' +
      '<path class="mp-deliberation-path" d="' +
      linePath(adjustedPoints) +
      '"></path>' +
      '<path class="mp-difficulty-path" d="' +
      linePath(difficultyPoints) +
      '"></path>';

    const currentLayer =
      '<line class="mp-now-line" x1="' +
      currentX +
      '" y1="' +
      margin.top +
      '" x2="' +
      currentX +
      '" y2="' +
      (margin.top + chartHeight) +
      '"></line>' +
      '<circle class="mp-marker" cx="' +
      currentX +
      '" cy="' +
      currentY +
      '" r="5.2"></circle>' +
      '<circle class="mp-difficulty-dot" cx="' +
      currentX +
      '" cy="' +
      currentDifficultyY +
      '" r="4.4"></circle>';

    const splitLayer =
      zoomMix > 0.001
        ? '<line class="mp-split-line" x1="' +
          splitX +
          '" y1="' +
          margin.top +
          '" x2="' +
          splitX +
          '" y2="' +
          (margin.top + chartHeight) +
          '" style="opacity:' +
          zoomMix.toFixed(3) +
          ';"></line>'
        : "";

    const milestoneRows = MORAL_PROGRESS_MILESTONES.slice();
    if (zoomMix > 0.001) {
      milestoneRows.push({ year: MORAL_LONG_HORIZON_YEAR, label: "700,000¹" });
    }

    const milestones = milestoneRows
      .filter(function (milestone) {
        return milestone.year <= endYear;
      })
      .map(function (milestone) {
        const mx = x(milestone.year);
        const my = y(getMoralProgressSnapshot(milestone.year).adjustedAdequacy);
        const anchor = mx > margin.left + chartWidth / 2 ? "end" : "start";
        const labelX = anchor === "end" ? mx - 8 : mx + 8;
        return (
          '<circle class="mp-milestone-dot" cx="' +
          mx +
          '" cy="' +
          my +
          '" r="2.8"></circle>' +
          '<text class="mp-milestone" x="' +
          labelX +
          '" y="' +
          (my - 8) +
          '" text-anchor="' +
          anchor +
          '">' +
          milestone.label +
          "</text>"
        );
      })
      .join("");

    const axisLabels =
      zoomMix > 0.001
        ? '<text class="mp-axis-label" x="' +
          x(MORAL_PROGRESS_START_YEAR) +
          '" y="' +
          (height - 8) +
          '" text-anchor="start">' +
          formatLargeYear(MORAL_PROGRESS_START_YEAR) +
          "</text>" +
          '<text class="mp-axis-label" x="' +
          x(MORAL_PROGRESS_PRESENT_YEAR) +
          '" y="' +
          (height - 24) +
          '" text-anchor="middle">' +
          formatLargeYear(MORAL_PROGRESS_PRESENT_YEAR) +
          "</text>" +
          '<text class="mp-axis-label" x="' +
          x(MORAL_ZOOM_TRIGGER_YEAR) +
          '" y="' +
          (height - 8) +
          '" text-anchor="middle">' +
          formatLargeYear(MORAL_ZOOM_TRIGGER_YEAR) +
          "</text>" +
          '<text class="mp-axis-label" x="' +
          x(endYear) +
          '" y="' +
          (height - 8) +
          '" text-anchor="end">' +
          (Math.round(endYear) >= MORAL_LONG_HORIZON_YEAR ? "700,000¹" : formatLargeYear(endYear)) +
          "</text>"
        : '<text class="mp-axis-label" x="' +
          x(MORAL_PROGRESS_START_YEAR) +
          '" y="' +
          (height - 8) +
          '" text-anchor="start">' +
          formatLargeYear(MORAL_PROGRESS_START_YEAR) +
          "</text>" +
          '<text class="mp-axis-label" x="' +
          x(MORAL_PROGRESS_PRESENT_YEAR) +
          '" y="' +
          (height - 8) +
          '" text-anchor="middle">' +
          formatLargeYear(MORAL_PROGRESS_PRESENT_YEAR) +
          "</text>" +
          '<text class="mp-axis-label" x="' +
          x(endYear) +
          '" y="' +
          (height - 8) +
          '" text-anchor="end">' +
          formatLargeYear(endYear) +
          "</text>";

    const axis =
      axisLabels +
      '<text class="mp-axis-label" x="' +
      (margin.left + 10) +
      '" y="' +
      (margin.top + 12) +
      '">Solid: progress with deliberation | Dashed: baseline (log to present)</text>' +
      '<text class="mp-axis-label" x="' +
      (margin.left + 10) +
      '" y="' +
      (margin.top + 27) +
      '">Brown: rising difficulty frontier' +
      (zoomMix > 0.001 ? " | Split axis: left 2/5 pre-2075, right 3/5 non-linear to 700,000" : "") +
      "</text>";

    el.progressChart.innerHTML = gridLayer + paths + splitLayer + currentLayer + milestones + axis;
  }

  function initComparisonProgressAnimation() {
    if (!el.mathProgressChart || !el.ethicsProgressChart) return;

    let year = COMPARISON_START_YEAR;
    let mode = "near";
    let zoomProgress = 0;
    let holdUntil = 0;
    let lastTick = performance.now();

    renderComparisonProgressFrame(year, prefersReducedMotion, {
      rangeEndYear: COMPARISON_END_YEAR,
      zoomMix: 0,
    });

    if (prefersReducedMotion) {
      renderComparisonProgressFrame(COMPARISON_LONG_HORIZON_YEAR, true, {
        rangeEndYear: COMPARISON_LONG_HORIZON_YEAR,
        zoomMix: 1,
      });
      return;
    }

    function tick(now) {
      const elapsedSeconds = (now - lastTick) / 1000;
      lastTick = now;

      if (mode === "hold" && now >= holdUntil) {
        mode = "near";
        year = COMPARISON_START_YEAR;
        zoomProgress = 0;
        holdUntil = 0;
      }

      if (mode === "near") {
        year += elapsedSeconds * 39;
        if (year >= COMPARISON_ZOOM_TRIGGER_YEAR) {
          year = COMPARISON_ZOOM_TRIGGER_YEAR;
          mode = "zoom";
          zoomProgress = 0;
        }
      } else if (mode === "zoom") {
        zoomProgress = clamp(zoomProgress + elapsedSeconds * 0.34, 0, 1);
        if (zoomProgress >= 1) {
          mode = "long";
        }
      } else if (mode === "long") {
        year += elapsedSeconds * 42000;
        if (year >= COMPARISON_LONG_HORIZON_YEAR) {
          year = COMPARISON_LONG_HORIZON_YEAR;
          mode = "hold";
          holdUntil = now + 2600;
        }
      }

      const zoomMix = mode === "near" ? 0 : mode === "zoom" ? easeInOutCubic(zoomProgress) : 1;
      const rangeEndYear = COMPARISON_END_YEAR + (COMPARISON_LONG_HORIZON_YEAR - COMPARISON_END_YEAR) * zoomMix;

      renderComparisonProgressFrame(year, false, {
        rangeEndYear: rangeEndYear,
        zoomMix: zoomMix,
      });
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function renderComparisonProgressFrame(year, reducedMotionMode, viewState) {
    const clampedYear = clamp(Number(year), COMPARISON_START_YEAR, COMPARISON_LONG_HORIZON_YEAR);
    const rangeEndYear =
      viewState && Number.isFinite(viewState.rangeEndYear) ? Number(viewState.rangeEndYear) : COMPARISON_END_YEAR;
    const zoomMix = clamp(viewState && Number.isFinite(viewState.zoomMix) ? Number(viewState.zoomMix) : 0, 0, 1);
    const mathSnapshot = getComparisonSnapshot(clampedYear, MATH_COMPARISON_ANCHORS);
    const ethicsSnapshot = getComparisonSnapshot(clampedYear, ETHICS_COMPARISON_ANCHORS);

    renderComparisonDomainChart(el.mathProgressChart, clampedYear, MATH_COMPARISON_ANCHORS, MATH_COMPARISON_MILESTONES, {
      rangeEndYear: rangeEndYear,
      zoomMix: zoomMix,
    });
    renderComparisonDomainChart(
      el.ethicsProgressChart,
      clampedYear,
      ETHICS_COMPARISON_ANCHORS,
      ETHICS_COMPARISON_MILESTONES,
      {
        rangeEndYear: rangeEndYear,
        zoomMix: zoomMix,
      }
    );
    updateComparisonProgressText(clampedYear, mathSnapshot, ethicsSnapshot, reducedMotionMode, zoomMix > 0.001);
  }

  function getComparisonSnapshot(year, anchors) {
    const clampedYear = clamp(Number(year), COMPARISON_START_YEAR, COMPARISON_LONG_HORIZON_YEAR);
    const domainKey = anchors === MATH_COMPARISON_ANCHORS ? "math" : "ethics";
    const longTargets =
      domainKey === "math" ? COMPARISON_LONG_HORIZON_TARGETS.math : COMPARISON_LONG_HORIZON_TARGETS.ethics;
    return {
      progress: interpolateComparisonMetric(clampedYear, anchors, "progress", longTargets.progress, domainKey),
      difficulty: interpolateComparisonMetric(clampedYear, anchors, "difficulty", longTargets.difficulty, domainKey),
    };
  }

  function interpolateComparisonMetric(year, anchors, metric, longTarget, domainKey) {
    const kind = domainKey || (anchors === MATH_COMPARISON_ANCHORS ? "math" : "ethics");
    if (year <= COMPARISON_END_YEAR) {
      if (metric === "progress") {
        return interpolateAnchoredComparisonProgress(anchors, year, kind);
      }
      return interpolateAnchoredMetric(anchors, year, metric);
    }

    const endValue = anchors[anchors.length - 1][metric];
    if (year >= COMPARISON_LONG_HORIZON_YEAR) return longTarget;

    const longT = clamp(
      (year - COMPARISON_END_YEAR) / Math.max(1, COMPARISON_LONG_HORIZON_YEAR - COMPARISON_END_YEAR),
      0,
      1
    );
    if (metric === "progress") {
      const eased =
        kind === "math"
          ? Math.log1p(34 * longT) / Math.log1p(34)
          : Math.log1p(12 * Math.pow(longT, 1.22)) / Math.log1p(12);
      return endValue + (longTarget - endValue) * eased;
    }
    const eased = Math.pow(longT, kind === "math" ? 0.52 : 0.64);
    return endValue + (longTarget - endValue) * eased;
  }

  function interpolateAnchoredComparisonProgress(anchors, year, domainKey) {
    if (!Array.isArray(anchors) || anchors.length === 0) return 0;
    if (year <= anchors[0].year) return anchors[0].progress;

    const last = anchors[anchors.length - 1];
    if (year >= last.year) return last.progress;

    for (let index = 1; index < anchors.length; index += 1) {
      const next = anchors[index];
      if (year > next.year) continue;
      const previous = anchors[index - 1];
      const span = next.year - previous.year;
      const progress = span <= 0 ? 0 : (year - previous.year) / span;
      const eased =
        domainKey === "math" ? 1 - Math.pow(1 - progress, 2.05) : Math.pow(progress, 1.35);
      return previous.progress + (next.progress - previous.progress) * clamp(eased, 0, 1);
    }

    return last.progress;
  }

  function updateComparisonProgressText(year, mathSnapshot, ethicsSnapshot, reducedMotionMode, zoomedOut) {
    if (el.comparisonYear) {
      el.comparisonYear.textContent = reducedMotionMode
        ? "Snapshot at year 700,000 (reduced motion)"
        : "Shared year: " + formatLargeYear(year) + (zoomedOut ? " (700,000-year horizon)" : "");
    }

    if (el.mathProgressValue) {
      el.mathProgressValue.textContent = Math.round(mathSnapshot.progress) + "%";
    }
    if (el.ethicsProgressValue) {
      el.ethicsProgressValue.textContent = Math.round(ethicsSnapshot.progress) + "%";
    }

    const gap = mathSnapshot.progress - ethicsSnapshot.progress;
    if (el.comparisonGapValue) {
      el.comparisonGapValue.textContent = Math.round(gap) + " pts";
    }

    if (el.mathStageNote) {
      if (year < 1900) {
        el.mathStageNote.textContent = "Rigor and proof standards are consolidating across algebra and analysis.";
      } else if (year < 2000) {
        el.mathStageNote.textContent = "Axiomatization, logic, and computation produce rapidly compounding results.";
      } else if (year < COMPARISON_ZOOM_TRIGGER_YEAR) {
        el.mathStageNote.textContent = "Formal verification and machine-assisted proof accelerate frontier progress.";
      } else if (year < 100000) {
        el.mathStageNote.textContent =
          "Collective inquiry and machine proof systems keep expanding formal coverage into harder abstractions.";
      } else {
        el.mathStageNote.textContent =
          "By very long horizons, humans approach most meaningful mathematical truths while frontier novelty persists.";
      }
    }

    if (el.ethicsStageNote) {
      if (year < 1900) {
        el.ethicsStageNote.textContent = "Secular ethical reform is fragmented and often outweighed by social hierarchy.";
      } else if (year < 2000) {
        el.ethicsStageNote.textContent = "Rights language expands, but practical consensus is still partial and uneven.";
      } else if (year < COMPARISON_ZOOM_TRIGGER_YEAR) {
        el.ethicsStageNote.textContent = "Global discourse broadens while deep value conflicts continue to resist closure.";
      } else if (year < 100000) {
        el.ethicsStageNote.textContent =
          "Institutions for mutual deliberation widen the moral circle, though difficult tradeoffs still require iteration.";
      } else {
        el.ethicsStageNote.textContent =
          "By very long horizons, humans may approach most meaningful moral truths through sustained deliberation.";
      }
    }

    if (el.comparisonNarrative) {
      if (year >= COMPARISON_LONG_HORIZON_YEAR - 1) {
        el.comparisonNarrative.textContent =
          "At year 700,000, both domains approach near-complete meaningful knowledge, with ethics still requiring ongoing deliberation.";
      } else if (gap >= 18) {
        el.comparisonNarrative.textContent =
          "Mathematics advances faster because proof can decisively settle claims; ethics keeps requiring broad, repeated deliberation.";
      } else if (gap >= 8) {
        el.comparisonNarrative.textContent =
          "The gap narrows slightly, but ethical progress is still slower due to plural values and institutional friction.";
      } else {
        el.comparisonNarrative.textContent =
          "Both areas remain incomplete today; mutual deliberation remains central for moral progress as difficulty rises.";
      }
    }
  }

  function renderComparisonDomainChart(svgEl, year, anchors, milestones, viewState) {
    if (!svgEl) return;

    const width = 680;
    const height = 250;
    const margin = { top: 18, right: 16, bottom: 24, left: 34 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const endYear = clamp(
      viewState && Number.isFinite(viewState.rangeEndYear) ? Number(viewState.rangeEndYear) : COMPARISON_END_YEAR,
      COMPARISON_END_YEAR,
      COMPARISON_LONG_HORIZON_YEAR
    );
    const zoomMix = clamp(viewState && Number.isFinite(viewState.zoomMix) ? Number(viewState.zoomMix) : 0, 0, 1);
    const splitYear = COMPARISON_ZOOM_TRIGGER_YEAR;
    const splitRatio = 0.4;
    const leftX = margin.left;
    const rightX = margin.left + chartWidth;
    const splitX = leftX + chartWidth * splitRatio;
    const postStartYear = splitYear + 1;
    const longTargets =
      anchors === MATH_COMPARISON_ANCHORS ? COMPARISON_LONG_HORIZON_TARGETS.math : COMPARISON_LONG_HORIZON_TARGETS.ethics;

    function xLinear(value) {
      const clamped = clamp(Number(value), COMPARISON_START_YEAR, endYear);
      return margin.left + ((clamped - COMPARISON_START_YEAR) / Math.max(1, endYear - COMPARISON_START_YEAR)) * chartWidth;
    }

    function xSplit(value) {
      const clamped = clamp(Number(value), COMPARISON_START_YEAR, endYear);
      if (endYear <= splitYear) return xLinear(clamped);
      if (clamped <= splitYear) {
        return (
          leftX +
          ((clamped - COMPARISON_START_YEAR) / Math.max(1, splitYear - COMPARISON_START_YEAR)) * (splitX - leftX)
        );
      }
      const logProgress = Math.log1p(clamped - postStartYear) / Math.log1p(Math.max(1, endYear - postStartYear));
      return splitX + logProgress * (rightX - splitX);
    }

    function x(value) {
      const linearX = xLinear(value);
      if (zoomMix <= 0) return linearX;
      const splitXValue = xSplit(value);
      return linearX + (splitXValue - linearX) * zoomMix;
    }

    function y(value) {
      return margin.top + ((100 - value) / 100) * chartHeight;
    }

    const sampleYears = [];
    if (zoomMix < 0.5 || endYear <= splitYear + 1) {
      const sampleCount = 130;
      const step = (endYear - COMPARISON_START_YEAR) / sampleCount;
      for (let i = 0; i <= sampleCount; i += 1) {
        sampleYears.push(COMPARISON_START_YEAR + step * i);
      }
    } else {
      const preCount = 120;
      const postCount = 220;
      for (let i = 0; i <= preCount; i += 1) {
        const t = i / preCount;
        sampleYears.push(COMPARISON_START_YEAR + (splitYear - COMPARISON_START_YEAR) * t);
      }
      const postSpanLog = Math.log1p(Math.max(1, endYear - postStartYear));
      for (let j = 1; j <= postCount; j += 1) {
        const t = j / postCount;
        sampleYears.push(postStartYear + Math.expm1(postSpanLog * t));
      }
    }
    if (Math.abs(sampleYears[sampleYears.length - 1] - endYear) > 0.0001) {
      sampleYears.push(endYear);
    }

    const progressPoints = sampleYears.map(function (sampleYear) {
      return [x(sampleYear), y(interpolateComparisonMetric(sampleYear, anchors, "progress", longTargets.progress))];
    });
    const difficultyPoints = sampleYears.map(function (sampleYear) {
      return [x(sampleYear), y(interpolateComparisonMetric(sampleYear, anchors, "difficulty", longTargets.difficulty))];
    });

    const currentYear = clamp(Number(year), COMPARISON_START_YEAR, COMPARISON_LONG_HORIZON_YEAR);
    const current = getComparisonSnapshot(currentYear, anchors);
    const currentX = x(currentYear);
    const currentProgressY = y(current.progress);
    const currentDifficultyY = y(current.difficulty);

    const gridLevels = [100, 75, 50, 25, 0];
    const gridLayer = gridLevels
      .map(function (level) {
        const py = y(level);
        return (
          '<line class="cmp-grid" x1="' +
          margin.left +
          '" y1="' +
          py +
          '" x2="' +
          (margin.left + chartWidth) +
          '" y2="' +
          py +
          '"></line>' +
          '<text class="cmp-axis-label" x="' +
          (margin.left - 8) +
          '" y="' +
          (py + 4) +
          '" text-anchor="end">' +
          level +
          "</text>"
        );
      })
      .join("");

    const paths =
      '<path class="cmp-progress" d="' +
      linePath(progressPoints) +
      '"></path>' +
      '<path class="cmp-difficulty" d="' +
      linePath(difficultyPoints) +
      '"></path>';

    const currentLayer =
      '<line class="cmp-now" x1="' +
      currentX +
      '" y1="' +
      margin.top +
      '" x2="' +
      currentX +
      '" y2="' +
      (margin.top + chartHeight) +
      '"></line>' +
      '<circle class="cmp-progress-dot" cx="' +
      currentX +
      '" cy="' +
      currentProgressY +
      '" r="4.8"></circle>' +
      '<circle class="cmp-difficulty-dot" cx="' +
      currentX +
      '" cy="' +
      currentDifficultyY +
      '" r="4"></circle>';

    const splitLayer =
      zoomMix > 0.001
        ? '<line class="cmp-split-line" x1="' +
          splitX +
          '" y1="' +
          margin.top +
          '" x2="' +
          splitX +
          '" y2="' +
          (margin.top + chartHeight) +
          '" style="opacity:' +
          zoomMix.toFixed(3) +
          ';"></line>'
        : "";

    const milestoneRows = milestones.slice();
    if (zoomMix > 0.001) {
      milestoneRows.push({ year: COMPARISON_LONG_HORIZON_YEAR, label: "700,000¹" });
    }

    const milestoneLayer = milestoneRows
      .filter(function (milestone) {
        return milestone.year <= endYear;
      })
      .map(function (milestone) {
        const mx = x(milestone.year);
        const my = y(interpolateComparisonMetric(milestone.year, anchors, "progress", longTargets.progress));
        const anchor = mx > margin.left + chartWidth / 2 ? "end" : "start";
        const lx = anchor === "end" ? mx - 6 : mx + 6;
        return (
          '<circle class="cmp-milestone-dot" cx="' +
          mx +
          '" cy="' +
          my +
          '" r="2.5"></circle>' +
          '<text class="cmp-milestone" x="' +
          lx +
          '" y="' +
          (my - 7) +
          '" text-anchor="' +
          anchor +
          '">' +
          milestone.label +
          "</text>"
        );
      })
      .join("");

    const axisLabels =
      zoomMix > 0.001
        ? '<text class="cmp-axis-label" x="' +
          x(COMPARISON_START_YEAR) +
          '" y="' +
          (height - 6) +
          '" text-anchor="start">' +
          formatLargeYear(COMPARISON_START_YEAR) +
          "</text>" +
          '<text class="cmp-axis-label" x="' +
          x(COMPARISON_PRESENT_YEAR) +
          '" y="' +
          (height - 20) +
          '" text-anchor="middle">' +
          formatLargeYear(COMPARISON_PRESENT_YEAR) +
          "</text>" +
          '<text class="cmp-axis-label" x="' +
          x(COMPARISON_ZOOM_TRIGGER_YEAR) +
          '" y="' +
          (height - 6) +
          '" text-anchor="middle">' +
          formatLargeYear(COMPARISON_ZOOM_TRIGGER_YEAR) +
          "</text>" +
          '<text class="cmp-axis-label" x="' +
          x(endYear) +
          '" y="' +
          (height - 6) +
          '" text-anchor="end">' +
          (Math.round(endYear) >= COMPARISON_LONG_HORIZON_YEAR ? "700,000¹" : formatLargeYear(endYear)) +
          "</text>"
        : '<text class="cmp-axis-label" x="' +
          x(COMPARISON_START_YEAR) +
          '" y="' +
          (height - 6) +
          '" text-anchor="start">' +
          formatLargeYear(COMPARISON_START_YEAR) +
          "</text>" +
          '<text class="cmp-axis-label" x="' +
          x(COMPARISON_PRESENT_YEAR) +
          '" y="' +
          (height - 6) +
          '" text-anchor="middle">' +
          formatLargeYear(COMPARISON_PRESENT_YEAR) +
          "</text>" +
          '<text class="cmp-axis-label" x="' +
          x(endYear) +
          '" y="' +
          (height - 6) +
          '" text-anchor="end">' +
          formatLargeYear(endYear) +
          "</text>";

    const axis =
      axisLabels +
      '<text class="cmp-axis-label" x="' +
      (margin.left + 10) +
      '" y="' +
      (margin.top + 12) +
      '">Solid: knowledge coverage | Dashed: remaining difficulty frontier</text>' +
      (zoomMix > 0.001
        ? '<text class="cmp-axis-label" x="' +
          (margin.left + 10) +
          '" y="' +
          (margin.top + 26) +
          '">Split axis: left 2/5 pre-2075, right 3/5 non-linear to 700,000</text>'
        : "");

    svgEl.innerHTML = gridLayer + paths + splitLayer + currentLayer + milestoneLayer + axis;
  }

  function renderGate() {
    const signed = state.pledge.signed;
    el.studioContent.classList.toggle("locked", !signed);
    if (signed) {
      const name = state.pledge.name || "Member";
      const dateLabel = state.pledge.signedAt ? formatDate(state.pledge.signedAt) : "today";
      el.gateBanner.textContent = "Studio unlocked for " + name + ". Pledge signed on " + dateLabel + ".";
      if (!el.pledgeStatus.textContent.trim()) {
        el.pledgeStatus.textContent = name + " signed the pledge on " + dateLabel + ".";
      }
      el.pledgeName.value = state.pledge.name || "";
    } else {
      el.gateBanner.textContent = "Studio is locked until the pledge is signed.";
      el.pledgeStatus.textContent = "";
    }
  }

  function renderConvictionList() {
    el.convictionList.innerHTML = "";
    if (state.convictions.length === 0) {
      const empty = document.createElement("li");
      empty.className = "mini-summary";
      empty.textContent = "No convictions yet. Publish one to start matching.";
      el.convictionList.appendChild(empty);
      return;
    }

    state.convictions.forEach(function (item) {
      const li = document.createElement("li");
      li.className = "conviction-item" + (item.id === state.activeConvictionId ? " active" : "");

      const title = document.createElement("p");
      title.innerHTML = "<strong>" + escapeHtml(item.claim) + "</strong>";

      const meta = document.createElement("p");
      meta.className = "hint";
      meta.textContent =
        topicLabel(item.topic) +
        " | " +
        frameworkLabel(item.framework) +
        " | Confidence: " +
        item.confidence +
        "%";

      const button = document.createElement("button");
      button.type = "button";
      button.className = item.id === state.activeConvictionId ? "btn btn-primary" : "btn btn-ghost";
      button.setAttribute("data-conviction-id", item.id);
      button.textContent = item.id === state.activeConvictionId ? "Active Conviction" : "Use For Matching";

      li.appendChild(title);
      li.appendChild(meta);
      li.appendChild(button);
      el.convictionList.appendChild(li);
    });
  }

  function renderMatching() {
    const activeConviction = getActiveConviction();
    const mode = el.matchModeInput.value || "balanced";

    if (!activeConviction) {
      currentMatches = [];
      el.activeConvictionSummary.textContent = "No active conviction selected yet.";
      el.counterpartList.innerHTML = "";
      el.matchRationale.textContent = formStatus.conviction || "Publish and select a conviction to generate candidates.";
      return;
    }

    el.activeConvictionSummary.innerHTML =
      "<strong>Active claim:</strong> " +
      escapeHtml(activeConviction.claim) +
      "<br><strong>Topic:</strong> " +
      escapeHtml(topicLabel(activeConviction.topic)) +
      " | <strong>Framework:</strong> " +
      escapeHtml(frameworkLabel(activeConviction.framework)) +
      " | <strong>Confidence:</strong> " +
      activeConviction.confidence +
      "%";

    currentMatches = buildMatches(activeConviction, mode);
    if (
      state.selectedCounterpartId &&
      !currentMatches.some(function (item) {
        return item.id === state.selectedCounterpartId;
      })
    ) {
      state.selectedCounterpartId = null;
      saveState();
    }

    if (currentMatches.length === 0) {
      el.counterpartList.innerHTML = "";
      el.matchRationale.textContent = "No counterparts available.";
      return;
    }

    const top = currentMatches[0];
    el.matchRationale.textContent =
      modeDescription(mode) +
      " Top result: " +
      top.name +
      " (" +
      top.score +
      "/100) with disagreement " +
      top.breakdown.disagreement +
      ", topic fit " +
      top.breakdown.topicFit +
      ", and reliability " +
      top.breakdown.reliability +
      ".";

    el.counterpartList.innerHTML = "";
    currentMatches.forEach(function (match, index) {
      const card = document.createElement("article");
      card.className = "counterpart-card";
      card.style.setProperty("--card-delay", String(index * 0.055) + "s");

      const selected = state.selectedCounterpartId === match.id;

      const head = document.createElement("div");
      head.className = "counterpart-head";

      const title = document.createElement("h4");
      title.textContent = match.name;

      const score = document.createElement("span");
      score.className = "score-pill";
      score.textContent = "Score " + match.score + "/100";

      head.appendChild(title);
      head.appendChild(score);

      const meta = document.createElement("div");
      meta.className = "counterpart-meta";
      meta.appendChild(chip(topicLabel(match.topic), "chip"));
      meta.appendChild(chip(frameworkLabel(match.framework), "chip"));
      meta.appendChild(chip(match.style, "chip"));
      meta.appendChild(chip("Claim confidence: " + match.claimConfidence + "%", "chip"));

      const scoreGrid = document.createElement("div");
      scoreGrid.className = "score-grid";
      scoreGrid.appendChild(scoreLine("Disagreement", match.breakdown.disagreement));
      scoreGrid.appendChild(scoreLine("Topic fit", match.breakdown.topicFit));
      scoreGrid.appendChild(scoreLine("Framework diversity", match.breakdown.frameworkDiversity));
      scoreGrid.appendChild(scoreLine("Reliability", match.breakdown.reliability));

      const stance = document.createElement("p");
      stance.className = "hint";
      stance.textContent = match.opposed
        ? "Counterpart currently takes the opposite side of your claim."
        : "Counterpart is not fully opposed, but still contributes useful pressure-testing.";

      const button = document.createElement("button");
      button.type = "button";
      button.className = selected ? "btn btn-primary" : "btn btn-secondary";
      button.setAttribute("data-counterpart-id", match.id);
      button.textContent = selected ? "Selected Counterpart" : "Select Counterpart";

      card.appendChild(head);
      card.appendChild(meta);
      card.appendChild(scoreGrid);
      card.appendChild(stance);
      card.appendChild(button);
      el.counterpartList.appendChild(card);
    });
  }

  function renderSessionPartner() {
    const chosen = getSelectedCounterpart();
    if (!chosen) {
      el.sessionPartnerSummary.textContent = "No counterpart selected yet.";
      return;
    }
    el.sessionPartnerSummary.innerHTML =
      "<strong>Selected counterpart:</strong> " +
      escapeHtml(chosen.name) +
      " | " +
      escapeHtml(frameworkLabel(chosen.framework)) +
      " | Match score " +
      chosen.score +
      "/100";
  }

  function renderLedger() {
    el.ledgerList.innerHTML = "";
    if (state.ledger.length === 0) {
      const empty = document.createElement("article");
      empty.className = "mini-summary";
      empty.textContent = "No action commitments yet. Once post-dialogue confidence goes above 50%, entries appear here.";
      el.ledgerList.appendChild(empty);
      return;
    }

    state.ledger.forEach(function (entry) {
      const row = document.createElement("article");
      row.className = "ledger-item" + (entry.status === "done" ? " done" : "");

      const title = document.createElement("h4");
      title.textContent = entry.claim;

      const meta = document.createElement("p");
      meta.className = "ledger-meta";
      meta.textContent =
        "Confidence at commitment: " +
        entry.confidenceAtDecision +
        "% | Start " +
        entry.startDate +
        " | Check-in " +
        entry.checkinDate +
        " | Logged " +
        formatDate(entry.createdAt);

      const implication = document.createElement("p");
      implication.innerHTML = "<strong>Implication:</strong> " + escapeHtml(entry.implication);

      const action = document.createElement("p");
      action.innerHTML = "<strong>Action plan:</strong> " + escapeHtml(entry.actionPlan);

      const counterparty = COUNTERPARTS.find(function (item) {
        return item.id === entry.counterpartId;
      });
      const source = document.createElement("p");
      source.className = "hint";
      source.textContent = "Counterpart: " + (counterparty ? counterparty.name : "Unknown");

      const button = document.createElement("button");
      button.type = "button";
      button.className = entry.status === "done" ? "btn btn-ghost" : "btn btn-primary";
      button.setAttribute("data-ledger-id", entry.id);
      button.textContent = entry.status === "done" ? "Mark As Pending" : "Mark As Completed";

      row.appendChild(title);
      row.appendChild(meta);
      row.appendChild(implication);
      row.appendChild(action);
      row.appendChild(source);
      row.appendChild(button);
      el.ledgerList.appendChild(row);
    });
  }

  function buildMatches(conviction, mode) {
    const weights = MATCH_WEIGHTS[mode] || MATCH_WEIGHTS.balanced;
    const userAffirms = conviction.confidence >= 50;
    const topic = conviction.topic || "general";

    return COUNTERPARTS.map(function (counterpart) {
      const claimConfidence = resolveCounterpartConfidence(counterpart, conviction);
      const counterpartAffirms = claimConfidence >= 50;
      const opposed = userAffirms !== counterpartAffirms;

      const rawDisagreement = Math.abs(conviction.confidence - claimConfidence);
      const disagreement = opposed ? rawDisagreement : Math.round(rawDisagreement * 0.35);
      const topicFit = Object.prototype.hasOwnProperty.call(counterpart.positions, topic) ? 100 : 35;
      const frameworkDiversity = conviction.framework === counterpart.framework ? 28 : 100;
      const reliability = counterpart.reliability;

      const score = Math.round(
        disagreement * weights.disagreement +
          topicFit * weights.topicFit +
          frameworkDiversity * weights.frameworkDiversity +
          reliability * weights.reliability
      );

      return {
        id: counterpart.id,
        name: counterpart.name,
        framework: counterpart.framework,
        style: counterpart.style,
        topic: topic,
        claimConfidence: claimConfidence,
        opposed: opposed,
        score: score,
        breakdown: {
          disagreement: disagreement,
          topicFit: topicFit,
          frameworkDiversity: frameworkDiversity,
          reliability: reliability,
        },
      };
    })
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .slice(0, 6);
  }

  function resolveCounterpartConfidence(counterpart, conviction) {
    const topic = conviction.topic || "general";
    if (Object.prototype.hasOwnProperty.call(counterpart.positions, topic)) {
      return counterpart.positions[topic];
    }
    const seed = hashString(counterpart.id + "|" + conviction.claim + "|" + topic);
    return 18 + (seed % 65);
  }

  function getSelectedCounterpart() {
    if (!state.selectedCounterpartId) return null;
    return (
      currentMatches.find(function (item) {
        return item.id === state.selectedCounterpartId;
      }) || null
    );
  }

  function getActiveConviction() {
    return (
      state.convictions.find(function (item) {
        return item.id === state.activeConvictionId;
      }) || null
    );
  }

  function updateThresholdState() {
    const value = Number(el.postConfidenceInput.value || "50");
    const triggered = value > 50;

    if (triggered) {
      el.thresholdNotice.className = "threshold-note triggered";
      el.thresholdNotice.textContent =
        "Threshold crossed: because confidence is above 50%, a concrete action commitment is required.";
      el.actionCommitmentBlock.classList.remove("hidden");
      el.actionPlanInput.required = true;
      el.startDateInput.required = true;
      el.checkinDateInput.required = true;
      if (!el.startDateInput.value) el.startDateInput.value = todayISO();
      if (!el.checkinDateInput.value) el.checkinDateInput.value = plusDaysISO(14);
    } else {
      el.thresholdNotice.className = "threshold-note neutral";
      el.thresholdNotice.textContent =
        "Threshold not crossed: action commitment is optional until confidence moves above 50%.";
      el.actionCommitmentBlock.classList.add("hidden");
      el.actionPlanInput.required = false;
      el.startDateInput.required = false;
      el.checkinDateInput.required = false;
    }
  }

  function updateConfidenceText(slider, label) {
    label.textContent = String(slider.value) + "%";
  }

  function inferTopic(text) {
    const source = String(text || "").toLowerCase();
    let bestTopic = "general";
    let bestHits = 0;

    Object.keys(TOPICS).forEach(function (topicId) {
      if (topicId === "general") return;
      const hits = TOPICS[topicId].keywords.reduce(function (count, keyword) {
        return count + (source.includes(keyword) ? 1 : 0);
      }, 0);
      if (hits > bestHits) {
        bestHits = hits;
        bestTopic = topicId;
      }
    });

    return bestTopic;
  }

  function topicLabel(topicId) {
    return TOPICS[topicId] ? TOPICS[topicId].label : TOPICS.general.label;
  }

  function frameworkLabel(frameworkId) {
    const labels = {
      utilitarian: "Utilitarian",
      deontological: "Deontological",
      rights: "Rights-based",
      virtue: "Virtue ethics",
      care: "Care ethics",
      contractarian: "Contractarian",
      pluralist: "Pluralist",
    };
    return labels[frameworkId] || "Unspecified framework";
  }

  function modeDescription(mode) {
    if (mode === "challenge") {
      return "Challenge mode prioritizes maximum disagreement while keeping topic fit.";
    }
    if (mode === "bridge") {
      return "Bridge mode prioritizes reliable, constructive disagreement over raw polarization.";
    }
    return "Balanced mode mixes disagreement, topical overlap, and reliability.";
  }

  function setSessionStatus(text) {
    el.sessionStatus.textContent = text;
  }

  function createDefaultState() {
    return {
      pledge: {
        signed: false,
        name: "",
        signedAt: "",
      },
      convictions: [],
      activeConvictionId: null,
      selectedCounterpartId: null,
      sessions: [],
      ledger: [],
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      const parsed = JSON.parse(raw);
      return {
        pledge: {
          signed: Boolean(parsed.pledge && parsed.pledge.signed),
          name: String((parsed.pledge && parsed.pledge.name) || ""),
          signedAt: String((parsed.pledge && parsed.pledge.signedAt) || ""),
        },
        convictions: Array.isArray(parsed.convictions) ? parsed.convictions : [],
        activeConvictionId: parsed.activeConvictionId || null,
        selectedCounterpartId: parsed.selectedCounterpartId || null,
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        ledger: Array.isArray(parsed.ledger) ? parsed.ledger : [],
      };
    } catch (error) {
      return createDefaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function resetConvictionForm() {
    el.claimInput.value = "";
    el.reasonInput.value = "";
    el.implicationInput.value = "";
    el.topicInput.value = "auto";
    el.frameworkInput.value = "utilitarian";
    el.confidenceInput.value = "50";
    updateConfidenceText(el.confidenceInput, el.confidenceValue);
  }

  function resetSessionForm() {
    el.counterArgumentInput.value = "";
    el.replyInput.value = "";
    el.postConfidenceInput.value = "50";
    el.actionPlanInput.value = "";
    el.startDateInput.value = "";
    el.checkinDateInput.value = "";
    updateConfidenceText(el.postConfidenceInput, el.postConfidenceValue);
    updateThresholdState();
  }

  function uid(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 10);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
  }

  function formatDate(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "unknown date";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function formatLargeYear(value) {
    return Math.round(Number(value) || 0).toLocaleString("en-US");
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function hashString(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function todayISO() {
    return localISODate(new Date());
  }

  function plusDaysISO(days) {
    const now = new Date();
    now.setDate(now.getDate() + days);
    return localISODate(now);
  }

  function localISODate(date) {
    const copy = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return copy.toISOString().slice(0, 10);
  }

  function chip(label, className) {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = label;
    return span;
  }

  function scoreLine(label, value) {
    const row = document.createElement("span");
    row.textContent = label + ": " + value;
    return row;
  }

  function average(values) {
    if (!Array.isArray(values) || values.length === 0) return 0;
    return (
      values.reduce(function (sum, value) {
        return sum + Number(value || 0);
      }, 0) / values.length
    );
  }

  function normalizeCredenceDistribution(values) {
    if (!Array.isArray(values) || values.length === 0) return [];
    const sanitized = values.map(function (value) {
      return Math.max(0, Number(value) || 0);
    });
    const total = sanitized.reduce(function (sum, value) {
      return sum + value;
    }, 0);
    if (total <= 0) {
      const equal = 100 / sanitized.length;
      return sanitized.map(function () {
        return equal;
      });
    }
    return sanitized.map(function (value) {
      return (value / total) * 100;
    });
  }

  function roundDistributionToHundred(values) {
    if (!Array.isArray(values) || values.length === 0) return [];
    const normalized = normalizeCredenceDistribution(values);
    const base = normalized.map(function (value) {
      return Math.floor(value);
    });
    let remaining = 100 - base.reduce(function (sum, value) {
      return sum + value;
    }, 0);
    const order = normalized
      .map(function (value, index) {
        return { index: index, fraction: value - Math.floor(value) };
      })
      .sort(function (a, b) {
        return b.fraction - a.fraction;
      });
    for (let i = 0; i < order.length && remaining > 0; i += 1) {
      base[order[i].index] += 1;
      remaining -= 1;
    }
    return base;
  }

  function linePath(points) {
    if (!Array.isArray(points) || points.length === 0) return "";
    return points
      .map(function (point, index) {
        const command = index === 0 ? "M" : "L";
        return command + point[0].toFixed(2) + " " + point[1].toFixed(2);
      })
      .join(" ");
  }

  function easeInOutCubic(value) {
    if (value <= 0) return 0;
    if (value >= 1) return 1;
    if (value < 0.5) return 4 * value * value * value;
    return 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function bindRevealAnimation() {
    const items = document.querySelectorAll(".reveal");
    items.forEach(function (node, index) {
      node.style.setProperty("--reveal-delay", String(Math.min(index * 0.06, 0.24)) + "s");
    });

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (node) {
        node.classList.add("reveal-on");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-on");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    items.forEach(function (node) {
      observer.observe(node);
    });
  }

  function bindCountUpAnimation() {
    if (!el.statValues || el.statValues.length === 0) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      el.statValues.forEach(function (node) {
        const target = Number(node.getAttribute("data-count-to") || "0");
        const suffix = String(node.getAttribute("data-suffix") || "");
        node.textContent = String(target) + suffix;
      });
      return;
    }

    el.statValues.forEach(function (node) {
      const suffix = String(node.getAttribute("data-suffix") || "");
      node.textContent = "0" + suffix;
    });

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const node = entry.target;
          const target = Number(node.getAttribute("data-count-to") || "0");
          const suffix = String(node.getAttribute("data-suffix") || "");
          animateCount(node, target, suffix, 940);
          observer.unobserve(node);
        });
      },
      { threshold: 0.5 }
    );

    el.statValues.forEach(function (node) {
      observer.observe(node);
    });
  }

  function animateCount(node, target, suffix, duration) {
    const start = performance.now();
    const from = 0;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(from + (target - from) * eased);
      node.textContent = String(value) + suffix;
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }
})();
