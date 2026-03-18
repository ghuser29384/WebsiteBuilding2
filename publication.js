(function () {
  "use strict";

  const STORAGE_KEY = "normativity-publications-v1";
  const ACTIVE_USER_KEY = "normativity-publications-active-user-v1";
  const MAX_MODEL_SIZE = 4;
  const MAX_PASSAGE_SELECTION = 800;

  const DEFAULT_USERS = ["henry", "maya", "sam", "lena", "amir"];
  const PROPOSITION_SETS = [
    {
      id: "overall-factory-farming",
      title: "Buying factory-farmed meat is morally wrong.",
      summary: "Relevant propositions below are widely cited as determinants of this overall claim.",
      relevant: [
        {
          id: "rp-animal-suffering-matters",
          title: "Animal suffering matters morally.",
        },
        {
          id: "rp-factory-farming-harm",
          title: "Factory farming causes large-scale animal suffering.",
        },
        {
          id: "rp-consumer-complicity",
          title: "Purchasers share moral responsibility for harms they fund.",
        },
      ],
    },
    {
      id: "overall-abortion-permissible",
      title: "Abortion is morally permissible in most circumstances.",
      summary: "Relevant propositions are treated as key premises in assessing permissibility.",
      relevant: [
        {
          id: "rp-fetal-personhood",
          title: "The fetus has moral status comparable to persons.",
        },
        {
          id: "rp-bodily-autonomy",
          title: "Bodily autonomy strongly limits forced use of a person's body.",
        },
        {
          id: "rp-harm-eq-killing",
          title: "Ending a potential life is morally equivalent to killing a person.",
        },
      ],
    },
    {
      id: "overall-wealth-redistribution",
      title: "People are morally required to redistribute significant wealth beyond charity.",
      summary: "Relevant propositions reflect common premises behind redistribution arguments.",
      relevant: [
        {
          id: "rp-inequality-harm",
          title: "Severe inequality causes large, avoidable suffering.",
        },
        {
          id: "rp-duty-beneficence",
          title: "People have enforceable duties of beneficence beyond voluntary charity.",
        },
        {
          id: "rp-property-not-absolute",
          title: "Property rights are not absolute when basic needs are unmet.",
        },
      ],
    },
  ];

  const PROPOSITION_INDEX = buildPropositionIndex(PROPOSITION_SETS);
  const authApi = window.NormativityAuth || null;

  let state = loadState();
  let activeUser = loadActiveUser();
  let feedMode = state.feedMode || "personal";

  const el = {
    activeHandleInput: document.getElementById("activeHandleInput"),
    setActiveUserBtn: document.getElementById("setActiveUserBtn"),
    activeUserBadge: document.getElementById("activeUserBadge"),
    knownUsersList: document.getElementById("knownUsersList"),

    articleForm: document.getElementById("articleForm"),
    articleTitle: document.getElementById("articleTitle"),
    articleBody: document.getElementById("articleBody"),
    clearArticleBtn: document.getElementById("clearArticleBtn"),
    mentionPreview: document.getElementById("mentionPreview"),
    articleStatus: document.getElementById("articleStatus"),
    propositionBoard: document.getElementById("propositionBoard"),
    articlePropositionPicker: document.getElementById("articlePropositionPicker"),

    inboxCountBadge: document.getElementById("inboxCountBadge"),
    inboxList: document.getElementById("inboxList"),

    articleFeed: document.getElementById("articleFeed"),
    feedHint: document.getElementById("feedHint"),
    insightsRange: document.getElementById("insightsRange"),
    insightCards: document.getElementById("insightCards"),
    insightTakeaways: document.getElementById("insightTakeaways"),
    insightsTrendChart: document.getElementById("insightsTrendChart"),
    insightTrendMeta: document.getElementById("insightTrendMeta"),

    termS: document.getElementById("termS"),
    termM: document.getElementById("termM"),
    termP: document.getElementById("termP"),
    majorMood: document.getElementById("majorMood"),
    majorFigure: document.getElementById("majorFigure"),
    minorMood: document.getElementById("minorMood"),
    minorFigure: document.getElementById("minorFigure"),
    conclusionMood: document.getElementById("conclusionMood"),
    conclusionFigure: document.getElementById("conclusionFigure"),
    majorSentence: document.getElementById("majorSentence"),
    minorSentence: document.getElementById("minorSentence"),
    conclusionSentence: document.getElementById("conclusionSentence"),
    checkSyllogismBtn: document.getElementById("checkSyllogismBtn"),
    insertSyllogismBtn: document.getElementById("insertSyllogismBtn"),
    syllogismResult: document.getElementById("syllogismResult"),
    syllogismCounterexample: document.getElementById("syllogismCounterexample"),
  };

  init();

  function init() {
    const authenticatedHandle = getAuthenticatedHandle();
    if (authenticatedHandle) {
      activeUser = authenticatedHandle;
      saveActiveUser(activeUser);
    }

    ensureSeedUsers();
    if (!activeUser) {
      activeUser = DEFAULT_USERS[0];
      saveActiveUser(activeUser);
    }
    ensureUser(activeUser);
    enforceAuthenticatedIdentityUi();

    bindEvents();
    updateSyllogismPreview();
    renderAll();
  }

  function bindEvents() {
    if (el.setActiveUserBtn) {
      el.setActiveUserBtn.addEventListener("click", onSetActiveUser);
    }
    if (el.activeHandleInput) {
      el.activeHandleInput.addEventListener("keydown", function (event) {
        if (event.key !== "Enter") return;
        event.preventDefault();
        onSetActiveUser();
      });
    }

    if (el.articleForm) {
      el.articleForm.addEventListener("submit", onPublishArticle);
    }
    if (el.clearArticleBtn) {
      el.clearArticleBtn.addEventListener("click", function () {
        el.articleTitle.value = "";
        el.articleBody.value = "";
        resetArticlePropositionPicker();
        updateMentionPreview();
        setArticleStatus("");
      });
    }
    if (el.articleBody) {
      el.articleBody.addEventListener("input", updateMentionPreview);
    }
    if (el.articleTitle) {
      el.articleTitle.addEventListener("input", updateMentionPreview);
    }

    if (el.inboxList) {
      el.inboxList.addEventListener("click", onInboxAction);
    }
    if (el.insightsRange) {
      el.insightsRange.addEventListener("change", renderInsights);
    }
    if (el.articleFeed) {
      el.articleFeed.addEventListener("mouseup", onArticleSelectionMouseUp);
      el.articleFeed.addEventListener("touchend", onArticleSelectionMouseUp);
      el.articleFeed.addEventListener("click", onArticleFeedAction);
    }
    if (el.propositionBoard) {
      el.propositionBoard.addEventListener("change", onPropositionBoardChange);
      el.propositionBoard.addEventListener("input", onPropositionBoardChange);
    }
    const feedButtons = document.querySelectorAll("[data-feed-mode]");
    if (feedButtons.length > 0) {
      feedButtons.forEach(function (button) {
        button.addEventListener("click", onFeedModeToggle);
      });
    }
    if (el.articlePropositionPicker) {
      el.articlePropositionPicker.addEventListener("change", onArticlePropositionToggle);
    }

    [
      el.termS,
      el.termM,
      el.termP,
      el.majorMood,
      el.majorFigure,
      el.minorMood,
      el.minorFigure,
      el.conclusionMood,
      el.conclusionFigure,
    ].forEach(function (field) {
      if (!field) return;
      field.addEventListener("input", updateSyllogismPreview);
      field.addEventListener("change", updateSyllogismPreview);
    });

    if (el.checkSyllogismBtn) {
      el.checkSyllogismBtn.addEventListener("click", onCheckSyllogism);
    }
    if (el.insertSyllogismBtn) {
      el.insertSyllogismBtn.addEventListener("click", onInsertSyllogismInDraft);
    }

    if (el.knownUsersList) {
      el.knownUsersList.addEventListener("click", function (event) {
        if (isIdentityLockedToAuth()) return;
        const button = event.target.closest("button[data-user-handle]");
        if (!button) return;
        const handle = normalizeHandle(button.getAttribute("data-user-handle"));
        if (!handle) return;
        activeUser = handle;
        saveActiveUser(activeUser);
        ensureUser(activeUser);
        renderAll();
      });
    }
  }

  function onSetActiveUser() {
    if (isIdentityLockedToAuth()) {
      setArticleStatus("Active username is tied to your signed-in account.", true);
      return;
    }
    if (!el.activeHandleInput) return;
    const next = normalizeHandle(el.activeHandleInput.value);
    if (!next) {
      setArticleStatus("Set a valid username (letters, numbers, underscore).", true);
      return;
    }
    activeUser = next;
    saveActiveUser(activeUser);
    ensureUser(activeUser);
    saveState();
    setArticleStatus("Active user switched to @" + activeUser + ".", false);
    renderAll();
  }

  function onPublishArticle(event) {
    event.preventDefault();
    syncActiveUserFromAuth();
    ensureUser(activeUser);

    const title = (el.articleTitle && el.articleTitle.value ? el.articleTitle.value : "").trim();
    const body = (el.articleBody && el.articleBody.value ? el.articleBody.value : "").trim();
    const positions = collectArticlePositions();

    if (!title || !body) {
      setArticleStatus("Title and body are required.", true);
      return;
    }
    if (!positions.length) {
      setArticleStatus("Select at least one relevant proposition and stance.", true);
      return;
    }

    const mentions = extractMentions(title + "\n" + body);
    const article = {
      id: makeId("art"),
      author: activeUser,
      title: title,
      body: body,
      mentions: mentions,
      positions: positions,
      createdAt: new Date().toISOString(),
    };

    state.articles.unshift(article);

    const uniqueMentions = Array.from(new Set(mentions));
    let notificationCount = 0;
    uniqueMentions.forEach(function (handle) {
      if (handle === activeUser) return;
      ensureUser(handle);
      state.notifications.unshift({
        id: makeId("noti"),
        type: "mention",
        to: handle,
        from: activeUser,
        articleId: article.id,
        articleTitle: article.title,
        excerpt: body.slice(0, 180),
        read: false,
        createdAt: new Date().toISOString(),
      });
      notificationCount += 1;
    });

    saveState();

    el.articleTitle.value = "";
    el.articleBody.value = "";
    resetArticlePropositionPicker();
    updateMentionPreview();

    const status =
      notificationCount > 0
        ? "Article published. " + notificationCount + " inbox notification(s) delivered."
        : "Article published. No user was mentioned.";
    setArticleStatus(status, false);

    renderAll();
  }

  function onFeedModeToggle(event) {
    const button = event.target.closest("[data-feed-mode]");
    if (!button) return;
    const nextMode = String(button.getAttribute("data-feed-mode") || "");
    if (!nextMode || nextMode === feedMode) return;
    feedMode = nextMode;
    state.feedMode = feedMode;
    saveState();
    renderFeed();
  }

  function onArticlePropositionToggle(event) {
    const row = event.target.closest("[data-article-prop]");
    if (!row) return;
    const checkbox = row.querySelector('input[type="checkbox"]');
    const stanceSelect = row.querySelector("select");
    if (!checkbox || !stanceSelect) return;
    stanceSelect.disabled = !checkbox.checked;
  }

  function onPropositionBoardChange(event) {
    const row = event.target.closest("[data-prop-id]");
    if (!row) return;
    if (!activeUser) return;

    const propId = String(row.getAttribute("data-prop-id") || "");
    if (!propId) return;
    const userViews = getUserViewMap(activeUser);
    const current = userViews[propId] || { belief: "", confidence: 50 };
    let changed = false;

    if (event.target.matches("[data-prop-belief]")) {
      const belief = String(event.target.value || "");
      current.belief = belief;
      if (!belief) {
        delete userViews[propId];
      } else {
        if (!Number.isFinite(Number(current.confidence))) {
          current.confidence = 50;
        }
        userViews[propId] = current;
      }
      changed = true;
    }

    if (event.target.matches("[data-prop-confidence]")) {
      current.confidence = clamp(Number(event.target.value), 1, 100);
      userViews[propId] = current;
      changed = true;
    }

    if (changed) {
      saveState();
      renderPropositionBoard();
      renderFeed();
    }
  }

  function onInboxAction(event) {
    const readBtn = event.target.closest("button[data-notification-read]");
    if (readBtn) {
      const notificationId = String(readBtn.getAttribute("data-notification-read") || "");
      markNotificationRead(notificationId);
      return;
    }

    const jumpBtn = event.target.closest("button[data-jump-article-id]");
    if (jumpBtn) {
      const articleId = String(jumpBtn.getAttribute("data-jump-article-id") || "");
      if (!articleId) return;
      const card = document.getElementById("article-" + articleId);
      if (!card) return;
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.classList.add("article-card-highlight");
      window.setTimeout(function () {
        card.classList.remove("article-card-highlight");
      }, 1200);
    }
  }

  function onArticleSelectionMouseUp(event) {
    const body = event.target && event.target.closest ? event.target.closest(".article-body") : null;
    if (!body) return;

    window.setTimeout(function () {
      captureSelectedPassage(body);
    }, 0);
  }

  function captureSelectedPassage(bodyEl) {
    const selection = window.getSelection ? window.getSelection() : null;
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    if (!bodyEl.contains(range.startContainer) || !bodyEl.contains(range.endContainer)) return;

    const articleId = String(bodyEl.getAttribute("data-article-id") || "");
    if (!articleId) return;

    const offsets = getSelectionOffsets(bodyEl, range);
    if (!offsets || offsets.end <= offsets.start) return;

    const selectedText = range.toString().trim();
    if (!selectedText) return;
    if (selectedText.length > MAX_PASSAGE_SELECTION) {
      setArticleStatus("Passage selection is too long. Select up to 800 characters.", true);
      return;
    }

    openAnnotationEditor(articleId, {
      start: offsets.start,
      end: offsets.end,
      text: selectedText,
    });
  }

  function onArticleFeedAction(event) {
    const saveBtn = event.target.closest("button[data-annotation-save]");
    if (saveBtn) {
      const articleId = String(saveBtn.getAttribute("data-annotation-save") || "");
      if (!articleId) return;
      saveAnnotationFromEditor(articleId);
      return;
    }

    const cancelBtn = event.target.closest("button[data-annotation-cancel]");
    if (cancelBtn) {
      const articleId = String(cancelBtn.getAttribute("data-annotation-cancel") || "");
      if (!articleId) return;
      dismissAnnotationEditor(articleId);
      return;
    }

    const replyStartBtn = event.target.closest("button[data-reply-start]");
    if (replyStartBtn) {
      const annotationId = String(replyStartBtn.getAttribute("data-reply-start") || "");
      if (!annotationId) return;
      openReplyEditor(annotationId);
      return;
    }

    const replyCancelBtn = event.target.closest("button[data-reply-cancel]");
    if (replyCancelBtn) {
      const annotationId = String(replyCancelBtn.getAttribute("data-reply-cancel") || "");
      if (!annotationId) return;
      closeReplyEditor(annotationId);
      return;
    }

    const replySaveBtn = event.target.closest("button[data-reply-save]");
    if (replySaveBtn) {
      const annotationId = String(replySaveBtn.getAttribute("data-reply-save") || "");
      if (!annotationId) return;
      saveReplyFromEditor(annotationId);
      return;
    }
  }

  function saveAnnotationFromEditor(articleId) {
    syncActiveUserFromAuth();
    if (!el.articleFeed) return;
    const editor = el.articleFeed.querySelector('[data-annotation-editor="' + cssEscape(articleId) + '"]');
    if (!editor) return;

    const commentInput = editor.querySelector('[data-annotation-comment="' + cssEscape(articleId) + '"]');
    const visibilityInput = editor.querySelector('[data-annotation-visibility="' + cssEscape(articleId) + '"]');
    const statusEl = editor.querySelector('[data-annotation-status="' + cssEscape(articleId) + '"]');

    const start = Number(editor.getAttribute("data-selection-start"));
    const end = Number(editor.getAttribute("data-selection-end"));
    const selectedText = String(editor.getAttribute("data-selection-text") || "").trim();
    const comment = commentInput && commentInput.value ? String(commentInput.value).trim() : "";
    const visibilityRaw = visibilityInput && visibilityInput.value ? String(visibilityInput.value) : "public";
    const visibility = visibilityRaw === "author" ? "author" : "public";

    if (!selectedText || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      if (statusEl) {
        statusEl.textContent = "Select a specific passage first, then post your comment.";
      }
      return;
    }

    if (!comment) {
      if (statusEl) {
        statusEl.textContent = "Write a comment before posting.";
      }
      return;
    }

    const article = findArticleById(articleId);
    if (!article) return;

    const annotation = {
      id: makeId("anno"),
      articleId: articleId,
      articleAuthor: article.author,
      author: activeUser,
      selectedText: selectedText,
      rangeStart: Math.max(0, Math.floor(start)),
      rangeEnd: Math.max(0, Math.floor(end)),
      comment: comment,
      visibility: visibility,
      createdAt: new Date().toISOString(),
    };

    state.annotations.unshift(annotation);
    if (article.author !== activeUser) {
      ensureUser(article.author);
      state.notifications.unshift(
        createNotification({
          type: "comment",
          to: article.author,
          from: activeUser,
          articleId: article.id,
          articleTitle: article.title,
          excerpt: selectedText,
          annotationId: annotation.id,
        })
      );
    }
    saveState();

    const selection = window.getSelection ? window.getSelection() : null;
    if (selection && typeof selection.removeAllRanges === "function") {
      selection.removeAllRanges();
    }

    setArticleStatus("Passage comment posted.", false);
    renderAll();
  }

  function dismissAnnotationEditor(articleId) {
    if (!el.articleFeed) return;
    const editor = el.articleFeed.querySelector('[data-annotation-editor="' + cssEscape(articleId) + '"]');
    if (!editor) return;

    editor.hidden = true;
    editor.removeAttribute("data-selection-start");
    editor.removeAttribute("data-selection-end");
    editor.removeAttribute("data-selection-text");

    const statusEl = editor.querySelector('[data-annotation-status="' + cssEscape(articleId) + '"]');
    const selectedEl = editor.querySelector('[data-annotation-selected="' + cssEscape(articleId) + '"]');
    const commentInput = editor.querySelector('[data-annotation-comment="' + cssEscape(articleId) + '"]');
    const visibilityInput = editor.querySelector('[data-annotation-visibility="' + cssEscape(articleId) + '"]');

    if (statusEl) statusEl.textContent = "";
    if (selectedEl) selectedEl.textContent = "";
    if (commentInput) commentInput.value = "";
    if (visibilityInput) visibilityInput.value = "public";
  }

  function openAnnotationEditor(articleId, selectionData) {
    if (!el.articleFeed) return;

    const editors = el.articleFeed.querySelectorAll("[data-annotation-editor]");
    editors.forEach(function (node) {
      if (node.getAttribute("data-annotation-editor") !== articleId) {
        node.hidden = true;
      }
    });

    const editor = el.articleFeed.querySelector('[data-annotation-editor="' + cssEscape(articleId) + '"]');
    if (!editor) return;

    const selectedEl = editor.querySelector('[data-annotation-selected="' + cssEscape(articleId) + '"]');
    const commentInput = editor.querySelector('[data-annotation-comment="' + cssEscape(articleId) + '"]');
    const statusEl = editor.querySelector('[data-annotation-status="' + cssEscape(articleId) + '"]');

    editor.hidden = false;
    editor.setAttribute("data-selection-start", String(selectionData.start));
    editor.setAttribute("data-selection-end", String(selectionData.end));
    editor.setAttribute("data-selection-text", selectionData.text);

    if (selectedEl) {
      selectedEl.textContent = '"' + trimPreview(selectionData.text, 260) + '"';
    }
    if (statusEl) {
      statusEl.textContent = "";
    }
    if (commentInput) {
      commentInput.value = "";
      commentInput.focus();
    }
  }

  function openReplyEditor(annotationId) {
    if (!el.articleFeed) return;
    const editor = el.articleFeed.querySelector('[data-reply-editor="' + cssEscape(annotationId) + '"]');
    if (!editor) return;
    editor.hidden = false;

    const textarea = editor.querySelector('[data-reply-input="' + cssEscape(annotationId) + '"]');
    const status = editor.querySelector('[data-reply-status="' + cssEscape(annotationId) + '"]');
    const visibility = editor.querySelector('[data-reply-visibility="' + cssEscape(annotationId) + '"]');
    if (status) status.textContent = "";
    if (visibility) visibility.value = "public";
    if (textarea) {
      textarea.value = "";
      textarea.focus();
    }
  }

  function closeReplyEditor(annotationId) {
    if (!el.articleFeed) return;
    const editor = el.articleFeed.querySelector('[data-reply-editor="' + cssEscape(annotationId) + '"]');
    if (!editor) return;
    editor.hidden = true;

    const textarea = editor.querySelector('[data-reply-input="' + cssEscape(annotationId) + '"]');
    const status = editor.querySelector('[data-reply-status="' + cssEscape(annotationId) + '"]');
    if (textarea) textarea.value = "";
    if (status) status.textContent = "";
  }

  function saveReplyFromEditor(annotationId) {
    syncActiveUserFromAuth();
    if (!el.articleFeed) return;
    const editor = el.articleFeed.querySelector('[data-reply-editor="' + cssEscape(annotationId) + '"]');
    if (!editor) return;

    const input = editor.querySelector('[data-reply-input="' + cssEscape(annotationId) + '"]');
    const status = editor.querySelector('[data-reply-status="' + cssEscape(annotationId) + '"]');
    const visibilitySelect = editor.querySelector('[data-reply-visibility="' + cssEscape(annotationId) + '"]');
    const replyText = input && input.value ? String(input.value).trim() : "";
    const visibility = visibilitySelect && visibilitySelect.value === "author" ? "author" : "public";

    if (!replyText) {
      if (status) status.textContent = "Write a reply before posting.";
      return;
    }

    const annotation = findAnnotationById(annotationId);
    if (!annotation) {
      if (status) status.textContent = "Comment reference not found.";
      return;
    }
    const article = findArticleById(annotation.articleId);
    if (!article) {
      if (status) status.textContent = "Article reference not found.";
      return;
    }

    const reply = {
      id: makeId("rpl"),
      annotationId: annotationId,
      articleId: annotation.articleId,
      articleTitle: article.title,
      articleAuthor: article.author,
      targetAuthor: annotation.author,
      author: activeUser,
      text: replyText,
      visibility: visibility,
      createdAt: new Date().toISOString(),
    };
    state.annotationReplies.unshift(reply);

    if (annotation.author !== activeUser) {
      ensureUser(annotation.author);
      state.notifications.unshift(
        createNotification({
          type: "reply",
          to: annotation.author,
          from: activeUser,
          articleId: annotation.articleId,
          articleTitle: article.title,
          excerpt: replyText,
          annotationId: annotation.id,
          replyId: reply.id,
        })
      );
    }

    saveState();
    setArticleStatus("Reply posted.", false);
    renderAll();
  }

  function getSelectionOffsets(container, range) {
    try {
      const startRange = document.createRange();
      startRange.selectNodeContents(container);
      startRange.setEnd(range.startContainer, range.startOffset);

      const endRange = document.createRange();
      endRange.selectNodeContents(container);
      endRange.setEnd(range.endContainer, range.endOffset);

      const start = startRange.toString().length;
      const end = endRange.toString().length;
      return start <= end ? { start: start, end: end } : { start: end, end: start };
    } catch (_error) {
      return null;
    }
  }

  function markNotificationRead(notificationId) {
    if (!notificationId) return;
    const notification = state.notifications.find(function (item) {
      return item.id === notificationId;
    });
    if (!notification) return;
    notification.read = true;
    saveState();
    renderInbox();
  }

  function updateMentionPreview() {
    if (!el.mentionPreview) return;
    const title = el.articleTitle ? el.articleTitle.value || "" : "";
    const body = el.articleBody ? el.articleBody.value || "" : "";
    const mentions = extractMentions(title + "\n" + body);
    if (mentions.length === 0) {
      el.mentionPreview.textContent = "None";
      return;
    }
    el.mentionPreview.textContent = mentions.map(function (m) {
      return "@" + m;
    }).join(", ");
  }

  function renderAll() {
    renderActiveUser();
    renderKnownUsers();
    renderInbox();
    renderInsights();
    renderPropositionBoard();
    renderArticlePropositionPicker();
    renderFeed();
    updateMentionPreview();
  }

  function renderActiveUser() {
    syncActiveUserFromAuth();
    if (el.activeHandleInput) {
      el.activeHandleInput.value = activeUser || "";
    }
    if (el.activeUserBadge) {
      el.activeUserBadge.textContent = activeUser ? "Active user: @" + activeUser : "No active user";
    }
    enforceAuthenticatedIdentityUi();
  }

  function renderKnownUsers() {
    if (!el.knownUsersList) return;
    if (isIdentityLockedToAuth()) {
      el.knownUsersList.innerHTML =
        '<li><span class="user-pill"><button type="button" disabled>@' + escapeHtml(activeUser) + "</button></span></li>";
      return;
    }
    const handles = Object.keys(state.users).sort();
    if (handles.length === 0) {
      el.knownUsersList.innerHTML = "<li class=\"hint\">No users yet.</li>";
      return;
    }

    el.knownUsersList.innerHTML = "";
    handles.forEach(function (handle) {
      const item = document.createElement("li");
      const pill = document.createElement("span");
      pill.className = "user-pill";

      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-user-handle", handle);
      button.textContent = "@" + handle;

      pill.appendChild(button);
      item.appendChild(pill);
      el.knownUsersList.appendChild(item);
    });
  }

  function renderInbox() {
    if (!el.inboxList || !el.inboxCountBadge) return;

    const notifications = state.notifications.filter(function (item) {
      return item.to === activeUser;
    });
    const unreadCount = notifications.filter(function (item) {
      return !item.read;
    }).length;
    el.inboxCountBadge.textContent = String(unreadCount);

    if (notifications.length === 0) {
      el.inboxList.innerHTML = '<li class="hint">No notifications yet for @' + escapeHtml(activeUser || "") + ".</li>";
      return;
    }

    el.inboxList.innerHTML = "";
    notifications.forEach(function (notification) {
      const item = document.createElement("li");
      item.className = "inbox-item" + (notification.read ? "" : " is-unread");

      const title = document.createElement("div");
      title.className = "inbox-top";
      title.innerHTML = "<strong>" + escapeHtml(renderNotificationTitle(notification)) + "</strong>";

      const meta = document.createElement("p");
      meta.className = "inbox-meta";
      meta.textContent = relativeTime(notification.createdAt);

      const excerpt = document.createElement("p");
      excerpt.className = "inbox-meta";
      excerpt.innerHTML = notification.excerpt ? "\"" + escapeHtml(notification.excerpt || "") + "\"" : "";

      const actions = document.createElement("div");
      actions.className = "inbox-actions";
      actions.innerHTML =
        '<button type="button" data-jump-article-id="' +
        escapeHtml(notification.articleId) +
        '">Open Article</button>' +
        '<button type="button" data-notification-read="' +
        escapeHtml(notification.id) +
        '">' +
        (notification.read ? "Mark Unread (disabled)" : "Mark Read") +
        "</button>";

      const readBtn = actions.querySelector("button[data-notification-read]");
      if (readBtn && notification.read) {
        readBtn.disabled = true;
      }

      item.appendChild(title);
      item.appendChild(meta);
      item.appendChild(excerpt);
      item.appendChild(actions);
      el.inboxList.appendChild(item);
    });
  }

  function renderFeed() {
    if (!el.articleFeed) return;
    const feedItems = buildFeedItems();
    updateFeedHint();
    updateFeedToggleState();
    if (feedItems.length === 0) {
      const emptyLabel =
        feedMode === "personal"
          ? "No articles currently challenge your saved views."
          : "No articles published yet.";
      el.articleFeed.innerHTML = '<p class="hint">' + escapeHtml(emptyLabel) + "</p>";
      return;
    }

    el.articleFeed.innerHTML = "";
    feedItems.forEach(function (item) {
      const article = item.article;
      const relevance = item.relevance;
      const disagreements = item.disagreements || [];
      const card = document.createElement("article");
      card.className = "article-card";
      card.id = "article-" + article.id;

      const mentions = Array.isArray(article.mentions) ? article.mentions : [];
      const mentionLine =
        mentions.length > 0
          ? '<p class="article-mention-line">Mentions: ' +
            mentions
              .map(function (handle) {
                return '<span class="pub-mention">@' + escapeHtml(handle) + "</span>";
              })
              .join(" ") +
            "</p>"
          : "";

      const positionLine = renderArticlePositionLine(article, relevance, disagreements);
      const visibleAnnotations = getVisibleAnnotationsForArticle(article);
      const highlightedBody = buildAnnotatedArticleBody(article.body, visibleAnnotations);
      const commentsHtml = renderPassageCommentThread(article, visibleAnnotations);

      card.innerHTML =
        '<h3 class="article-title">' +
        escapeHtml(article.title) +
        "</h3>" +
        '<p class="article-meta">By @' +
        escapeHtml(article.author) +
        " · " +
        escapeHtml(formatDate(article.createdAt)) +
        "</p>" +
        positionLine +
        '<p class="article-body" data-article-id="' +
        escapeHtml(article.id) +
        '">' +
        highlightedBody +
        "</p>" +
        mentionLine +
        '<p class="hint article-annotation-instruction">Highlight a specific passage above, then post a targeted comment.</p>' +
        '<section class="article-annotation-editor" data-annotation-editor="' +
        escapeHtml(article.id) +
        '" hidden>' +
        '<p class="label-lite">Selected passage</p>' +
        '<p class="annotation-selected-quote" data-annotation-selected="' +
        escapeHtml(article.id) +
        '"></p>' +
        '<label class="annotation-label">Comment on this highlighted passage' +
        '<textarea data-annotation-comment="' +
        escapeHtml(article.id) +
        '" rows="3" maxlength="2000" placeholder="Explain agreement, disagreement, or a request for clarification."></textarea>' +
        "</label>" +
        '<label class="annotation-label">Visibility' +
        '<select data-annotation-visibility="' +
        escapeHtml(article.id) +
        '">' +
        '<option value="public">Visible to everyone</option>' +
        '<option value="author">Visible only to article author</option>' +
        "</select>" +
        "</label>" +
        '<div class="annotation-action-row">' +
        '<button type="button" class="btn btn-secondary" data-annotation-save="' +
        escapeHtml(article.id) +
        '">Post Passage Comment</button>' +
        '<button type="button" class="btn btn-ghost" data-annotation-cancel="' +
        escapeHtml(article.id) +
        '">Cancel</button>' +
        "</div>" +
        '<p class="annotation-editor-status hint" data-annotation-status="' +
        escapeHtml(article.id) +
        '"></p>' +
        "</section>" +
        commentsHtml;

      el.articleFeed.appendChild(card);
    });
  }

  function updateFeedHint() {
    if (!el.feedHint) return;
    el.feedHint.textContent =
      feedMode === "personal"
        ? "Articles that argue against views you currently hold appear here, weighted by your confidence."
        : "Newest first. Highlight any excerpt to attach a passage comment (public or author-only).";
  }

  function updateFeedToggleState() {
    const buttons = document.querySelectorAll("[data-feed-mode]");
    if (!buttons.length) return;
    buttons.forEach(function (button) {
      const mode = String(button.getAttribute("data-feed-mode") || "");
      if (mode === feedMode) {
        button.classList.add("is-active");
      } else {
        button.classList.remove("is-active");
      }
    });
  }

  function renderPropositionBoard() {
    if (!el.propositionBoard) return;
    if (!activeUser) {
      el.propositionBoard.innerHTML = '<p class="hint">Sign in or set an active username to save proposition views.</p>';
      return;
    }

    const userViews = getUserViewMap(activeUser);
    const groups = PROPOSITION_SETS.map(function (group) {
      const overallMarket = computeMarket(group.id);
      const overallView = userViews[group.id] || {};
      const overallRow =
        '<div class="prop-row prop-overall" data-prop-id="' +
        escapeHtml(group.id) +
        '">' +
        '<div class="prop-copy">' +
        '<p class="prop-title">Overall: ' +
        escapeHtml(group.title) +
        "</p>" +
        '<p class="prop-note">' +
        escapeHtml(group.summary || "") +
        "</p>" +
        "</div>" +
        renderMarketBlock(overallMarket) +
        renderUserViewControls(overallView) +
        "</div>";

      const relevantRows = group.relevant
        .map(function (prop) {
          const market = computeMarket(prop.id);
          const view = userViews[prop.id] || {};
          return (
            '<div class="prop-row prop-relevant" data-prop-id="' +
            escapeHtml(prop.id) +
            '">' +
            '<div class="prop-copy">' +
            '<p class="prop-title">Relevant: ' +
            escapeHtml(prop.title) +
            "</p>" +
            "</div>" +
            renderMarketBlock(market) +
            renderUserViewControls(view) +
            "</div>"
          );
        })
        .join("");

      return '<div class="prop-group">' + overallRow + '<div class="prop-relevant-list">' + relevantRows + "</div></div>";
    }).join("");

    el.propositionBoard.innerHTML = groups;
  }

  function renderArticlePropositionPicker() {
    if (!el.articlePropositionPicker) return;
    if (el.articlePropositionPicker.dataset.ready === "true") return;
    const items = PROPOSITION_SETS.map(function (group) {
      const rows = group.relevant
        .map(function (prop) {
          return (
            '<label class="prop-picker-item" data-article-prop data-overall-id="' +
            escapeHtml(group.id) +
            '" data-prop-id="' +
            escapeHtml(prop.id) +
            '">' +
            '<input type="checkbox">' +
            '<span>' +
            escapeHtml(prop.title) +
            "</span>" +
            '<select disabled>' +
            '<option value="true">Argues true</option>' +
            '<option value="false">Argues not true</option>' +
            "</select>" +
            "</label>"
          );
        })
        .join("");
      return (
        '<div class="prop-picker-group">' +
        '<p class="prop-picker-title">' +
        escapeHtml(group.title) +
        "</p>" +
        '<div class="prop-picker-list">' +
        rows +
        "</div>" +
        "</div>"
      );
    }).join("");

    el.articlePropositionPicker.innerHTML = items;
    el.articlePropositionPicker.dataset.ready = "true";
  }

  function resetArticlePropositionPicker() {
    if (!el.articlePropositionPicker) return;
    const rows = el.articlePropositionPicker.querySelectorAll("[data-article-prop]");
    rows.forEach(function (row) {
      const checkbox = row.querySelector('input[type="checkbox"]');
      const select = row.querySelector("select");
      if (checkbox) checkbox.checked = false;
      if (select) {
        select.disabled = true;
        select.value = "true";
      }
    });
  }

  function collectArticlePositions() {
    if (!el.articlePropositionPicker) return [];
    const selections = [];
    const rows = el.articlePropositionPicker.querySelectorAll("[data-article-prop]");
    rows.forEach(function (row) {
      const checkbox = row.querySelector('input[type="checkbox"]');
      const select = row.querySelector("select");
      if (!checkbox || !checkbox.checked) return;
      const stance = select ? String(select.value || "") : "";
      if (stance !== "true" && stance !== "false") return;
      selections.push({
        overallId: String(row.getAttribute("data-overall-id") || ""),
        propositionId: String(row.getAttribute("data-prop-id") || ""),
        stance: stance,
      });
    });
    return selections;
  }

  function renderArticlePositionLine(article, relevance, disagreements) {
    const positions = Array.isArray(article.positions) ? article.positions : [];
    const chips = positions
      .map(function (pos) {
        const label = formatPositionLabel(pos);
        if (!label) return "";
        const stanceText = pos.stance === "false" ? "argues not true" : "argues true";
        return '<span class="article-prop-tag">' + escapeHtml(label + " · " + stanceText) + "</span>";
      })
      .filter(Boolean)
      .join("");

    const relevanceText =
      typeof relevance === "number"
        ? '<span class="article-relevance">Relevance: ' + Math.round(relevance) + "%</span>"
        : "";
    const disagreementText =
      Array.isArray(disagreements) && disagreements.length
        ? '<span class="article-disagreement">Disagrees with your view on ' +
          escapeHtml(disagreements.map(formatDisagreementLabel).filter(Boolean).join("; ")) +
          "</span>"
        : "";

    if (!chips && !relevanceText && !disagreementText) return "";
    return (
      '<div class="article-prop-meta">' +
      relevanceText +
      (relevanceText && disagreementText ? " · " : "") +
      disagreementText +
      (chips ? '<div class="article-prop-tags">' + chips + "</div>" : "") +
      "</div>"
    );
  }

  function buildFeedItems() {
    const articles = Array.isArray(state.articles) ? state.articles : [];
    if (feedMode !== "personal") {
      return articles.map(function (article) {
        return { article: article };
      });
    }
    const userViews = getUserViewMap(activeUser || "");
    const scored = articles
      .map(function (article) {
        const info = getDisagreementInfo(article, userViews);
        if (!info) return null;
        return {
          article: article,
          relevance: info.score,
          disagreements: info.disagreements,
        };
      })
      .filter(Boolean);

    scored.sort(function (a, b) {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance;
      }
      return new Date(b.article.createdAt).getTime() - new Date(a.article.createdAt).getTime();
    });
    return scored;
  }

  function getDisagreementInfo(article, userViews) {
    const positions = Array.isArray(article.positions) ? article.positions : [];
    if (!positions.length) return null;
    let bestScore = null;
    const disagreements = [];
    positions.forEach(function (pos) {
      const view = userViews && userViews[pos.propositionId];
      if (!view || (view.belief !== "true" && view.belief !== "false")) return;
      if (view.belief === pos.stance) return;
      const confidence = clamp(Number(view.confidence), 1, 100);
      if (bestScore === null || confidence > bestScore) {
        bestScore = confidence;
      }
      disagreements.push({
        propositionId: pos.propositionId,
        overallId: pos.overallId,
        stance: pos.stance,
      });
    });
    if (bestScore === null) return null;
    return { score: bestScore, disagreements: disagreements };
  }

  function formatDisagreementLabel(disagreement) {
    const label = formatPositionLabel(disagreement);
    return label ? label : "";
  }

  function formatPositionLabel(pos) {
    if (!pos) return "";
    const relevant = PROPOSITION_INDEX.relevant[pos.propositionId];
    const overall = PROPOSITION_INDEX.overall[pos.overallId];
    if (relevant) {
      return (overall ? overall.shortTitle + ": " : "") + relevant.title;
    }
    return overall ? overall.title : "";
  }

  function renderMarketBlock(market) {
    if (!market || !market.total) {
      return '<div class="prop-market"><span class="market-label">Credence market</span><strong>--</strong><span class="market-sub">No votes yet</span></div>';
    }
    return (
      '<div class="prop-market">' +
      '<span class="market-label">Credence market</span>' +
      '<strong>Yes ' +
      market.yes +
      "% · No " +
      market.no +
      "%</strong>" +
      '<span class="market-sub">' +
      market.total +
      " vote" +
      (market.total === 1 ? "" : "s") +
      "</span>" +
      "</div>"
    );
  }

  function renderUserViewControls(view) {
    const belief = view && (view.belief === "true" || view.belief === "false") ? view.belief : "";
    const confidence = view && Number.isFinite(Number(view.confidence)) ? clamp(Number(view.confidence), 1, 100) : 50;
    const disabled = !belief;
    const confidenceLabel = belief ? confidence + "%" : "--";
    return (
      '<div class="prop-view">' +
      '<label class="market-label">Your view</label>' +
      '<select data-prop-belief>' +
      '<option value=""' +
      (belief === "" ? " selected" : "") +
      ">No view</option>" +
      '<option value="true"' +
      (belief === "true" ? " selected" : "") +
      ">True</option>" +
      '<option value="false"' +
      (belief === "false" ? " selected" : "") +
      ">False</option>" +
      "</select>" +
      '<div class="prop-confidence-row">' +
      '<input type="range" data-prop-confidence min="1" max="100" step="1" value="' +
      confidence +
      '"' +
      (disabled ? " disabled" : "") +
      ">" +
      '<span class="prop-confidence-value" data-prop-confidence-value>' +
      confidenceLabel +
      "</span>" +
      "</div>" +
      "</div>"
    );
  }

  function computeMarket(propId) {
    const views = state.propositionViews || {};
    let yes = 0;
    let no = 0;
    Object.keys(views).forEach(function (handle) {
      const view = views[handle] && views[handle][propId];
      if (!view || (view.belief !== "true" && view.belief !== "false")) return;
      if (view.belief === "true") {
        yes += 1;
      } else {
        no += 1;
      }
    });
    const total = yes + no;
    if (!total) return { yes: 0, no: 0, total: 0 };
    return {
      yes: Math.round((yes / total) * 100),
      no: Math.round((no / total) * 100),
      total: total,
    };
  }

  function getUserViewMap(handle) {
    if (!state.propositionViews) {
      state.propositionViews = {};
    }
    const normalized = normalizeHandle(handle);
    if (!normalized) return {};
    if (!state.propositionViews[normalized]) {
      state.propositionViews[normalized] = {};
    }
    return state.propositionViews[normalized];
  }

  function renderInsights() {
    if (!el.insightCards || !el.insightTakeaways || !el.insightsTrendChart || !el.insightTrendMeta) return;

    const range = el.insightsRange && el.insightsRange.value ? String(el.insightsRange.value) : "30d";
    const summary = buildInsightsSummary(range);

    el.insightCards.innerHTML = summary.cards
      .map(function (card) {
        return (
          '<article class="insight-card">' +
          '<p class="insight-card-label">' +
          escapeHtml(card.label) +
          "</p>" +
          '<p class="insight-card-value">' +
          escapeHtml(card.value) +
          "</p>" +
          '<p class="insight-card-sub">' +
          escapeHtml(card.sub) +
          "</p>" +
          "</article>"
        );
      })
      .join("");

    el.insightTakeaways.innerHTML = summary.takeaways
      .map(function (line) {
        return "<li>" + escapeHtml(line) + "</li>";
      })
      .join("");

    el.insightTrendMeta.textContent = summary.trendMeta;
    drawInsightsTrendChart(summary.buckets);
  }

  function buildInsightsSummary(range) {
    const startDate = getRangeStartDate(range);
    const articleById = {};
    state.articles.forEach(function (article) {
      articleById[article.id] = article;
    });

    const filteredArticles = state.articles.filter(function (article) {
      return inDateWindow(article.createdAt, startDate);
    });
    const filteredAnnotations = (Array.isArray(state.annotations) ? state.annotations : []).filter(function (annotation) {
      return inDateWindow(annotation.createdAt, startDate);
    });

    const totalArticles = filteredArticles.length;
    const totalAnnotations = filteredAnnotations.length;
    const totalMentions = filteredArticles.reduce(function (sum, article) {
      const mentions = Array.isArray(article.mentions) ? article.mentions.length : 0;
      return sum + mentions;
    }, 0);
    const articlesWithMentions = filteredArticles.filter(function (article) {
      return Array.isArray(article.mentions) && article.mentions.length > 0;
    }).length;
    const articlesWithPassageComments = new Set(
      filteredAnnotations.map(function (annotation) {
        return annotation.articleId;
      })
    ).size;
    const publicAnnotations = filteredAnnotations.filter(function (annotation) {
      return annotation.visibility === "public";
    }).length;
    const crossAuthorAnnotations = filteredAnnotations.filter(function (annotation) {
      const article = articleById[annotation.articleId];
      if (!article) return false;
      return annotation.author !== article.author;
    }).length;

    const cards = [
      {
        label: "Mention Coverage",
        value: formatPercent(articlesWithMentions, totalArticles),
        sub: articlesWithMentions + " of " + totalArticles + " published articles mention at least one user.",
      },
      {
        label: "Targeted Feedback Rate",
        value: formatPercent(articlesWithPassageComments, totalArticles),
        sub: articlesWithPassageComments + " articles received passage-specific comments.",
      },
      {
        label: "Public Comment Share",
        value: formatPercent(publicAnnotations, totalAnnotations),
        sub: publicAnnotations + " of " + totalAnnotations + " passage comments are public.",
      },
      {
        label: "Cross-Author Engagement",
        value: formatPercent(crossAuthorAnnotations, totalAnnotations),
        sub: crossAuthorAnnotations + " comments were posted by non-authors on others' work.",
      },
    ];

    const takeaways = [
      formatPercent(articlesWithMentions, totalArticles) +
        " of published articles directly invite peer dialogue through @mentions.",
      formatPercent(articlesWithPassageComments, totalArticles) +
        " of articles generated line-by-line feedback, indicating focused disagreement handling.",
      "Public comments: " +
        publicAnnotations +
        ", author-only comments: " +
        (totalAnnotations - publicAnnotations) +
        ", total passage comments: " +
        totalAnnotations +
        ".",
      "Average mentions per article: " + formatDecimal(totalMentions / Math.max(totalArticles, 1)) + ".",
    ];

    const bucketResult = buildInsightBuckets(range, startDate);
    return {
      cards: cards,
      takeaways: takeaways,
      buckets: bucketResult.buckets,
      trendMeta:
        bucketResult.windowLabel +
        " • " +
        totalArticles +
        " articles • " +
        totalAnnotations +
        " passage comments • " +
        totalMentions +
        " mentions",
    };
  }

  function buildInsightBuckets(range, startDate) {
    const now = new Date();
    const buckets = [];
    const keyed = {};
    let windowLabel = "All time";

    if (range === "7d" || range === "30d") {
      const dayCount = range === "7d" ? 7 : 30;
      windowLabel = "Daily trend";
      for (let i = dayCount - 1; i >= 0; i -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = date.toISOString().slice(0, 10);
        const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        const entry = { key: key, label: label, articles: 0, comments: 0 };
        buckets.push(entry);
        keyed[key] = entry;
      }
      state.articles.forEach(function (article) {
        if (!inDateWindow(article.createdAt, startDate)) return;
        const key = safeDateKey(article.createdAt);
        if (!keyed[key]) return;
        keyed[key].articles += 1;
      });
      (Array.isArray(state.annotations) ? state.annotations : []).forEach(function (annotation) {
        if (!inDateWindow(annotation.createdAt, startDate)) return;
        const key = safeDateKey(annotation.createdAt);
        if (!keyed[key]) return;
        keyed[key].comments += 1;
      });
      return { buckets: buckets, windowLabel: windowLabel };
    }

    windowLabel = "Monthly trend";
    for (let m = 11; m >= 0; m -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const key = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
      const label = date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
      const entry = { key: key, label: label, articles: 0, comments: 0 };
      buckets.push(entry);
      keyed[key] = entry;
    }
    state.articles.forEach(function (article) {
      const date = new Date(article.createdAt);
      if (!Number.isFinite(date.getTime())) return;
      const key = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
      if (!keyed[key]) return;
      keyed[key].articles += 1;
    });
    (Array.isArray(state.annotations) ? state.annotations : []).forEach(function (annotation) {
      const date = new Date(annotation.createdAt);
      if (!Number.isFinite(date.getTime())) return;
      const key = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
      if (!keyed[key]) return;
      keyed[key].comments += 1;
    });
    return { buckets: buckets, windowLabel: windowLabel };
  }

  function drawInsightsTrendChart(buckets) {
    if (!el.insightsTrendChart) return;
    if (!Array.isArray(buckets) || buckets.length === 0) {
      el.insightsTrendChart.innerHTML = "";
      return;
    }

    const width = 760;
    const height = 240;
    const padLeft = 42;
    const padRight = 16;
    const padTop = 14;
    const padBottom = 34;
    const innerW = width - padLeft - padRight;
    const innerH = height - padTop - padBottom;

    const maxValue = Math.max(
      1,
      buckets.reduce(function (acc, bucket) {
        return Math.max(acc, bucket.articles, bucket.comments);
      }, 0)
    );

    const articlePath = [];
    const commentPath = [];
    const articleDots = [];
    const commentDots = [];
    const xLabelEvery = Math.max(1, Math.floor(buckets.length / 6));

    buckets.forEach(function (bucket, index) {
      const x = buckets.length === 1 ? padLeft + innerW / 2 : padLeft + (innerW * index) / (buckets.length - 1);
      const articleY = padTop + innerH - (bucket.articles / maxValue) * innerH;
      const commentY = padTop + innerH - (bucket.comments / maxValue) * innerH;

      articlePath.push((index === 0 ? "M " : "L ") + x.toFixed(2) + " " + articleY.toFixed(2));
      commentPath.push((index === 0 ? "M " : "L ") + x.toFixed(2) + " " + commentY.toFixed(2));
      articleDots.push('<circle cx="' + x.toFixed(2) + '" cy="' + articleY.toFixed(2) + '" r="2.8" fill="#246c4a"></circle>');
      commentDots.push('<circle cx="' + x.toFixed(2) + '" cy="' + commentY.toFixed(2) + '" r="2.8" fill="#3a6ea5"></circle>');
    });

    const grid = [0, 0.25, 0.5, 0.75, 1].map(function (t) {
      const y = padTop + innerH - t * innerH;
      const tick = Math.round(t * maxValue);
      return (
        '<line x1="' +
        padLeft +
        '" y1="' +
        y.toFixed(2) +
        '" x2="' +
        (width - padRight) +
        '" y2="' +
        y.toFixed(2) +
        '" stroke="#dbe3ec" stroke-width="1"></line>' +
        '<text x="' +
        (padLeft - 8) +
        '" y="' +
        (y + 4).toFixed(2) +
        '" text-anchor="end" fill="#607286" font-size="10">' +
        tick +
        "</text>"
      );
    });

    const xLabels = buckets
      .map(function (bucket, index) {
        if (index % xLabelEvery !== 0 && index !== buckets.length - 1) return "";
        const x = buckets.length === 1 ? padLeft + innerW / 2 : padLeft + (innerW * index) / (buckets.length - 1);
        return (
          '<text x="' +
          x.toFixed(2) +
          '" y="' +
          (height - 10) +
          '" text-anchor="middle" fill="#63778e" font-size="10">' +
          escapeHtml(bucket.label) +
          "</text>"
        );
      })
      .join("");

    el.insightsTrendChart.innerHTML =
      '<rect x="0" y="0" width="' +
      width +
      '" height="' +
      height +
      '" fill="#ffffff"></rect>' +
      grid.join("") +
      '<line x1="' +
      padLeft +
      '" y1="' +
      (padTop + innerH) +
      '" x2="' +
      (width - padRight) +
      '" y2="' +
      (padTop + innerH) +
      '" stroke="#cfd9e4" stroke-width="1"></line>' +
      '<path d="' +
      articlePath.join(" ") +
      '" fill="none" stroke="#246c4a" stroke-width="2.2"></path>' +
      '<path d="' +
      commentPath.join(" ") +
      '" fill="none" stroke="#3a6ea5" stroke-width="2.2"></path>' +
      articleDots.join("") +
      commentDots.join("") +
      '<rect x="' +
      (width - 210) +
      '" y="10" width="200" height="26" rx="8" fill="#f7fbff" stroke="#d4deea"></rect>' +
      '<circle cx="' +
      (width - 195) +
      '" cy="23" r="4" fill="#246c4a"></circle>' +
      '<text x="' +
      (width - 186) +
      '" y="27" fill="#385672" font-size="11">Articles</text>' +
      '<circle cx="' +
      (width - 122) +
      '" cy="23" r="4" fill="#3a6ea5"></circle>' +
      '<text x="' +
      (width - 113) +
      '" y="27" fill="#385672" font-size="11">Passage comments</text>' +
      xLabels;
  }

  function renderPassageCommentThread(article, annotations) {
    if (!annotations || annotations.length === 0) {
      return (
        '<section class="article-comments">' +
        "<h4>Passage Comments</h4>" +
        '<p class="hint">No passage comments visible to you yet.</p>' +
        "</section>"
      );
    }

    const items = annotations
      .slice()
      .sort(function (a, b) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .map(function (annotation) {
        const replies = getVisibleRepliesForAnnotation(annotation, article);
        const repliesHtml =
          replies.length === 0
            ? '<p class="hint annotation-replies-empty">No replies yet.</p>'
            : '<ul class="annotation-reply-list">' +
              replies
                .map(function (reply) {
                  return (
                    '<li class="annotation-reply-item">' +
                    '<p class="article-comment-text">' +
                    escapeHtml(reply.text) +
                    "</p>" +
                    '<p class="article-comment-meta">By @' +
                    escapeHtml(reply.author) +
                    " · " +
                    escapeHtml(relativeTime(reply.createdAt)) +
                    " · " +
                    '<span class="annotation-visibility-badge">' +
                    escapeHtml(reply.visibility === "author" ? "Author only" : "Public") +
                    "</span>" +
                    "</p>" +
                    "</li>"
                  );
                })
                .join("") +
              "</ul>";

        return (
          '<li class="article-comment-item">' +
          '<p class="annotation-quote">"' +
          escapeHtml(trimPreview(annotation.selectedText, 220)) +
          '"</p>' +
          '<p class="article-comment-text">' +
          escapeHtml(annotation.comment) +
          "</p>" +
          '<p class="article-comment-meta">By @' +
          escapeHtml(annotation.author) +
          " · " +
          escapeHtml(relativeTime(annotation.createdAt)) +
          " · " +
          '<span class="annotation-visibility-badge">' +
          escapeHtml(annotation.visibility === "author" ? "Author only" : "Public") +
          "</span>" +
          "</p>" +
          '<div class="annotation-reply-wrap">' +
          '<button type="button" class="btn btn-ghost" data-reply-start="' +
          escapeHtml(annotation.id) +
          '">Reply</button>' +
          '<div class="annotation-reply-editor" data-reply-editor="' +
          escapeHtml(annotation.id) +
          '" hidden>' +
          '<label class="annotation-label">Reply' +
          '<textarea rows="2" maxlength="1200" data-reply-input="' +
          escapeHtml(annotation.id) +
          '" placeholder="Write a reply to this comment."></textarea>' +
          "</label>" +
          '<label class="annotation-label">Visibility' +
          '<select data-reply-visibility="' +
          escapeHtml(annotation.id) +
          '">' +
          '<option value="public">Visible to everyone</option>' +
          '<option value="author">Visible only to article author</option>' +
          "</select>" +
          "</label>" +
          '<div class="annotation-action-row">' +
          '<button type="button" class="btn btn-secondary" data-reply-save="' +
          escapeHtml(annotation.id) +
          '">Post Reply</button>' +
          '<button type="button" class="btn btn-ghost" data-reply-cancel="' +
          escapeHtml(annotation.id) +
          '">Cancel</button>' +
          "</div>" +
          '<p class="annotation-editor-status hint" data-reply-status="' +
          escapeHtml(annotation.id) +
          '"></p>' +
          "</div>" +
          repliesHtml +
          "</div>" +
          "</li>"
        );
      })
      .join("");

    return '<section class="article-comments"><h4>Passage Comments</h4><ul class="article-comment-list">' + items + "</ul></section>";
  }

  function buildAnnotatedArticleBody(body, visibleAnnotations) {
    const source = String(body || "");
    const ranges = buildRenderableRanges(source, visibleAnnotations);

    if (ranges.length === 0) {
      return formatArticleFragment(source);
    }

    const chunks = [];
    let cursor = 0;
    ranges.forEach(function (range) {
      if (range.start > cursor) {
        chunks.push(formatArticleFragment(source.slice(cursor, range.start)));
      }
      chunks.push(
        '<mark class="article-passage-highlight" data-annotation-id="' +
          escapeHtml(range.id) +
          '">' +
          formatArticleFragment(source.slice(range.start, range.end)) +
          "</mark>"
      );
      cursor = range.end;
    });

    if (cursor < source.length) {
      chunks.push(formatArticleFragment(source.slice(cursor)));
    }

    return chunks.join("");
  }

  function buildRenderableRanges(sourceText, annotations) {
    if (!annotations || annotations.length === 0) return [];

    const rawRanges = annotations
      .map(function (annotation) {
        const size = sourceText.length;
        let start = Number(annotation.rangeStart);
        let end = Number(annotation.rangeEnd);

        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
          if (!annotation.selectedText) return null;
          const fallbackStart = sourceText.indexOf(annotation.selectedText);
          if (fallbackStart < 0) return null;
          start = fallbackStart;
          end = fallbackStart + annotation.selectedText.length;
        }

        start = Math.max(0, Math.min(size, Math.floor(start)));
        end = Math.max(0, Math.min(size, Math.floor(end)));
        if (end <= start) return null;

        return { id: annotation.id, start: start, end: end };
      })
      .filter(Boolean)
      .sort(function (a, b) {
        if (a.start === b.start) return a.end - b.end;
        return a.start - b.start;
      });

    const nonOverlapping = [];
    let cursor = -1;
    rawRanges.forEach(function (range) {
      if (range.start < cursor) return;
      nonOverlapping.push(range);
      cursor = range.end;
    });

    return nonOverlapping;
  }

  function getVisibleAnnotationsForArticle(article) {
    const items = Array.isArray(state.annotations) ? state.annotations : [];
    return items.filter(function (annotation) {
      if (!annotation || annotation.articleId !== article.id) return false;
      if (annotation.visibility === "public") return true;
      if (activeUser === article.author) return true;
      if (activeUser === annotation.author) return true;
      return false;
    });
  }

  function getVisibleRepliesForAnnotation(annotation, article) {
    const replies = Array.isArray(state.annotationReplies) ? state.annotationReplies : [];
    return replies
      .filter(function (reply) {
        if (!reply || reply.annotationId !== annotation.id) return false;
        if (reply.visibility === "public") return true;
        if (activeUser === article.author) return true;
        if (activeUser === annotation.author) return true;
        if (activeUser === reply.author) return true;
        return false;
      })
      .sort(function (a, b) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }

  function formatArticleFragment(text) {
    const escaped = escapeHtml(text || "");
    return escaped.replace(/(^|[\s(>])@([a-zA-Z0-9_]{2,24})/g, "$1<span class=\"pub-mention\">@$2</span>");
  }

  function updateSyllogismPreview() {
    if (!el.majorSentence || !el.minorSentence || !el.conclusionSentence) return;
    const parsed = readSyllogismInput();
    el.majorSentence.textContent = statementToSentence(parsed.major, parsed.terms);
    el.minorSentence.textContent = statementToSentence(parsed.minor, parsed.terms);
    el.conclusionSentence.textContent = statementToSentence(parsed.conclusion, parsed.terms);
  }

  function onCheckSyllogism() {
    const parsed = readSyllogismInput();
    const verdict = evaluateSyllogism(parsed);

    if (!el.syllogismResult || !el.syllogismCounterexample) return;

    if (verdict.valid) {
      el.syllogismResult.className = "syll-result valid";
      el.syllogismResult.innerHTML =
        "<strong>Valid.</strong> No counterexample model was found where both premises are true and the conclusion is false.";
      el.syllogismCounterexample.innerHTML =
        '<p class="hint">Checker uses finite model search over categorical forms (A/E/I/O) with terms S, M, P.</p>';
      return;
    }

    el.syllogismResult.className = "syll-result invalid";
    el.syllogismResult.innerHTML =
      "<strong>Invalid.</strong> A counterexample exists: the premises can be true while the conclusion is false.";

    el.syllogismCounterexample.innerHTML = renderCounterexample(verdict.counterexample, parsed);
  }

  function onInsertSyllogismInDraft() {
    if (!el.articleBody) return;

    const parsed = readSyllogismInput();
    const block =
      "\n\nSyllogism Draft:\n" +
      "1) " +
      statementToSentence(parsed.major, parsed.terms) +
      "\n" +
      "2) " +
      statementToSentence(parsed.minor, parsed.terms) +
      "\n" +
      "Therefore: " +
      statementToSentence(parsed.conclusion, parsed.terms) +
      "\n";

    el.articleBody.value = (el.articleBody.value || "") + block;
    updateMentionPreview();
    setArticleStatus("Syllogism inserted into draft.", false);
  }

  function readSyllogismInput() {
    const terms = {
      S: normalizeTerm(el.termS && el.termS.value, "S"),
      M: normalizeTerm(el.termM && el.termM.value, "M"),
      P: normalizeTerm(el.termP && el.termP.value, "P"),
    };

    const majorMap = (el.majorFigure && el.majorFigure.value) === "PM" ? ["P", "M"] : ["M", "P"];
    const minorMap = (el.minorFigure && el.minorFigure.value) === "MS" ? ["M", "S"] : ["S", "M"];
    const conclusionMap = (el.conclusionFigure && el.conclusionFigure.value) === "PS" ? ["P", "S"] : ["S", "P"];

    return {
      terms: terms,
      major: { mood: readMood(el.majorMood), subject: majorMap[0], predicate: majorMap[1] },
      minor: { mood: readMood(el.minorMood), subject: minorMap[0], predicate: minorMap[1] },
      conclusion: { mood: readMood(el.conclusionMood), subject: conclusionMap[0], predicate: conclusionMap[1] },
    };
  }

  function evaluateSyllogism(parsed) {
    const major = parsed.major;
    const minor = parsed.minor;
    const conclusion = parsed.conclusion;

    for (let size = 1; size <= MAX_MODEL_SIZE; size += 1) {
      const totalModels = Math.pow(8, size);
      for (let index = 0; index < totalModels; index += 1) {
        const model = decodeModel(index, size);
        const majorTrue = evaluateStatement(major, model);
        const minorTrue = evaluateStatement(minor, model);
        const conclusionTrue = evaluateStatement(conclusion, model);
        if (majorTrue && minorTrue && !conclusionTrue) {
          return {
            valid: false,
            counterexample: model,
          };
        }
      }
    }

    return { valid: true };
  }

  function decodeModel(index, size) {
    const model = [];
    let cursor = index;
    for (let i = 0; i < size; i += 1) {
      const code = cursor % 8;
      cursor = Math.floor(cursor / 8);
      model.push({
        S: Boolean(code & 1),
        M: Boolean(code & 2),
        P: Boolean(code & 4),
      });
    }
    return model;
  }

  function evaluateStatement(statement, model) {
    const subject = statement.subject;
    const predicate = statement.predicate;
    const mood = statement.mood;

    if (mood === "A") {
      return model.every(function (obj) {
        return !obj[subject] || obj[predicate];
      });
    }
    if (mood === "E") {
      return model.every(function (obj) {
        return !obj[subject] || !obj[predicate];
      });
    }
    if (mood === "I") {
      return model.some(function (obj) {
        return obj[subject] && obj[predicate];
      });
    }
    if (mood === "O") {
      return model.some(function (obj) {
        return obj[subject] && !obj[predicate];
      });
    }
    return false;
  }

  function statementToSentence(statement, terms) {
    const subjectLabel = terms[statement.subject];
    const predicateLabel = terms[statement.predicate];
    if (statement.mood === "A") return "All " + subjectLabel + " are " + predicateLabel + ".";
    if (statement.mood === "E") return "No " + subjectLabel + " are " + predicateLabel + ".";
    if (statement.mood === "I") return "Some " + subjectLabel + " are " + predicateLabel + ".";
    if (statement.mood === "O") return "Some " + subjectLabel + " are not " + predicateLabel + ".";
    return "";
  }

  function renderCounterexample(model, parsed) {
    const rows = model
      .map(function (obj, idx) {
        return (
          "<tr>" +
          "<td>#" +
          (idx + 1) +
          "</td>" +
          "<td>" +
          (obj.S ? "Yes" : "No") +
          "</td>" +
          "<td>" +
          (obj.M ? "Yes" : "No") +
          "</td>" +
          "<td>" +
          (obj.P ? "Yes" : "No") +
          "</td>" +
          "</tr>"
        );
      })
      .join("");

    const major = statementToSentence(parsed.major, parsed.terms);
    const minor = statementToSentence(parsed.minor, parsed.terms);
    const conclusion = statementToSentence(parsed.conclusion, parsed.terms);

    return (
      "<p>Counterexample model (premises true, conclusion false):</p>" +
      '<table class="counterexample-table"><thead><tr><th>Individual</th><th>S</th><th>M</th><th>P</th></tr></thead><tbody>' +
      rows +
      "</tbody></table>" +
      "<p class=\"hint\">Premises: " +
      escapeHtml(major) +
      " " +
      escapeHtml(minor) +
      " Conclusion fails: " +
      escapeHtml(conclusion) +
      "</p>"
    );
  }

  function extractMentions(text) {
    const value = String(text || "");
    const results = [];
    const regex = /(^|[^\w])@([a-zA-Z0-9_]{2,24})\b/g;
    let match = regex.exec(value);
    while (match) {
      const handle = normalizeHandle(match[2]);
      if (handle) results.push(handle);
      match = regex.exec(value);
    }
    return Array.from(new Set(results));
  }

  function normalizeNotifications(value) {
    if (!Array.isArray(value)) return [];
    return value
      .map(function (notification) {
        if (!notification || typeof notification !== "object") return null;
        return {
          id: String(notification.id || makeId("noti")),
          type: String(notification.type || "mention"),
          to: normalizeHandle(notification.to),
          from: normalizeHandle(notification.from),
          articleId: String(notification.articleId || ""),
          articleTitle: String(notification.articleTitle || ""),
          excerpt: String(notification.excerpt || ""),
          annotationId: String(notification.annotationId || ""),
          replyId: String(notification.replyId || ""),
          read: Boolean(notification.read),
          createdAt: String(notification.createdAt || new Date().toISOString()),
        };
      })
      .filter(Boolean);
  }

  function ensureSeedUsers() {
    DEFAULT_USERS.forEach(function (handle) {
      ensureUser(handle);
    });
  }

  function ensureUser(handle) {
    const normalized = normalizeHandle(handle);
    if (!normalized) return;
    if (!state.users[normalized]) {
      state.users[normalized] = {
        handle: normalized,
        createdAt: new Date().toISOString(),
      };
    }
    if (!state.propositionViews) {
      state.propositionViews = {};
    }
    if (!state.propositionViews[normalized]) {
      state.propositionViews[normalized] = {};
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return {
          users: {},
          articles: [],
          notifications: [],
          annotations: [],
          annotationReplies: [],
          propositionViews: {},
          feedMode: "personal",
        };
      }
      const parsed = JSON.parse(raw);
      return {
        users: parsed && parsed.users && typeof parsed.users === "object" ? parsed.users : {},
        articles: Array.isArray(parsed && parsed.articles) ? parsed.articles : [],
        notifications: normalizeNotifications(parsed && parsed.notifications),
        annotations: Array.isArray(parsed && parsed.annotations) ? parsed.annotations : [],
        annotationReplies: Array.isArray(parsed && parsed.annotationReplies) ? parsed.annotationReplies : [],
        propositionViews:
          parsed && parsed.propositionViews && typeof parsed.propositionViews === "object" ? parsed.propositionViews : {},
        feedMode: parsed && typeof parsed.feedMode === "string" ? parsed.feedMode : "personal",
      };
    } catch (_error) {
      return {
        users: {},
        articles: [],
        notifications: [],
        annotations: [],
        annotationReplies: [],
        propositionViews: {},
        feedMode: "personal",
      };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadActiveUser() {
    const raw = localStorage.getItem(ACTIVE_USER_KEY);
    return normalizeHandle(raw);
  }

  function saveActiveUser(handle) {
    localStorage.setItem(ACTIVE_USER_KEY, normalizeHandle(handle));
  }

  function makeId(prefix) {
    return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
  }

  function getRangeStartDate(range) {
    const now = new Date();
    if (range === "7d") {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    }
    if (range === "30d") {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    }
    return null;
  }

  function inDateWindow(isoDate, startDate) {
    if (!startDate) return true;
    const date = new Date(isoDate);
    if (!Number.isFinite(date.getTime())) return false;
    return date.getTime() >= startDate.getTime();
  }

  function safeDateKey(isoDate) {
    const date = new Date(isoDate);
    if (!Number.isFinite(date.getTime())) return "";
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0, 10);
  }

  function formatPercent(value, total) {
    if (!total || total <= 0) return "0%";
    return Math.round((value / total) * 100) + "%";
  }

  function formatDecimal(value) {
    if (!Number.isFinite(value)) return "0.0";
    return value.toFixed(1);
  }

  function findArticleById(articleId) {
    return state.articles.find(function (article) {
      return article.id === articleId;
    });
  }

  function findAnnotationById(annotationId) {
    return (Array.isArray(state.annotations) ? state.annotations : []).find(function (annotation) {
      return annotation.id === annotationId;
    });
  }

  function createNotification(payload) {
    return {
      id: makeId("noti"),
      type: payload.type || "mention",
      to: normalizeHandle(payload.to),
      from: normalizeHandle(payload.from),
      articleId: String(payload.articleId || ""),
      articleTitle: String(payload.articleTitle || ""),
      excerpt: String(payload.excerpt || ""),
      annotationId: payload.annotationId ? String(payload.annotationId) : "",
      replyId: payload.replyId ? String(payload.replyId) : "",
      read: false,
      createdAt: new Date().toISOString(),
    };
  }

  function renderNotificationTitle(notification) {
    const from = "@" + String(notification.from || "user");
    const article = '"' + String(notification.articleTitle || "an article") + '"';
    const type = String(notification.type || "mention");
    if (type === "comment") {
      return from + " commented on your article " + article;
    }
    if (type === "reply") {
      return from + " replied to your comment in " + article;
    }
    return from + " mentioned you in " + article;
  }

  function getAuthenticatedHandle() {
    if (!authApi || typeof authApi.getCurrentUser !== "function") return "";
    const user = authApi.getCurrentUser();
    if (!user || !user.handle) return "";
    return normalizeHandle(user.handle);
  }

  function isIdentityLockedToAuth() {
    return Boolean(getAuthenticatedHandle());
  }

  function syncActiveUserFromAuth() {
    const authHandle = getAuthenticatedHandle();
    if (!authHandle) return;
    if (authHandle === activeUser) return;
    activeUser = authHandle;
    ensureUser(activeUser);
    saveActiveUser(activeUser);
  }

  function enforceAuthenticatedIdentityUi() {
    if (!el.activeHandleInput || !el.setActiveUserBtn) return;
    const authHandle = getAuthenticatedHandle();
    if (!authHandle) {
      el.activeHandleInput.disabled = false;
      el.setActiveUserBtn.disabled = false;
      return;
    }

    el.activeHandleInput.disabled = true;
    el.setActiveUserBtn.disabled = true;
    el.activeHandleInput.value = authHandle;
    if (el.activeUserBadge) {
      el.activeUserBadge.textContent = "Signed-in identity: @" + authHandle;
    }
  }

  function trimPreview(text, maxLength) {
    const value = String(text || "").replace(/\s+/g, " ").trim();
    if (value.length <= maxLength) return value;
    return value.slice(0, maxLength - 1).trimEnd() + "…";
  }

  function cssEscape(value) {
    if (typeof CSS !== "undefined" && CSS && typeof CSS.escape === "function") {
      return CSS.escape(String(value || ""));
    }
    return String(value || "").replace(/["\\]/g, "\\$&");
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  function buildPropositionIndex(sets) {
    const overall = {};
    const relevant = {};
    (Array.isArray(sets) ? sets : []).forEach(function (set) {
      if (!set || !set.id) return;
      overall[set.id] = {
        id: set.id,
        title: set.title,
        shortTitle: makeShortTitle(set.title),
      };
      (Array.isArray(set.relevant) ? set.relevant : []).forEach(function (prop) {
        if (!prop || !prop.id) return;
        relevant[prop.id] = {
          id: prop.id,
          title: prop.title,
          overallId: set.id,
        };
      });
    });
    return { overall: overall, relevant: relevant };
  }

  function makeShortTitle(title) {
    const clean = String(title || "").replace(/\.$/, "");
    if (clean.length <= 40) return clean;
    return clean.slice(0, 37).trimEnd() + "…";
  }

  function normalizeHandle(value) {
    const raw = String(value || "")
      .trim()
      .replace(/^@+/, "")
      .toLowerCase();
    if (!/^[a-z0-9_]{2,24}$/.test(raw)) return "";
    return raw;
  }

  function normalizeTerm(value, fallback) {
    const text = String(value || "")
      .trim()
      .replace(/\s+/g, " ");
    return text || fallback;
  }

  function readMood(selectEl) {
    const mood = String(selectEl && selectEl.value ? selectEl.value : "A").toUpperCase();
    if (mood === "A" || mood === "E" || mood === "I" || mood === "O") return mood;
    return "A";
  }

  function relativeTime(isoDate) {
    const date = new Date(isoDate);
    if (!Number.isFinite(date.getTime())) return "Unknown time";
    const deltaMs = Date.now() - date.getTime();
    const deltaMin = Math.floor(deltaMs / 60000);
    if (deltaMin < 1) return "Just now";
    if (deltaMin < 60) return deltaMin + " min ago";
    const deltaH = Math.floor(deltaMin / 60);
    if (deltaH < 24) return deltaH + " h ago";
    const deltaD = Math.floor(deltaH / 24);
    return deltaD + " d ago";
  }

  function formatDate(isoDate) {
    const date = new Date(isoDate);
    if (!Number.isFinite(date.getTime())) return "Unknown date";
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function setArticleStatus(text, isError) {
    if (!el.articleStatus) return;
    el.articleStatus.textContent = text;
    el.articleStatus.style.color = isError ? "#8f2236" : "#355271";
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
