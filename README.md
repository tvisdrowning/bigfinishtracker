# Big Finish Tracker

A lightweight web application for tracking listening progress across the Big Finish Doctor Who audio range. Filter releases by Doctor, series, or sub-series, search by title, and mark individual stories or entire releases as listened.

## Features
- Browse a catalogue sourced from the [abs-agg](https://github.com/vito0912/abs-agg) Big Finish metadata provider with a bundled offline fallback.
- Filter and search to quickly narrow down stories.
- Mark entire releases or specific stories as listened.
- Persistent progress storage in the browser via `localStorage`.
- Catalogue releases and stories cached in an in-browser IndexedDB database for offline reuse.
- Completion snapshots: overall percentage, by Doctor, and by series.

## Running locally
This is a static site—no build step required.

```bash
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

### Metadata provider sync
The catalogue attempts to load the latest Big Finish releases from the hosted abs-agg provider at `https://provider.vito0912.de/bigfinish` using basic auth (`abs`). If the provider is unreachable, the app will fall back to the bundled sample catalogue. Use the “Sync from metadata provider” button to retry with your current search text.

All progress is stored locally in your browser and can be cleared by removing the `bft-progress-v1` entry from localStorage. The synced catalogue is also persisted in an IndexedDB database (`bft-catalogue`); remove that database from your browser's storage inspector to fully reset the app.
