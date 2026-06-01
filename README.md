# GitHub Mental Peace Filter 🍃

A Chrome extension that softens emotionally draining comments on GitHub Issues and Pull Requests, helping open-source maintainers protect their mental energy.

## What it does

The extension scans GitHub Issue/PR comments in real time and gently transforms three categories of noisy or hostile messages:

| Type | Example | How it's handled |
|------|---------|------------------|
| **Rush** — impatient pings & demands | "When will this be fixed?", "bump", "ASAP" | Replaced with a calm placeholder. Hover to reveal the original (dimmed). |
| **Toxic** — insults & emotional venting | "useless", "garbage", "what the hell" | Blinded behind a red warning card. Click to toggle the original text. |
| **Noise** — low-information comments | "+1", "same here", "me too" | Shrunk and greyed out to reduce visual fatigue. |

All detection happens **client-side** through a regex-based dictionary. No external server, no AI API, no telemetry.

## Features

- **Real-time filtering** via `MutationObserver` — works on GitHub's SPA navigation and lazy-loaded comments.
- **Popup toggle** — turn the filter on/off instantly without reloading the page.
- **Healed-text counter** — track how many comments have been softened.
- **Primer-friendly styling** — visual treatments match GitHub's native look and feel.

## Installation

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the project folder.
5. Visit any GitHub Issue or Pull Request to see the filter in action.

## Tech stack

- Manifest V3
- Vanilla JavaScript, HTML, CSS
- `chrome.storage.local` for state sync between popup and content script

## File structure

```
.
├── manifest.json   # Extension manifest (MV3)
├── content.js      # Dictionary, transforms, MutationObserver
├── content.css     # Visual styles for each transform type
├── popup.html      # Pastel popup UI
└── popup.js        # Toggle + counter logic
```

## Status

Prototype. The dictionary is intentionally broad and may produce false positives — tune the patterns in `content.js` to fit your needs.
