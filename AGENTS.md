# AGENTS.md — Morro Bay Kayak Forecast & Indie's Dashboard

This file captures the architecture, tech stack, design guidelines, key decisions, and constraints for `gomce62/morro-bay-dashboards` so any AI assistant can immediately understand and follow them.

---

## 1. Repository Structure & Deployment

- **Root Dashboard (`index.html`):** Original Morro Bay Kayaking Conditions & Optimal Planner. Keep untouched unless explicitly asked.
- **Indie's Kayak Forecast (`Indies Kayak Forecast/index.html`):** Enhanced dashboard featuring Indie (animated weather-girl presenter), live telemetry, Conditions & Time-of-Day Simulator, and 805 Webcams estuary snapshots.
- **Assets (`Indies Kayak Forecast/assets/`):** Background plates (`bg_*.jpg`) and Indie character frames (`indie_*_{closed,mid,open,blink}.png`).
- **Deployment:** Zero-build static site hosted via **GitHub Pages** from `origin/main` (`/ (root)`). Pushing to `main` automatically triggers the `pages-build-deployment` workflow.
  - Live URL: `https://gomce62.github.io/morro-bay-dashboards/Indies%20Kayak%20Forecast/`

---

## 2. Tech Stack & Constraints

- **Frontend:** Plain HTML5, vanilla JavaScript, Tailwind CSS (CDN), Font Awesome (CDN), Google Fonts (`Plus Jakarta Sans`).
- **Speech & Captions:** Browser Web Speech API (`SpeechSynthesisUtterance`) with `onboundary` word tracking and cadence fallback.
- **Live Data Sources (No API keys required):**
  - Open-Meteo (`forecast` & `marine-api`) and NWS (`KSBP`, grid `LOX/72,119`) for air temp, wind, precipitation, and sky conditions.
  - NOAA CO-OPS (`9412110` / `9412139`) for water temperature, wind, and tide predictions.
  - 805 Webcams Morro Bay Estuary Program snapshots (with `weserv.nl` / `wsrv.nl` cache-busting fallbacks).
- **Security:** Never commit API keys, passwords, tokens, or `.env` secrets to the repository.

---

## 3. Indie Avatar & Animation Architecture

### Layering & Compositing (Preventing Flicker/Shadow Artifacts)
- **Strict `z-index` stack inside the modal stage:**
  - `#indie-bg-img`: `z-0`
  - Grounding shadow: `z-[1]`
  - Foreground wrapper: `z-10`
  - `#indie-frame-closed`: `z-10`, permanently `opacity: 1` (never faded out, no CSS `transition`).
  - `#indie-frame-mid`, `#indie-frame-open`, `#indie-frame-blink`: `z-20`, `will-change: opacity` (instant crisp swap, no CSS `opacity` transition).
- **Face-Only Overlays (Critical):** Every `mid`, `open`, and `blink` PNG **must be 100% transparent (`alpha = 0`) everywhere outside Indie's face** (roughly `(458..524, 138..218)` on `1024x1024` frames). Her body, legs, hair, and props are rendered solely by `indie-frame-closed` so nothing below her chin ever re-composites or flashes dark background shadows while speaking.
- **Motion Constraints:** Do not add 2D `rotate()` to `#indie-stage`'s `indieSpeakBody` keyframe animation—keep only gentle scale/vertical breathing so GPU compositor tiles don't tear.
- **Preloading:** `preloadIndieOutfits()` preloads all backgrounds and outfit frames on modal open so base `closed` images never disappear while loading.

### Facial Expressions & Lip-Sync
- **`closed`:** Warm natural smile (Indie always returns to this smile when finished speaking).
- **`mid` & `open`:** Subtle, natural conversational mouth shapes matched to each outfit's face skin tone—never exaggerated wide-open "Mr. Bill" mouths.
- **`blink`:** Independent `startIndieBlinkLoop()` triggers a `135ms` natural blink every `2.6s–5.0s`, both while speaking and while idle.
- **`onboundary` Debounce:** Debounce rapid `onboundary` mouth changes (`115ms`) for smooth lip-sync cadence.

---

## 4. Outfit Modes, Backgrounds & Styling Rules

