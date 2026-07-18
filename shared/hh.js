/* ============================================================
   H&H Learning Framework — shared runtime
   Provides: progress tracking (localStorage), quiz engine,
   canvas plot helper with hover readout, slider binding,
   engineering-notation formatting.
   No dependencies, no build step — works from file://.
   ============================================================ */

(function () {
  "use strict";

  const HH = (window.HH = {});
  const STORE_KEY = "hh:progress";

  /* ---------------- offline support ----------------
     From file:// everything already works with zero network (no external
     resources anywhere). When hosted over http(s), also install a service
     worker so the whole app is cached and usable offline / installable. */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    const root = new URL("..", document.currentScript.src); // shared/hh.js → repo root
    window.addEventListener("load", function () {
      navigator.serviceWorker.register(new URL("sw.js", root)).catch(function () {
        /* e.g. sandboxed iframe — offline install just doesn't happen */
      });
    });
  }

  /* ---------------- storage ---------------- */

  function loadStore() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function saveStore(store) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch (e) {
      /* private mode etc. — progress just won't persist */
    }
  }

  HH.progress = {
    get(moduleId) {
      return loadStore()[moduleId] || {};
    },
    set(moduleId, patch) {
      const store = loadStore();
      store[moduleId] = Object.assign({}, store[moduleId], patch);
      saveStore(store);
      return store[moduleId];
    },
    all() {
      return loadStore();
    },
  };

  /* ---------------- module bootstrap ---------------- */

  let currentModuleId = null;

  HH.initModule = function (id) {
    currentModuleId = id;
    HH.progress.set(id, { visited: true, lastVisit: Date.now() });
    // Wire any task checkboxes: <input type="checkbox" data-task="t1">
    const saved = HH.progress.get(id).tasks || {};
    document.querySelectorAll("input[data-task]").forEach(function (cb) {
      const tid = cb.dataset.task;
      cb.checked = !!saved[tid];
      cb.addEventListener("change", function () {
        const p = HH.progress.get(id);
        const tasks = p.tasks || {};
        tasks[tid] = cb.checked;
        HH.progress.set(id, { tasks: tasks });
      });
    });
  };

  /* Modules should consult this before running ambient (non-user-triggered)
     animations; user-initiated ones (e.g. "Charge" buttons) may still animate. */
  HH.reducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- formatting ---------------- */

  // Engineering notation: HH.fmt(4700, "Ω") -> "4.7 kΩ"
  HH.fmt = function (value, unit, digits) {
    unit = unit || "";
    if (value === 0) return "0 " + unit;
    if (!isFinite(value)) return "∞ " + unit;
    const prefixes = [
      [1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""],
      [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"],
    ];
    const abs = Math.abs(value);
    for (const [mag, pre] of prefixes) {
      if (abs >= mag * 0.9995) {
        const scaled = value / mag;
        const d = digits != null ? digits : scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
        return trimZeros(scaled.toFixed(d)) + " " + pre + unit;
      }
    }
    return value.toExponential(2) + " " + unit;
  };

  function trimZeros(s) {
    return s.indexOf(".") >= 0 ? s.replace(/\.?0+$/, "") : s;
  }

  /* ---------------- sliders ---------------- */

  // HH.slider("idOfInput", { log: false, format: v => "...", onchange: fn })
  // The label's .val element (inside label[for=id] or the sibling label) gets the
  // formatted value. Returns { get value(), set value(v), el }.
  HH.slider = function (id, opts) {
    opts = opts || {};
    const el = document.getElementById(id);
    const valEl =
      document.querySelector('label[for="' + id + '"] .val') ||
      (el.closest(".control") && el.closest(".control").querySelector(".val"));

    function realValue() {
      const raw = parseFloat(el.value);
      return opts.log ? Math.pow(10, raw) : raw;
    }
    function refresh() {
      if (valEl && opts.format) valEl.textContent = opts.format(realValue());
    }
    el.addEventListener("input", function () {
      refresh();
      if (opts.onchange) opts.onchange(realValue());
    });
    refresh();
    return {
      get value() { return realValue(); },
      set value(v) {
        el.value = opts.log ? Math.log10(v) : v;
        refresh();
      },
      el: el,
      refresh: refresh,
    };
  };

  /* ---------------- canvas plots ---------------- */

  // Read a CSS custom property off :root (theme-aware).
  HH.cssVar = function (name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  };

  /*
    plot = HH.plot(canvas, {
      xlabel, ylabel, xmin, xmax, ymin, ymax,
      xticks: [..] | count, yticks,
      xfmt: v=>str, yfmt: v=>str,
      hover: (x) => [{label, text}]   // optional readout lines at hover x
    });
    plot.draw([ { pts: [[x,y],...], color: "--series-1", width: 2, dash: [] , label: "V(t)" } ],
              { markers: [{x, y, color}], vline: x });
  */
  HH.plot = function (canvas, cfg) {
    cfg = cfg || {};
    const pad = { l: 52, r: 14, t: 12, b: 38 };
    let lastSeries = [], lastExtras = {};
    let hoverX = null;

    function dims() {
      const cssW = canvas.clientWidth || parseInt(canvas.getAttribute("width")) || 600;
      const cssH = parseInt(canvas.dataset.height || canvas.getAttribute("height")) || 300;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
      }
      canvas.style.height = cssH + "px";
      return { w: cssW, h: cssH, dpr: dpr };
    }

    function scales(d) {
      const x0 = cfg.xmin != null ? cfg.xmin : 0;
      const x1 = cfg.xmax != null ? cfg.xmax : 1;
      const y0 = cfg.ymin != null ? cfg.ymin : 0;
      const y1 = cfg.ymax != null ? cfg.ymax : 1;
      return {
        x: (v) => pad.l + ((v - x0) / (x1 - x0)) * (d.w - pad.l - pad.r),
        y: (v) => d.h - pad.b - ((v - y0) / (y1 - y0)) * (d.h - pad.t - pad.b),
        x0, x1, y0, y1,
      };
    }

    function ticks(min, max, spec) {
      if (Array.isArray(spec)) return spec;
      const n = spec || 5;
      const out = [];
      for (let i = 0; i <= n; i++) out.push(min + ((max - min) * i) / n);
      return out;
    }

    function draw(series, extras) {
      lastSeries = series || lastSeries;
      lastExtras = extras || {};
      const d = dims();
      const s = scales(d);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(d.dpr, 0, 0, d.dpr, 0, 0);
      ctx.clearRect(0, 0, d.w, d.h);

      const gridC = HH.cssVar("--grid");
      const axisC = HH.cssVar("--axis");
      const mutedC = HH.cssVar("--muted");

      // grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = gridC;
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillStyle = mutedC;
      const xt = ticks(s.x0, s.x1, cfg.xticks);
      const yt = ticks(s.y0, s.y1, cfg.yticks);
      xt.forEach(function (v) {
        const x = s.x(v);
        ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, d.h - pad.b); ctx.stroke();
        ctx.textAlign = "center";
        ctx.fillText(cfg.xfmt ? cfg.xfmt(v) : String(v), x, d.h - pad.b + 16);
      });
      yt.forEach(function (v) {
        const y = s.y(v);
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(d.w - pad.r, y); ctx.stroke();
        ctx.textAlign = "right";
        ctx.fillText(cfg.yfmt ? cfg.yfmt(v) : String(v), pad.l - 8, y + 4);
      });

      // axes
      ctx.strokeStyle = axisC;
      ctx.beginPath();
      ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, d.h - pad.b); ctx.lineTo(d.w - pad.r, d.h - pad.b);
      ctx.stroke();

      // axis labels
      ctx.fillStyle = mutedC;
      ctx.font = "12px system-ui, sans-serif";
      if (cfg.xlabel) { ctx.textAlign = "center"; ctx.fillText(cfg.xlabel, (pad.l + d.w - pad.r) / 2, d.h - 6); }
      if (cfg.ylabel) {
        ctx.save();
        ctx.translate(12, (pad.t + d.h - pad.b) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = "center";
        ctx.fillText(cfg.ylabel, 0, 0);
        ctx.restore();
      }

      // clip to plot area for series
      ctx.save();
      ctx.beginPath();
      ctx.rect(pad.l, pad.t, d.w - pad.l - pad.r, d.h - pad.t - pad.b);
      ctx.clip();

      (lastSeries || []).forEach(function (ser) {
        ctx.strokeStyle = ser.color && ser.color.startsWith("--") ? HH.cssVar(ser.color) : ser.color || HH.cssVar("--series-1");
        ctx.lineWidth = ser.width || 2;
        ctx.setLineDash(ser.dash || []);
        ctx.beginPath();
        ser.pts.forEach(function (p, i) {
          const x = s.x(p[0]), y = s.y(p[1]);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // extras
      if (lastExtras.vline != null) {
        ctx.strokeStyle = axisC;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(s.x(lastExtras.vline), pad.t);
        ctx.lineTo(s.x(lastExtras.vline), d.h - pad.b);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      (lastExtras.markers || []).forEach(function (m) {
        ctx.fillStyle = m.color && m.color.startsWith("--") ? HH.cssVar(m.color) : m.color || HH.cssVar("--series-1");
        ctx.beginPath();
        ctx.arc(s.x(m.x), s.y(m.y), 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = HH.cssVar("--surface");
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.restore();

      // hover crosshair + readout
      if (hoverX != null && cfg.hover) {
        const hx = Math.max(s.x0, Math.min(s.x1, hoverX));
        const px = s.x(hx);
        ctx.strokeStyle = mutedC;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(px, pad.t); ctx.lineTo(px, d.h - pad.b); ctx.stroke();
        ctx.setLineDash([]);
        const lines = cfg.hover(hx) || [];
        ctx.font = "12px system-ui, sans-serif";
        let boxW = 0;
        lines.forEach(function (ln) {
          boxW = Math.max(boxW, ctx.measureText(ln.text).width);
        });
        boxW += 24;
        const boxH = lines.length * 18 + 12;
        let bx = px + 10;
        if (bx + boxW > d.w - pad.r) bx = px - 10 - boxW;
        const by = pad.t + 8;
        ctx.fillStyle = HH.cssVar("--surface");
        ctx.strokeStyle = HH.cssVar("--axis");
        ctx.lineWidth = 1;
        roundRect(ctx, bx, by, boxW, boxH, 6);
        ctx.fill(); ctx.stroke();
        lines.forEach(function (ln, i) {
          if (ln.color) {
            ctx.fillStyle = ln.color.startsWith("--") ? HH.cssVar(ln.color) : ln.color;
            ctx.beginPath();
            ctx.arc(bx + 12, by + 12 + i * 18, 4, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = HH.cssVar("--ink");
          ctx.textAlign = "left";
          ctx.fillText(ln.text, bx + (ln.color ? 22 : 12), by + 16 + i * 18);
        });
      }
    }

    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    if (cfg.hover) {
      function pointAt(clientX) {
        const rect = canvas.getBoundingClientRect();
        const d = dims();
        const s = scales(d);
        const cx = clientX - rect.left;
        if (cx < pad.l || cx > d.w - pad.r) hoverX = null;
        else hoverX = s.x0 + ((cx - pad.l) / (d.w - pad.l - pad.r)) * (s.x1 - s.x0);
        draw();
      }
      canvas.addEventListener("mousemove", function (ev) { pointAt(ev.clientX); });
      canvas.addEventListener("mouseleave", function () { hoverX = null; draw(); });
      /* touch: drag a finger across the plot to scrub the readout */
      canvas.addEventListener("touchstart", function (ev) {
        pointAt(ev.touches[0].clientX);
      }, { passive: true });
      canvas.addEventListener("touchmove", function (ev) {
        pointAt(ev.touches[0].clientX);
        ev.preventDefault(); /* scrubbing the plot shouldn't scroll the page */
      }, { passive: false });
      canvas.addEventListener("touchend", function () { hoverX = null; draw(); });
    }
    window.addEventListener("resize", function () { draw(); });

    return { draw: draw, cfg: cfg };
  };

  /* ---------------- quiz engine ---------------- */

  /*
    HH.quiz(containerElOrId, [
      { q: "…", opts: ["a","b","c","d"], answer: 1, expl: "why" },
      …
    ])
    Renders questions with immediate feedback + explanations, tracks score,
    persists best score for the current module.
  */
  HH.quiz = function (container, questions) {
    const root = typeof container === "string" ? document.getElementById(container) : container;
    root.classList.add("quiz");
    let answered = 0, correct = 0;
    const missed = [];

    questions.forEach(function (q, qi) {
      const card = document.createElement("div");
      card.className = "quiz-q";
      const qt = document.createElement("div");
      qt.className = "q-text";
      qt.innerHTML = '<span class="q-num">' + (qi + 1) + ".</span>" + q.q;
      card.appendChild(qt);

      const expl = document.createElement("div");
      expl.className = "quiz-expl";

      q.opts.forEach(function (optText, oi) {
        const label = document.createElement("label");
        label.className = "quiz-opt";
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "q" + qi + "-" + Math.random().toString(36).slice(2, 7);
        const span = document.createElement("span");
        span.innerHTML = optText;
        label.appendChild(radio);
        label.appendChild(span);
        label.addEventListener("click", function (ev) {
          if (card.dataset.done) { ev.preventDefault(); return; }
          card.dataset.done = "1";
          answered++;
          const ok = oi === q.answer;
          if (ok) correct++;
          else missed.push(qi);
          card.querySelectorAll(".quiz-opt").forEach(function (el, idx) {
            el.classList.add("disabled");
            if (idx === q.answer) el.classList.add("correct");
            else if (idx === oi) el.classList.add("incorrect");
          });
          expl.innerHTML =
            '<span class="verdict ' + (ok ? "ok" : "bad") + '">' +
            (ok ? "Correct. " : "Not quite. ") + "</span>" + (q.expl || "");
          expl.classList.add("show");
          if (answered === questions.length) finish();
        });
        card.appendChild(label);
      });

      card.appendChild(expl);
      root.appendChild(card);
    });

    const scoreEl = document.createElement("div");
    scoreEl.className = "quiz-score";
    root.appendChild(scoreEl);

    function finish() {
      const pct = Math.round((100 * correct) / questions.length);
      let msg;
      if (pct === 100) msg = "Perfect — you own this topic.";
      else if (pct >= 75) msg = "Solid. Review the explanations you missed.";
      else if (pct >= 50) msg = "Getting there — reread the sections above and retry.";
      else msg = "Worth another pass through the material before moving on.";
      scoreEl.innerHTML =
        "Score: " + correct + " / " + questions.length + " (" + pct + "%)<br><small>" + msg + "</small>";
      scoreEl.classList.add("show");
      if (currentModuleId) {
        const prev = HH.progress.get(currentModuleId);
        const patch = { lastQuizAt: Date.now(), lastQuizPct: pct, missed: missed };
        if (!prev.quizBest || pct > prev.quizBest) {
          patch.quizBest = pct;
          patch.quizTotal = questions.length;
        }
        HH.progress.set(currentModuleId, patch);
        scoreEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  };
})();
