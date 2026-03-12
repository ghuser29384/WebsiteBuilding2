(function () {
  "use strict";

  var auth = window.NormativityAuth;
  if (!auth) return;

  var STORAGE_KEYS = {
    dialogue: "normativity-dialogue-state-v1",
    market: "normativity-market-state-v4",
    marketLegacy: "normativity-market-state-v3",
    publication: "normativity-publications-v1",
    wre: "normativity-wre-assistant-session-v1",
  };

  var dom = {
    profileTitle: document.getElementById("profileTitle"),
    profileSubtitle: document.getElementById("profileSubtitle"),
    profileMetrics: document.getElementById("profileMetrics"),
    profileConversations: document.getElementById("profileConversations"),
    profileArticles: document.getElementById("profileArticles"),
    profileNotifications: document.getElementById("profileNotifications"),
    profileWre: document.getElementById("profileWre"),
    profilePledges: document.getElementById("profilePledges"),
    profileSuggestedPledges: document.getElementById("profileSuggestedPledges"),
  };

  function parseJson(raw, fallback) {
    try {
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (_error) {
      return fallback;
    }
  }

  function readFromLocalStorage(keys, fallback) {
    for (var i = 0; i < keys.length; i += 1) {
      var raw = window.localStorage.getItem(keys[i]);
      if (!raw) continue;
      return parseJson(raw, fallback);
    }
    return fallback;
  }

  function formatDate(iso) {
    var date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return "unknown date";
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function normalizeHandle(value) {
    return String(value || "")
      .trim()
      .replace(/^@+/, "")
      .toLowerCase();
  }

  function truncate(text, maxLen) {
    var value = String(text || "").replace(/\s+/g, " ").trim();
    if (value.length <= maxLen) return value;
    return value.slice(0, Math.max(0, maxLen - 1)).trimEnd() + "…";
  }

  function renderList(element, lines) {
    if (!element) return;
    element.innerHTML = "";
    if (!Array.isArray(lines) || lines.length === 0) {
      var emptyItem = document.createElement("li");
      emptyItem.className = "hint";
      emptyItem.textContent = "No records yet.";
      element.appendChild(emptyItem);
      return;
    }
    lines.forEach(function (line) {
      var item = document.createElement("li");
      item.textContent = String(line || "");
      element.appendChild(item);
    });
  }

  function renderGuestProfile() {
    if (dom.profileTitle) {
      dom.profileTitle.textContent = "Guest Profile";
    }
    if (dom.profileSubtitle) {
      dom.profileSubtitle.textContent =
        "Sign in to view your saved conversations, articles, and pledges. Browsing is available without an account.";
    }
    if (dom.profileMetrics) {
      dom.profileMetrics.innerHTML = "";
    }

    renderList(dom.profileConversations, ["Sign in to view your saved conversations."]);
    renderList(dom.profileArticles, ["Sign in to view your published articles."]);
    renderList(dom.profileNotifications, ["Sign in to view notifications and replies."]);
    renderList(dom.profileWre, ["Sign in to view your reflective equilibrium sessions."]);
    renderList(dom.profilePledges, ["Sign in to view your pledges."]);
    renderList(dom.profileSuggestedPledges, ["Sign in to see suggested pledges based on your activity."]);
  }

  function collectProfileData(user) {
    var handle = normalizeHandle(user && user.handle);

    var dialogueState = readFromLocalStorage(
      [auth.scopedStorageKey(STORAGE_KEYS.dialogue), STORAGE_KEYS.dialogue],
      {
        pledge: { signed: false, name: "", role: "", focus: "", firstAction: "", signedAt: "" },
        pledgeRegistry: [],
        convictions: [],
        sessions: [],
        ledger: [],
      }
    );

    var marketState = readFromLocalStorage(
      [auth.scopedStorageKey(STORAGE_KEYS.market), auth.scopedStorageKey(STORAGE_KEYS.marketLegacy), STORAGE_KEYS.market, STORAGE_KEYS.marketLegacy],
      {
        positions: [],
        activity: [],
        history: [],
      }
    );

    var publicationState = readFromLocalStorage([STORAGE_KEYS.publication], {
      users: {},
      articles: [],
      notifications: [],
      annotations: [],
      annotationReplies: [],
    });

    var wreState = readFromLocalStorage([auth.scopedStorageKey(STORAGE_KEYS.wre), STORAGE_KEYS.wre], {
      judgments: [],
      principles: [],
      theories: [],
      links: [],
      reflections: [],
      savedAt: "",
    });

    var ownArticles = (Array.isArray(publicationState.articles) ? publicationState.articles : []).filter(function (article) {
      return normalizeHandle(article.author) === handle;
    });

    var ownNotifications = (Array.isArray(publicationState.notifications) ? publicationState.notifications : []).filter(function (item) {
      return normalizeHandle(item.to) === handle;
    });

    var ownAnnotations = (Array.isArray(publicationState.annotations) ? publicationState.annotations : []).filter(function (annotation) {
      return normalizeHandle(annotation.author) === handle;
    });

    var annotationReplies = Array.isArray(publicationState.annotationReplies) ? publicationState.annotationReplies : [];
    var ownRepliesReceived = annotationReplies.filter(function (reply) {
      return normalizeHandle(reply.targetAuthor) === handle;
    });

    return {
      user: user,
      dialogueState: dialogueState,
      marketState: marketState,
      publicationState: publicationState,
      wreState: wreState,
      ownArticles: ownArticles,
      ownNotifications: ownNotifications,
      ownAnnotations: ownAnnotations,
      ownRepliesReceived: ownRepliesReceived,
    };
  }

  function buildSuggestedPledges(data) {
    var suggestions = [];
    var seen = {};

    function addSuggestion(text, source) {
      var cleanText = String(text || "").trim();
      var cleanSource = String(source || "").trim();
      if (!cleanText || !cleanSource) return;
      var key = cleanText.toLowerCase();
      if (seen[key]) return;
      seen[key] = true;
      suggestions.push(cleanText + " (Source: " + cleanSource + ")");
    }

    var positions = Array.isArray(data.marketState.positions) ? data.marketState.positions : [];
    positions.forEach(function (position) {
      if ((position.coins || 0) < 12) return;
      var marketId = String(position.marketId || "");
      var optionId = String(position.optionId || "");

      if (marketId === "factory-farm-meat" && optionId === "yes") {
        addSuggestion("I will avoid buying factory-farmed meat and record substitutions weekly.", "Moral Market votes");
      }
      if (marketId === "fast-fashion" && optionId === "no") {
        addSuggestion("I will pause non-essential fast-fashion purchases and audit alternatives.", "Moral Market votes");
      }
      if (marketId === "wealth-redistribution" && optionId === "yes") {
        addSuggestion("I will set a recurring donation target aligned with my judged obligations.", "Moral Market votes");
      }
      if (marketId === "civil-disobedience" && optionId === "yes") {
        addSuggestion("I will support a lawful or nonviolent campaign challenging serious injustice.", "Moral Market votes");
      }
      if (marketId === "ai-surveillance" && optionId === "no") {
        addSuggestion("I will prioritize privacy-preserving tools and oppose unnecessary surveillance.", "Moral Market votes");
      }
    });

    var convictionsById = {};
    (Array.isArray(data.dialogueState.convictions) ? data.dialogueState.convictions : []).forEach(function (conviction) {
      convictionsById[conviction.id] = conviction;
    });

    (Array.isArray(data.dialogueState.sessions) ? data.dialogueState.sessions : []).forEach(function (session) {
      if ((session.postConfidence || 0) <= 50) return;
      var conviction = convictionsById[session.convictionId];
      if (!conviction) return;
      var implication = String(conviction.implication || "").trim();
      if (!implication) return;
      addSuggestion("I will execute this implication from my dialogue outcome: " + truncate(implication, 110), "Conversation outcomes");
    });

    if (suggestions.length === 0) {
      addSuggestion(
        "I will choose one current conviction above 50% confidence and define one concrete 7-day action.",
        "Profile baseline"
      );
    }

    return suggestions.slice(0, 7);
  }

  function formatNotification(item) {
    var from = item.from ? "@" + item.from : "someone";
    var type = String(item.type || "mention");
    if (type === "comment") {
      return "" + from + " commented on your article \"" + truncate(item.articleTitle || "untitled", 40) + "\".";
    }
    if (type === "reply") {
      return "" + from + " replied to your passage comment in \"" + truncate(item.articleTitle || "untitled", 40) + "\".";
    }
    if (type === "mention") {
      return "" + from + " mentioned you in \"" + truncate(item.articleTitle || "untitled", 40) + "\".";
    }
    return from + " sent a notification.";
  }

  function renderProfile(data) {
    var user = data.user;

    if (dom.profileTitle) {
      dom.profileTitle.textContent = "@" + user.handle + " · Profile";
    }
    if (dom.profileSubtitle) {
      dom.profileSubtitle.textContent =
        "Signed in as " + user.email + " • Terms accepted: " + (user.acceptedAt ? formatDate(user.acceptedAt) : "yes");
    }

    var sessions = Array.isArray(data.dialogueState.sessions) ? data.dialogueState.sessions : [];
    var ledger = Array.isArray(data.dialogueState.ledger) ? data.dialogueState.ledger : [];
    var unreadNotifications = data.ownNotifications.filter(function (item) {
      return !item.read;
    }).length;

    if (dom.profileMetrics) {
      dom.profileMetrics.innerHTML =
        '<article class="profile-metric"><p class="label">Conversations</p><p class="value">' +
        sessions.length +
        "</p></article>" +
        '<article class="profile-metric"><p class="label">Articles</p><p class="value">' +
        data.ownArticles.length +
        "</p></article>" +
        '<article class="profile-metric"><p class="label">Unread Notifications</p><p class="value">' +
        unreadNotifications +
        "</p></article>" +
        '<article class="profile-metric"><p class="label">Open Action Items</p><p class="value">' +
        ledger.filter(function (item) {
          return item.status !== "done";
        }).length +
        "</p></article>";
    }

    var convictionsById = {};
    (Array.isArray(data.dialogueState.convictions) ? data.dialogueState.convictions : []).forEach(function (conviction) {
      convictionsById[conviction.id] = conviction;
    });

    var conversationLines = sessions.slice(0, 8).map(function (session) {
      var conviction = convictionsById[session.convictionId];
      var claim = conviction ? truncate(conviction.claim, 76) : "Unknown claim";
      return (
        claim +
        " • post-dialogue confidence " +
        Math.round(Number(session.postConfidence || 0)) +
        "% • " +
        formatDate(session.createdAt)
      );
    });
    renderList(dom.profileConversations, conversationLines);

    var articleLines = data.ownArticles.slice(0, 8).map(function (article) {
      var commentCount = (Array.isArray(data.publicationState.annotations) ? data.publicationState.annotations : []).filter(function (annotation) {
        return annotation.articleId === article.id;
      }).length;
      return (
        truncate(article.title, 78) +
        " • " +
        commentCount +
        " passage comments • " +
        formatDate(article.createdAt)
      );
    });
    renderList(dom.profileArticles, articleLines);

    var notificationLines = data.ownNotifications
      .slice(0, 10)
      .map(function (item) {
        var prefix = item.read ? "" : "[Unread] ";
        return prefix + formatNotification(item) + " • " + formatDate(item.createdAt);
      });

    var notificationReplyIds = {};
    data.ownNotifications.forEach(function (item) {
      if (!item || !item.replyId) return;
      notificationReplyIds[String(item.replyId)] = true;
    });

    var replyLines = data.ownRepliesReceived
      .filter(function (reply) {
        return !notificationReplyIds[String(reply.id || "")];
      })
      .slice(0, 4)
      .map(function (reply) {
        return (
          "[Reply] @" +
          String(reply.author || "user") +
          " replied to your comment • " +
          truncate(reply.text || "", 90) +
          " • " +
          formatDate(reply.createdAt)
        );
      });

    renderList(dom.profileNotifications, notificationLines.concat(replyLines));

    var wre = data.wreState || {};
    var wreLines = [
      "Judgments: " + (Array.isArray(wre.judgments) ? wre.judgments.length : 0),
      "Principles: " + (Array.isArray(wre.principles) ? wre.principles.length : 0),
      "Background theories: " + (Array.isArray(wre.theories) ? wre.theories.length : 0),
      "Recorded reflections: " + (Array.isArray(wre.reflections) ? wre.reflections.length : 0),
      "Last saved: " + (wre.savedAt ? formatDate(wre.savedAt) : "No saved session"),
    ];
    renderList(dom.profileWre, wreLines);

    var pledge = data.dialogueState.pledge || { signed: false };
    var pledgeRegistry = Array.isArray(data.dialogueState.pledgeRegistry) ? data.dialogueState.pledgeRegistry : [];

    var pledgeLines = [
      pledge.signed
        ? "Signed: yes (" + formatDate(pledge.signedAt) + ")"
        : "Signed: no",
      "Role: " + String(pledge.role || "Not set"),
      "Focus area: " + String(pledge.focus || "Not set"),
      "First action: " + (pledge.firstAction ? truncate(pledge.firstAction, 110) : "Not set"),
      "Registry entries in your workspace: " + pledgeRegistry.length,
    ];
    renderList(dom.profilePledges, pledgeLines);

    var suggestedPledges = buildSuggestedPledges(data);
    renderList(dom.profileSuggestedPledges, suggestedPledges);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var user = auth.getCurrentUser();
    if (!user) {
      renderGuestProfile();
      return;
    }
    var data = collectProfileData(user);
    renderProfile(data);
  });
})();
