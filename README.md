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
- **Global toggle** — turn the filter on/off instantly without reloading the page.
- **Per-category toggles** — independently enable or disable Rush, Toxic, or Noise filtering. Changes apply immediately to the active tab.
- **Inline "Not harmful" allowlist** — click the small button on any filtered comment to mark it as a false positive. The normalized text is stored locally and that exact comment (and identical future ones) won't be filtered again.
- **Healed-text counter** — track how many comments have been softened. The counter does not double-count when categories are toggled off and back on.
- **Primer-friendly styling** — visual treatments match GitHub's native look and feel.

### Privacy

Everything — including the allowlist — is stored only in `chrome.storage.local`. No data is sent to any external server, and the extension does not request broader permissions than `storage` and access to `github.com`.

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

## Manual test checklist

There is no automated test runner. After making changes, walk through the following on a real GitHub Issue/PR page:

1. Global toggle off removes all transforms from the page.
2. Turning off only **Rush** restores rush comments while Toxic and Noise stay filtered.
3. Turning off only **Toxic** restores toxic comments while Rush and Noise stay filtered.
4. Turning off only **Noise** restores noise comments while Rush and Toxic stay filtered.
5. Turning a category back on rescans the page and reapplies only that category.
6. Clicking **Not harmful** on a filtered comment restores it immediately.
7. Reloading the page keeps that comment unfiltered because the text is allowlisted.
8. Allowlist does not create duplicate entries for the same normalized text.
9. The healed-text counter does not increase when removing or restoring transforms (toggling categories or clicking Not harmful).
10. No network calls are introduced — verify via the browser DevTools Network tab.

## Status

Prototype. The dictionary is intentionally broad and may produce false positives — use the inline **Not harmful** button to allowlist any misclassified comment, or tune the patterns in `content.js`.
