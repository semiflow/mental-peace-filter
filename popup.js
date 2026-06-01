// ============================================================
// GitHub Mental Peace Filter — Popup Script
// ============================================================

const toggleEl = document.getElementById('toggle');
const stateEl = document.getElementById('state');
const countEl = document.getElementById('count');
const catToggleEls = document.querySelectorAll('.cat-toggle');

const DEFAULT_CATEGORIES = { rush: true, toxic: true, noise: true };

// ------------------------------------------------------------
// UI 렌더
// ------------------------------------------------------------
function renderEnabled(enabled) {
    toggleEl.checked = enabled;
    stateEl.textContent = enabled ? '활성' : '비활성';
    stateEl.style.color = enabled ? '#0f766e' : '#94a3b8';
}

function renderCount(count) {
    countEl.textContent = Number(count || 0).toLocaleString();
}

function renderCategories(cats) {
    catToggleEls.forEach(cb => {
        cb.checked = cats[cb.dataset.cat] !== false;
    });
}

// ------------------------------------------------------------
// 초기 로드
// ------------------------------------------------------------
async function loadState() {
    const data = await chrome.storage.local.get(['enabled', 'count', 'categories']);
    const enabled = data.enabled !== false;
    const categories = Object.assign({}, DEFAULT_CATEGORIES, data.categories || {});
    renderEnabled(enabled);
    renderCount(data.count);
    renderCategories(categories);
}

// ------------------------------------------------------------
// 토글 → storage 저장 + 현재 탭 content script에 메시지 전송
// ------------------------------------------------------------
async function handleToggle() {
    const enabled = toggleEl.checked;
    renderEnabled(enabled);
    await chrome.storage.local.set({ enabled });

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id || !tab.url) return;
        if (!tab.url.startsWith('https://github.com/')) return;
        await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE', enabled });
    } catch (err) {
        // content script가 주입되지 않은 페이지일 수 있음 — 무시
    }
}

toggleEl.addEventListener('change', handleToggle);

// ------------------------------------------------------------
// 카테고리 토글 → storage 저장 + 현재 탭에 UPDATE_CATEGORIES 메시지
// ------------------------------------------------------------
async function handleCategoryChange() {
    const categories = {};
    catToggleEls.forEach(cb => {
        categories[cb.dataset.cat] = cb.checked;
    });
    await chrome.storage.local.set({ categories });

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id || !tab.url) return;
        if (!tab.url.startsWith('https://github.com/')) return;
        await chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_CATEGORIES', categories });
    } catch (err) {
        // content script가 주입되지 않은 페이지일 수 있음 — 무시
    }
}

catToggleEls.forEach(cb => cb.addEventListener('change', handleCategoryChange));

// ------------------------------------------------------------
// 다른 곳에서 상태가 바뀌면 팝업에도 실시간 반영
// ------------------------------------------------------------
chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.count) renderCount(changes.count.newValue);
    if (changes.enabled) renderEnabled(changes.enabled.newValue !== false);
    if (changes.categories) {
        const cats = Object.assign({}, DEFAULT_CATEGORIES, changes.categories.newValue || {});
        renderCategories(cats);
    }
});

loadState();
