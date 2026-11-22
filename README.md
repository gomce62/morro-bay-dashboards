# Morro Bay Kayaking Conditions & Optimal Planner

A static web dashboard for checking kayaking conditions, tide-aligned launch strategies, live estuary webcam snapshots, and 7-day paddling windows in Morro Bay, CA.

**Live Site (Original):** https://gomce62.github.io/morro-bay-dashboards/  
**Live Site (Indie's Kayak Forecast):** https://gomce62.github.io/morro-bay-dashboards/Indies%20Kayak%20Forecast/

---

## What This Website Does

- **Conditions Overview:** Displays water temperature, air temperature, wind speed/direction, wave height, and daylight/sky status calculated for Morro Bay's sunrise and sunset times.
- **Launch Time & Site Planner:** Supports both **Live Now** mode and custom day/time planning, comparing launch sites (State Park Kayak Launch Ramp, Public Launch, and Coleman Park) with tide-strategy recommendations and quick Google Maps links.
- **Live Estuary Webcam:** Pulls the [805 Webcams Morro Bay Estuary Program](https://www.805webcams.com/morro-bay-webcam-estuary-program/) snapshot with automatic 5-minute refreshes and fallback image proxies.
- **7-Day Forecast & Optimal Windows:** Renders daily temperature highs/lows, wind forecasts, tide schedules, and highlighted optimal launch windows.
- **Zero-Build Architecture:** Built with plain HTML, vanilla JavaScript, Tailwind CSS (CDN), Font Awesome (CDN), and Google Fonts (`Plus Jakarta Sans`)—no build step, Node backend, or API keys required.

---

## Indie's Kayak Forecast (`Indies Kayak Forecast/`)

A standalone version at `Indies Kayak Forecast/index.html` (leaving the root `index.html` untouched) that adds:

- **Interactive Forecast Presenter ("Indie"):** Click **Hear Indie's Kayak Forecast** in the header or on Today's card to open a centered broadcast modal with live captions, Web Speech API narration, voice/speed/pitch settings, and hybrid `onboundary` + cadence lip-sync (with D-pad focus support for Google TV APKs).
- **Layered Artwork & Rotating Outfits:** Renders Indie's transparent full-body foreground frames over a locked Morro Bay / Morro Rock shoreline plate (`assets/bg_morro_bay.jpg`), rotating automatically between **One-Piece** (`indie_onepiece_*.png`) and **Sport Shorts** (`indie_shorts_closed.png`), with a manual **Outfit** toggle and saved bikini frames (`indie_v2_*.png`) in `Indies Kayak Forecast/assets/`.
- **Live Central Coast Telemetry:** Fetches current air temperature, wind, precipitation, and sky conditions from **NWS (`KSBP`)** and water temperature from **NOAA CO-OPS (`9412110`)** on load and on **Refresh Station Data**.

---

## Installation & Local Usage

Because this is a static site, there are no dependencies to install.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/gomce62/morro-bay-dashboards.git
   cd morro-bay-dashboards
   ```

2. **Run locally (pick one):**
   - **Option A — Open directly:** Double-click `index.html` (or open it in your browser).
   - **Option B — Local static server:**
     ```bash
     # Using Python
     python -m http.server 8000

     # Or using Node.js
     npx serve .
     ```
     Then visit `http://localhost:8000` (or the port shown in your terminal).

---

## Deploying / Embedding in Google Sites

This repository is deployed via **GitHub Pages** from the `main` branch (`/ (root)`).

To embed it in **Google Sites** (`sites.google.com`):
1. Open your Google Site editor.
2. Select **Insert → Embed → By URL**.
3. Paste:
   ```text
   https://gomce62.github.io/morro-bay-dashboards/
   ```
