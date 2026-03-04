(function () {
  "use strict";

  const STORAGE_KEY = "normativity-publications-v1";
  const ACTIVE_USER_KEY = "normativity-publications-active-user-v1";
  const MAX_MODEL_SIZE = 4;
  const MAX_PASSAGE_SELECTION = 800;

  const DEFAULT_USERS = ["henry", "maya", "sam", "lena", "amir"];

  let state = loadState();
  let activeUser = loadActiveUser();

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

    inboxCountBadge: document.getElementById("inboxCountBadge"),
    inboxList: document.getElementById("inboxList"),

    articleFeed: document.getElementById("articleFeed"),

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
    ensureSeedUsers();
    if (!activeUser) {
      activeUser = DEFAULT_USERS[0];
      saveActiveUser(activeUser);
    }
    ensureUser(activeUser);

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
    if (el.articleFeed) {
      el.articleFeed.addEventListener("mouseup", onArticleSelectionMouseUp);
      el.articleFeed.addEventListener("touchend", onArticleSelectionMouseUp);
      el.articleFeed.addEventListener("click", onArticleFeedAction);
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
    if (!el.activeHandleInput) return;
    const next = normalizeHandle(el.activeHandleInput.value);
    if (!next) {
      setArticleStatus("Set a valid handle (letters, numbers, underscore).", true);
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
    ensureUser(activeUser);

    const title = (el.articleTitle && el.articleTitle.value ? el.articleTitle.value : "").trim();
    const body = (el.articleBody && el.articleBody.value ? el.articleBody.value : "").trim();

    if (!title || !body) {
      setArticleStatus("Title and body are required.", true);
      return;
    }

    const mentions = extractMentions(title + "\n" + body);
    const article = {
      id: makeId("art"),
      author: activeUser,
      title: title,
      body: body,
      mentions: mentions,
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
    updateMentionPreview();

    const status =
      notificationCount > 0
        ? "Article published. " + notificationCount + " inbox notification(s) delivered."
        : "Article published. No user was mentioned.";
    setArticleStatus(status, false);

    renderAll();
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
  }

  function saveAnnotationFromEditor(articleId) {
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
    saveState();

    const selection = window.getSelection ? window.getSelection() : null;
    if (selection && typeof selection.removeAllRanges === "function") {
      selection.removeAllRanges();
    }

    setArticleStatus("Passage comment posted.", false);
    renderFeed();
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
    renderFeed();
    updateMentionPreview();
  }

  function renderActiveUser() {
    if (el.activeHandleInput) {
      el.activeHandleInput.value = activeUser || "";
    }
    if (el.activeUserBadge) {
      el.activeUserBadge.textContent = activeUser ? "Active user: @" + activeUser : "No active user";
    }
  }

  function renderKnownUsers() {
    if (!el.knownUsersList) return;
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
      title.innerHTML =
        "<strong>@" +
        escapeHtml(notification.from) +
        " mentioned you in \"" +
        escapeHtml(notification.articleTitle) +
        "\"</strong>";

      const meta = document.createElement("p");
      meta.className = "inbox-meta";
      meta.textContent = relativeTime(notification.createdAt);

      const excerpt = document.createElement("p");
      excerpt.className = "inbox-meta";
      excerpt.innerHTML = "\"" + escapeHtml(notification.excerpt || "") + "\"";

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
    if (!Array.isArray(state.articles) || state.articles.length === 0) {
      el.articleFeed.innerHTML = '<p class="hint">No articles published yet.</p>';
      return;
    }

    el.articleFeed.innerHTML = "";
    state.articles.forEach(function (article) {
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

      const visibleAnnotations = getVisibleAnnotationsForArticle(article);
      const highlightedBody = buildAnnotatedArticleBody(article.body, visibleAnnotations);
      const commentsHtml = renderPassageCommentThread(visibleAnnotations);

      card.innerHTML =
        '<h3 class="article-title">' +
        escapeHtml(article.title) +
        "</h3>" +
        '<p class="article-meta">By @' +
        escapeHtml(article.author) +
        " · " +
        escapeHtml(formatDate(article.createdAt)) +
        "</p>" +
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

  function renderPassageCommentThread(annotations) {
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
        };
      }
      const parsed = JSON.parse(raw);
      return {
        users: parsed && parsed.users && typeof parsed.users === "object" ? parsed.users : {},
        articles: Array.isArray(parsed && parsed.articles) ? parsed.articles : [],
        notifications: Array.isArray(parsed && parsed.notifications) ? parsed.notifications : [],
        annotations: Array.isArray(parsed && parsed.annotations) ? parsed.annotations : [],
      };
    } catch (_error) {
      return {
        users: {},
        articles: [],
        notifications: [],
        annotations: [],
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

  function findArticleById(articleId) {
    return state.articles.find(function (article) {
      return article.id === articleId;
    });
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
