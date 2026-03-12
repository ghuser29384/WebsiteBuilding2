(function () {
  "use strict";

  var USERS_KEY = "normativity-auth-users-v1";
  var SESSION_KEY = "normativity-auth-session-v1";
  var TERMS_VERSION = "normativity-terms-v1";

  var REQUIRED_AGREEMENT_TEXT =
    "By using Normativity, I commit to:\n\n" +
    "(1) openly and honestly examining my beliefs;\n\n" +
    "(2) treating others with kindness and fairness; and\n\n" +
    "(3) after considering my beliefs,\n" +
    "    (a) avoiding actions I judge to have more than a 50% chance of being morally wrong, and\n" +
    "    (b) choosing the action I judge least likely to be wrong.";

  // Keep empty to allow browsing the site without authentication.
  var GATED_PAGE_NAMES = {};

  function parseJson(raw, fallback) {
    try {
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (_error) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizeHandle(value) {
    return String(value || "")
      .trim()
      .replace(/^@+/, "")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 24);
  }

  function passwordHash(password) {
    var normalized = String(password || "");
    var hash = 0;
    for (var i = 0; i < normalized.length; i += 1) {
      hash = (hash << 5) - hash + normalized.charCodeAt(i) + 17;
      hash |= 0;
    }
    return "h" + Math.abs(hash).toString(36);
  }

  function uid(prefix) {
    return prefix + "_" + Math.random().toString(36).slice(2, 10);
  }

  function getUsers() {
    var users = parseJson(window.localStorage.getItem(USERS_KEY), []);
    return Array.isArray(users) ? users : [];
  }

  function saveUsers(users) {
    saveJson(USERS_KEY, users);
  }

  function setSession(userId) {
    saveJson(SESSION_KEY, {
      userId: userId,
      signedInAt: new Date().toISOString(),
    });
  }

  function clearSession() {
    window.localStorage.removeItem(SESSION_KEY);
  }

  function getSession() {
    var data = parseJson(window.localStorage.getItem(SESSION_KEY), null);
    if (!data || typeof data !== "object") return null;
    return data;
  }

  function getCurrentUser() {
    var session = getSession();
    if (!session || !session.userId) return null;
    var users = getUsers();
    for (var i = 0; i < users.length; i += 1) {
      if (users[i].id === session.userId) {
        return users[i];
      }
    }
    return null;
  }

  function updateUser(userId, updater) {
    var users = getUsers();
    var changed = false;
    for (var i = 0; i < users.length; i += 1) {
      if (users[i].id === userId) {
        users[i] = updater(users[i]);
        changed = true;
        break;
      }
    }
    if (changed) {
      saveUsers(users);
    }
  }

  function signUp(payload) {
    var handle = normalizeHandle(payload && payload.handle);
    var email = normalizeEmail(payload && payload.email);
    var password = String(payload && payload.password ? payload.password : "");
    var acceptedTerms = Boolean(payload && payload.acceptedTerms);

    if (!handle || handle.length < 2) {
      return { ok: false, error: "Username must be at least 2 characters (letters, numbers, underscore)." };
    }
    if (!email || !/^.+@.+\..+$/.test(email)) {
      return { ok: false, error: "Please provide a valid email address." };
    }
    if (password.length < 6) {
      return { ok: false, error: "Password must be at least 6 characters." };
    }
    if (!acceptedTerms) {
      return { ok: false, error: "You must agree to the Normativity commitment to use the platform." };
    }

    var users = getUsers();
    var handleTaken = users.some(function (user) {
      return normalizeHandle(user.handle) === handle;
    });
    if (handleTaken) {
      return { ok: false, error: "That username is already in use." };
    }

    var emailTaken = users.some(function (user) {
      return normalizeEmail(user.email) === email;
    });
    if (emailTaken) {
      return { ok: false, error: "That email is already registered." };
    }

    var now = new Date().toISOString();
    var user = {
      id: uid("user"),
      handle: handle,
      email: email,
      passwordHash: passwordHash(password),
      acceptedTerms: true,
      termsVersion: TERMS_VERSION,
      acceptedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    users.push(user);
    saveUsers(users);
    setSession(user.id);

    return { ok: true, user: user };
  }

  function signIn(payload) {
    var identifier = String(payload && payload.identifier ? payload.identifier : "").trim();
    var password = String(payload && payload.password ? payload.password : "");
    var acceptTerms = Boolean(payload && payload.acceptTerms);

    if (!identifier || !password) {
      return { ok: false, error: "Enter your email/username and password." };
    }

    var handleGuess = normalizeHandle(identifier);
    var emailGuess = normalizeEmail(identifier);
    var users = getUsers();
    var user = null;

    for (var i = 0; i < users.length; i += 1) {
      var matchByHandle = normalizeHandle(users[i].handle) === handleGuess;
      var matchByEmail = normalizeEmail(users[i].email) === emailGuess;
      if (matchByHandle || matchByEmail) {
        user = users[i];
        break;
      }
    }

    if (!user) {
      return { ok: false, error: "Account not found." };
    }
    if (user.passwordHash !== passwordHash(password)) {
      return { ok: false, error: "Incorrect password." };
    }

    var needsTermsAcceptance = !user.acceptedTerms || user.termsVersion !== TERMS_VERSION;
    if (needsTermsAcceptance && !acceptTerms) {
      return {
        ok: false,
        error: "You must accept the Normativity commitment before continuing.",
        requiresTerms: true,
      };
    }

    if (needsTermsAcceptance && acceptTerms) {
      updateUser(user.id, function (current) {
        return Object.assign({}, current, {
          acceptedTerms: true,
          termsVersion: TERMS_VERSION,
          acceptedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
      user = getCurrentUserById(user.id);
    }

    setSession(user.id);
    return { ok: true, user: user };
  }

  function getCurrentUserById(userId) {
    var users = getUsers();
    for (var i = 0; i < users.length; i += 1) {
      if (users[i].id === userId) {
        return users[i];
      }
    }
    return null;
  }

  function signOut() {
    clearSession();
  }

  function getCurrentPath() {
    var path = window.location.pathname || "/";
    var search = window.location.search || "";
    var hash = window.location.hash || "";
    return path + search + hash;
  }

  function buildAuthRedirectUrl(mode) {
    var next = encodeURIComponent(getCurrentPath());
    var query = "?mode=" + encodeURIComponent(mode || "signin") + "&next=" + next;
    return "auth.html" + query;
  }

  function shouldGatePage() {
    var path = window.location.pathname || "";
    var page = path.split("/").pop() || "";
    return Boolean(GATED_PAGE_NAMES[page]);
  }

  function requireAccess() {
    if (!shouldGatePage()) return true;
    var user = getCurrentUser();
    if (!user) {
      window.location.assign(buildAuthRedirectUrl("signin"));
      return false;
    }
    if (!user.acceptedTerms || user.termsVersion !== TERMS_VERSION) {
      window.location.assign(buildAuthRedirectUrl("agreement"));
      return false;
    }
    return true;
  }

  function scopedStorageKey(baseKey) {
    var user = getCurrentUser();
    if (!user || !user.id) return baseKey + "--guest";
    return baseKey + "--" + user.id;
  }

  function renderHeaderControls() {
    var user = getCurrentUser();
    var headerTools = document.querySelector(".header-tools");
    var wreTopbar = document.querySelector(".wre-topbar-inner");
    var host = headerTools || wreTopbar;
    if (!host) return;

    var existing = host.querySelector("[data-auth-controls]");
    if (existing) {
      existing.remove();
    }

    var controls = document.createElement("div");
    controls.className = "auth-controls";
    controls.setAttribute("data-auth-controls", "true");

    if (user) {
      controls.innerHTML =
        '<span class="auth-chip">@' +
        escapeHtml(user.handle) +
        "</span>" +
        '<a class="auth-link" href="profile.html">Profile</a>' +
        '<button type="button" class="auth-signout" data-auth-signout="true">Sign out</button>';
    } else {
      controls.innerHTML =
        '<a class="auth-link" href="auth.html?mode=signin">Sign in</a>' +
        '<a class="auth-link auth-link-strong" href="auth.html?mode=signup">Sign up</a>';
    }

    host.appendChild(controls);

    var signOutBtn = controls.querySelector("[data-auth-signout]");
    if (signOutBtn) {
      signOutBtn.addEventListener("click", function () {
        signOut();
        window.location.assign("auth.html?mode=signin");
      });
    }
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  window.NormativityAuth = {
    usersKey: USERS_KEY,
    sessionKey: SESSION_KEY,
    termsVersion: TERMS_VERSION,
    requiredAgreementText: REQUIRED_AGREEMENT_TEXT,
    getUsers: getUsers,
    getCurrentUser: getCurrentUser,
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    requireAccess: requireAccess,
    scopedStorageKey: scopedStorageKey,
    renderHeaderControls: renderHeaderControls,
  };

  if (requireAccess()) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        renderHeaderControls();
      });
    } else {
      renderHeaderControls();
    }
  }
})();
