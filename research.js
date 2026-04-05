(function () {
  "use strict";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function animateDotOnPath(path, dot, progress) {
    if (!path || !dot) return;
    var length = path.getTotalLength();
    var point = path.getPointAtLength(length * easeInOut(clamp(progress, 0, 1)));
    dot.setAttribute("cx", point.x.toFixed(2));
    dot.setAttribute("cy", point.y.toFixed(2));
  }

  function makeTrack(svg, pathId, dotSelector, speed, phase) {
    var path = svg.querySelector("#" + pathId);
    var dot = svg.querySelector(dotSelector);
    if (!path || !dot) return null;
    return { path: path, dot: dot, speed: speed, phase: phase };
  }

  function buildTargetsAnimation() {
    var svg = document.getElementById("researchTargetsGraphic");
    if (!svg) return null;

    var tracks = [
      makeTrack(svg, "research-target-path-a", '[data-track-dot="a"]', 0.072, 0.06),
      makeTrack(svg, "research-target-path-b", '[data-track-dot="b"]', 0.081, 0.24),
      makeTrack(svg, "research-target-path-c", '[data-track-dot="c"]', 0.078, 0.44),
      makeTrack(svg, "research-target-path-d", '[data-track-dot="d"]', 0.07, 0.66),
    ].filter(Boolean);

    return {
      setStatic: function () {
        tracks.forEach(function (track, index) {
          animateDotOnPath(track.path, track.dot, 0.62 + index * 0.08);
        });
      },
      update: function (seconds) {
        tracks.forEach(function (track) {
          animateDotOnPath(track.path, track.dot, (seconds * track.speed + track.phase) % 1);
        });
      },
    };
  }

  function buildStackAnimation() {
    var svg = document.getElementById("researchStackGraphic");
    if (!svg) return null;

    var tracks = [
      makeTrack(svg, "research-stack-path-top", '[data-stack-dot="top"]', 0.1, 0.02),
      makeTrack(svg, "research-stack-path-loop", '[data-stack-dot="loop"]', 0.04, 0.42),
    ].filter(Boolean);

    return {
      setStatic: function () {
        tracks.forEach(function (track, index) {
          animateDotOnPath(track.path, track.dot, 0.34 + index * 0.32);
        });
      },
      update: function (seconds) {
        tracks.forEach(function (track) {
          animateDotOnPath(track.path, track.dot, (seconds * track.speed + track.phase) % 1);
        });
      },
    };
  }

  function buildPublicAnimation() {
    var svg = document.getElementById("researchPublicGraphic");
    if (!svg) return null;

    var tracks = [
      makeTrack(svg, "research-public-path-a", '[data-public-dot="a"]', 0.063, 0.1),
      makeTrack(svg, "research-public-path-b", '[data-public-dot="b"]', 0.082, 0.32),
      makeTrack(svg, "research-public-path-c", '[data-public-dot="c"]', 0.066, 0.56),
      makeTrack(svg, "research-public-path-d", '[data-public-dot="d"]', 0.088, 0.74),
    ].filter(Boolean);

    return {
      setStatic: function () {
        tracks.forEach(function (track, index) {
          animateDotOnPath(track.path, track.dot, 0.52 + index * 0.08);
        });
      },
      update: function (seconds) {
        tracks.forEach(function (track) {
          animateDotOnPath(track.path, track.dot, (seconds * track.speed + track.phase) % 1);
        });
      },
    };
  }

  function initResearchGraphics() {
    var page = document.querySelector(".research-page");
    if (!page) return;

    var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var animations = [buildTargetsAnimation(), buildStackAnimation(), buildPublicAnimation()].filter(Boolean);
    if (!animations.length) return;

    if (prefersReducedMotion) {
      animations.forEach(function (animation) {
        animation.setStatic();
      });
      return;
    }

    var rafId = 0;
    var startTime = 0;

    function frame(timestamp) {
      if (!startTime) startTime = timestamp;
      var seconds = (timestamp - startTime) / 1000;
      animations.forEach(function (animation) {
        animation.update(seconds);
      });
      rafId = window.requestAnimationFrame(frame);
    }

    function start() {
      if (rafId) return;
      rafId = window.requestAnimationFrame(frame);
    }

    animations.forEach(function (animation) {
      animation.setStatic();
    });

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              start();
              observer.disconnect();
            }
          });
        },
        { threshold: 0.12 }
      );
      observer.observe(page);
      return;
    }

    start();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initResearchGraphics);
  } else {
    initResearchGraphics();
  }
})();
