# GitHub Mental Peace Filter 🍃

A Chrome extension that softens emotionally draining comments on GitHub Issues and Pull Requests, helping open-source maintainers protect their mental energy.

## What it does

The extension protects open-source maintainers in two directions:

**Incoming — soften what others write to you.** Scans GitHub Issue/PR comments in real time and gently transforms three categories of noisy or hostile messages:

| Type | Example | How it's handled |
|------|---------|------------------|
| **Rush** — impatient pings & demands | "When will this be fixed?", "bump", "ASAP" | Replaced with a calm placeholder. Hover to reveal the original (dimmed). |
| **Toxic** — insults & emotional venting | "useless", "garbage", "what the hell" | Blinded behind a red warning card. Click to toggle the original text. |
| **Noise** — low-information comments | "+1", "same here", "me too" | Shrunk and greyed out to reduce visual fatigue. |

**Outgoing — 🪞 Self-Tone Mirror.** Reuses the same dictionary against *your own* draft reply. Detects harsh phrases as you type and, when toxic language is found, intercepts the submit click with a 5-second cooldown modal so you have time to reconsider before sending a comment you might regret.

All detection happens **client-side** through a regex-based dictionary. No external server, no AI API, no telemetry.

## Features

- **Real-time filtering** via `MutationObserver` — works on GitHub's SPA navigation and lazy-loaded comments.
- **Global toggle** — turn the filter on/off instantly without reloading the page.
- **Per-category toggles** — independently enable or disable Rush, Toxic, or Noise filtering. Changes apply immediately to the active tab.
- **Inline "Not harmful" allowlist** — click the small button on any filtered comment to mark it as a false positive. The normalized text is stored locally and that exact comment (and identical future ones) won't be filtered again.
- **Allowlist management** — the popup shows every allowlisted entry with its category. Click ✕ to remove an entry; any matching comment currently on the page is re-filtered immediately.
- **Healed-text counter** — track how many comments have been softened. The counter does not double-count when categories are toggled off and back on.
- **🪞 Self-Tone Mirror** — inline warning under any comment textarea when your draft contains rush or toxic phrases. If toxic phrases remain when you click *Comment*, a calm modal asks you to wait 5 seconds and reread before sending (or back out and edit). Independent toggle and counter in the popup.
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
├── content.js      # Dictionary, incoming-comment transforms, Self-Tone Mirror, MutationObserver
├── content.css     # Visual styles for transforms and the Self-Tone Mirror modal
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
11. After "Not harmful", the entry appears in the popup's allowlist with the correct category badge.
12. Clicking the ✕ in the popup's allowlist removes the entry, and any matching comment on the page is re-filtered without a reload.
13. Typing a rush phrase (e.g., "bump") into a comment textarea shows the yellow Self-Tone Mirror panel inline; clearing the textarea hides it.
14. Typing a toxic phrase (e.g., "this is useless") and clicking *Comment* opens the cooldown modal; the *그래도 보내기* button stays disabled for 5 seconds, then submits without re-intercepting.
15. Pressing *다시 다듬기*, the overlay background, or Escape closes the modal and refocuses the textarea without submitting.
16. Toggling Self-Tone Mirror off in the popup removes mirror panels immediately and stops intercepting submit clicks.
17. The "거울에 비춘 답글" counter in the popup increments by one each time the cooldown modal opens.

## Status

Prototype. The dictionary is intentionally broad and may produce false positives — use the inline **Not harmful** button to allowlist any misclassified comment, or tune the patterns in `content.js`.
