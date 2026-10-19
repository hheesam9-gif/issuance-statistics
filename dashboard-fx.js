/* dashboard-fx.js — افزونهٔ داشبورد (GSAP + افکت‌های React Bits به‌صورت vanilla)
   فقط یک خط قبل از </body> و بعد از همهٔ اسکریپت‌های قبلی: <script src="dashboard-fx.js"></script> */
(function () {
  const $ = (id) => document.getElementById(id);
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const G = typeof gsap !== "undefined" && !REDUCE;
  const sfx = (n) => { try { window.sfx && window.sfx.play(n); } catch (e) {} };

  /* ---------- CSS ---------- */
  const st = document.createElement("style");
  st.textContent = `
    /* فویل هولوگرافیک */
    .total::before, .rank::before { content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
      opacity:0; transition:opacity .35s ease; mix-blend-mode:overlay;
      background:linear-gradient(115deg, transparent 20%, rgba(255,255,255,.3) 40%,
        color-mix(in srgb, var(--medal, var(--accent2)) 55%, transparent) 50%, rgba(255,255,255,.22) 60%, transparent 80%);
      background-size:260% 260%; background-position:var(--fx,50%) var(--fy,50%); }
    .total:hover::before, .rank:hover::before { opacity:.7; }
    /* پالت فرمان */
    .cmdk { position:fixed; inset:0; z-index:140; display:none; align-items:flex-start; justify-content:center;
      padding:16vh 16px 0; background:rgba(4,6,16,.55); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); }
    .cmdk.show { display:flex; }
    .cmdk-box { width:100%; max-width:460px; border-radius:22px; overflow:hidden; background:var(--card-bg);
      border:1px solid var(--card-border); box-shadow:var(--card-shadow);
      backdrop-filter:blur(26px) saturate(140%); -webkit-backdrop-filter:blur(26px) saturate(140%); }
    .cmdk-in { width:100%; padding:17px 20px; border:0; border-bottom:1px solid var(--divider); background:transparent;
      color:var(--text); font:inherit; font-size:15px; outline:none; }
    .cmdk-in::placeholder { color:var(--text-faint); }
    .cmdk-list { max-height:min(52vh,360px); overflow-y:auto; padding:8px; scrollbar-width:none; }
    .cmdk-list::-webkit-scrollbar { display:none; }
    .cmdk-it { display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:13px; cursor:pointer;
      font-size:14px; color:var(--text); border:1px solid transparent; }
    .cmdk-it .ic { width:34px; height:34px; display:grid; place-items:center; border-radius:11px; background:var(--row-bg); font-size:16px; }
    .cmdk-it.on { background:var(--row-bg-hover); border-color:var(--accent1); }
    .cmdk-empty { padding:26px; text-align:center; color:var(--text-dim); font-size:13px; }
    .cmdk-foot { padding:9px; text-align:center; border-top:1px solid var(--divider); font-size:11px; color:var(--text-faint); }
  `;
  document.head.appendChild(st);

  /* ---------- ۲) Decrypted Text روی نام کاربری (React Bits) ---------- */
  const un = $("usernameDisplay");
  if (G && un) {
    let busy = false;
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789_-";
    function decrypt() {
      const fin = un.dataset.final;
      if (!fin || busy) return;
      busy = true;
      const o = { p: 0 };
      gsap.to(o, { p: 1, duration: 1.1, ease: "none",
        onUpdate() {
          const k = Math.floor(o.p * fin.length);
          let s = "";
          for (let i = 0; i < fin.length; i++) s += (i < k || fin[i] === " ") ? fin[i] : chars[(Math.random() * chars.length) | 0];
          un.textContent = s;
        },
        onComplete() { un.textContent = fin; busy = false; } });
    }
    new MutationObserver(() => {
      if (busy) return;
      const t = un.textContent;
      if (t && t !== un.dataset.final) { un.dataset.final = t; setTimeout(decrypt, 900); }
    }).observe(un, { childList: true });
    un.addEventListener("pointerenter", decrypt);
  }

  /* ---------- ۳) فویل هولوگرافیک روی کارت مجموع و رتبه ---------- */
  if (FINE) document.addEventListener("pointermove", (e) => {
    const c = e.target.closest && e.target.closest(".rank, .total");
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty("--fx", ((e.clientX - r.left) / r.width * 100) + "%");
    c.style.setProperty("--fy", ((e.clientY - r.top) / r.height * 100) + "%");
  });

  /* ---------- ۴) Click Spark (React Bits) ---------- */
  if (G) {
    const cv = document.createElement("canvas");
    Object.assign(cv.style, { position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 145 });
    document.body.appendChild(cv);
    const cx = cv.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 2);
    let W, H;
    const fit = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    fit(); addEventListener("resize", fit);
    const sp = [];
    const v = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    addEventListener("pointerdown", (e) => {
      const cols = [v("--accent2"), v("--accent1")];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 6.283 + Math.random() * 0.5, s = 2 + Math.random() * 3;
        sp.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 1, c: cols[i % 2], n: 5 + Math.random() * 7 });
      }
    });
    gsap.ticker.add(() => {
      if (!sp.length) { if (cx.globalAlpha !== 0) { cx.clearRect(0, 0, W, H); cx.globalAlpha = 0; } return; }
      cx.clearRect(0, 0, W, H);
      for (let i = sp.length - 1; i >= 0; i--) {
        const p = sp[i];
        p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy *= 0.95; p.l -= 0.03;
        if (p.l <= 0) { sp.splice(i, 1); continue; }
        const m = Math.hypot(p.vx, p.vy) || 1;
        cx.globalAlpha = p.l; cx.strokeStyle = p.c; cx.lineWidth = 2; cx.lineCap = "round";
        cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(p.x - p.vx / m * p.n * p.l, p.y - p.vy / m * p.n * p.l); cx.stroke();
      }
    });
  }

  /* ---------- ۵) پالت فرمان: Ctrl/⌘ + K یا / ---------- */
  const CMDS = [
    ["📦", "سفارش‌های من", "سفارش order", "ordRefBtn"],
    ["💰", "پورسانت تخمینی", "پورسانت پول payout", "payoutBtn"],
    ["👤", "اطلاعات من", "پروفایل سرگروه profile", "profBtn"],
    ["🔔", "اعلان‌ها", "زنگ notification", "bellBtn"],
    ["🧾", "سابقه ثبت", "لیست روزانه", "tabOrders"],
    ["⚠️", "خطاها", "مغایرت", "tabErrors"],
    ["🗓️", "سابقه ماهانه", "دوره آرشیو", "tabPeriods"],
    ["🌗", "تغییر تم", "dark light روز شب", "themeToggle"],
    ["🔊", "روشن / خاموش کردن صدا", "sound", "soundBtn"],
    ["🚪", "خروج از حساب", "logout", "logoutBtn"]
  ];
  const norm = (s) => s.toLowerCase().replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/\s+/g, "");

  const ov = document.createElement("div");
  ov.className = "cmdk";
  ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "جستجوی سریع");
  ov.innerHTML = '<div class="cmdk-box"><input class="cmdk-in" type="text" placeholder="کجا بریم؟ مثلاً «سفارش» یا «تم»" autocomplete="off" spellcheck="false">' +
    '<div class="cmdk-list"></div><div class="cmdk-foot">↑ ↓ انتخاب · Enter اجرا · Esc بستن</div></div>';
  document.body.appendChild(ov);
  const box = ov.querySelector(".cmdk-box"), inp = ov.querySelector(".cmdk-in"), listEl = ov.querySelector(".cmdk-list");
  let shown = [], sel = 0;

  function paint(animate) {
    const q = norm(inp.value);
    shown = CMDS.filter((c) => {
      const b = $(c[3]);
      return b && !b.disabled && (!q || norm(c[1] + c[2]).includes(q));
    });
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    listEl.replaceChildren();
    if (!shown.length) { const e = document.createElement("div"); e.className = "cmdk-empty"; e.textContent = "چیزی پیدا نشد"; listEl.appendChild(e); return; }
    shown.forEach((c, i) => {
      const d = document.createElement("div");
      d.className = "cmdk-it" + (i === sel ? " on" : "");
      d.innerHTML = '<span class="ic">' + c[0] + "</span><span></span>";
      d.lastChild.textContent = c[1];
      d.addEventListener("pointermove", () => { if (sel !== i) { sel = i; mark(); } });
      d.addEventListener("click", () => run(c));
      listEl.appendChild(d);
    });
    if (animate && G) gsap.from(listEl.children, { y: 10, autoAlpha: 0, duration: 0.45, stagger: 0.03, ease: "power3.out", clearProps: "transform,opacity,visibility" });
  }
  function mark() {
    [...listEl.children].forEach((e, i) => e.classList.toggle("on", i === sel));
    const cur = listEl.children[sel]; if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: "nearest" });
  }
  function open() {
    if (ov.classList.contains("show")) return;
    inp.value = ""; sel = 0; paint(false);
    ov.classList.add("show");
    sfx("open");
    if (G) {
      gsap.fromTo(ov, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 });
      gsap.fromTo(box, { y: -26, scale: 0.94, filter: "blur(8px)" }, { y: 0, scale: 1, filter: "blur(0px)", duration: 0.6, ease: "expo.out", clearProps: "transform,filter" });
      gsap.from(listEl.children, { y: 12, autoAlpha: 0, duration: 0.5, stagger: 0.035, delay: 0.1, ease: "power3.out", clearProps: "transform,opacity,visibility" });
    }
    setTimeout(() => inp.focus(), 30);
  }
  function close() { ov.classList.remove("show"); if (G) gsap.set(ov, { clearProps: "opacity,visibility" }); }
  function run(c) {
    close();
    setTimeout(() => { const b = $(c[3]); if (b && !b.disabled) b.click(); }, 170);
  }
  inp.addEventListener("input", () => { sel = 0; paint(true); });
  ov.addEventListener("click", (e) => { if (e.target === ov) close(); });
  ov.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % Math.max(1, shown.length); mark(); sfx("select"); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + shown.length) % Math.max(1, shown.length); mark(); sfx("select"); }
    else if (e.key === "Enter" && shown[sel]) { e.preventDefault(); run(shown[sel]); }
    else if (e.key === "Escape") { e.stopPropagation(); close(); }
  });
  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA)$/.test((e.target.tagName || ""));
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); ov.classList.contains("show") ? close() : open(); }
    else if (e.key === "/" && !typing && !ov.classList.contains("show")) { e.preventDefault(); open(); }
  });

  /* دکمهٔ جستجو در نوار ابزار (برای موبایل و کسانی که کیبورد ندارند) */
  const tb = document.querySelector(".toolbar");
  if (tb) {
    const b = document.createElement("button");
    b.className = "bell"; b.type = "button"; b.setAttribute("aria-label", "جستجوی سریع");
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
    b.addEventListener("click", open);
    tb.appendChild(b);
    if (G) gsap.from(b, { scale: 0, rotation: -90, duration: 0.8, delay: 1.6, ease: "back.out(2.4)", clearProps: "transform" });
  }
})();
