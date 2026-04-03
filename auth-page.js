(function () {
  "use strict";

  var auth = window.NormativityAuth;
  if (!auth) return;

  var dom = {
    signinTab: document.getElementById("signinTab"),
    signupTab: document.getElementById("signupTab"),
    signinPanel: document.getElementById("signinPanel"),
    signupPanel: document.getElementById("signupPanel"),
    signinIdentifier: document.getElementById("signinIdentifier"),
    signinPassword: document.getElementById("signinPassword"),
    signinAcceptTerms: document.getElementById("signinAcceptTerms"),
    signinBtn: document.getElementById("signinBtn"),
    signupDisplayName: document.getElementById("signupDisplayName"),
    signupHandle: document.getElementById("signupHandle"),
    signupBio: document.getElementById("signupBio"),
    signupAvatarPreview: document.getElementById("signupAvatarPreview"),
    signupAvatarBtn: document.getElementById("signupAvatarBtn"),
    signupEmail: document.getElementById("signupEmail"),
    signupPassword: document.getElementById("signupPassword"),
    signupPasswordConfirm: document.getElementById("signupPasswordConfirm"),
    signupAcceptTerms: document.getElementById("signupAcceptTerms"),
    signupBtn: document.getElementById("signupBtn"),
    authStatus: document.getElementById("authStatus"),
    requiredAgreementText: document.getElementById("requiredAgreementText"),
  };

  var nextPath = "index.html";

  function sanitizeNextPath(rawNext) {
    var candidate = String(rawNext || "").trim();
    if (!candidate) return "index.html";
    if (/^javascript:/i.test(candidate)) return "index.html";

    try {
      var parsed = new URL(candidate, window.location.href);
      if (parsed.origin !== window.location.origin) {
        return "index.html";
      }
      if (parsed.pathname.indexOf("/auth.html") >= 0) {
        return "index.html";
      }
      return parsed.pathname + parsed.search + parsed.hash;
    } catch (_error) {
      return "index.html";
    }
  }

  function parseModeFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      var mode = String(params.get("mode") || "signin").toLowerCase();
      var next = String(params.get("next") || "");
      if (next) {
        nextPath = sanitizeNextPath(next);
      }
      if (mode === "signup" || mode === "agreement") {
        return mode;
      }
      return "signin";
    } catch (_error) {
      return "signin";
    }
  }

  function setStatus(text, isError) {
    if (!dom.authStatus) return;
    dom.authStatus.style.color = isError ? "#ab4758" : "#5f615b";
    dom.authStatus.textContent = text;
  }

  function activateMode(mode) {
    var useSignup = mode === "signup";
    if (document.body) {
      document.body.classList.toggle("auth-signup-mode", useSignup);
      document.body.classList.toggle("auth-signin-mode", !useSignup);
    }
    if (dom.signinPanel) dom.signinPanel.classList.toggle("active", !useSignup);
    if (dom.signupPanel) dom.signupPanel.classList.toggle("active", useSignup);
    if (dom.signinTab) dom.signinTab.classList.toggle("active", !useSignup);
    if (dom.signupTab) dom.signupTab.classList.toggle("active", useSignup);

    if (mode === "agreement") {
      if (dom.signinPanel) dom.signinPanel.classList.add("active");
      if (dom.signupPanel) dom.signupPanel.classList.remove("active");
      if (dom.signinTab) dom.signinTab.classList.add("active");
      if (dom.signupTab) dom.signupTab.classList.remove("active");
      setStatus("Sign in and accept the user agreement to continue.", false);
    }
  }

  function redirectAfterAuth() {
    window.location.assign(nextPath || "index.html");
  }

  function onSignIn() {
    var payload = {
      identifier: dom.signinIdentifier && dom.signinIdentifier.value,
      password: dom.signinPassword && dom.signinPassword.value,
      acceptTerms: Boolean(dom.signinAcceptTerms && dom.signinAcceptTerms.checked),
    };

    var result = auth.signIn(payload);
    if (!result.ok) {
      setStatus(result.error || "Unable to sign in.", true);
      return;
    }

    setStatus("Signed in. Redirecting...", false);
    window.setTimeout(redirectAfterAuth, 160);
  }

  function onSignUp() {
    var displayName = dom.signupDisplayName && dom.signupDisplayName.value ? String(dom.signupDisplayName.value).trim() : "";
    var password = dom.signupPassword && dom.signupPassword.value ? String(dom.signupPassword.value) : "";
    var passwordConfirm = dom.signupPasswordConfirm && dom.signupPasswordConfirm.value ? String(dom.signupPasswordConfirm.value) : "";

    if (displayName.length < 2) {
      setStatus("Name must be at least 2 characters.", true);
      return;
    }

    if (password !== passwordConfirm) {
      setStatus("Passwords do not match.", true);
      return;
    }

    var payload = {
      displayName: displayName,
      handle: dom.signupHandle && dom.signupHandle.value,
      bio: dom.signupBio && dom.signupBio.value,
      email: dom.signupEmail && dom.signupEmail.value,
      password: password,
      acceptedTerms: Boolean(dom.signupAcceptTerms && dom.signupAcceptTerms.checked),
    };

    var result = auth.signUp(payload);
    if (!result.ok) {
      setStatus(result.error || "Unable to create account.", true);
      return;
    }

    setStatus("Account created. Redirecting...", false);
    window.setTimeout(redirectAfterAuth, 160);
  }

  function bindEvents() {
    if (dom.signinTab) {
      dom.signinTab.addEventListener("click", function () {
        activateMode("signin");
      });
    }
    if (dom.signupTab) {
      dom.signupTab.addEventListener("click", function () {
        activateMode("signup");
      });
    }
    if (dom.signinBtn) {
      dom.signinBtn.addEventListener("click", onSignIn);
    }
    if (dom.signupBtn) {
      dom.signupBtn.addEventListener("click", onSignUp);
    }

    if (dom.signupAvatarBtn) {
      dom.signupAvatarBtn.addEventListener("click", function () {
        setStatus("Profile photo upload is coming soon.", false);
      });
    }

    if (dom.signinPassword) {
      dom.signinPassword.addEventListener("keydown", function (event) {
        if (event.key !== "Enter") return;
        event.preventDefault();
        onSignIn();
      });
    }

    if (dom.signupPasswordConfirm) {
      dom.signupPasswordConfirm.addEventListener("keydown", function (event) {
        if (event.key !== "Enter") return;
        event.preventDefault();
        onSignUp();
      });
    }

    if (dom.signupHandle) {
      dom.signupHandle.addEventListener("input", updateSignupAvatarPreview);
    }
    if (dom.signupDisplayName) {
      dom.signupDisplayName.addEventListener("input", updateSignupAvatarPreview);
    }
  }

  function updateSignupAvatarPreview() {
    if (!dom.signupAvatarPreview) return;
    var rawName = dom.signupDisplayName && dom.signupDisplayName.value ? String(dom.signupDisplayName.value).trim() : "";
    var rawHandle = dom.signupHandle && dom.signupHandle.value ? String(dom.signupHandle.value).trim() : "";
    var fallback = rawName || rawHandle || "Normativity";
    var initial = fallback.charAt(0).toUpperCase();
    dom.signupAvatarPreview.textContent = initial;
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (dom.requiredAgreementText) {
      dom.requiredAgreementText.textContent = auth.requiredAgreementText;
    }

    var mode = parseModeFromUrl();
    activateMode(mode);
    bindEvents();
    updateSignupAvatarPreview();

    var currentUser = auth.getCurrentUser();
    if (currentUser && mode !== "agreement") {
      redirectAfterAuth();
    }
  });
})();
