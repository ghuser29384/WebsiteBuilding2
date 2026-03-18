function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

export class CoherenceGauge {
  constructor(container) {
    this.container = container;
    this.value = 0;
    this.meta = "";
    this.rafId = 0;
    this.fill = null;
    this.valueEl = null;
    this.detailEl = null;
    this.mount();
  }

  mount() {
    this.container.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "gauge-wrap";

    const track = document.createElement("div");
    track.className = "gauge-track";
    const fill = document.createElement("div");
    fill.className = "gauge-fill";
    track.appendChild(fill);

    const meta = document.createElement("div");
    meta.className = "gauge-meta";
    const valueEl = document.createElement("p");
    valueEl.className = "gauge-value";
    valueEl.textContent = "0.0%";
    const detailEl = document.createElement("p");
    detailEl.className = "gauge-detail";
    detailEl.textContent = "Coherence pending input";
    meta.appendChild(valueEl);
    meta.appendChild(detailEl);

    wrap.appendChild(track);
    wrap.appendChild(meta);
    this.container.appendChild(wrap);

    this.fill = fill;
    this.valueEl = valueEl;
    this.detailEl = detailEl;
    this.paint(0);
  }

  paint(score) {
    const clamped = clamp(score, -100, 100);
    const percentage = ((clamped + 100) / 200) * 100;
    if (this.fill) {
      this.fill.style.width = percentage.toFixed(2) + "%";
      if (clamped >= 0) {
        this.fill.style.background = "linear-gradient(90deg, #90e5c0 0%, #0a6 100%)";
      } else {
        this.fill.style.background = "linear-gradient(90deg, #f8a0a8 0%, #d23 100%)";
      }
    }
    if (this.valueEl) {
      this.valueEl.textContent = clamped.toFixed(1) + "%";
    }
  }

  setValue(nextValue, detailText) {
    const target = clamp(nextValue, -100, 100);
    const start = this.value;
    const duration = 380;
    const started = performance.now();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }

    const tick = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = lerp(start, target, eased);
      this.paint(current);
      if (progress < 1) {
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.value = target;
        this.rafId = 0;
      }
    };
    this.rafId = requestAnimationFrame(tick);

    if (this.detailEl && typeof detailText === "string") {
      this.detailEl.textContent = detailText;
    }
  }
}
