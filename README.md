# PulseAI — Modular Web Application

A standalone, modular AI daily intelligence dashboard for **Tamil Nadu**, **India (National)**, and **Global** updates.

## Project Structure

```text
pulseai-web/
├── index.html                  # Clean application shell & modal markup
├── css/
│   └── styles.css              # Custom scrollbars, typography, and keyframe animations
└── js/
    ├── main.js                 # App entry point, state controller, and DOM event listeners
    ├── data/
    │   ├── sources.js          # Whitelisted trusted news sources registry
    │   └── initialStories.js   # Verified October 2026 baseline stories (TN, India, Global)
    ├── services/
    │   ├── storage.js          # Safe localStorage persistence for stories, bookmarks & API key
    │   └── aiEngine.js         # Priority 1/2 classifier, scorer, What/Why/Takeaway generator & HN sync
    └── ui/
        └── render.js           # Pure HTML template renderers for cards, badges, and Markdown export
```

## Running Locally

Because the project uses standard ES Modules (`<script type="module" src="js/main.js">`), serve the folder over any local HTTP server:

```bash
python3 -m http.server 8000
# Then open http://localhost:8000
```
