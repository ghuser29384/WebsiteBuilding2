function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function colorFromScale(normalized) {
  const n = clamp(normalized, 0, 1);
  if (n < 0.5) {
    const t = n / 0.5;
    return {
      from: "rgb(" + Math.round(214 + (242 - 214) * t) + "," + Math.round(95 + (190 - 95) * t) + "," + Math.round(95 + (90 - 95) * t) + ")",
      to: "rgb(" + Math.round(196 + (220 - 196) * t) + "," + Math.round(57 + (175 - 57) * t) + "," + Math.round(57 + (66 - 57) * t) + ")",
    };
  }
  const t = (n - 0.5) / 0.5;
  return {
    from: "rgb(" + Math.round(242 + (169 - 242) * t) + "," + Math.round(190 + (228 - 190) * t) + "," + Math.round(90 + (213 - 90) * t) + ")",
    to: "rgb(" + Math.round(220 + (10 - 220) * t) + "," + Math.round(175 + (102 - 175) * t) + "," + Math.round(66 + (102 - 66) * t) + ")",
  };
}

function levelLabel(normalized) {
  if (normalized < 0.33) return "Low coherence";
  if (normalized < 0.67) return "Medium coherence";
  return "High coherence";
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
    this.track = null;
    this.mount();
  }

  mount() {
    this.container.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "gauge-wrap";

    const track = document.createElement("div");
    track.className = "gauge-track";
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", "Coherence meter");
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    track.setAttribute("aria-valuenow", "50");
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

    this.track = track;
    this.fill = fill;
    this.valueEl = valueEl;
    this.detailEl = detailEl;
    this.paint(0);
  }

  paint(score) {
    const clamped = clamp(score, -100, 100);
    const normalized = (clamped + 100) / 200;
    const percentage = normalized * 100;
    const colors = colorFromScale(normalized);
    if (this.fill) {
      this.fill.style.width = percentage.toFixed(2) + "%";
      this.fill.style.background = "linear-gradient(90deg, " + colors.from + " 0%, " + colors.to + " 100%)";
    }
    if (this.valueEl) {
      this.valueEl.textContent = clamped.toFixed(1) + "%";
    }
    if (this.track) {
      this.track.setAttribute("aria-valuenow", percentage.toFixed(1));
      this.track.setAttribute("aria-valuetext", clamped.toFixed(1) + "%, " + levelLabel(normalized));
    }
  }

  setValue(nextValue, detailText) {
    const target = clamp(nextValue, -100, 100);
    const start = this.value;
    const duration = 420;
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
