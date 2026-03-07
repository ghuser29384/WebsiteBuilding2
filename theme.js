(function () {
  "use strict";

  var prefersReducedMotion = false;
  try {
    prefersReducedMotion = Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  } catch (_error) {
    prefersReducedMotion = false;
  }

  function setupScrollProgress() {
    if (document.querySelector(".scroll-progress")) return;

    var progressWrap = document.createElement("div");
    progressWrap.className = "scroll-progress";
    progressWrap.setAttribute("aria-hidden", "true");
    var progressBar = document.createElement("span");
    progressWrap.appendChild(progressBar);
    document.body.appendChild(progressWrap);

    function update() {
      var doc = document.documentElement;
      var scrollRange = Math.max(1, doc.scrollHeight - window.innerHeight);
      var ratio = Math.max(0, Math.min(1, window.scrollY / scrollRange));
      progressBar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  function setupRevealOnScroll() {
    var selectors = [
      ".section",
      ".hero",
      ".board",
      ".panel",
      ".publication-card",
      ".profile-card",
      ".wre-panel",
      ".explainer-panel",
      ".normative-hero",
      ".market-card",
      ".ticket",
      ".side-panel"
    ];

    var sourceNodes = document.querySelectorAll(selectors.join(","));
    if (!sourceNodes.length) return;
    var nodes = [];

    sourceNodes.forEach(function (node) {
      if (node.hasAttribute("hidden") || node.classList.contains("hidden")) return;
      nodes.push(node);
      if (!node.classList.contains("theme-reveal")) {
        node.classList.add("theme-reveal");
      }
    });
    if (!nodes.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      nodes.forEach(function (node) {
        node.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    nodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  function setupAnchorScrollOffset() {
    var links = document.querySelectorAll('a[href^="#"]');
    if (!links.length) return;

    links.forEach(function (link) {
      link.addEventListener("click", function (event) {
        var href = link.getAttribute("href") || "";
        if (href.length < 2) return;
        var target = document.getElementById(href.slice(1));
        if (!target) return;
        event.preventDefault();

        var header = document.querySelector(".site-header") || document.querySelector(".wre-topbar");
        var headerOffset = header ? header.getBoundingClientRect().height + 12 : 20;
        var targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;

        window.scrollTo({
          top: Math.max(0, targetTop),
          behavior: prefersReducedMotion ? "auto" : "smooth"
        });
      });
    });
  }

  function setupParallaxGlow() {
    if (prefersReducedMotion) return;
    var glows = document.querySelectorAll(".orb, .bg-orb");
    if (!glows.length) return;

    function update() {
      var y = window.scrollY || 0;
      glows.forEach(function (node, index) {
        var depth = index % 2 === 0 ? 0.045 : 0.065;
        var shift = y * depth;
        node.style.transform = "translate3d(0," + shift.toFixed(2) + "px,0)";
      });
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!prefersReducedMotion && document.querySelector(".section, .hero, .board")) {
      document.documentElement.classList.add("theme-snap");
    }
    setupScrollProgress();
    setupRevealOnScroll();
    setupAnchorScrollOffset();
    setupParallaxGlow();
  });
})();
