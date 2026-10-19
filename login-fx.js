/* login-fx.js — Lenis + GSAP + React Bits-style effects (vanilla)
   بعد از اسکریپت اصلی و بعد از CDN لنیس لود شود. به منطق Supabase دست نمی‌زند. */
(function () {
  const root = document.documentElement;
  const $ = (s) => document.querySelector(s);
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (REDUCE || typeof gsap === "undefined") return;

  /* ---------- CSS ---------- */
  const st = document.createElement("style");
  st.textContent = `
    html.lenis, html.lenis body { height: auto; }
    .lenis.lenis-smooth { scroll-behavior: auto !important; }
    /* Shiny Text روی دکمه */
    #loginBtn .btn-label {
      background: linear-gradient(100deg, #fff 40%, rgba(255,255,255,.45) 50%, #fff 60%);
      background-size: 250% auto; -webkit-background-clip: text; background-clip: text;
      color: transparent; animation: fxShiny 3.4s linear infinite;
    }
    @keyframes fxShiny { to { background-position: -250% center; } }
    /* قفل وقتی رمز نمایش داده می‌شود نیم‌باز می‌شود */
    .logo.peek .shackle { transform: translateY(-1.5px) rotate(-18deg); }
    .subtitle .w { display: inline-block; will-change: transform, filter; }
  `;
  document.head.appendChild(st);

  /* ---------- Lenis + GSAP ticker (اسکرول نرم، مهم روی موبایل با کیبورد) ---------- */
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.on("scroll", ({ scroll }) => {
      gsap.set(".bg .dots", { y: -scroll * 0.18 });
      gsap.set(".blob", { y: (i) => -scroll * (0.08 + i * 0.05) });
    });
  }

  /* ---------- Click Spark (React Bits) + انفجار موفقیت ---------- */
  const cv = document.createElement("canvas");
  Object.assign(cv.style, { position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 60 });
  document.body.appendChild(cv);
  const cx = cv.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let W, H;
  const fit = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  fit(); addEventListener("resize", fit);

  const sparks = [];
  const cssVar = (n) => getComputedStyle(root).getPropertyValue(n).trim();
  function burst(x, y, n, power, gravity, colors) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5, v = (2 + Math.random() * 4) * power;
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: gravity, life: 1,
                    len: 5 + Math.random() * 8, c: colors[i % colors.length] });
    }
  }
  gsap.ticker.add(() => {
    cx.clearRect(0, 0, W, H);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy = p.vy * 0.95 + p.g; p.life -= 0.022;
      if (p.life <= 0) { sparks.splice(i, 1); continue; }
      const m = Math.hypot(p.vx, p.vy) || 1;
      cx.globalAlpha = p.life; cx.strokeStyle = p.c; cx.lineWidth = 2; cx.lineCap = "round";
      cx.beginPath(); cx.moveTo(p.x, p.y);
      cx.lineTo(p.x - (p.vx / m) * p.len * p.life, p.y - (p.vy / m) * p.len * p.life); cx.stroke();
    }
  });
  addEventListener("pointerdown", (e) => burst(e.clientX, e.clientY, 8, 1, 0, [cssVar("--accent2"), cssVar("--accent1")]));

  const btn = $("#loginBtn");
  if (btn) new MutationObserver(() => {
    if (!btn.classList.contains("success")) return;
    const r = btn.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 46, 1.9, 0.09,
          [cssVar("--accent1"), cssVar("--accent2"), "#2fd3a7", "#ffd166", "#fff"]);
  }).observe(btn, { attributes: true, attributeFilter: ["class"] });

  /* ---------- Magnet (React Bits) با خاصیت translate تا با transform:none دکمه تداخل نکند ---------- */
  function magnet(el, strength, radius) {
    if (!el || !FINE) return;
    let tx = 0, ty = 0, x = 0, y = 0;
    addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2 - x), dy = e.clientY - (r.top + r.height / 2 - y);
      const near = Math.hypot(dx, dy) < radius + Math.max(r.width, r.height) / 2;
      tx = near ? dx * strength : 0; ty = near ? dy * strength : 0;
    });
    gsap.ticker.add(() => {
      x += (tx - x) * 0.14; y += (ty - y) * 0.14;
      el.style.translate = Math.abs(x) + Math.abs(y) < 0.05 ? "none" : x.toFixed(2) + "px " + y.toFixed(2) + "px";
    });
  }
  magnet(btn, 0.22, 60);
  magnet($("#themeToggle"), 0.3, 50);
  magnet($(".season-pill"), 0.3, 50);

  /* ---------- Blur Text (React Bits): زیرعنوان که کلمه‌به‌کلمه عوض می‌شود ---------- */
  const sub = $(".subtitle");
  if (sub) {
    const msgs = [sub.textContent.trim(), "خوش برگشتی 👋", "همه‌چیز آماده‌ست ✨", "فقط یک قدم تا پنل"];
    let idx = 0, alive = true, busy = false;
    const build = (t) => {
      sub.replaceChildren(...t.split(" ").flatMap((w, i, a) => {
        const s = document.createElement("span"); s.className = "w"; s.textContent = w;
        return i < a.length - 1 ? [s, document.createTextNode(" ")] : [s];
      }));
      return sub.querySelectorAll(".w");
    };
    const next = () => {
      if (!alive || busy) return;
      busy = true;
      const old = sub.querySelectorAll(".w").length ? sub.querySelectorAll(".w") : build(msgs[idx]);
      gsap.to(old, { autoAlpha: 0, filter: "blur(8px)", y: -8, duration: 0.35, stagger: 0.05, onComplete: () => {
        idx = (idx + 1) % msgs.length;
        gsap.fromTo(build(msgs[idx]), { autoAlpha: 0, filter: "blur(10px)", y: 10 },
          { autoAlpha: 1, filter: "blur(0px)", y: 0, duration: 0.6, stagger: 0.07, ease: "power3.out",
            onComplete: () => { busy = false; } });
      } });
    };
    setTimeout(() => { if (alive) setInterval(next, 4200); }, 3500);
    addEventListener("focusin", () => {            // وقتی شروع به تایپ کرد، آرام باش
      alive = false; idx = 0;
      if (!busy) { busy = true; gsap.to(sub.querySelectorAll(".w"), { autoAlpha: 0, duration: 0.2, onComplete: () => {
        sub.textContent = msgs[0]; gsap.fromTo(sub, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }); } }); }
    }, { once: true });
  }

  /* ---------- ریزتعامل‌های قفل ---------- */
  const logo = $("#logo"), pw = $("#password"), eye = $("#eyeBtn");
  if (eye) eye.addEventListener("click", () => logo.classList.toggle("peek", pw.type === "text"));
  if (pw) pw.addEventListener("input", () =>
    gsap.fromTo(logo, { scale: 1.1, rotation: (Math.random() - 0.5) * 10 }, { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(3)" }));
  if (pw) pw.addEventListener("focus", () => gsap.to(logo, { y: -3, duration: 0.3 }));
  if (pw) pw.addEventListener("blur", () => gsap.to(logo, { y: 0, duration: 0.3 }));
})();
