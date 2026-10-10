/* افزونه‌ی پنل ادمین: ثبت اطلاعات نمایندگان و سرگروه (جدول agent_info)
   فقط یک خط <script src="admin-agents-info.js"></script> بعد از اسکریپت اصلی admin.html کافیه. */
(function () {
  const g = id => document.getElementById(id);
  const clean = s => String(s == null ? "" : s).replace(/[\u200e\u200f\ufeff]/g, "").trim();
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  /* ---- پنجره ---- */
  const modal = el("div", "modal");
  modal.id = "agInfoModal";
  modal.setAttribute("role", "dialog");
  modal.innerHTML =
    '<div class="modal-box" style="max-width:640px;text-align:right">' +
    '<div class="card-head"><div class="card-icon" style="font-size:20px">👥</div><div>' +
    '<h2>اطلاعات نمایندگان و سرگروه</h2>' +
    '<p>ستون‌ها را از اکسل پیست کنید: نام‌کاربری سایت، آیدی مترموست، نام، سرگروه</p></div></div>' +
    '<textarea id="agText" spellcheck="false" style="min-height:160px" placeholder="amir.rezaei&#9;amir.rezaei&#9;امیرحسین&#9;فیروز - شاهمیر"></textarea>' +
    '<div class="paste-meta"><span id="agLines"></span></div>' +
    '<div class="actions"><button type="button" id="agCheck">بررسی لیست</button></div>' +
    '<div id="agPrev" style="display:none;margin-top:16px">' +
    '<div class="tiles">' +
    '<div class="tile ok"><div class="n" id="agOk">0</div><div class="lb">آماده ثبت</div></div>' +
    '<div class="tile warn"><div class="n" id="agMiss">0</div><div class="lb">در سایت نیستن</div></div>' +
    '<div class="tile bad"><div class="n" id="agBad">0</div><div class="lb">خط نامعتبر</div></div></div>' +
    '<div id="agFolds"></div>' +
    '<div class="history" id="agGroups" style="max-height:200px;margin-top:12px"></div>' +
    '<div class="actions"><button type="button" id="agSave">ثبت نهایی</button>' +
    '<button type="button" class="secondary" id="agCancel">لغو</button></div></div>' +
    '<div id="agMsg" role="status" style="text-align:center;font-size:13px;min-height:18px;margin-top:10px;color:var(--text-dim)"></div>' +
    '<div class="sub-title"><span>ثبت‌شده در سایت</span><span id="agSaved"></span></div>' +
    '<div class="actions"><button type="button" class="secondary full" id="agClose">بستن</button></div></div>';
  document.body.appendChild(modal);

  /* ---- آیتم منو ---- */
  const menu = g("menuItems");
  const btn = el("button", "menu-item");
  btn.type = "button";
  btn.setAttribute("role", "menuitem");
  btn.innerHTML = '<span class="menu-item-icon">👥</span><span class="menu-item-label">اطلاعات نمایندگان / سرگروه</span>';
  menu.insertBefore(btn, menu.querySelector(".menu-divider"));

  const say = (t, c) => { const m = g("agMsg"); m.textContent = t; m.style.color = c === "error" ? "var(--error)" : c === "ok" ? "var(--ok)" : "var(--text-dim)"; };
  let pending = [];

  async function loadSavedCount() {
    try {
      const { count } = await supabaseClient.from("agent_info").select("username", { count: "exact", head: true });
      g("agSaved").textContent = count == null ? "" : count + " نماینده";
    } catch (e) {}
  }
  btn.addEventListener("click", () => { modal.classList.add("show"); say(""); loadSavedCount(); });
  g("agClose").addEventListener("click", () => modal.classList.remove("show"));
  modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("show"); });
  g("agText").addEventListener("input", () => {
    const n = g("agText").value.split(/\r?\n/).filter(l => l.trim()).length;
    g("agLines").textContent = n ? n + " خط وارد شده" : "";
  });
  g("agCancel").addEventListener("click", () => { pending = []; g("agPrev").style.display = "none"; say(""); });

  /* ---- بررسی ---- */
  g("agCheck").addEventListener("click", async () => {
    say(""); g("agPrev").style.display = "none"; pending = [];
    const raw = g("agText").value;
    if (!raw.trim()) { say("لیست خالیه؛ داده‌ی اکسل را پیست کنید", "error"); return; }
    g("agCheck").disabled = true; say("در حال بررسی کاربران...");
    let names;
    try { names = await fetchAllUsernames(); }
    catch (e) { say("خواندن کاربران ناموفق بود: " + (e.message || e), "error"); g("agCheck").disabled = false; return; }
    g("agCheck").disabled = false; say("");

    const map = new Map(names.map(u => [String(u).trim().toLowerCase(), u]));
    const rows = new Map(), missing = [], invalid = [];
    raw.split(/\r?\n/).forEach(line => {
      if (!line.trim()) return;
      const p = line.split("\t").map(clean);
      if (p[0] && p[0].toLowerCase() === "username") return;
      if (p.length < 4 || !p[0] || !p[3]) { invalid.push(line.trim()); return; }
      const real = map.get(p[0].toLowerCase());
      if (!real) { missing.push(p[0]); return; }
      rows.set(real, { username: real, mattermost_id: p[1], first_name: p[2], leader_label: p[3] });
    });
    pending = [...rows.values()];

    animateNumber(g("agOk"), pending.length);
    animateNumber(g("agMiss"), missing.length);
    animateNumber(g("agBad"), invalid.length);

    const folds = g("agFolds"); folds.replaceChildren();
    const fold = (title, items) => {
      const d = el("details", "fold"); d.appendChild(el("summary", null, title));
      d.appendChild(el("div", "bulk-list", items.join("  |  "))); folds.appendChild(d);
    };
    if (missing.length) fold("در سایت نیستن (ثبت نمی‌شن)", missing);
    if (invalid.length) fold("خط‌های نامعتبر (باید ۴ ستون با Tab باشه)", invalid);

    const byLabel = new Map();
    pending.forEach(r => byLabel.set(r.leader_label, (byLabel.get(r.leader_label) || 0) + 1));
    const gl = g("agGroups"); gl.replaceChildren();
    byLabel.forEach((n, label) => {
      const row = el("div", "row");
      row.appendChild(el("span", "d", label));
      row.appendChild(el("b", null, n + " نفر"));
      gl.appendChild(row);
    });

    g("agSave").textContent = "ثبت نهایی " + pending.length + " نفر";
    g("agSave").disabled = !pending.length;
    g("agPrev").style.display = "block";
    if (!pending.length) say("هیچ ردیف معتبری پیدا نشد", "error");
  });

  /* ---- ثبت ---- */
  g("agSave").addEventListener("click", async () => {
    if (!pending.length) return;
    g("agSave").disabled = true; g("agCancel").disabled = true; g("agCheck").disabled = true;
    const now = new Date().toISOString();
    let done = 0;
    for (let i = 0; i < pending.length; i += 200) {
      const batch = pending.slice(i, i + 200).map(r => ({ ...r, updated_at: now }));
      say("در حال ذخیره... " + done + " از " + pending.length);
      const { error } = await supabaseClient.from("agent_info").upsert(batch, { onConflict: "username" });
      if (error) {
        say("ثبت متوقف شد (" + done + " نفر ثبت شده بود): " + explainError(error), "error");
        g("agSave").disabled = false; g("agCancel").disabled = false; g("agCheck").disabled = false;
        return;
      }
      done += batch.length;
    }
    say("✔ اطلاعات " + done + " نماینده ثبت شد", "ok");
    pending = []; g("agPrev").style.display = "none"; g("agText").value = ""; g("agLines").textContent = "";
    g("agCancel").disabled = false; g("agCheck").disabled = false;
    loadSavedCount();
  });
})();