### Automatic Mode Selection (`rotateIndieOutfit` & `applyIndieOutfit`)
1. **After Dark (`!tide.isDaylight`, `mode: 'night'`):**
   - Rotates through indoor studio outfits (`night_black`, `night_bw`, `night_cowl` — no kayak paddle).
   - Uses `assets/bg_indoor_rainy_night.jpg` when raining, or `assets/bg_indoor_clear_night.jpg` when dry.
   - Both night backgrounds depict an unmistakable **TV weather studio** (overhead studio lights, acoustic wall panels, teal LED accents, studio floor) with Morro Bay visible through a 3-pane window and **no kayak**.
2. **Daytime Rain (`mode: 'rainy'`):**
   - Auto-selected when raining during daylight (`Rainy Day` outfit with umbrella).
   - Uses `assets/bg_morro_bay_rainy.jpg` (overcast Morro Bay with falling rain and **no kayak**—kayak stays dry indoors).
   - Note: `bg_morro_bay_rainy.jpg` is shown **only** when the `Rainy Day` outfit is active.
3. **Daytime Clear (`mode: 'day'`):**
   - Rotates through `One-Piece`, `Sport Shorts`, `Skort & Knit`, `Surf Rashguard`, and `Cozy Knit`.
   - Uses `assets/bg_morro_bay.jpg`, featuring Chris's actual **red Pelican sit-in kayak** positioned in the shallow waterline behind Indie so she stands cleanly on the sandy shore in front of it.

### Avatar Anatomy & Wardrobe Guidelines
- **Consistency:** Preserve Indie's exact face, blonde hair, and body proportions across all outfits.
- **Pose Variation:** Give each outfit a slightly different natural standing position and pose (e.g., weight shifted, subtle turn, varied arm/hand placement) while preserving her exact face and body proportions.
- **Wardrobe Styling Rule:** Anytime an outfit is created or updated, show **natural medium-full breast size (proportionate to her slender frame, never oversized) with tight, pressed-together vertical center cleavage** (soft, natural teardrop drape) and **most of her toned legs (mid-thigh hemline for skirts/dresses)** unless the user specifically requests long pants.
- **Anatomy Refinements:** Keep her legs long, lean, and slender with smoothly shaded knees (avoid harsh angular creases) and **high, sleek, well-defined calf muscles** tapering cleanly into slim ankles.

---

## 5. Forecast Script & UI Guidelines (`buildTodayBriefingScript`)

- **Exact Tagline:** Always introduce her as `"I'm Indie, your Morro Bay Alta Court weather girl"` (never `"It's Indie from..."`).
- **Studio Tag:** When after dark / indoors, include `"reporting from my studio in Morro Bay"` (or `"live from my studio in Morro Bay"`).
- **Condition-Aware Script:**
  - **After Dark:** Lead immediately with the fact that it's too dark to kayak tonight, then give current conditions and the next daylight launch recommendation.
  - **Rain:** State that Chris's kayak is staying dry indoors due to rain and advise staying ashore until the next dry daylight window.
  - **No Post-Water Quips When Not Kayaking:** Omit flirty "after you get out of the water" quips whenever it is raining or too dark to kayak (`!canKayakNow`).
  - **Time-Aware High/Low:** After 4:00 PM or after dark on Today's forecast, use past tense for the daytime high (`"Earlier today, the high reached ..."`).
- **Grammar & Variety:**
  - Use `pickIndieLine(pool, storageKey)` backed by `localStorage` so intros, water-temp quips, and closings vary each forecast without repeating back-to-back.
  - Keep prepositions and site names grammatical (e.g., `"From Coleman Park"` without `"the"`, `"under clear skies"`, `"with rain"`, strip weekday abbreviations from `"Tomorrow: Mon ..."`).
- **Auto-Scrolling Captions:** `renderIndieCaptionAt(charIndex)` must auto-scroll `#indie-captions` to keep the active spoken word visible without manual scrolling, resetting `scrollTop = 0` on stop/end.

---

## 6. Verification Checklist Before Pushing

1. Verify all `assets/...` paths referenced in `Indies Kayak Forecast/index.html` exist on disk.
2. Validate every `<script>` block in `Indies Kayak Forecast/index.html` with Node (`new Function(script)`).
3. Commit and push to `origin/main`, then optionally confirm `pages-build-deployment` succeeds via `gh run list`.
