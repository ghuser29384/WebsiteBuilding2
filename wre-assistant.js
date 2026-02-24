/*
  Wide Reflective Equilibrium (WRE) Assistant
  ===========================================
  This client-side assistant operationalizes the wide reflective equilibrium method as an
  iterative, user-guided process of mutual adjustment among:
  1) considered judgments,
  2) candidate general principles,
  3) background theories.

  The workflow is intentionally procedural (no AI, no backend): users map relations,
  identify tensions, revise commitments, and record rationale. Coherence is treated as a
  revisable state rather than a final proof, mirroring WRE's disciplined back-and-forth
  refinement across levels of moral reasoning.
*/

(function () {
  "use strict";

  var STORAGE_KEY = "normativity-wre-assistant-session-v1";

  var state = {
    judgments: [],
    principles: [],
    theories: [],
    links: [],
    reflections: [],
    selectedSourceId: null,
    selectedTargetId: null,
    currentStep: "start",
    dragging: null,
    linkDraft: null,
  };

  var dom = {};

  var STEP_TEXT = {
    start: {
      title: "Start Deliberation",
      description:
        "Begin by clarifying which judgments you currently trust most, and which principles/theories are candidates for organizing them.",
      questions: [
        "Which of your current judgments feel most stable and least likely to change?",
        "Which principle currently seems to explain the most judgments?",
      ],
    },
    identify: {
      title: "Identify Conflicts",
      description:
        "Locate explicit or inferred tensions across judgments, principles, and theories before making revisions.",
      questions: [
        "Which judgment seems most inconsistent with your current principles?",
        "Which background theory appears to generate pressure against your favored principle?",
      ],
    },
    suggest: {
      title: "Suggest Revisions",
      description:
        "Generate candidate revisions and test whether they reduce unresolved tensions without collapsing explanatory coverage.",
      questions: [
        "Which principle might justifiably be narrowed or qualified?",
        "Which judgment might need confidence adjustment given your background theories?",
      ],
    },
    rationale: {
      title: "Record Rationale",
      description:
        "Document why you accepted certain revisions and rejected alternatives.",
      questions: [
        "What change did you make, and what was your strongest reason?",
        "What competing revision did you reject, and why?",
      ],
    },
    summary: {
      title: "Coherence Summary",
      description:
        "Review remaining tensions and decide where another cycle of mutual adjustment is most needed.",
      questions: [
        "Which unresolved tension remains most philosophically significant?",
        "What additional evidence or conceptual clarification would reduce it?",
      ],
    },
  };

  function safeTrim(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function makeId(prefix) {
    return prefix + "_" + Math.random().toString(36).slice(2, 10);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getAllItems() {
    return state.judgments.concat(state.principles, state.theories);
  }

  function getTypeFromId(itemId) {
    if (!itemId) return null;
    if (itemId.indexOf("j_") === 0) return "judgment";
    if (itemId.indexOf("p_") === 0) return "principle";
    if (itemId.indexOf("t_") === 0) return "theory";
    return null;
  }

  function getCollectionByType(type) {
    if (type === "judgment") return state.judgments;
    if (type === "principle") return state.principles;
    return state.theories;
  }

  function getItemById(itemId) {
    var items = getAllItems();
    for (var i = 0; i < items.length; i += 1) {
      if (items[i].id === itemId) {
        return items[i];
      }
    }
    return null;
  }

  function findExistingLink(fromId, toId) {
    for (var i = 0; i < state.links.length; i += 1) {
      var link = state.links[i];
      if (link.fromId === fromId && link.toId === toId) {
        return link;
      }
    }
    return null;
  }

  function defaultXForType(type, boardWidth) {
    if (type === "judgment") return Math.round(boardWidth * 0.06);
    if (type === "principle") return Math.round(boardWidth * 0.39);
    return Math.round(boardWidth * 0.72);
  }

  function getColumnBounds(type, boardWidth, cardWidth) {
    var width = boardWidth || 980;
    var card = cardWidth || 220;
    var third = width / 3;
    var gutter = 8;
    var min = gutter;
    var max = width - card - gutter;

    if (type === "judgment") {
      min = gutter;
      max = third - card - gutter;
    } else if (type === "principle") {
      min = third + gutter;
      max = third * 2 - card - gutter;
    } else if (type === "theory") {
      min = third * 2 + gutter;
      max = width - card - gutter;
    }

    if (max < min) {
      max = min;
    }

    return { min: Math.round(min), max: Math.round(max) };
  }

  function clampItemXToColumn(itemType, x, boardWidth, cardWidth) {
    var bounds = getColumnBounds(itemType, boardWidth, cardWidth);
    return Math.round(clamp(x, bounds.min, bounds.max));
  }

  function nextYForType(type) {
    var collection = getCollectionByType(type);
    return 56 + collection.length * 92;
  }

  function addItem(type, text) {
    var normalized = safeTrim(text);
    if (!normalized) return null;

    var boardWidth = dom.workspaceBoard ? dom.workspaceBoard.clientWidth : 980;
    var item = {
      id: (type === "judgment" ? "j" : type === "principle" ? "p" : "t") + "_" + makeId(""),
      type: type,
      text: normalized,
      x: defaultXForType(type, boardWidth),
      y: nextYForType(type),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    getCollectionByType(type).push(item);
    serializeSession();
    renderUI();
    return item;
  }

  function addJudgment(text) {
    return addItem("judgment", text);
  }

  function addPrinciple(text) {
    return addItem("principle", text);
  }

  function addTheory(text) {
    return addItem("theory", text);
  }

  function removeItem(itemId) {
    var type = getTypeFromId(itemId);
    if (!type) return;

    var collection = getCollectionByType(type);
    for (var i = collection.length - 1; i >= 0; i -= 1) {
      if (collection[i].id === itemId) {
        collection.splice(i, 1);
      }
    }

    for (var j = state.links.length - 1; j >= 0; j -= 1) {
      if (state.links[j].fromId === itemId || state.links[j].toId === itemId) {
        state.links.splice(j, 1);
      }
    }

    if (state.selectedSourceId === itemId) state.selectedSourceId = null;
    if (state.selectedTargetId === itemId) state.selectedTargetId = null;

    serializeSession();
    renderUI();
  }

  function editItem(itemId) {
    var item = getItemById(itemId);
    if (!item) return;

    var nextText = window.prompt("Revise text", item.text);
    if (nextText === null) return;

    var normalized = safeTrim(nextText);
    if (!normalized) return;

    item.text = normalized;
    item.updatedAt = new Date().toISOString();
    serializeSession();
    renderUI();
  }

  function createOrUpdateLink() {
    var fromId = state.selectedSourceId;
    var toId = state.selectedTargetId;
    var relation = dom.relationType ? dom.relationType.value : "support";

    if (!fromId || !toId || fromId === toId) {
      return;
    }

    var existing = findExistingLink(fromId, toId);
    if (existing) {
      existing.relation = relation;
      existing.resolved = relation !== "conflict";
      existing.updatedAt = new Date().toISOString();
    } else {
      state.links.push({
        id: "l_" + makeId(""),
        fromId: fromId,
        toId: toId,
        relation: relation,
        resolved: relation !== "conflict",
        createdAt: new Date().toISOString(),
      });
    }

    serializeSession();
    renderUI();
  }

  function createOrUpdateLinkByIds(fromId, toId) {
    if (!fromId || !toId || fromId === toId) {
      return false;
    }
    state.selectedSourceId = fromId;
    state.selectedTargetId = toId;
    createOrUpdateLink();
    return true;
  }

  function clearSelection() {
    state.selectedSourceId = null;
    state.selectedTargetId = null;
    renderUI();
  }

  function hasConflictMarkers(textA, textB) {
    var a = textA.toLowerCase();
    var b = textB.toLowerCase();

    var positiveWords = ["permissible", "required", "should", "ought", "obligatory"];
    var negativeWords = ["impermissible", "wrong", "forbidden", "should not", "ought not", "never"];

    var aPos = false;
    var aNeg = false;
    var bPos = false;
    var bNeg = false;

    for (var i = 0; i < positiveWords.length; i += 1) {
      if (a.indexOf(positiveWords[i]) >= 0) aPos = true;
      if (b.indexOf(positiveWords[i]) >= 0) bPos = true;
    }

    for (var j = 0; j < negativeWords.length; j += 1) {
      if (a.indexOf(negativeWords[j]) >= 0) aNeg = true;
      if (b.indexOf(negativeWords[j]) >= 0) bNeg = true;
    }

    if ((aPos && bNeg) || (aNeg && bPos)) {
      return true;
    }

    var absoluteA = a.indexOf("always") >= 0 || a.indexOf("never") >= 0;
    var exceptionB = b.indexOf("unless") >= 0 || b.indexOf("except") >= 0;
    var absoluteB = b.indexOf("always") >= 0 || b.indexOf("never") >= 0;
    var exceptionA = a.indexOf("unless") >= 0 || a.indexOf("except") >= 0;

    return (absoluteA && exceptionB) || (absoluteB && exceptionA);
  }

  function hasAnyLinkBetween(idA, idB) {
    for (var i = 0; i < state.links.length; i += 1) {
      var link = state.links[i];
      if ((link.fromId === idA && link.toId === idB) || (link.fromId === idB && link.toId === idA)) {
        return true;
      }
    }
    return false;
  }

  function findConflicts() {
    var conflicts = [];

    for (var i = 0; i < state.links.length; i += 1) {
      var link = state.links[i];
      if (link.relation === "conflict" && !link.resolved) {
        conflicts.push({
          id: link.id,
          fromId: link.fromId,
          toId: link.toId,
          reason: "Explicit conflict relation not yet resolved.",
          derived: false,
        });
      }
    }

    var items = getAllItems();
    for (var a = 0; a < items.length; a += 1) {
      for (var b = a + 1; b < items.length; b += 1) {
        var left = items[a];
        var right = items[b];

        if (hasAnyLinkBetween(left.id, right.id)) {
          continue;
        }

        if (hasConflictMarkers(left.text, right.text)) {
          conflicts.push({
            id: "heur_" + left.id + "_" + right.id,
            fromId: left.id,
            toId: right.id,
            reason: "Potential conceptual tension inferred from opposing modal or normative language.",
            derived: true,
          });
        }
      }
    }

    return conflicts;
  }

  function countSupportiveLinks() {
    var count = 0;
    for (var i = 0; i < state.links.length; i += 1) {
      if (state.links[i].relation === "support") {
        count += 1;
      }
    }
    return count;
  }

  function suggestNextStep() {
    var conflicts = findConflicts();
    var supportCount = countSupportiveLinks();
    var itemsCount = getAllItems().length;
    var prompts = [];

    if (conflicts.length > 0) {
      var first = conflicts[0];
      var firstSource = getItemById(first.fromId);
      var firstTarget = getItemById(first.toId);
      var sourceText = firstSource ? firstSource.text : first.fromId;
      var targetText = firstTarget ? firstTarget.text : first.toId;

      prompts.push("Consider whether this principle adequately accounts for these judgments.");
      prompts.push("Could one claim be narrowed in scope rather than rejected outright?");
      prompts.push("Target tension: '" + sourceText + "' versus '" + targetText + "'.");
      return prompts;
    }

    if (itemsCount > 0 && supportCount === 0) {
      prompts.push("Map at least one explicit support relation to test explanatory fit.");
      prompts.push("Ask which background theory best explains why your principle should hold.");
      prompts.push("Check whether each judgment is anchored by at least one principle or theory.");
      return prompts;
    }

    prompts.push("Current map is relatively coherent; test robustness with harder counterexamples.");
    prompts.push("Revisit whether any background theory is over-assumed and should be justified explicitly.");
    prompts.push("Record rationale for why unresolved tensions are acceptable or still pending.");
    return prompts;
  }

  function relationColor(relation) {
    if (relation === "support") return "#2c8d57";
    if (relation === "conflict") return "#bf3b46";
    return "#8a94a6";
  }

  function ensureSvgDefs(svg) {
    var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

    function addMarker(id, color) {
      var marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
      marker.setAttribute("id", id);
      marker.setAttribute("markerWidth", "8");
      marker.setAttribute("markerHeight", "8");
      marker.setAttribute("refX", "7");
      marker.setAttribute("refY", "4");
      marker.setAttribute("orient", "auto");
      marker.setAttribute("markerUnits", "strokeWidth");

      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M0,0 L8,4 L0,8 z");
      path.setAttribute("fill", color);
      marker.appendChild(path);
      defs.appendChild(marker);
    }

    addMarker("arrow-support", "#2c8d57");
    addMarker("arrow-conflict", "#bf3b46");
    addMarker("arrow-neutral", "#8a94a6");

    svg.appendChild(defs);
  }

  function getCardCenter(itemId) {
    var card = dom.cardLayer ? dom.cardLayer.querySelector('[data-card-id="' + itemId + '"]') : null;
    if (!card || !dom.workspaceBoard) {
      return null;
    }

    var boardRect = dom.workspaceBoard.getBoundingClientRect();
    var cardRect = card.getBoundingClientRect();

    return {
      x: cardRect.left - boardRect.left + cardRect.width / 2,
      y: cardRect.top - boardRect.top + cardRect.height / 2,
    };
  }

  function buildCurvePath(source, target) {
    var dx = target.x - source.x;
    var controlOffset = Math.max(26, Math.min(130, Math.abs(dx) * 0.35));
    var c1x = source.x + controlOffset;
    var c2x = target.x - controlOffset;
    return (
      "M" + source.x + "," + source.y +
      " C" + c1x + "," + source.y +
      " " + c2x + "," + target.y +
      " " + target.x + "," + target.y
    );
  }

  function renderConnections() {
    if (!dom.connectionLayer || !dom.workspaceBoard) {
      return;
    }

    var width = dom.workspaceBoard.clientWidth;
    var height = dom.workspaceBoard.clientHeight;

    dom.connectionLayer.innerHTML = "";
    dom.connectionLayer.setAttribute("viewBox", "0 0 " + width + " " + height);
    dom.connectionLayer.setAttribute("width", String(width));
    dom.connectionLayer.setAttribute("height", String(height));

    ensureSvgDefs(dom.connectionLayer);

    for (var i = 0; i < state.links.length; i += 1) {
      var link = state.links[i];
      var source = getCardCenter(link.fromId);
      var target = getCardCenter(link.toId);
      if (!source || !target) continue;

      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", buildCurvePath(source, target));
      path.setAttribute("class", "wre-link-path wre-link-" + link.relation + (link.resolved ? " wre-link-resolved" : ""));
      path.setAttribute("stroke", relationColor(link.relation));
      path.setAttribute("marker-end", "url(#arrow-" + link.relation + ")");
      dom.connectionLayer.appendChild(path);
    }

    if (state.linkDraft) {
      var draftSource = getCardCenter(state.linkDraft.fromId);
      if (draftSource) {
        var draftTarget = {
          x: clamp(state.linkDraft.toX, 0, width),
          y: clamp(state.linkDraft.toY, 0, height),
        };
        var draftPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        draftPath.setAttribute("d", buildCurvePath(draftSource, draftTarget));
        draftPath.setAttribute("class", "wre-link-path wre-link-draft");
        draftPath.setAttribute("marker-end", "url(#arrow-neutral)");
        dom.connectionLayer.appendChild(draftPath);
      }
    }
  }

  function renderCards() {
    if (!dom.cardLayer || !dom.workspaceBoard) {
      return;
    }

    dom.cardLayer.innerHTML = "";

    var items = getAllItems();
    var boardWidth = dom.workspaceBoard.clientWidth || 980;
    var boardHeight = dom.workspaceBoard.clientHeight || 560;
    for (var i = 0; i < items.length; i += 1) {
      var item = items[i];
      item.x = clampItemXToColumn(item.type, item.x, boardWidth, 220);
      item.y = Math.round(clamp(item.y, 16, Math.max(16, boardHeight - 95)));

      var card = document.createElement("article");
      card.className = "wre-card wre-card-" + item.type;
      if (state.selectedSourceId === item.id) {
        card.classList.add("wre-card-source");
      }
      if (state.selectedTargetId === item.id) {
        card.classList.add("wre-card-target");
      }
      card.setAttribute("data-card-id", item.id);
      card.style.left = item.x + "px";
      card.style.top = item.y + "px";

      var top = document.createElement("div");
      top.className = "wre-card-top";

      var typeLabel = document.createElement("span");
      typeLabel.className = "wre-card-type";
      typeLabel.textContent = item.type;

      var actions = document.createElement("div");
      actions.className = "wre-card-actions";

      var sourceBtn = document.createElement("button");
      sourceBtn.type = "button";
      sourceBtn.textContent = "Source";
      sourceBtn.addEventListener("click", makeSelectSourceHandler(item.id));

      var targetBtn = document.createElement("button");
      targetBtn.type = "button";
      targetBtn.textContent = "Target";
      targetBtn.addEventListener("click", makeSelectTargetHandler(item.id));

      var editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", makeEditHandler(item.id));

      var deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", makeDeleteHandler(item.id));

      var connectHandle = document.createElement("button");
      connectHandle.type = "button";
      connectHandle.className = "wre-link-handle";
      connectHandle.textContent = "Link";
      connectHandle.setAttribute("title", "Drag to another card to create a relation");
      connectHandle.setAttribute("aria-label", "Drag to another card to create a relation");
      connectHandle.addEventListener("pointerdown", makeLinkDragStartHandler(item.id));

      actions.appendChild(sourceBtn);
      actions.appendChild(targetBtn);
      actions.appendChild(connectHandle);
      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      top.appendChild(typeLabel);
      top.appendChild(actions);

      var text = document.createElement("p");
      text.className = "wre-card-text";
      text.textContent = item.text;

      card.appendChild(top);
      card.appendChild(text);
      dom.cardLayer.appendChild(card);

      attachDragHandlers(card, item.id);
    }
  }

  function renderUnresolvedTensions() {
    if (!dom.unresolvedList) return;

    dom.unresolvedList.innerHTML = "";
    var conflicts = findConflicts();

    if (conflicts.length === 0) {
      var none = document.createElement("li");
      none.textContent = "No unresolved tensions currently detected.";
      dom.unresolvedList.appendChild(none);
      return;
    }

    for (var i = 0; i < conflicts.length; i += 1) {
      var conflict = conflicts[i];
      var from = getItemById(conflict.fromId);
      var to = getItemById(conflict.toId);
      var li = document.createElement("li");
      li.className = "wre-conflict-item" + (conflict.derived ? " heuristic" : "");

      var relationText = (from ? from.text : conflict.fromId) + " ↔ " + (to ? to.text : conflict.toId);
      var info = document.createElement("div");
      info.textContent = relationText;

      var reason = document.createElement("div");
      reason.textContent = conflict.reason;
      reason.style.marginTop = "0.2rem";
      reason.style.color = "#5c677f";

      li.appendChild(info);
      li.appendChild(reason);

      if (!conflict.derived) {
        var toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "ghost";
        toggleBtn.style.marginTop = "0.35rem";
        toggleBtn.textContent = "Mark Resolved";
        toggleBtn.addEventListener("click", makeResolveHandler(conflict.id));
        li.appendChild(toggleBtn);
      }

      dom.unresolvedList.appendChild(li);
    }
  }

  function buildNarrative(conflicts, supportiveCount) {
    if (conflicts.length === 0 && supportiveCount === 0) {
      return "No links yet. Add support/conflict relations to begin coherence tracking.";
    }

    if (conflicts.length === 0) {
      return (
        "Current map shows " + supportiveCount +
        " supportive links and no unresolved conflicts. Next step: probe robustness with harder counterexamples."
      );
    }

    var first = conflicts[0];
    var from = getItemById(first.fromId);
    var to = getItemById(first.toId);
    var left = from ? from.text : first.fromId;
    var right = to ? to.text : first.toId;

    return (
      "There are " + conflicts.length + " unresolved tensions and " + supportiveCount +
      " supportive links. A key inconsistency appears between '" + left +
      "' and '" + right + "'. Consider scope refinement or background-theory revision."
    );
  }

  function renderSummaryPanel() {
    if (!dom.coherenceMetrics || !dom.coherenceNarrative) {
      return;
    }

    var conflicts = findConflicts();
    var supportiveCount = countSupportiveLinks();
    var neutralCount = 0;
    for (var i = 0; i < state.links.length; i += 1) {
      if (state.links[i].relation === "neutral") {
        neutralCount += 1;
      }
    }

    dom.coherenceMetrics.innerHTML = "";

    var p1 = document.createElement("p");
    p1.innerHTML = "<strong>Unresolved conflicts:</strong> " + conflicts.length;

    var p2 = document.createElement("p");
    p2.innerHTML = "<strong>Supportive links:</strong> " + supportiveCount;

    var p3 = document.createElement("p");
    p3.innerHTML = "<strong>Neutral links:</strong> " + neutralCount;

    dom.coherenceMetrics.appendChild(p1);
    dom.coherenceMetrics.appendChild(p2);
    dom.coherenceMetrics.appendChild(p3);

    dom.coherenceNarrative.textContent = buildNarrative(conflicts, supportiveCount);
  }

  function renderStepGuidance() {
    if (!dom.stepGuidance) return;

    var key = state.currentStep;
    var step = STEP_TEXT[key] || STEP_TEXT.start;
    var customPrompts = key === "suggest" ? suggestNextStep() : step.questions;

    dom.stepGuidance.innerHTML = "";

    var title = document.createElement("h3");
    title.textContent = step.title;

    var desc = document.createElement("p");
    desc.textContent = step.description;

    var list = document.createElement("ul");
    for (var i = 0; i < customPrompts.length; i += 1) {
      var li = document.createElement("li");
      li.textContent = customPrompts[i];
      list.appendChild(li);
    }

    dom.stepGuidance.appendChild(title);
    dom.stepGuidance.appendChild(desc);
    dom.stepGuidance.appendChild(list);
  }

  function renderReflectionLog() {
    if (!dom.responseLog) return;

    dom.responseLog.innerHTML = "";

    if (state.reflections.length === 0) {
      var none = document.createElement("li");
      none.textContent = "No rationale entries yet.";
      dom.responseLog.appendChild(none);
      return;
    }

    for (var i = state.reflections.length - 1; i >= 0; i -= 1) {
      var entry = state.reflections[i];
      var li = document.createElement("li");

      var title = document.createElement("strong");
      title.textContent = entry.stepTitle;

      var body = document.createElement("p");
      body.textContent = entry.text;
      body.style.margin = "0.25rem 0 0";

      var meta = document.createElement("p");
      meta.textContent = new Date(entry.timestamp).toLocaleString();
      meta.style.margin = "0.2rem 0 0";
      meta.style.fontSize = "0.75rem";
      meta.style.color = "#6c768a";

      li.appendChild(title);
      li.appendChild(body);
      li.appendChild(meta);
      dom.responseLog.appendChild(li);
    }
  }

  function updateLinkSelectionLabels() {
    if (!dom.selectedSourceLabel || !dom.selectedTargetLabel) return;

    var source = getItemById(state.selectedSourceId);
    var target = getItemById(state.selectedTargetId);

    dom.selectedSourceLabel.textContent = source ? source.id : "None";
    dom.selectedTargetLabel.textContent = target ? target.id : "None";
  }

  function renderUI() {
    renderCards();
    renderConnections();
    renderUnresolvedTensions();
    renderSummaryPanel();
    renderStepGuidance();
    renderReflectionLog();
    updateLinkSelectionLabels();
  }

  function serializeSession() {
    var payload = {
      judgments: state.judgments,
      principles: state.principles,
      theories: state.theories,
      links: state.links,
      reflections: state.reflections,
      currentStep: state.currentStep,
      savedAt: new Date().toISOString(),
    };

    var serialized = JSON.stringify(payload);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    return serialized;
  }

  function restoreSession() {
    var raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
      var parsed = JSON.parse(raw);

      state.judgments = Array.isArray(parsed.judgments) ? parsed.judgments : [];
      state.principles = Array.isArray(parsed.principles) ? parsed.principles : [];
      state.theories = Array.isArray(parsed.theories) ? parsed.theories : [];
      state.links = Array.isArray(parsed.links) ? parsed.links : [];
      state.reflections = Array.isArray(parsed.reflections) ? parsed.reflections : [];
      state.currentStep = STEP_TEXT[parsed.currentStep] ? parsed.currentStep : "start";
      state.selectedSourceId = null;
      state.selectedTargetId = null;
      state.linkDraft = null;

      renderUI();
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function setStep(stepKey) {
    if (!STEP_TEXT[stepKey]) return;
    state.currentStep = stepKey;
    renderUI();
  }

  function saveReflection() {
    if (!dom.stepResponseInput) return;
    var text = safeTrim(dom.stepResponseInput.value);
    if (!text) return;

    var stepMeta = STEP_TEXT[state.currentStep] || STEP_TEXT.start;
    state.reflections.push({
      id: "r_" + makeId(""),
      step: state.currentStep,
      stepTitle: stepMeta.title,
      text: text,
      timestamp: new Date().toISOString(),
    });

    dom.stepResponseInput.value = "";
    serializeSession();
    renderReflectionLog();
  }

  function makeResolveHandler(linkId) {
    return function () {
      for (var i = 0; i < state.links.length; i += 1) {
        if (state.links[i].id === linkId) {
          state.links[i].resolved = true;
          state.links[i].updatedAt = new Date().toISOString();
          break;
        }
      }
      serializeSession();
      renderUI();
    };
  }

  function makeSelectSourceHandler(itemId) {
    return function () {
      state.selectedSourceId = itemId;
      renderUI();
    };
  }

  function makeSelectTargetHandler(itemId) {
    return function () {
      state.selectedTargetId = itemId;
      renderUI();
    };
  }

  function makeEditHandler(itemId) {
    return function () {
      editItem(itemId);
    };
  }

  function makeDeleteHandler(itemId) {
    return function () {
      removeItem(itemId);
    };
  }

  function makeLinkDragStartHandler(itemId) {
    return function (event) {
      if (!dom.workspaceBoard) return;
      event.preventDefault();
      event.stopPropagation();

      var boardRect = dom.workspaceBoard.getBoundingClientRect();
      state.linkDraft = {
        fromId: itemId,
        toX: event.clientX - boardRect.left,
        toY: event.clientY - boardRect.top,
      };
      state.selectedSourceId = itemId;
      updateLinkSelectionLabels();
      renderConnections();
    };
  }

  function attachDragHandlers(card, itemId) {
    card.addEventListener("pointerdown", function (event) {
      if (event.target && event.target.closest("button")) {
        return;
      }

      var item = getItemById(itemId);
      if (!item || !dom.workspaceBoard) return;

      var boardRect = dom.workspaceBoard.getBoundingClientRect();
      state.dragging = {
        id: itemId,
        offsetX: event.clientX - boardRect.left - item.x,
        offsetY: event.clientY - boardRect.top - item.y,
      };

      card.classList.add("dragging");
      if (card.setPointerCapture) {
        card.setPointerCapture(event.pointerId);
      }
    });

    card.addEventListener("pointerup", function (event) {
      if (card.releasePointerCapture) {
        try {
          card.releasePointerCapture(event.pointerId);
        } catch (e) {
          /* no-op */
        }
      }
      card.classList.remove("dragging");
    });
  }

  function handlePointerMove(event) {
    if (!dom.workspaceBoard) return;
    var boardRect = dom.workspaceBoard.getBoundingClientRect();

    if (state.linkDraft) {
      state.linkDraft.toX = clamp(event.clientX - boardRect.left, 0, boardRect.width);
      state.linkDraft.toY = clamp(event.clientY - boardRect.top, 0, boardRect.height);
      renderConnections();
      return;
    }

    if (!state.dragging) return;

    var item = getItemById(state.dragging.id);
    if (!item) return;

    var card = dom.cardLayer ? dom.cardLayer.querySelector('[data-card-id="' + item.id + '"]') : null;
    var cardWidth = card ? card.offsetWidth : 220;
    var maxY = Math.max(16, boardRect.height - 95);

    item.x = clampItemXToColumn(
      item.type,
      event.clientX - boardRect.left - state.dragging.offsetX,
      boardRect.width,
      cardWidth
    );
    item.y = Math.round(clamp(event.clientY - boardRect.top - state.dragging.offsetY, 16, maxY));
    item.updatedAt = new Date().toISOString();

    if (card) {
      card.style.left = item.x + "px";
      card.style.top = item.y + "px";
    }

    renderConnections();
  }

  function finalizeLinkDraft(event) {
    if (!state.linkDraft) return false;

    var fromId = state.linkDraft.fromId;
    var targetEl = null;
    if (document.elementFromPoint) {
      targetEl = document.elementFromPoint(event.clientX, event.clientY);
    } else {
      targetEl = event.target || null;
    }

    var targetCard = targetEl && targetEl.closest ? targetEl.closest("[data-card-id]") : null;
    var targetId = targetCard ? targetCard.getAttribute("data-card-id") : null;

    state.linkDraft = null;
    if (!targetId || targetId === fromId) {
      renderConnections();
      return false;
    }

    return createOrUpdateLinkByIds(fromId, targetId);
  }

  function handlePointerUp(event) {
    if (state.linkDraft) {
      finalizeLinkDraft(event);
      return;
    }

    if (!state.dragging) return;
    state.dragging = null;
    serializeSession();
    renderUI();
  }

  function bindEvents() {
    dom.addJudgmentBtn.addEventListener("click", function () {
      addJudgment(dom.judgmentInput.value);
      dom.judgmentInput.value = "";
      dom.judgmentInput.focus();
    });

    dom.addPrincipleBtn.addEventListener("click", function () {
      addPrinciple(dom.principleInput.value);
      dom.principleInput.value = "";
      dom.principleInput.focus();
    });

    dom.addTheoryBtn.addEventListener("click", function () {
      addTheory(dom.theoryInput.value);
      dom.theoryInput.value = "";
      dom.theoryInput.focus();
    });

    dom.createLinkBtn.addEventListener("click", createOrUpdateLink);
    dom.clearSelectionBtn.addEventListener("click", clearSelection);

    dom.startDeliberationBtn.addEventListener("click", function () {
      setStep("start");
    });

    dom.identifyConflictsBtn.addEventListener("click", function () {
      setStep("identify");
    });

    dom.suggestRevisionsBtn.addEventListener("click", function () {
      setStep("suggest");
    });

    dom.recordRationaleBtn.addEventListener("click", function () {
      setStep("rationale");
    });

    dom.showSummaryBtn.addEventListener("click", function () {
      setStep("summary");
      renderSummaryPanel();
    });

    dom.saveResponseBtn.addEventListener("click", saveReflection);
    dom.saveSessionBtn.addEventListener("click", function () {
      serializeSession();
      renderStepGuidance();
    });

    dom.restoreSessionBtn.addEventListener("click", function () {
      restoreSession();
    });

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("resize", renderUI);

    dom.judgmentInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        dom.addJudgmentBtn.click();
      }
    });

    dom.principleInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        dom.addPrincipleBtn.click();
      }
    });

    dom.theoryInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        dom.addTheoryBtn.click();
      }
    });
  }

  function cacheDom() {
    dom.judgmentInput = document.getElementById("judgment-input");
    dom.principleInput = document.getElementById("principle-input");
    dom.theoryInput = document.getElementById("theory-input");

    dom.addJudgmentBtn = document.getElementById("add-judgment-btn");
    dom.addPrincipleBtn = document.getElementById("add-principle-btn");
    dom.addTheoryBtn = document.getElementById("add-theory-btn");

    dom.workspaceBoard = document.getElementById("wre-workspace-board");
    dom.cardLayer = document.getElementById("wre-card-layer");
    dom.connectionLayer = document.getElementById("wre-connection-layer");

    dom.selectedSourceLabel = document.getElementById("selected-source-label");
    dom.selectedTargetLabel = document.getElementById("selected-target-label");
    dom.relationType = document.getElementById("relation-type");
    dom.createLinkBtn = document.getElementById("create-link-btn");
    dom.clearSelectionBtn = document.getElementById("clear-selection-btn");

    dom.unresolvedList = document.getElementById("unresolved-list");
    dom.coherenceMetrics = document.getElementById("coherence-metrics");
    dom.coherenceNarrative = document.getElementById("coherence-narrative");

    dom.startDeliberationBtn = document.getElementById("start-deliberation-btn");
    dom.identifyConflictsBtn = document.getElementById("identify-conflicts-btn");
    dom.suggestRevisionsBtn = document.getElementById("suggest-revisions-btn");
    dom.recordRationaleBtn = document.getElementById("record-rationale-btn");
    dom.showSummaryBtn = document.getElementById("show-summary-btn");

    dom.stepGuidance = document.getElementById("step-guidance");
    dom.stepResponseInput = document.getElementById("step-response-input");
    dom.saveResponseBtn = document.getElementById("save-response-btn");
    dom.saveSessionBtn = document.getElementById("save-session-btn");
    dom.restoreSessionBtn = document.getElementById("restore-session-btn");
    dom.responseLog = document.getElementById("response-log");
  }

  function init() {
    cacheDom();

    if (!dom.workspaceBoard) {
      return;
    }

    bindEvents();

    if (!restoreSession()) {
      renderUI();
    }
  }

  document.addEventListener("DOMContentLoaded", init);

  window.WREAssistant = {
    renderUI: renderUI,
    addJudgment: addJudgment,
    addPrinciple: addPrinciple,
    addTheory: addTheory,
    findConflicts: findConflicts,
    suggestNextStep: suggestNextStep,
    renderConnections: renderConnections,
    serializeSession: serializeSession,
    restoreSession: restoreSession,
  };
})();
