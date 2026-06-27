# Calorie Tracker

A simple, mobile-first web app for tracking daily calories and nutrients. No build step, no account, fully offline — your data is stored locally in your browser.

## Features

- **Overview** — daily calorie ring, macro progress (protein / carbs / fat), and a water-intake tracker. Today's food is grouped by meal (breakfast / lunch / dinner / snack) with per-meal subtotals.
- **Input** — search a built-in food database (~70 common foods), add by serving or grams with a live nutrition preview, tag each item with a meal, and add your own custom foods.
- **History** — 7-day / 30-day trends for calories, protein, carbs, fat, and water, plus a daily log.

## Usage

It's plain HTML/CSS/JS — just open `index.html` in any browser, or host the folder on any static host.

### Run locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

### On your phone

Host the folder (e.g. GitHub Pages), open the URL on your phone, then use your browser's **Add to Home Screen** to launch it full-screen like a native app.

## Files

| File | Purpose |
|------|---------|
| `index.html` | App structure (3 views + bottom tab bar) |
| `styles.css` | Mobile-first styling |
| `app.js` | App logic (logging, totals, history, water, meals) |
| `foods.js` | Built-in food database (per-100g values) |

## Data & storage

All data is kept in your browser's `localStorage` on the device you use. Nutrition values in the database are standard reference figures (good estimates, not lab-exact).
