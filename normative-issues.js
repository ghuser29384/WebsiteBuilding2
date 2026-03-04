(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initTheoryFilters();
    initStrategyMeters();
  });

  function initTheoryFilters() {
    const buttons = Array.prototype.slice.call(document.querySelectorAll(".theory-filter-btn[data-theory-filter]"));
    const rows = Array.prototype.slice.call(document.querySelectorAll(".theory-table tbody tr[data-tags]"));
    if (buttons.length === 0 || rows.length === 0) return;

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        const filter = String(button.getAttribute("data-theory-filter") || "all").trim();
        buttons.forEach(function (other) {
          const active = other === button;
          other.classList.toggle("is-active", active);
          other.setAttribute("aria-pressed", active ? "true" : "false");
        });

        rows.forEach(function (row) {
          if (filter === "all") {
            row.classList.remove("is-hidden");
            return;
          }
          const tags = String(row.getAttribute("data-tags") || "").toLowerCase().split(/\s+/).filter(Boolean);
          row.classList.toggle("is-hidden", tags.indexOf(filter) === -1);
        });
      });
    });

    buttons.forEach(function (button) {
      const isActive = button.classList.contains("is-active");
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function initStrategyMeters() {
    const rows = Array.prototype.slice.call(document.querySelectorAll(".strategy-row[data-intensity]"));
    if (rows.length === 0) return;

    rows.forEach(function (row) {
      const raw = Number(row.getAttribute("data-intensity"));
      const value = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 50;
      row.style.setProperty("--strategy-intensity", String(value));
    });

    if (!("IntersectionObserver" in window)) {
      rows.forEach(function (row) {
        row.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2 }
    );

    rows.forEach(function (row) {
      observer.observe(row);
    });
  }
})();
