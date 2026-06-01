// ============================================================
// GitHub Mental Peace Filter — Content Script
// ============================================================

// ------------------------------------------------------------
// 매칭 사전 (Dictionary)
//   - 유형 1: 무례한 재촉 (rush)     → 흐림 + 호버 시 원문 노출
//   - 유형 2: 비난/감정 배설 (toxic) → 블라인드 + 클릭 토글
//   - 유형 3: 무의미 노이즈 (noise)  → 글자 축소 + 회색 처리
// ------------------------------------------------------------
const DICTIONARY = {
    rush: {
        placeholder: '[진행 상황 확인 요청으로 순화됨]',
        patterns: [
            // 한국어
            /언제\s*수정/,
            /언제\s*되나요/,
            /언제\s*됩니까/,
            /언제까지\s*기다/,
            /도대체\s*언제/,
            /빨리\s*고쳐/,
            /빨리\s*해\s*주/,
            /왜\s*안\s*고치/,
            /왜\s*이렇게\s*오래/,
            /아직\s*안\s*[됐돼됨]/,
            /업데이트\s*[언제없]/,
            /확인\s*좀\s*해\s*주/,
            /답변\s*좀\s*주/,
            /급한데/,
            /급해요/,
            /언제\s*머지/,
            /언제\s*배포/,
            // 영어
            /\bfix\s+this\s+(asap|now|please)\b/i,
            /\bany\s+updates?\b/i,
            /\bwhy\s+is\s+this\s+taking\s+so\s+long\b/i,
            /\bwhen\s+will\s+this\s+be\s+(fixed|done|merged|released)\b/i,
            /\bwhen\s+can\s+we\s+expect\b/i,
            /\bis\s+anyone\s+(working|looking)\s+on\b/i,
            /\bany\s+progress\b/i,
            /\bstill\s+waiting\b/i,
            /\bhello\?+/i,
            /(^|\s)ping\??\s*$/im,
            /(^|\s)bump\s*$/im,
            /\bcome\s+on\b/i,
            /\bstill\s+no\s+fix\b/i,
            /\bany\s+eta\b/i,
            /\bplease\s+(fix|merge|review|respond)\b/i,
            /\bcan\s+you\s+(please\s+)?(fix|merge|look)\b/i
        ]
    },
    toxic: {
        placeholder: '⚠️ [메인테이너 보호를 위해 블라인드 처리된 문장입니다]',
        patterns: [
            // 한국어
            /쓰레기/,
            /망작/,
            /망쳤/,
            /이딴\s*거/,
            /병신/,
            /어이없/,
            /한심/,
            /최악/,
            /개판/,
            /엉망/,
            /빡친/,
            /빡쳐/,
            /기본도\s*안/,
            /왜\s*만들었/,
            /장난하/,
            /실력이?\s*없/,
            /수준\s*보소/,
            /후지/,
            /구려/,
            /짜증\s*나/,
            /토\s*나/,
            /실망\s*[했스]/,
            // 영어
            /\buseless\b/i,
            /\bbroken\b/i,
            /\bworst\b/i,
            /\bgarbage\b/i,
            /\btrash\b/i,
            /\bhorrible\b/i,
            /\bterrible\b/i,
            /\bstupid\b/i,
            /\bawful\b/i,
            /\bdisaster\b/i,
            /\bincompetent\b/i,
            /\bridiculous\b/i,
            /\bidiot/i,
            /\bwtf\b/i,
            /\bthis\s+is\s+a\s+joke\b/i,
            /\bjoke\s+of\b/i,
            /\bwhat\s+(the\s+)?hell\b/i,
            /\bare\s+you\s+(kidding|serious)/i,
            /\bnonsense\b/i,
            /\bpathetic\b/i,
            /\bdisgrace/i,
            /\bjunk\b/i,
            /\bcrap(py)?\b/i,
            /\bsucks?\b/i,
            /\bshit(ty)?\b/i,
            /\bdamn\s+(thing|library|tool|repo)/i
        ]
    },
    noise: {
        patterns: [
            // 한국어 — 행 단위 / 짧은 댓글
            /^나도\s*안\s*[됨돼되]\.?$/m,
            /^저도\s*안\s*[됨돼되]\.?$/m,
            /^저도(?:요|입니다)?[\.\!]?$/m,
            /^같은\s*증상\.?$/m,
            /^동일(\s*증상|\s*문제|하게\s*안\s*됩?니다)\.?$/m,
            /^안\s*되는데\s*어쩌(죠|나요)\.?$/m,
            /^마찬가지(요|입니다)?\.?$/m,
            /^저도\s*같(아요|은)\.?$/m,
            /^확인했(어요|습니다)?\.?$/m,
            // 영어
            /^same\s+here\.?$/im,
            /^\+1\.?$/im,
            /^me\s+too\.?$/im,
            /^same\s+(issue|problem|bug|here)\.?$/im,
            /^having\s+the\s+same/im,
            /^any\s+luck\??\s*$/im,
            /^(it\s+)?doesn'?t\s+work\.?$/im,
            /^(it'?s\s+)?not\s+working\.?$/im,
            /^this\.?$/im,
            /^same\.?$/im,
            /^\^this\.?$/im,
            /^confirmed\.?$/im,
            /^reproducible\.?$/im,
            /^👍\s*$/m,
            /^❤️\s*$/m,
            /^🙏\s*$/m
        ]
    }
};

// ------------------------------------------------------------
// 상태
// ------------------------------------------------------------
const State = {
    enabled: true,
    count: 0,
    originals: new WeakMap()   // element → 원본 innerHTML
};

const TARGET_SELECTOR = '.comment-body, .js-issue-title';

// ------------------------------------------------------------
// 텍스트 치환 핵심 엔진
// ------------------------------------------------------------
function processElement(el) {
    if (!el || el.dataset.mpfProcessed) return;
    const text = el.textContent ? el.textContent.trim() : '';
    if (!text) return;

    for (const [type, config] of Object.entries(DICTIONARY)) {
        for (const pattern of config.patterns) {
            if (pattern.test(text)) {
                applyTransform(el, type, config);
                return;
            }
        }
    }
}

function applyTransform(el, type, config) {
    el.dataset.mpfProcessed = type;

    if (type === 'noise') {
        // 유형 3: 원문 유지 + 시각적 축소
        el.classList.add('mpf-noise');
    } else {
        // 유형 1, 2: 원본 보관 후 placeholder + original 구조로 교체
        const originalHTML = el.innerHTML;
        State.originals.set(el, originalHTML);
        el.classList.add(`mpf-${type}`);
        el.innerHTML =
            `<span class="mpf-placeholder">${escapeHTML(config.placeholder)}</span>` +
            `<span class="mpf-original">${originalHTML}</span>`;

        if (type === 'toxic') {
            el.addEventListener('click', toggleOriginal);
        }
    }

    State.count++;
    chrome.storage.local.set({ count: State.count });
}

function toggleOriginal(e) {
    // 링크 클릭은 토글에서 제외 (이동 우선)
    if (e.target.tagName === 'A') return;
    e.currentTarget.classList.toggle('show-original');
}

function removeAllTransforms() {
    document.querySelectorAll('[data-mpf-processed]').forEach(el => {
        const type = el.dataset.mpfProcessed;
        if ((type === 'rush' || type === 'toxic') && State.originals.has(el)) {
            el.innerHTML = State.originals.get(el);
        }
        if (type === 'toxic') {
            el.removeEventListener('click', toggleOriginal);
        }
        el.classList.remove('mpf-rush', 'mpf-toxic', 'mpf-noise', 'show-original');
        delete el.dataset.mpfProcessed;
    });
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ------------------------------------------------------------
// 스캔
// ------------------------------------------------------------
function scanAll(root) {
    if (!State.enabled) return;
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(TARGET_SELECTOR).forEach(processElement);
}

// ------------------------------------------------------------
// MutationObserver — SPA 전환 / 댓글 비동기 로드 대응
// ------------------------------------------------------------
const observer = new MutationObserver((mutations) => {
    if (!State.enabled) return;
    for (const m of mutations) {
        for (const node of m.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (typeof node.matches === 'function' && node.matches(TARGET_SELECTOR)) {
                processElement(node);
            }
            if (typeof node.querySelectorAll === 'function') {
                node.querySelectorAll(TARGET_SELECTOR).forEach(processElement);
            }
        }
    }
});

function startObserver() {
    observer.observe(document.body, { childList: true, subtree: true });
}

// ------------------------------------------------------------
// 팝업 ↔ 콘텐트 메시징
// ------------------------------------------------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !msg.type) return;
    if (msg.type === 'TOGGLE') {
        State.enabled = !!msg.enabled;
        if (State.enabled) scanAll();
        else removeAllTransforms();
        sendResponse({ ok: true, enabled: State.enabled });
    } else if (msg.type === 'RESET_COUNT') {
        State.count = 0;
        chrome.storage.local.set({ count: 0 });
        sendResponse({ ok: true });
    }
    return true;
});

// ------------------------------------------------------------
// 초기화
// ------------------------------------------------------------
chrome.storage.local.get(['enabled', 'count'], (data) => {
    State.enabled = data.enabled !== false; // 기본값 true
    State.count = typeof data.count === 'number' ? data.count : 0;
    if (State.enabled) scanAll();
    startObserver();
});
