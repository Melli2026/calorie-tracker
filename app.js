/* ===== Calorie Tracker ===== */
(function () {
  "use strict";

  const LOG_KEY = "ct_log_v1";
  const GOAL_KEY = "ct_goal_v1";
  const CUSTOM_KEY = "ct_custom_foods_v1";
  const WATER_KEY = "ct_water_v1";

  const DEFAULT_GOAL = { kcal: 2000, protein: 120, carbs: 230, fat: 65, water: 2000 };

  // Meal categories
  const MEALS = ["breakfast", "lunch", "dinner", "snack"];
  const MEAL_LABEL = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
  function defaultMeal() {
    const h = new Date().getHours();
    if (h < 11) return "breakfast";
    if (h < 16) return "lunch";
    if (h < 21) return "dinner";
    return "snack";
  }

  /* ---------- storage ---------- */
  const load = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
    catch { return fallback; }
  };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  let log = load(LOG_KEY, []);
  let goal = Object.assign({}, DEFAULT_GOAL, load(GOAL_KEY, {}));
  let customFoods = load(CUSTOM_KEY, []);
  let water = load(WATER_KEY, {}); // { "YYYY-MM-DD": ml }

  // Ensure custom foods carry stable ids (for edit/delete) and a custom flag.
  let _migrated = false;
  customFoods.forEach(f => { if (!f.id) { f.id = uid(); _migrated = true; } f.custom = true; });
  if (_migrated) save(CUSTOM_KEY, customFoods);

  const allFoods = () => customFoods.concat(window.FOOD_DB);
  const waterFor = (dateStr) => water[dateStr] || 0;

  /* ---------- date helpers ---------- */
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const fmtDay = (str, opts) =>
    new Date(str + "T00:00:00").toLocaleDateString(undefined, opts || { weekday: "short", month: "short", day: "numeric" });

  const round = (n) => Math.round(n);

  /* ---------- totals ---------- */
  function totalsFor(dateStr) {
    return log.filter(e => e.date === dateStr).reduce((t, e) => {
      t.kcal += e.kcal; t.protein += e.protein; t.carbs += e.carbs; t.fat += e.fat;
      return t;
    }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  }

  /* ---------- view switching ---------- */
  const views = ["overview", "history", "input", "foods"];
  const titles = { overview: "Today", history: "History", input: "Add food", foods: "Food database" };

  function switchView(name) {
    views.forEach(v => {
      document.getElementById("view-" + v).classList.toggle("active", v === name);
    });
    document.querySelectorAll(".tab").forEach(t =>
      t.classList.toggle("active", t.dataset.view === name));
    document.getElementById("header-title").textContent = titles[name];
    const sub = document.getElementById("header-sub");
    sub.textContent = name === "overview"
      ? fmtDay(todayStr(), { weekday: "long", month: "long", day: "numeric" })
      : "";
    if (name === "overview") renderOverview();
    if (name === "history") renderHistory();
    if (name === "input") { document.getElementById("search").focus(); }
    if (name === "foods") renderDb();
  }

  document.querySelectorAll(".tab").forEach(t =>
    t.addEventListener("click", () => switchView(t.dataset.view)));
  document.getElementById("goto-input").addEventListener("click", () => switchView("input"));

  /* ---------- overview ---------- */
  const RING_CIRC = 2 * Math.PI * 56; // ~351.9

  function renderOverview() {
    const t = totalsFor(todayStr());

    document.getElementById("ov-cal").textContent = round(t.kcal);
    document.getElementById("ov-cal-goal").textContent = `of ${goal.kcal} kcal`;
    document.getElementById("ov-consumed").textContent = `${round(t.kcal)} kcal`;
    const remaining = goal.kcal - t.kcal;
    document.getElementById("ov-remaining").textContent =
      remaining >= 0 ? `${round(remaining)} kcal` : `${round(-remaining)} kcal over`;

    const pct = Math.min(t.kcal / goal.kcal, 1);
    const ring = document.getElementById("ring-progress");
    ring.style.strokeDashoffset = RING_CIRC * (1 - pct);
    ring.setAttribute("stroke", t.kcal > goal.kcal ? "var(--danger)" : "var(--cal)");

    setMacro("pro", t.protein, goal.protein);
    setMacro("carb", t.carbs, goal.carbs);
    setMacro("fat", t.fat, goal.fat);

    renderWater();
    renderTodayEntries();
  }

  function setMacro(key, val, target) {
    document.getElementById("ov-" + key).innerHTML = `${round(val)}<small>/${target}g</small>`;
    document.getElementById("bar-" + key).style.width = Math.min(val / target * 100, 100) + "%";
  }

  function renderWater() {
    const ml = waterFor(todayStr());
    document.getElementById("ov-water").textContent = ml;
    document.getElementById("ov-water-goal").textContent = goal.water;
    document.getElementById("water-fill").style.width =
      Math.min(ml / goal.water * 100, 100) + "%";
  }

  // Today's food grouped by meal, with per-meal subtotals
  function renderTodayEntries() {
    const box = document.getElementById("ov-entries");
    const entries = log.filter(e => e.date === todayStr());
    if (!entries.length) {
      box.innerHTML = `<div class="empty">No food logged yet.</div>`;
      return;
    }
    let html = "";
    MEALS.forEach(meal => {
      const items = entries.filter(e => (e.meal || "snack") === meal);
      if (!items.length) return;
      const sub = items.reduce((s, e) => s + e.kcal, 0);
      html += `<div class="meal-group">
        <div class="meal-head">
          <span class="m-name">${MEAL_LABEL[meal]}</span>
          <span class="m-kcal">${round(sub)} kcal</span>
        </div>`;
      html += items.map(e => `
        <div class="entry in-meal">
          <div class="info">
            <div class="name">${escapeHtml(e.name)}</div>
            <div class="meta">${round(e.grams)} g · P ${round(e.protein)} · C ${round(e.carbs)} · F ${round(e.fat)}</div>
          </div>
          <div class="kcal">${round(e.kcal)} kcal</div>
          <button class="del" data-id="${e.id}" aria-label="Delete">×</button>
        </div>`).join("");
      html += `</div>`;
    });
    box.innerHTML = html;
    box.querySelectorAll(".del").forEach(b =>
      b.addEventListener("click", () => deleteEntry(b.dataset.id)));
  }

  function deleteEntry(id) {
    log = log.filter(e => e.id !== id);
    save(LOG_KEY, log);
    renderOverview();
  }

  /* ---------- water actions ---------- */
  document.querySelectorAll("#water-card .water-actions button").forEach(b =>
    b.addEventListener("click", () => {
      const d = todayStr();
      water[d] = Math.max(0, waterFor(d) + parseInt(b.dataset.ml, 10));
      if (water[d] === 0) delete water[d];
      save(WATER_KEY, water);
      renderWater();
    }));

  /* ---------- edit goal ---------- */
  document.getElementById("edit-goal").addEventListener("click", () => {
    openSheet(`
      <h3>Daily goals</h3>
      <div class="meta">Set your targets for the day.</div>
      <div class="field-group">
        <label>Calories (kcal)</label>
        <input type="number" id="g-kcal" value="${goal.kcal}" inputmode="numeric" />
      </div>
      <div class="row4" style="margin-bottom:16px;">
        <div><label style="font-size:13px;color:var(--muted);">Protein g</label>
          <input type="number" id="g-pro" value="${goal.protein}" inputmode="numeric" /></div>
        <div><label style="font-size:13px;color:var(--muted);">Carbs g</label>
          <input type="number" id="g-carb" value="${goal.carbs}" inputmode="numeric" /></div>
        <div><label style="font-size:13px;color:var(--muted);">Fat g</label>
          <input type="number" id="g-fat" value="${goal.fat}" inputmode="numeric" /></div>
      </div>
      <div class="field-group">
        <label>Water (ml)</label>
        <input type="number" id="g-water" value="${goal.water}" inputmode="numeric" />
      </div>
      <button class="btn" id="save-goal">Save</button>
      <button class="btn ghost" id="cancel-goal">Cancel</button>
    `);
    document.getElementById("save-goal").addEventListener("click", () => {
      goal = {
        kcal: num("g-kcal", DEFAULT_GOAL.kcal),
        protein: num("g-pro", DEFAULT_GOAL.protein),
        carbs: num("g-carb", DEFAULT_GOAL.carbs),
        fat: num("g-fat", DEFAULT_GOAL.fat),
        water: num("g-water", DEFAULT_GOAL.water),
      };
      save(GOAL_KEY, goal);
      closeSheet();
      renderOverview();
    });
    document.getElementById("cancel-goal").addEventListener("click", closeSheet);
  });

  /* ---------- history ---------- */
  let histMetric = "kcal";
  let histRange = 7; // 7 or 30 days
  const metricLabel = { kcal: "kcal", protein: "g", carbs: "g", fat: "g", water: "ml" };
  const metricColor = { kcal: "var(--cal)", protein: "var(--pro)", carbs: "var(--carb)", fat: "var(--fat)", water: "#2aa7e0" };

  document.querySelectorAll("#chart-tabs .chip").forEach(c =>
    c.addEventListener("click", () => {
      histMetric = c.dataset.metric;
      document.querySelectorAll("#chart-tabs .chip").forEach(x =>
        x.classList.toggle("active", x === c));
      renderHistory();
    }));

  document.querySelectorAll("#range-tabs .chip").forEach(c =>
    c.addEventListener("click", () => {
      histRange = parseInt(c.dataset.range, 10);
      document.querySelectorAll("#range-tabs .chip").forEach(x =>
        x.classList.toggle("active", x === c));
      renderHistory();
    }));

  function rangeDates(n) {
    const out = [];
    const d = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const dd = new Date(d);
      dd.setDate(d.getDate() - i);
      out.push(`${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`);
    }
    return out;
  }

  const metricValue = (dateStr) =>
    histMetric === "water" ? waterFor(dateStr)
    : histMetric === "kcal" ? totalsFor(dateStr).kcal
    : totalsFor(dateStr)[histMetric];

  function renderHistory() {
    const dates = rangeDates(histRange);
    const dense = histRange > 7;
    const vals = dates.map(metricValue);
    const max = Math.max(...vals, 1);
    const active = vals.filter(v => v > 0);
    const avg = active.length ? active.reduce((a, b) => a + b, 0) / active.length : 0;

    document.getElementById("hist-title").textContent = `Last ${histRange} days`;
    document.getElementById("hist-avg").textContent =
      `${round(avg)} ${metricLabel[histMetric]}`;

    const bars = document.getElementById("hist-bars");
    bars.classList.toggle("dense", dense);
    bars.innerHTML = dates.map((d, i) => {
      const h = (vals[i] / max) * 100;
      // For 30-day view only label roughly weekly to avoid clutter
      const showDay = !dense || (dates.length - 1 - i) % 5 === 0;
      const dayLabel = dense ? fmtDay(d, { day: "numeric" }) : fmtDay(d, { weekday: "short" }).slice(0, 2);
      return `
        <div class="bar-col">
          <div class="amt">${vals[i] ? round(vals[i]) : ""}</div>
          <div class="fill" style="height:${h}%;background:${metricColor[histMetric]}"></div>
          <div class="day">${showDay ? dayLabel : ""}</div>
        </div>`;
    }).join("");

    // daily log list (most recent first): any day with food or water
    const loggedDays = [...new Set([...log.map(e => e.date), ...Object.keys(water)])]
      .sort().reverse();
    const box = document.getElementById("hist-days");
    if (!loggedDays.length) {
      box.innerHTML = `<div class="empty">No history yet. Start logging food!</div>`;
      return;
    }
    box.innerHTML = loggedDays.map(d => {
      const t = totalsFor(d);
      const count = log.filter(e => e.date === d).length;
      const ml = waterFor(d);
      return `
        <div class="entry">
          <div class="info">
            <div class="name">${fmtDay(d)}</div>
            <div class="meta">${count} item${count !== 1 ? "s" : ""} · P ${round(t.protein)} · C ${round(t.carbs)} · F ${round(t.fat)}${ml ? ` · 💧 ${ml} ml` : ""}</div>
          </div>
          <div class="kcal">${round(t.kcal)} kcal</div>
        </div>`;
    }).join("");
  }

  /* ---------- input / search ---------- */
  const searchEl = document.getElementById("search");
  searchEl.addEventListener("input", renderResults);

  function renderResults() {
    const q = searchEl.value.trim().toLowerCase();
    const list = allFoods()
      .filter(f => f.name.toLowerCase().includes(q))
      .slice(0, 40);
    const box = document.getElementById("results");
    if (!list.length) {
      box.innerHTML = `<div class="empty">No matches. Try “Add a custom food”.</div>`;
      return;
    }
    box.innerHTML = list.map((f, i) => {
      const idx = allFoods().indexOf(f);
      return `
        <div class="result" data-idx="${idx}">
          <div>
            <div class="name">${escapeHtml(f.name)}</div>
            <div class="meta">${f.kcal} kcal · ${f.protein}P ${f.carbs}C ${f.fat}F · per 100 g</div>
          </div>
          <div class="add">＋</div>
        </div>`;
    }).join("");
    box.querySelectorAll(".result").forEach(r =>
      r.addEventListener("click", () => openAddSheet(allFoods()[+r.dataset.idx])));
  }

  /* ---------- add food sheet ---------- */
  function openAddSheet(food) {
    const state = { mode: "serving", meal: defaultMeal() };
    openSheet(buildAddSheet(food, state));
    wireAddSheet(food, state);
  }

  function buildAddSheet(food, state) {
    const mode = state.mode;
    return `
      <h3>${escapeHtml(food.name)}</h3>
      <div class="meta">${food.kcal} kcal · ${food.protein}P · ${food.carbs}C · ${food.fat}F per 100 g</div>
      <div class="seg" id="add-seg">
        <button data-mode="serving" class="${mode === "serving" ? "active" : ""}">Servings (${food.serving} g)</button>
        <button data-mode="grams" class="${mode === "grams" ? "active" : ""}">Grams</button>
      </div>
      <div class="qty-row">
        <label id="qty-label">${mode === "serving" ? "Servings" : "Grams"}</label>
        <input type="number" id="qty" value="${mode === "serving" ? 1 : 100}" min="0" step="${mode === "serving" ? "0.5" : "10"}" inputmode="decimal" />
      </div>
      <label style="font-size:13px;color:var(--muted);margin-bottom:6px;display:block;">Meal</label>
      <div class="seg meal-seg" id="meal-seg">
        ${MEALS.map(m => `<button data-meal="${m}" class="${m === state.meal ? "active" : ""}">${MEAL_LABEL[m]}</button>`).join("")}
      </div>
      <div class="preview" id="add-preview"></div>
      <button class="btn" id="confirm-add">Add to today</button>
      <button class="btn ghost" id="cancel-add">Cancel</button>
    `;
  }

  function wireAddSheet(food, state) {
    const qty = document.getElementById("qty");
    const updatePreview = () => {
      const grams = computeGrams(food, state.mode, parseFloat(qty.value) || 0);
      const f = scale(food, grams);
      document.getElementById("add-preview").innerHTML = `
        <div><div class="pv">${round(f.kcal)}</div><div class="pl">kcal</div></div>
        <div><div class="pv">${round(f.protein)}</div><div class="pl">protein</div></div>
        <div><div class="pv">${round(f.carbs)}</div><div class="pl">carbs</div></div>
        <div><div class="pv">${round(f.fat)}</div><div class="pl">fat</div></div>`;
    };
    qty.addEventListener("input", updatePreview);
    updatePreview();

    const rebuild = () => {
      document.getElementById("sheet-content").innerHTML = buildAddSheet(food, state);
      wireAddSheet(food, state);
    };
    document.getElementById("add-seg").querySelectorAll("button").forEach(b =>
      b.addEventListener("click", () => { state.mode = b.dataset.mode; rebuild(); }));
    document.getElementById("meal-seg").querySelectorAll("button").forEach(b =>
      b.addEventListener("click", () => { state.meal = b.dataset.meal; rebuild(); }));

    document.getElementById("confirm-add").addEventListener("click", () => {
      const grams = computeGrams(food, state.mode, parseFloat(qty.value) || 0);
      if (grams <= 0) return;
      addEntry(food, grams, state.meal);
    });
    document.getElementById("cancel-add").addEventListener("click", closeSheet);
  }

  const computeGrams = (food, mode, q) => mode === "serving" ? q * food.serving : q;

  function scale(food, grams) {
    const k = grams / 100;
    return {
      kcal: food.kcal * k, protein: food.protein * k,
      carbs: food.carbs * k, fat: food.fat * k,
    };
  }

  function addEntry(food, grams, meal) {
    const f = scale(food, grams);
    log.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: todayStr(),
      name: food.name,
      grams,
      meal: meal || defaultMeal(),
      kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat,
    });
    save(LOG_KEY, log);
    closeSheet();
    searchEl.value = "";
    renderResults();
    switchView("overview");
  }

  /* ---------- food database tab ---------- */
  // "+ Add a custom food" on the Input tab → editor, then log it
  document.getElementById("add-custom").addEventListener("click", () =>
    openFoodEditor({}, { logAfter: true, title: "Add a custom food" }));

  document.getElementById("add-food-manual").addEventListener("click", () =>
    openFoodEditor({}, { title: "Add food" }));
  document.getElementById("scan-food").addEventListener("click", openScan);

  const dbSearchEl = document.getElementById("db-search");
  dbSearchEl.addEventListener("input", renderDb);

  function renderDb() {
    const q = (dbSearchEl.value || "").trim().toLowerCase();
    const mine = customFoods.filter(f => f.name.toLowerCase().includes(q));
    const builtin = window.FOOD_DB.filter(f => f.name.toLowerCase().includes(q));
    document.getElementById("db-count").textContent =
      `${customFoods.length} custom · ${window.FOOD_DB.length} built-in`;

    const macro = (f) => `${round(f.kcal)} kcal · ${f.protein}P ${f.carbs}C ${f.fat}F · per 100 g`;
    let html = "";
    mine.forEach(f => {
      html += `<div class="db-item">
        <div class="info">
          <div class="name">${escapeHtml(f.name)} <span class="badge">Custom</span></div>
          <div class="meta">${macro(f)}</div>
        </div>
        <button class="icon-btn edit" data-edit="${f.id}" aria-label="Edit">✎</button>
        <button class="icon-btn del" data-del="${f.id}" aria-label="Delete">🗑</button>
      </div>`;
    });
    builtin.forEach((f, i) => {
      const idx = window.FOOD_DB.indexOf(f);
      html += `<div class="db-item">
        <div class="info">
          <div class="name">${escapeHtml(f.name)}</div>
          <div class="meta">${macro(f)}</div>
        </div>
        <button class="icon-btn copy" data-copy="${idx}" aria-label="Copy to my foods">⧉</button>
      </div>`;
    });
    const box = document.getElementById("db-list");
    box.innerHTML = html || `<div class="empty">No foods match “${escapeHtml(q)}”.</div>`;

    box.querySelectorAll("[data-edit]").forEach(b =>
      b.addEventListener("click", () => {
        const f = customFoods.find(x => x.id === b.dataset.edit);
        if (f) openFoodEditor(f, { editingId: f.id, title: "Edit food" });
      }));
    box.querySelectorAll("[data-del]").forEach(b =>
      b.addEventListener("click", () => {
        const f = customFoods.find(x => x.id === b.dataset.del);
        if (f && confirm(`Delete "${f.name}" from your foods?`)) {
          customFoods = customFoods.filter(x => x.id !== b.dataset.del);
          save(CUSTOM_KEY, customFoods);
          renderDb();
        }
      }));
    box.querySelectorAll("[data-copy]").forEach(b =>
      b.addEventListener("click", () => {
        const src = window.FOOD_DB[+b.dataset.copy];
        openFoodEditor(Object.assign({}, src, { name: src.name + " (copy)" }), { title: "New food" });
      }));
  }

  /* ---------- food editor (manual / review-and-correct) ---------- */
  const veVal = (v) => (v === undefined || v === null || (typeof v === "number" && isNaN(v))) ? "" : v;

  function openFoodEditor(food, opts) {
    opts = opts || {};
    let note = "";
    if (opts.source === "barcode")
      note = `<div class="source-note">✓ Found in Open Food Facts — check the values, then save.</div>`;
    else if (opts.source === "barcode-missing")
      note = `<div class="source-note warn">No product match for that barcode. Enter the values manually.</div>`;
    else if (opts.source === "ocr")
      note = `<div class="source-note warn">⚠️ Read from the label photo — OCR can misread. Please verify <b>every</b> value before saving.</div>`;

    const f = (k) => veVal(food[k]);
    openSheet(`
      <h3>${opts.title || "Food"}</h3>
      ${note}
      <div class="fe-field"><label>Name</label>
        <input type="text" id="fe-name" value="${escapeHtml(String(f("name")))}" placeholder="Food name" /></div>
      <div class="row3">
        <div class="fe-field"><label>Serving (g)</label>
          <input type="number" id="fe-serv" value="${f("serving") || 100}" inputmode="decimal" /></div>
        <div class="fe-field" style="grid-column: span 2;"><label>Serving label</label>
          <input type="text" id="fe-unit" value="${escapeHtml(String(f("unit") || "1 serving"))}" placeholder="e.g. 1 cup" /></div>
      </div>
      <div class="meta" style="margin:8px 0 10px;">Nutrition per 100 g / 100 ml</div>
      <div class="row3">
        <div class="fe-field"><label>Calories</label><input type="number" id="fe-kcal" value="${f("kcal")}" inputmode="decimal" /></div>
        <div class="fe-field"><label>Protein g</label><input type="number" id="fe-pro" value="${f("protein")}" inputmode="decimal" /></div>
        <div class="fe-field"><label>Carbs g</label><input type="number" id="fe-carb" value="${f("carbs")}" inputmode="decimal" /></div>
      </div>
      <div class="row3">
        <div class="fe-field"><label>Sugar g</label><input type="number" id="fe-sugar" value="${f("sugar")}" inputmode="decimal" /></div>
        <div class="fe-field"><label>Fat g</label><input type="number" id="fe-fat" value="${f("fat")}" inputmode="decimal" /></div>
        <div class="fe-field"><label>Sat. fat g</label><input type="number" id="fe-sat" value="${f("satFat")}" inputmode="decimal" /></div>
      </div>
      <div class="row3">
        <div class="fe-field"><label>Fiber g</label><input type="number" id="fe-fiber" value="${f("fiber")}" inputmode="decimal" /></div>
        <div class="fe-field"><label>Salt g</label><input type="number" id="fe-salt" value="${f("salt")}" inputmode="decimal" /></div>
        <div></div>
      </div>
      <button class="btn" id="fe-save">${opts.logAfter ? "Save & log" : "Save to database"}</button>
      <button class="btn ghost" id="fe-cancel">Cancel</button>
    `, true);

    document.getElementById("fe-save").addEventListener("click", () => {
      const name = document.getElementById("fe-name").value.trim();
      if (!name) { document.getElementById("fe-name").focus(); return; }
      const saved = {
        id: opts.editingId || uid(),
        custom: true,
        name,
        serving: num("fe-serv", 100) || 100,
        unit: document.getElementById("fe-unit").value.trim() || "1 serving",
        kcal: num("fe-kcal", 0),
        protein: num("fe-pro", 0),
        carbs: num("fe-carb", 0),
        sugar: num("fe-sugar", undefined),
        fat: num("fe-fat", 0),
        satFat: num("fe-sat", undefined),
        fiber: num("fe-fiber", undefined),
        salt: num("fe-salt", undefined),
      };
      if (food.barcode) saved.barcode = food.barcode;
      if (opts.editingId) {
        const i = customFoods.findIndex(x => x.id === opts.editingId);
        if (i >= 0) customFoods[i] = saved; else customFoods.unshift(saved);
      } else {
        customFoods.unshift(saved);
      }
      save(CUSTOM_KEY, customFoods);
      if (opts.logAfter) {
        openAddSheet(saved);
      } else {
        closeSheet();
        renderDb();
      }
    });
    document.getElementById("fe-cancel").addEventListener("click", closeSheet);
  }

  /* ---------- scanning (barcode + label OCR) ---------- */
  const scanEl = document.getElementById("scan-overlay");
  const SCAN = { reader: null, running: false, busy: false };
  const setScanStatus = (m) => { document.getElementById("scan-status").textContent = m; };

  const _scripts = {};
  function loadScript(src) {
    if (_scripts[src]) return _scripts[src];
    _scripts[src] = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res;
      s.onerror = () => rej(new Error("load failed"));
      document.head.appendChild(s);
    });
    return _scripts[src];
  }

  async function openScan() {
    scanEl.classList.add("open");
    SCAN.busy = false;
    setScanStatus("Loading scanner…");
    try {
      await loadScript("https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js");
    } catch (e) {
      setScanStatus("Couldn't load the barcode scanner (offline?). Tap “Photograph the label” instead.");
      return;
    }
    startBarcode();
  }

  function startBarcode() {
    setScanStatus("Point the camera at the barcode…");
    let formats;
    const F = window.Html5QrcodeSupportedFormats;
    if (F) formats = [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E, F.CODE_128, F.CODE_39];
    try {
      SCAN.reader = new Html5Qrcode("scan-reader", { formatsToSupport: formats, verbose: false });
    } catch (e) {
      setScanStatus("Scanner failed to start. Use “Photograph the label”.");
      return;
    }
    SCAN.reader.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 260, height: 160 } },
      (text) => onBarcode(text),
      () => {} // ignore per-frame "not found"
    ).then(() => { SCAN.running = true; })
     .catch(() => setScanStatus("Camera unavailable. Tap “Photograph the label” to take a photo instead."));
  }

  async function stopReader() {
    if (SCAN.reader && SCAN.running) {
      try { await SCAN.reader.stop(); } catch (e) {}
      try { SCAN.reader.clear(); } catch (e) {}
    }
    SCAN.running = false;
  }

  async function closeScan() {
    await stopReader();
    SCAN.busy = false;
    scanEl.classList.remove("open");
    setScanStatus("");
  }

  async function onBarcode(code) {
    if (SCAN.busy) return;
    SCAN.busy = true;
    await stopReader();
    setScanStatus(`Looking up ${code}…`);
    try {
      const food = await lookupBarcode(code);
      await closeScan();
      if (food) openFoodEditor(food, { source: "barcode", title: "Review scanned food" });
      else openFoodEditor({ barcode: code }, { source: "barcode-missing", title: "Not found — enter manually" });
    } catch (e) {
      setScanStatus("Lookup failed (offline?). Tap “Photograph the label” or try again.");
      SCAN.busy = false;
      startBarcode();
    }
  }

  const numOr = (v, d) => (typeof v === "number" && !isNaN(v)) ? Math.round(v * 10) / 10 : d;

  async function lookupBarcode(code) {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json` +
      `?fields=product_name,brands,nutriments,serving_quantity`;
    const r = await fetch(url);
    const j = await r.json();
    if (j.status !== 1 || !j.product) return null;
    const p = j.product, n = p.nutriments || {};
    let kcal = n["energy-kcal_100g"];
    if (kcal == null && n["energy_100g"] != null) kcal = n["energy_100g"] / 4.184; // kJ → kcal
    const name = [p.brands ? p.brands.split(",")[0].trim() : "", p.product_name || ""]
      .filter(Boolean).join(" ").trim() || ("Product " + code);
    return {
      name,
      kcal: numOr(kcal, 0),
      protein: numOr(n["proteins_100g"], 0),
      carbs: numOr(n["carbohydrates_100g"], 0),
      sugar: numOr(n["sugars_100g"], undefined),
      fat: numOr(n["fat_100g"], 0),
      satFat: numOr(n["saturated-fat_100g"], undefined),
      fiber: numOr(n["fiber_100g"], undefined),
      salt: numOr(n["salt_100g"], undefined),
      serving: numOr(p.serving_quantity, 100) || 100,
      unit: "1 serving",
      barcode: code,
    };
  }

  document.getElementById("scan-photo").addEventListener("click", () =>
    document.getElementById("ocr-file").click());
  document.getElementById("ocr-file").addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    await stopReader();
    setScanStatus("Reading label… (this can take ~10–20s)");
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js");
      const { data } = await Tesseract.recognize(file, "eng");
      const parsed = parseLabel(data.text || "");
      await closeScan();
      openFoodEditor(parsed, { source: "ocr", title: "Review scanned label" });
    } catch (err) {
      setScanStatus("Couldn't read the label. You can enter the food manually instead.");
    }
  });

  function parseLabel(text) {
    const t = " " + text.toLowerCase().replace(/,/g, ".") + " ";
    const grab = (re) => { const m = t.match(re); return m ? Math.round(parseFloat(m[1]) * 10) / 10 : undefined; };
    const kcal = grab(/([0-9]+(?:\.[0-9]+)?)\s*k?cal/) ?? grab(/energy[^0-9]*([0-9]+(?:\.[0-9]+)?)/);
    return {
      name: "",
      kcal: kcal ?? 0,
      protein: grab(/protein[s]?[^0-9a-z]*([0-9]+(?:\.[0-9]+)?)/) ?? 0,
      carbs: grab(/carbohydrate[s]?[^0-9a-z]*([0-9]+(?:\.[0-9]+)?)/) ?? 0,
      sugar: grab(/sugar[s]?[^0-9a-z]*([0-9]+(?:\.[0-9]+)?)/),
      fat: grab(/(?:^|[^a-z])fat[^0-9a-z]*([0-9]+(?:\.[0-9]+)?)/),
      satFat: grab(/satur[a-z]*[^0-9a-z]*([0-9]+(?:\.[0-9]+)?)/),
      fiber: grab(/fib(?:re|er)[^0-9a-z]*([0-9]+(?:\.[0-9]+)?)/),
      salt: grab(/salt[^0-9a-z]*([0-9]+(?:\.[0-9]+)?)/),
      serving: 100,
      unit: "1 serving",
    };
  }

  document.getElementById("scan-close").addEventListener("click", closeScan);

  /* ---------- sheet helpers ---------- */
  const backdrop = document.getElementById("sheet");
  function openSheet(html, tall) {
    const c = document.getElementById("sheet-content");
    c.classList.toggle("tall", !!tall);
    c.innerHTML = html;
    backdrop.classList.add("open");
  }
  function closeSheet() { backdrop.classList.remove("open"); }
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeSheet(); });

  /* ---------- utils ---------- */
  function num(id, fallback) {
    const v = parseFloat(document.getElementById(id).value);
    return isNaN(v) ? fallback : v;
  }
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- init ---------- */
  renderResults();
  switchView("overview");
})();
