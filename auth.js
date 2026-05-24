(function () {
  "use strict";

  var USERS_KEY = "normativity-auth-users-v1";
  var SESSION_KEY = "normativity-auth-session-v1";
  var TERMS_VERSION = "normativity-terms-v1";
  var PUBLIC_CONFIG_ENDPOINT = "/api/public-config";
  var authReadyPromise = null;
  var publicConfigPromise = null;
  var publicConfig = null;

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

  function setSession(userId, authData) {
    saveJson(SESSION_KEY, Object.assign({
      userId: userId,
      signedInAt: new Date().toISOString(),
    }, authData || {}));
  }

  function clearSession() {
    window.localStorage.removeItem(SESSION_KEY);
  }

  function getSession() {
    var data = parseJson(window.localStorage.getItem(SESSION_KEY), null);
    if (!data || typeof data !== "object") return null;
    return data;
  }

  function getAccessToken() {
    var session = getSession();
    if (!session || !session.accessToken) return "";
    if (session.expiresAt && Date.now() > Number(session.expiresAt) - 60000) {
      refreshSupabaseSession(false);
    }
    return String(session.accessToken || "");
  }

  function getPublicConfigFallback() {
    return {
      supabaseUrl: String(window.NORMATIVITY_SUPABASE_URL || "").replace(/\/+$/, ""),
      supabaseAnonKey: String(window.NORMATIVITY_SUPABASE_ANON_KEY || ""),
    };
  }

  function shouldFetchPublicConfig() {
    var hostname = window.location && window.location.hostname ? String(window.location.hostname) : "";
    var protocol = window.location && window.location.protocol ? String(window.location.protocol) : "";
    var isLocalHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "";
    return (protocol === "https:" || protocol === "http:") && !isLocalHost;
  }

  function loadPublicConfig() {
    if (publicConfigPromise) return publicConfigPromise;
    publicConfigPromise = Promise.resolve()
      .then(function () {
        if (!shouldFetchPublicConfig()) {
          return getPublicConfigFallback();
        }
        return fetch(PUBLIC_CONFIG_ENDPOINT, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
          .then(function (response) {
            if (!response.ok) throw new Error("Public config request failed.");
            return response.json();
          })
          .catch(function () {
            return getPublicConfigFallback();
          });
      })
      .then(function (config) {
        publicConfig = {
          supabaseUrl: String(config && config.supabaseUrl ? config.supabaseUrl : "").replace(/\/+$/, ""),
          supabaseAnonKey: String(config && config.supabaseAnonKey ? config.supabaseAnonKey : ""),
        };
        return publicConfig;
      });
    return publicConfigPromise;
  }

  function hasSupabaseConfig() {
    return Boolean(publicConfig && publicConfig.supabaseUrl && publicConfig.supabaseAnonKey);
  }

  function supabaseRequest(path, options) {
    var config = publicConfig || getPublicConfigFallback();
    var init = options || {};
    var headers = Object.assign({
      apikey: config.supabaseAnonKey,
      "Content-Type": "application/json",
    }, init.headers || {});
    return fetch(config.supabaseUrl + path, {
      method: init.method || "GET",
      headers: headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    }).then(function (response) {
      return response.text().then(function (text) {
        var payload = null;
        try {
          payload = text ? JSON.parse(text) : null;
        } catch (_error) {
          payload = { raw: text };
        }
        if (!response.ok) {
          var message =
            payload && payload.msg
              ? String(payload.msg)
              : payload && payload.error_description
                ? String(payload.error_description)
                : payload && payload.error
                  ? String(payload.error)
                  : "Supabase authentication request failed.";
          throw new Error(message);
        }
        return payload;
      });
    });
  }

  function upsertLocalUser(user) {
    var users = getUsers();
    var changed = false;
    for (var i = 0; i < users.length; i += 1) {
      if (users[i].id === user.id || normalizeEmail(users[i].email) === normalizeEmail(user.email)) {
        users[i] = Object.assign({}, users[i], user, { updatedAt: new Date().toISOString() });
        changed = true;
        break;
      }
    }
    if (!changed) {
      users.push(user);
    }
    saveUsers(users);
    return user;
  }

  function normalizeSupabaseUser(record, fallback) {
    var metadata = record && record.user_metadata && typeof record.user_metadata === "object"
      ? record.user_metadata
      : {};
    var email = normalizeEmail((record && record.email) || (fallback && fallback.email));
    var handle = normalizeHandle(metadata.handle || (fallback && fallback.handle) || (email ? email.split("@")[0] : ""));
    var now = new Date().toISOString();
    return {
      id: String(record && record.id ? record.id : uid("user")),
      displayName: String(metadata.display_name || metadata.displayName || (fallback && fallback.displayName) || handle || "Normativity member").slice(0, 80),
      handle: handle || "member",
      bio: String(metadata.bio || (fallback && fallback.bio) || "").slice(0, 400),
      email: email,
      passwordHash: "supabase-managed",
      provider: "supabase",
      acceptedTerms: Boolean(metadata.accepted_terms || (fallback && fallback.acceptedTerms)),
      termsVersion: String(metadata.terms_version || TERMS_VERSION),
      acceptedAt: String(metadata.accepted_at || now),
      createdAt: String((record && record.created_at) || now),
      updatedAt: now,
    };
  }

  function persistSupabaseAuth(payload, fallback) {
    var supabaseUser = payload && payload.user ? payload.user : null;
    if (!supabaseUser) return null;
    var user = upsertLocalUser(normalizeSupabaseUser(supabaseUser, fallback));
    var expiresAt = payload.expires_at
      ? Number(payload.expires_at) * 1000
      : payload.expires_in
        ? Date.now() + Number(payload.expires_in) * 1000
        : 0;
    setSession(user.id, {
      provider: "supabase",
      accessToken: String(payload.access_token || ""),
      refreshToken: String(payload.refresh_token || ""),
      expiresAt: expiresAt,
      tokenType: String(payload.token_type || "bearer"),
    });
    return user;
  }

  function refreshSupabaseSession(force) {
    var session = getSession();
    if (!session || session.provider !== "supabase" || !session.refreshToken) {
      return Promise.resolve(null);
    }
    if (!force && session.expiresAt && Date.now() < Number(session.expiresAt) - 60000) {
      return Promise.resolve(session);
    }
    return loadPublicConfig().then(function () {
      if (!hasSupabaseConfig()) return null;
      return supabaseRequest("/auth/v1/token?grant_type=refresh_token", {
        method: "POST",
        body: { refresh_token: session.refreshToken },
      })
        .then(function (payload) {
          return persistSupabaseAuth(payload, getCurrentUser());
        })
        .catch(function () {
          clearSession();
          return null;
        });
    });
  }

  function ready() {
    if (!authReadyPromise) {
      authReadyPromise = loadPublicConfig()
        .then(function () {
          return refreshSupabaseSession(false);
        })
        .catch(function () {
          return null;
        });
    }
    return authReadyPromise;
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
    var displayName = String(payload && payload.displayName ? payload.displayName : "").trim().slice(0, 80);
    var handle = normalizeHandle(payload && payload.handle);
    var bio = String(payload && payload.bio ? payload.bio : "").trim().slice(0, 400);
    var email = normalizeEmail(payload && payload.email);
    var password = String(payload && payload.password ? payload.password : "");
    var acceptedTerms = Boolean(payload && payload.acceptedTerms);

    if (!displayName || displayName.length < 2) {
      return { ok: false, error: "Name must be at least 2 characters." };
    }
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

    var emailTaken = users.some(function (user) {
      return normalizeEmail(user.email) === email;
    });

    return loadPublicConfig().then(function () {
      if (hasSupabaseConfig()) {
        return supabaseRequest("/auth/v1/signup", {
          method: "POST",
          body: {
            email: email,
            password: password,
            data: {
              display_name: displayName,
              handle: handle,
              bio: bio,
              accepted_terms: true,
              terms_version: TERMS_VERSION,
              accepted_at: new Date().toISOString(),
            },
          },
        }).then(function (payload) {
          var user = payload && payload.user
            ? upsertLocalUser(normalizeSupabaseUser(payload.user, {
                displayName: displayName,
                handle: handle,
                bio: bio,
                email: email,
                acceptedTerms: true,
              }))
            : null;
          if (payload && payload.access_token) {
            user = persistSupabaseAuth(payload, {
              displayName: displayName,
              handle: handle,
              bio: bio,
              email: email,
              acceptedTerms: true,
            });
          }
          if (!payload || !payload.access_token) {
            return {
              ok: true,
              user: user,
              pendingConfirmation: true,
              message: "Account created. Check your email to confirm the account, then sign in.",
            };
          }
          return { ok: true, user: user };
        }).catch(function (error) {
          return { ok: false, error: error && error.message ? error.message : "Unable to create account." };
        });
      }
      if (handleTaken) {
        return { ok: false, error: "That username is already in use." };
      }
      if (emailTaken) {
        return { ok: false, error: "That email is already registered." };
      }

      var now = new Date().toISOString();
      var user = {
        id: uid("user"),
        displayName: displayName,
        handle: handle,
        bio: bio,
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
    });
  }

  function signIn(payload) {
    var identifier = String(payload && payload.identifier ? payload.identifier : "").trim();
    var password = String(payload && payload.password ? payload.password : "");
    var acceptTerms = Boolean(payload && payload.acceptTerms);

    if (!identifier || !password) {
      return { ok: false, error: "Enter your email/username and password." };
    }

    return loadPublicConfig().then(function () {
      if (hasSupabaseConfig()) {
        var supabaseEmail = normalizeEmail(identifier);
        if (!/^.+@.+\..+$/.test(supabaseEmail)) {
          var knownUsers = getUsers();
          for (var knownIndex = 0; knownIndex < knownUsers.length; knownIndex += 1) {
            if (normalizeHandle(knownUsers[knownIndex].handle) === normalizeHandle(identifier)) {
              supabaseEmail = normalizeEmail(knownUsers[knownIndex].email);
              break;
            }
          }
        }
        if (!/^.+@.+\..+$/.test(supabaseEmail)) {
          return { ok: false, error: "Use your email address to sign in." };
        }
        return supabaseRequest("/auth/v1/token?grant_type=password", {
          method: "POST",
          body: {
            email: supabaseEmail,
            password: password,
          },
        }).then(function (payload) {
          var user = persistSupabaseAuth(payload, {
            email: supabaseEmail,
            acceptedTerms: acceptTerms,
          });
          if (!user) {
            return { ok: false, error: "Unable to load account from Supabase." };
          }
          if ((!user.acceptedTerms || user.termsVersion !== TERMS_VERSION) && !acceptTerms) {
            return {
              ok: false,
              error: "You must accept the Normativity commitment before continuing.",
              requiresTerms: true,
            };
          }
          if ((!user.acceptedTerms || user.termsVersion !== TERMS_VERSION) && acceptTerms) {
            updateUser(user.id, function (current) {
              return Object.assign({}, current, {
                acceptedTerms: true,
                termsVersion: TERMS_VERSION,
                acceptedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            });
          }
          return { ok: true, user: getCurrentUserById(user.id) || user };
        }).catch(function (error) {
          return { ok: false, error: error && error.message ? error.message : "Unable to sign in." };
        });
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
    });
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
    var session = getSession();
    clearSession();
    if (session && session.provider === "supabase" && session.accessToken) {
      loadPublicConfig().then(function () {
        if (!hasSupabaseConfig()) return;
        return supabaseRequest("/auth/v1/logout", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + session.accessToken,
          },
        }).catch(function () {
          return null;
        });
      });
    }
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
    var wreTopbar = document.querySelector(".wre-topbar-inner, .wre-topbar .wre-shell");
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
        var currentPath = window.location.pathname || "";
        var page = currentPath.split("/").pop() || "";
        if (page === "auth.html") {
          window.location.assign("index.html");
          return;
        }
        window.location.reload();
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
    getSession: getSession,
    getAccessToken: getAccessToken,
    getCurrentUser: getCurrentUser,
    ready: ready,
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
    ready().then(function () {
      renderHeaderControls();
    });
  }
})();
