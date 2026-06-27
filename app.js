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

  let log = load(LOG_KEY, []);
  let goal = Object.assign({}, DEFAULT_GOAL, load(GOAL_KEY, {}));
  let customFoods = load(CUSTOM_KEY, []);
  let water = load(WATER_KEY, {}); // { "YYYY-MM-DD": ml }

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
  const views = ["overview", "history", "input"];
  const titles = { overview: "Today", history: "History", input: "Add food" };

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

  /* ---------- custom food ---------- */
  document.getElementById("add-custom").addEventListener("click", () => {
    openSheet(`
      <h3>Custom food</h3>
      <div class="meta">Enter nutrition values per 100 g.</div>
      <div class="field-group">
        <label>Name</label>
        <input type="text" id="c-name" placeholder="e.g. My protein shake" />
      </div>
      <div class="row4" style="margin-bottom:16px;">
        <div><label style="font-size:13px;color:var(--muted);">kcal</label>
          <input type="number" id="c-kcal" inputmode="numeric" /></div>
        <div><label style="font-size:13px;color:var(--muted);">P g</label>
          <input type="number" id="c-pro" inputmode="numeric" /></div>
        <div><label style="font-size:13px;color:var(--muted);">C g</label>
          <input type="number" id="c-carb" inputmode="numeric" /></div>
        <div><label style="font-size:13px;color:var(--muted);">F g</label>
          <input type="number" id="c-fat" inputmode="numeric" /></div>
      </div>
      <div class="qty-row">
        <label>Serving g</label>
        <input type="number" id="c-serv" value="100" inputmode="numeric" />
      </div>
      <button class="btn" id="save-custom">Save & add</button>
      <button class="btn ghost" id="cancel-custom">Cancel</button>
    `);
    document.getElementById("save-custom").addEventListener("click", () => {
      const name = document.getElementById("c-name").value.trim();
      if (!name) { document.getElementById("c-name").focus(); return; }
      const food = {
        name,
        kcal: num("c-kcal", 0), protein: num("c-pro", 0),
        carbs: num("c-carb", 0), fat: num("c-fat", 0),
        serving: num("c-serv", 100) || 100, unit: "1 serving",
      };
      customFoods.unshift(food);
      save(CUSTOM_KEY, customFoods);
      openAddSheet(food);
    });
    document.getElementById("cancel-custom").addEventListener("click", closeSheet);
  });

  /* ---------- sheet helpers ---------- */
  const backdrop = document.getElementById("sheet");
  function openSheet(html) {
    document.getElementById("sheet-content").innerHTML = html;
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
