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
            /언제\s*수정\s*[되됩]/,             // "언제 수정되나요/됩니까" (기존 /언제\s*수정/ 보다 좁힘 — "수정된 후" 같은 정보 질문 제외)
            /언제\s*되나요/,
            /언제\s*됩니까/,
            /언제까지\s*기다/,
            /도대체\s*언제/,
            /왜\s*안\s*고치/,
            /왜\s*이렇게\s*오래/,
            /아직\s*안\s*[됐돼됨]/,
            /업데이트\s*언제/,                  // 기존 /업데이트\s*[언제없]/ 에서 "없이/없는" 등 정상 표현 제외
            /확인\s*좀\s*해\s*주/,
            /답변\s*좀\s*주/,
            /급한데/,
            /급해요/,
            /언제\s*머지/,
            /언제\s*배포/,
            // 영어
            /\bfix\s+this\s+(asap|now)\b/i,     // "please" 제거 — "please fix this" 는 정중한 요청일 수 있음
            /\bany\s+updates?\??\s*$/im,        // 줄 끝 단독 형태로 좁힘 — "Any updates available for v2?" 같은 정상 질문 제외
            /\bwhy\s+is\s+this\s+taking\s+so\s+long\b/i,
            /\bwhen\s+will\s+this\s+be\s+(fixed|done|merged|released)\b/i,
            /\bwhen\s+can\s+we\s+expect\b/i,
            /\bis\s+anyone\s+(working|looking)\s+on\s+this\b/i,
            /\bany\s+progress\s*\??\s*$/im,     // 줄 끝 단독 형태로 좁힘 — "any progress bar" 같은 정상 표현 제외
            /\bstill\s+waiting\b/i,
            /\bhello\?+/i,
            /(^|\s)ping\??\s*$/im,
            /(^|\s)bump\s*$/im,
            /\bstill\s+no\s+fix\b/i,
            /\bany\s+eta\b/i
            // 제거: /빨리\s*고쳐/, /빨리\s*해\s*주/ — "빨리 고쳐주셔서 감사합니다" 같은 감사 표현 FP
            // 제거: /\bcome\s+on\b/i — "come on board/in" 등 정상 표현
            // 제거: /\bplease\s+(fix|merge|review|respond)\b/i — 정중한 PR 요청에 흔히 등장
            // 제거: /\bcan\s+you\s+(please\s+)?(fix|merge|look)\b/i — 동일
        ]
    },
    toxic: {
        placeholder: '⚠️ [메인테이너 보호를 위해 블라인드 처리된 문장입니다]',
        patterns: [
            // 한국어 — 부정 맥락이 명확한 형태만
            /쓰레기\s*(?:같|네요|이네|이다|이야|입니다|야|짓|취급|코드)/,
            /(?:이런|이딴|이거|이건|개)\s*쓰레기/,
            /망작/,
            /망쳤/,
            /이딴\s*거/,
            /병신/,
            /어이없(?:는|네|어|군)/,            // 평가형 어미만 매칭
            /한심(?:하|한|해|네)/,              // 평가형 어미만 매칭
            /최악(?:이|입니|이라)/,             // "최악의 경우" 같은 정상 표현 제외
            /개판/,
            /엉망(?:이|인|입니|진창)/,          // "엉망의" 같은 모호 표현 제외
            /빡친/,
            /빡쳐/,
            /기본도\s*안\s*되/,
            /왜\s*만들었/,
            /장난하/,
            /수준\s*보소/,
            /구려/,
            /짜증\s*나/,
            /실망\s*(?:했|스)/,
            // 영어 — 명확한 욕설 및 모욕
            /\buseless\b/i,
            /\bhorrible\b/i,
            /\bterrible\b/i,
            /\bstupid\b/i,
            /\bawful\b/i,
            /\b(?:complete|total|absolute|what\s+a)\s+disaster\b/i,  // "disaster recovery" 같은 기술 용어 제외
            /\bincompetent\b/i,
            /\bridiculous\b/i,
            /\bidiot/i,
            /\bwtf\b/i,
            /\bthis\s+is\s+a\s+joke\b/i,
            /\bjoke\s+of\s+an?\s+(library|project|maintainer|developer|tool|api|product)\b/i,
            /\bwhat\s+(the\s+)?hell\b/i,
            /\bare\s+you\s+(kidding|serious)\b/i,
            /\bnonsense\b/i,
            /\bpathetic\b/i,
            /\bdisgrace/i,
            /\bcrap(py)?\b/i,
            /\bsucks?\b/i,
            /\bshit(?:ty)?\b/i
            // 제거: /\bbroken\b/i — 버그 리포트에서 "broken link/build/English" 등 정상 표현이 너무 많음
            // 제거: /\bworst\b/i — "worst case" 등 기술 토론 빈출 표현
            // 제거: /\bgarbage\b/i — "garbage collection" 등 기술 용어
            // 제거: /\btrash\b/i — "TrashCan controller" 등 코드 식별자
            // 제거: /\bjunk\b/i — "junk dimension" 등 데이터 용어
            // 제거: /\bdamn\s+(thing|library|tool|repo)/i — "this damn library saved my life" 같은 긍정 강조
            // 제거: /후지/ — "후지산", "후지필름" 등
            // 제거: /토\s*나/ — 너무 짧고 무관한 단어 사이 매칭 위험
            // 제거: /실력이?\s*없/ — "실력이 없는 분도 쓸 수 있게 설계됨" 같은 긍정 묘사
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
    originals:       new WeakMap(),   // element → 원본 innerHTML (rush/toxic)
    originalTexts:   new WeakMap(),   // element → 원본 plain text (allowlist용)
    countedElements: new WeakSet(),   // 카운터 중복 방지 (토글로 재진입해도 1회만)
    categories: { rush: true, toxic: true, noise: true },
    allowlist: []                     // [{ text, type, createdAt }]
};

const TARGET_SELECTOR = '.comment-body, .js-issue-title';

// ------------------------------------------------------------
// 텍스트 정규화 & 허용목록(False-positive allowlist)
// ------------------------------------------------------------
function normalizeText(text) {
    return String(text || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function isAllowlisted(text) {
    const norm = normalizeText(text);
    if (!norm) return false;
    return State.allowlist.some(entry => entry.text === norm);
}

function addToAllowlist(text, type) {
    const norm = normalizeText(text);
    if (!norm) return;
    if (State.allowlist.some(e => e.text === norm)) return; // 중복 방지
    State.allowlist.push({ text: norm, type, createdAt: Date.now() });
    chrome.storage.local.set({ allowlist: State.allowlist });
}

// ------------------------------------------------------------
// 텍스트 치환 핵심 엔진
// ------------------------------------------------------------
function processElement(el) {
    if (!el || el.dataset.mpfProcessed) return;
    const text = el.textContent ? el.textContent.trim() : '';
    if (!text) return;
    if (isAllowlisted(text)) return;

    for (const [type, config] of Object.entries(DICTIONARY)) {
        if (State.categories[type] === false) continue;
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
    // 정규화 전 원본 텍스트 — innerHTML 교체 전에 캡처
    State.originalTexts.set(el, el.textContent || '');

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

    attachAllowButton(el);

    // 카운터는 동일 element에 대해 1회만 증가
    if (!State.countedElements.has(el)) {
        State.countedElements.add(el);
        State.count++;
        chrome.storage.local.set({ count: State.count });
    }
}

// ------------------------------------------------------------
// "Not harmful" 버튼 — 잘못 잡힌 댓글을 사용자 허용목록에 추가
// ------------------------------------------------------------
function attachAllowButton(el) {
    if (el.querySelector(':scope > .mpf-allow-button')) return; // 중복 방지
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mpf-allow-button';
    btn.textContent = 'Not harmful';
    btn.title = 'Stop filtering this comment text';
    btn.addEventListener('click', handleAllowClick);
    el.appendChild(btn);
}

function handleAllowClick(e) {
    e.stopPropagation();
    e.preventDefault();
    const el = e.currentTarget.closest('[data-mpf-processed]');
    if (!el) return;
    const type = el.dataset.mpfProcessed;
    const original = State.originalTexts.get(el) || el.textContent || '';
    addToAllowlist(original, type);
    restoreElement(el);
}

function toggleOriginal(e) {
    // 링크 클릭은 토글에서 제외 (이동 우선)
    if (e.target.tagName === 'A') return;
    // "Not harmful" 버튼 클릭은 별도 처리 (stopPropagation 외 이중 안전장치)
    if (e.target.closest && e.target.closest('.mpf-allow-button')) return;
    e.currentTarget.classList.toggle('show-original');
}

// ------------------------------------------------------------
// 복원
// ------------------------------------------------------------
function restoreElement(el) {
    if (!el || !el.dataset.mpfProcessed) return;
    const type = el.dataset.mpfProcessed;

    if ((type === 'rush' || type === 'toxic') && State.originals.has(el)) {
        el.innerHTML = State.originals.get(el);
    }
    if (type === 'toxic') {
        el.removeEventListener('click', toggleOriginal);
    }

    // 위에서 innerHTML 교체 시 버튼이 함께 사라졌을 수 있지만, noise나 fallback 처리
    const lingeringBtn = el.querySelector(':scope > .mpf-allow-button');
    if (lingeringBtn) {
        lingeringBtn.removeEventListener('click', handleAllowClick);
        lingeringBtn.remove();
    }

    el.classList.remove('mpf-rush', 'mpf-toxic', 'mpf-noise', 'show-original');
    delete el.dataset.mpfProcessed;
}

function removeAllTransforms(typeFilter) {
    document.querySelectorAll('[data-mpf-processed]').forEach(el => {
        if (typeFilter && el.dataset.mpfProcessed !== typeFilter) return;
        restoreElement(el);
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
    } else if (msg.type === 'UPDATE_CATEGORIES') {
        const incoming = msg.categories || {};
        for (const type of Object.keys(State.categories)) {
            if (!(type in incoming)) continue;
            const prev = State.categories[type] !== false;
            const next = incoming[type] !== false;
            State.categories[type] = next;
            if (prev && !next) removeAllTransforms(type); // OFF로 바뀐 유형만 복원
        }
        if (State.enabled) scanAll(); // ON된 유형은 재스캔으로 적용
        sendResponse({ ok: true });
    } else if (msg.type === 'RESET_COUNT') {
        State.count = 0;
        chrome.storage.local.set({ count: 0 });
        sendResponse({ ok: true });
    }
    return true;
});

// ------------------------------------------------------------
// 다른 탭/팝업에서 storage가 바뀌면 동기화 (allowlist 등)
// ------------------------------------------------------------
chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (!changes.allowlist) return;

    State.allowlist = Array.isArray(changes.allowlist.newValue)
        ? changes.allowlist.newValue : [];

    if (!State.enabled) return;

    // 1) 이미 변환된 element 중 새로 허용목록에 들어간 것은 즉시 복원
    //    (다른 탭에서 "Not harmful"을 눌렀거나, 동일 텍스트의 다른 댓글이 있을 때)
    document.querySelectorAll('[data-mpf-processed]').forEach(el => {
        const original = State.originalTexts.get(el) || el.textContent || '';
        if (isAllowlisted(original)) restoreElement(el);
    });

    // 2) 허용목록에서 삭제된 항목은 다시 매칭되어야 하므로 전체 재스캔
    scanAll();
});

// ------------------------------------------------------------
// 초기화
// ------------------------------------------------------------
chrome.storage.local.get(['enabled', 'count', 'categories', 'allowlist'], (data) => {
    State.enabled = data.enabled !== false; // 기본값 true
    State.count = typeof data.count === 'number' ? data.count : 0;
    State.categories = Object.assign(
        { rush: true, toxic: true, noise: true },
        data.categories || {}
    );
    State.allowlist = Array.isArray(data.allowlist) ? data.allowlist : [];
    if (State.enabled) scanAll();
    startObserver();
});
