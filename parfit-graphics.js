(function () {
  "use strict";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function easeInOutCubic(t) {
    if (t < 0.5) return 4 * t * t * t;
    var f = -2 * t + 2;
    return 1 - (f * f * f) / 2;
  }

  function animatePathDot(path, dot, progress) {
    if (!path || !dot) return;
    var length = path.getTotalLength();
    var eased = easeInOutCubic(clamp(progress, 0, 1));
    var point = path.getPointAtLength(length * eased);
    dot.setAttribute("cx", point.x.toFixed(2));
    dot.setAttribute("cy", point.y.toFixed(2));
  }

  function setupMountain(svg) {
    var summitPulse = svg.querySelector("[data-summit-pulse]");
    var routeSpecs = [
      { pathId: "route-conseq", climbers: ["consequentialist-a", "consequentialist-b"], speed: 0.058, phase: 0.08 },
      { pathId: "route-deon", climbers: ["deontological-a", "deontological-b"], speed: 0.052, phase: 0.23 },
      { pathId: "route-virtue", climbers: ["virtue-a", "virtue-b"], speed: 0.047, phase: 0.39 },
      { pathId: "route-contract", climbers: ["contractualist-a", "contractualist-b"], speed: 0.055, phase: 0.15 },
      { pathId: "route-relational", climbers: ["relational-a", "relational-b"], speed: 0.049, phase: 0.31 },
      { pathId: "route-hybrid", climbers: ["hybrid-a", "hybrid-b"], speed: 0.061, phase: 0.49 },
    ];

    var routes = routeSpecs
      .map(function (spec) {
        var path = svg.querySelector("#" + spec.pathId);
        if (!path) return null;
        return {
          path: path,
          speed: spec.speed,
          phase: spec.phase,
          climbers: spec.climbers
            .map(function (id, index) {
              return {
                el: svg.querySelector('[data-climber="' + id + '"]'),
                offset: index === 0 ? 0 : 0.56,
              };
            })
            .filter(function (climber) {
              return Boolean(climber.el);
            }),
        };
      })
      .filter(Boolean);

    function update(timeSeconds) {
      var summitActivity = 0;

      routes.forEach(function (route) {
        route.climbers.forEach(function (climber) {
          var progress = (timeSeconds * route.speed + route.phase + climber.offset) % 1;
          animatePathDot(route.path, climber.el, progress);
          if (progress > 0.84) {
            summitActivity = Math.max(summitActivity, (progress - 0.84) / 0.16);
          }
        });
      });

      if (summitPulse) {
        var pulse = 9.5 + summitActivity * 6 + Math.sin(timeSeconds * 2.8) * 1.2;
        var opacity = 0.38 + summitActivity * 0.42;
        summitPulse.setAttribute("r", pulse.toFixed(2));
        summitPulse.style.opacity = opacity.toFixed(2);
      }
    }

    function setStatic() {
      routes.forEach(function (route) {
        route.climbers.forEach(function (climber, index) {
          animatePathDot(route.path, climber.el, 0.72 + index * 0.12);
        });
      });
      if (summitPulse) {
        summitPulse.setAttribute("r", "11.5");
        summitPulse.style.opacity = "0.58";
      }
    }

    return {
      update: update,
      setStatic: setStatic,
    };
  }

  function setupLattice(svg) {
    var paths = Array.prototype.slice.call(svg.querySelectorAll("[data-lattice-route]"));
    var dots = Array.prototype.slice.call(svg.querySelectorAll("[data-lattice-dot]"));

    var tracks = paths
      .map(function (path, index) {
        return {
          path: path,
          dot: dots[index] || null,
          speed: 0.062 - index * 0.005,
          phase: 0.11 + index * 0.17,
        };
      })
      .filter(function (track) {
        return Boolean(track.path && track.dot);
      });

    function update(timeSeconds) {
      tracks.forEach(function (track) {
        var progress = (timeSeconds * track.speed + track.phase) % 1;
        animatePathDot(track.path, track.dot, progress);
      });
    }

    function setStatic() {
      tracks.forEach(function (track, index) {
        animatePathDot(track.path, track.dot, 0.74 + index * 0.03);
      });
    }

    return {
      update: update,
      setStatic: setStatic,
    };
  }

  function initParfitGraphics() {
    var section = document.getElementById("parfit-mountain");
    var mountainSvg = document.getElementById("parfitMountainGraphic");
    var latticeSvg = document.getElementById("parfitLatticeGraphic");
    if (!section || !mountainSvg || !latticeSvg) return;

    var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var mountain = setupMountain(mountainSvg);
    var lattice = setupLattice(latticeSvg);

    if (prefersReducedMotion) {
      mountain.setStatic();
      lattice.setStatic();
      return;
    }

    var cards = section.querySelectorAll(".parfit-graphic-card");
    var running = false;
    var rafId = 0;
    var startTime = 0;

    function setPaused(paused) {
      cards.forEach(function (card) {
        card.classList.toggle("is-paused", paused);
      });
    }

    function step(timestamp) {
      if (!running) return;
      if (!startTime) startTime = timestamp;
      var elapsedSeconds = (timestamp - startTime) / 1000;
      mountain.update(elapsedSeconds);
      lattice.update(elapsedSeconds);
      rafId = window.requestAnimationFrame(step);
    }

    function start() {
      if (running) return;
      running = true;
      setPaused(false);
      rafId = window.requestAnimationFrame(step);
    }

    function stop() {
      if (!running) return;
      running = false;
      setPaused(true);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = 0;
    }

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              start();
            } else {
              stop();
            }
          });
        },
        {
          threshold: 0.24,
        }
      );
      observer.observe(section);
    } else {
      start();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initParfitGraphics);
  } else {
    initParfitGraphics();
  }
})();
