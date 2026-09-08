/* ════════════════════════════════════════════
   Flashcard View — Open-mind
   SM-2 SRS · 3D Flip · Confetti · Session Summary
════════════════════════════════════════════ */

'use strict';

const FC = {
  deckId: null,
  cards: [],
  idx: 0,
  isFlipped: false,
  sessionStart: Date.now(),
  reviewed: 0,
  correct: 0,   // good + easy
  wrong: 0,     // again
  shuffleMode: false,
  allMode: false,
  timerInterval: null,
};

// ──────────────────────────────────────────
// Render view shell
// ──────────────────────────────────────────
function renderFlashcardView() {
  el('view-flashcard').innerHTML = `
<div class="flashcard-layout" style="height:100%;padding:0;">

  <!-- LEFT: Deck Panel -->
  <div class="deck-panel" style="height:100%;overflow:hidden;display:flex;flex-direction:column;gap:10px;">
    <div class="deck-panel-header" style="flex-shrink:0;">
      <span class="deck-panel-title">Chủ đề ôn tập</span>
      <button class="btn btn-secondary btn-sm" id="fcNewDeck"
        style="display:inline-flex;align-items:center;gap:5px;">
        <i data-lucide="plus" style="width:13px;height:13px;"></i> Thêm
      </button>
    </div>

    <div class="deck-list" id="deckList" style="flex:1;overflow-y:auto;"></div>

    <div style="flex-shrink:0;display:flex;flex-direction:column;gap:8px;">
      <div class="mode-toggles" style="padding:2px 0;">
        <label class="toggle-label">
          <input type="checkbox" id="fcShuffle">
          <i data-lucide="shuffle" style="width:13px;height:13px;"></i> Ngẫu nhiên
        </label>
        <label class="toggle-label">
          <input type="checkbox" id="fcAll">
          <i data-lucide="book-open" style="width:13px;height:13px;"></i> Ôn tất cả
        </label>
      </div>

      <button class="btn btn-ghost btn-full btn-sm" id="fcAddCard"
        style="display:inline-flex;align-items:center;justify-content:center;gap:6px;">
        <i data-lucide="plus-circle" style="width:14px;height:14px;"></i> Thêm thẻ thủ công
      </button>
    </div>
  </div>

  <!-- RIGHT: Study Panel -->
  <div class="study-panel" style="height:100%;overflow:hidden;">
    <!-- Top bar -->
    <div class="study-topbar" style="flex-shrink:0;">
      <div class="study-title" id="fcDeckTitle">
        <i data-lucide="layers" style="width:18px;height:18px;color:var(--accent);"></i>
        <span>Chọn một chủ đề để bắt đầu</span>
      </div>
      <div class="study-meta">
        <span class="timer" id="fcTimer"></span>
        <span class="badge badge-muted" id="fcProgress">0 / 0</span>
      </div>
    </div>

    <!-- Keyboard hint bar -->
    <div id="fcKeyHints" style="flex-shrink:0;display:flex;gap:12px;font-size:11px;color:var(--text-subtle);padding:2px 0;">
      <span><kbd style="background:var(--glass-medium);border:1px solid var(--glass-border);padding:1px 6px;border-radius:4px;">Space</kbd> Lật thẻ</span>
      <span><kbd style="background:var(--glass-medium);border:1px solid var(--glass-border);padding:1px 6px;border-radius:4px;">1</kbd><kbd style="background:var(--glass-medium);border:1px solid var(--glass-border);padding:1px 6px;border-radius:4px;">2</kbd><kbd style="background:var(--glass-medium);border:1px solid var(--glass-border);padding:1px 6px;border-radius:4px;">3</kbd><kbd style="background:var(--glass-medium);border:1px solid var(--glass-border);padding:1px 6px;border-radius:4px;">4</kbd> Đánh giá</span>
    </div>

    <!-- 3D Flip Card -->
    <div class="card-scene" id="fcScene" style="flex:1;min-height:0;">
      <div class="card-inner" id="fcInner">
        <div class="card-face card-front" id="fcFront">
          <div class="card-empty">
            <i data-lucide="layers" style="width:52px;height:52px;color:var(--text-subtle);margin-bottom:8px;"></i>
            <div class="card-empty-title">Chọn chủ đề bên trái</div>
            <div class="card-empty-sub">để bắt đầu phiên ôn tập</div>
          </div>
        </div>
        <div class="card-face card-back" id="fcBack">
          <!-- populated dynamically -->
        </div>
      </div>
    </div>

    <!-- SRS Rating Bar -->
    <div class="srs-bar" id="fcSrsBar" style="flex-shrink:0;">
      <button class="srs-btn srs-again" id="srsAgain" disabled>
        <span>😰 QUÊN</span>
        <span class="srs-interval" id="ivAgain">1 ngày</span>
      </button>
      <button class="srs-btn srs-hard" id="srsHard" disabled>
        <span>😅 KHÓ</span>
        <span class="srs-interval" id="ivHard">—</span>
      </button>
      <button class="srs-btn srs-good" id="srsGood" disabled>
        <span>😊 TỐT</span>
        <span class="srs-interval" id="ivGood">—</span>
      </button>
      <button class="srs-btn srs-easy" id="srsEasy" disabled>
        <span>🚀 DỄ</span>
        <span class="srs-interval" id="ivEasy">—</span>
      </button>
    </div>
  </div>
</div>`;

  el('fcNewDeck').addEventListener('click', createDeckDialog);
  el('fcAddCard').addEventListener('click', addCardDialog);
  el('fcInner').addEventListener('click', flipCard);
  el('fcShuffle').addEventListener('change', e => { FC.shuffleMode = e.target.checked; reloadCards(); });
  el('fcAll').addEventListener('change',    e => { FC.allMode = e.target.checked; reloadCards(); });
  el('srsAgain').addEventListener('click', () => rateCard(0));
  el('srsHard').addEventListener('click',  () => rateCard(1));
  el('srsGood').addEventListener('click',  () => rateCard(2));
  el('srsEasy').addEventListener('click',  () => rateCard(3));

  loadDecks();
}

// ──────────────────────────────────────────
// Deck list
// ──────────────────────────────────────────
async function loadDecks() {
  try {
    const decks = await API.get_decks();
    renderDeckList(decks);
    if (!FC.deckId && decks.length > 0) {
      selectDeck(decks[0].id, decks[0].name);
    }
  } catch (e) {
    if (el('deckList')) el('deckList').innerHTML = `<p class="text-muted text-sm" style="padding:12px;">Lỗi tải danh sách</p>`;
  }
}

function renderDeckList(decks) {
  if (!el('deckList')) return;
  if (!decks.length) {
    el('deckList').innerHTML = `
      <div class="empty-state" style="padding:32px 12px;gap:8px;">
        <div style="font-size:32px;opacity:0.35;">📚</div>
        <div style="font-size:13px;font-weight:700;color:var(--text);">Chưa có bộ thẻ nào</div>
        <div class="text-xs text-muted">Trích xuất từ bài giảng hoặc tạo mới!</div>
      </div>`;
    return;
  }

  el('deckList').innerHTML = decks.map(d => {
    const total    = d.total_cards    || 0;
    const due      = d.due_cards      || 0;
    const mastered = d.mastered_cards || 0;
    const pct      = total > 0 ? Math.round(mastered / total * 100) : 0;
    const isActive = d.id === FC.deckId;

    return `
<div class="deck-item ${isActive ? 'active' : ''}" data-did="${escHtml(d.id)}" data-name="${escHtml(d.name)}">
  <div class="deck-item-top">
    <div style="flex:1;min-width:0;">
      <div class="deck-name">${escHtml(d.name)}</div>
      <div class="deck-meta">${due > 0 ? `<span style="color:#d97706;font-weight:700;">${due} cần ôn</span> · ` : ''}${total} thẻ</div>
    </div>
    <div class="flex items-center gap-2">
      <span class="deck-pct ${isActive ? 'text-accent' : 'text-muted'}" style="font-size:12px;font-weight:800;">${pct}%</span>
      <button class="btn btn-ghost btn-sm btn-del-deck" data-did="${escHtml(d.id)}"
        style="padding:4px 6px;display:inline-flex;align-items:center;" title="Xoá chủ đề">
        <i data-lucide="trash-2" style="width:12px;height:12px;color:var(--danger);"></i>
      </button>
    </div>
  </div>
  <div class="deck-bar mt-2">
    <div class="progress-wrap">
      <div class="progress-bar ${isActive ? 'progress-accent' : 'progress-success'}" style="width:${pct}%"></div>
    </div>
  </div>
</div>`;
  }).join('');

  el('deckList').querySelectorAll('.deck-item').forEach(item => {
    item.addEventListener('click', e => {
      if (e.target.closest('.btn-del-deck')) return;
      selectDeck(item.dataset.did, item.dataset.name);
    });
  });

  el('deckList').querySelectorAll('.btn-del-deck').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const did = btn.dataset.did;
      const idx = await showModal(
        'Xoá chủ đề',
        `<p style="color:var(--text-muted);">Bạn chắc muốn xoá chủ đề này và <strong style="color:var(--danger);">toàn bộ thẻ bên trong</strong>?</p>`,
        [{ label: 'Huỷ', class: 'btn-ghost' }, { label: '🗑️ Xoá', class: 'btn-danger' }]
      );
      if (idx !== 1) return;
      try {
        await API.delete_deck(did);
        showToast('Đã xoá chủ đề', 'success');
        if (FC.deckId === did) {
          FC.deckId = null;
          if (el('fcDeckTitle')) el('fcDeckTitle').innerHTML = `<i data-lucide="layers" style="width:18px;height:18px;color:var(--accent);"></i><span>Chọn chủ đề để bắt đầu</span>`;
          if (el('fcFront')) el('fcFront').innerHTML = '<div class="card-empty"><div class="card-empty-title">Chọn chủ đề</div></div>';
          if (el('fcBack')) el('fcBack').innerHTML = '';
        }
        loadDecks();
      } catch (err) {
        showToast('Lỗi khi xóa chủ đề', 'error');
      }
    });
  });
  refreshIcons();
}

async function selectDeck(deckId, deckName) {
  FC.deckId = deckId;
  FC.reviewed = 0;
  FC.correct = 0;
  FC.wrong = 0;
  FC.sessionStart = Date.now();
  if (el('fcDeckTitle')) {
    el('fcDeckTitle').innerHTML = `<i data-lucide="layers" style="width:18px;height:18px;color:var(--accent);"></i> <span>${escHtml(deckName)}</span>`;
  }
  const decks = await API.get_decks();
  renderDeckList(decks);
  reloadCards();
}

async function reloadCards() {
  if (!FC.deckId) return;
  try {
    let cards = FC.allMode
      ? await API.get_all_cards(FC.deckId)
      : await API.get_due_cards(FC.deckId);

    if (FC.shuffleMode) cards = cards.sort(() => Math.random() - .5);

    FC.cards = cards;
    FC.idx = 0;
    clearInterval(FC.timerInterval);
    startTimer();
    showCurrentCard();
  } catch (e) {
    showToast('Lỗi tải thẻ: ' + e.message, 'error');
  }
}

// ──────────────────────────────────────────
// Card display
// ──────────────────────────────────────────
function showCurrentCard() {
  if (!el('fcInner')) return;

  disableSRS();

  const total = FC.cards.length;
  const idx   = FC.idx;

  if (!total || idx >= total) {
    showCompletionState();
    return;
  }

  const card = FC.cards[idx];
  FC.isFlipped = false;
  el('fcInner').classList.remove('flipped');

  const progress  = total > 0 ? idx / total : 0;
  const progLabel = `${idx + 1} / ${total}`;

  if (el('fcProgress')) {
    el('fcProgress').textContent = progLabel;
    const remaining = total - idx;
    el('fcProgress').className = `badge ${remaining <= 3 ? 'badge-warning' : 'badge-muted'}`;
  }

  const hasHint = card.hint && card.hint.trim();

  // ── Front face ──
  el('fcFront').innerHTML = `
    <div class="card-badge card-badge-front">CÂUHỎI</div>
    <div class="card-prog-bar">
      <div class="card-prog-track"><div class="card-prog-fill" style="width:${Math.round(progress*100)}%"></div></div>
      <span class="card-prog-label">${progLabel}</span>
    </div>
    <div style="margin-bottom:14px;display:flex;align-items:center;justify-content:center;">
      <i data-lucide="help-circle" style="width:44px;height:44px;color:var(--accent);opacity:0.7;"></i>
    </div>
    <div class="card-question">${escHtml(card.front)}</div>
    ${hasHint ? `<button class="card-hint-btn" id="fcHintBtn">💡 Hiện gợi ý</button>` : ''}
    <div class="card-flip-cta">Nhấp hoặc [Space] để lật →</div>
  `;

  // ── Back face ──
  el('fcBack').innerHTML = `
    <div class="card-badge card-badge-back">ĐÁP ÁN</div>
    <div style="margin-bottom:14px;display:flex;align-items:center;justify-content:center;">
      <i data-lucide="check-circle-2" style="width:44px;height:44px;color:var(--success);opacity:0.8;"></i>
    </div>
    <div class="card-answer">${escHtml(card.back)}</div>
    <div class="card-flip-cta" style="color:var(--text-muted);">Đánh giá mức độ nhớ bên dưới ↓</div>
  `;

  if (hasHint) {
    el('fcHintBtn')?.addEventListener('click', e => {
      e.stopPropagation();
      el('fcHintBtn').replaceWith((() => {
        const d = document.createElement('div');
        d.className = 'card-hint-text';
        d.textContent = `💡 ${card.hint}`;
        return d;
      })());
    });
  }

  updateIntervalPreviews(card);
  refreshIcons();
}

function showCompletionState() {
  clearInterval(FC.timerInterval);
  const elapsed = Math.round((Date.now() - FC.sessionStart) / 1000);
  const acc = FC.reviewed > 0 ? Math.round((FC.correct / FC.reviewed) * 100) : 0;

  if (el('fcProgress')) { el('fcProgress').textContent = 'Xong! 🎉'; el('fcProgress').className = 'badge badge-success'; }

  el('fcFront').innerHTML = `
    <div class="card-empty" style="gap:0;">
      <div style="font-size:54px;margin-bottom:12px;animation:float 3s ease-in-out infinite;">🏆</div>
      <div class="card-empty-title" style="font-size:22px;">Hoàn tất phiên ôn tập!</div>
      <div class="card-empty-sub" style="margin:8px 0 20px;">Đã ôn <strong style="color:var(--text);">${FC.reviewed}</strong> thẻ · Độ chính xác <strong style="color:${acc >= 80 ? '#059669' : '#d97706'};">${acc}%</strong></div>

      <div style="display:flex;gap:20px;margin-bottom:20px;">
        <div style="text-align:center;">
          <div style="font-size:22px;font-weight:800;color:#059669;">${FC.correct}</div>
          <div class="text-xs text-muted">Nhớ tốt</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:22px;font-weight:800;color:#dc2626;">${FC.wrong}</div>
          <div class="text-xs text-muted">Cần ôn lại</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:22px;font-weight:800;color:#4f46e5;">${elapsed < 60 ? elapsed+'s' : Math.floor(elapsed/60)+'p'}</div>
          <div class="text-xs text-muted">Thời gian</div>
        </div>
      </div>

      <button class="btn btn-primary" id="btnRestartReview"
        style="display:inline-flex;align-items:center;gap:7px;">
        <i data-lucide="rotate-ccw" style="width:15px;height:15px;"></i> Ôn lại từ đầu
      </button>
    </div>`;

  el('fcInner').classList.remove('flipped');
  el('fcBack').innerHTML = '';

  el('btnRestartReview')?.addEventListener('click', e => {
    e.stopPropagation();
    restartAllCards();
  });

  // Trigger confetti if good session
  if (FC.reviewed > 0 && acc >= 70) launchConfetti();

  refreshIcons();
}

async function restartAllCards() {
  if (!FC.deckId) return;
  FC.allMode = true;
  if (el('fcAll')) el('fcAll').checked = true;
  try {
    let cards = await API.get_all_cards(FC.deckId);
    if (FC.shuffleMode) cards = cards.sort(() => Math.random() - 0.5);
    FC.cards = cards;
    FC.idx = 0;
    FC.reviewed = 0;
    FC.correct = 0;
    FC.wrong = 0;
    clearInterval(FC.timerInterval);
    startTimer();
    showCurrentCard();
    showToast(`Đang ôn lại ${cards.length} thẻ`, 'info');
  } catch (e) {
    showToast('Lỗi tải lại thẻ: ' + e.message, 'error');
  }
}

// ──────────────────────────────────────────
// Flip animation
// ──────────────────────────────────────────
function flipCard(e) {
  if (e && e.target && e.target.closest('button')) return;
  const inner = el('fcInner');
  if (!inner) return;
  if (!FC.cards.length || FC.idx >= FC.cards.length) return;

  FC.isFlipped = !FC.isFlipped;
  inner.classList.toggle('flipped', FC.isFlipped);

  if (FC.isFlipped) enableSRS();
  else disableSRS();
}

// ──────────────────────────────────────────
// SRS rating
// ──────────────────────────────────────────
async function updateIntervalPreviews(card) {
  const ef = card.ease_factor   ?? 2.5;
  const iv = card.interval_days ?? 0;
  const rp = card.repetitions   ?? 0;

  const ids = ['ivAgain', 'ivHard', 'ivGood', 'ivEasy'];
  await Promise.all(ids.map(async (id, rating) => {
    try {
      const r = await API.preview_srs(rating, ef, iv, rp);
      if (el(id)) el(id).textContent = fmtInterval(r.interval_days);
    } catch (_) {}
  }));
}

function enableSRS()  { ['srsAgain','srsHard','srsGood','srsEasy'].forEach(id => { if (el(id)) el(id).disabled = false; }); }
function disableSRS() { ['srsAgain','srsHard','srsGood','srsEasy'].forEach(id => { if (el(id)) el(id).disabled = true; }); }

async function rateCard(rating) {
  if (!FC.cards.length || FC.idx >= FC.cards.length) return;
  const card = FC.cards[FC.idx];

  disableSRS();

  // Micro-feedback
  if (rating === 0) {
    // Again — shake
    el('fcInner')?.classList.add('shake');
    setTimeout(() => el('fcInner')?.classList.remove('shake'), 500);
    showMicroFeedback('😰 Cố lên lần sau!', 'warning');
    FC.wrong++;
  } else if (rating >= 2) {
    // Good/Easy — positive
    showMicroFeedback(rating === 3 ? '🚀 Xuất sắc!' : '😊 Rất tốt!', 'success');
    FC.correct++;
  } else {
    showMicroFeedback('😅 Khá tốt!', 'info');
    FC.correct++;
  }

  try {
    await API.rate_card(
      card.id, rating,
      card.ease_factor   ?? 2.5,
      card.interval_days ?? 0,
      card.repetitions   ?? 0
    );
    FC.reviewed++;
    FC.idx++;
    FC.isFlipped = false;

    setTimeout(() => {
      showCurrentCard();
    }, 200);

    const decks = await API.get_decks();
    renderDeckList(decks);
    refreshTopBar();
  } catch (e) {
    showToast('Lỗi lưu đánh giá: ' + e.message, 'error');
    enableSRS();
  }
}

// ──────────────────────────────────────────
// Micro feedback toast (positioned near card)
// ──────────────────────────────────────────
let microTimer = null;
function showMicroFeedback(text, type) {
  // Use the main toast for simplicity but with brief duration
  showToast(text, type, 1200);
}

// ──────────────────────────────────────────
// Confetti burst
// ──────────────────────────────────────────
function launchConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  const colors = ['#4f46e5','#7c3aed','#059669','#d97706','#dc2626','#0891b2'];
  for (let i = 0; i < 36; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.top  = (Math.random() * 40) + 'vh';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.transform = `rotate(${Math.random()*360}deg)`;
    piece.style.animationDuration = (0.6 + Math.random() * 0.6) + 's';
    piece.style.animationDelay = (Math.random() * 0.3) + 's';
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), 1200);
}

// ──────────────────────────────────────────
// Timer
// ──────────────────────────────────────────
function startTimer() {
  FC.sessionStart = Date.now();
  clearInterval(FC.timerInterval);
  FC.timerInterval = setInterval(() => {
    if (!el('fcTimer')) { clearInterval(FC.timerInterval); return; }
    const sec = Math.floor((Date.now() - FC.sessionStart) / 1000);
    if (sec < 60) el('fcTimer').textContent = `⏱ ${sec}s`;
    else el('fcTimer').textContent = `⏱ ${Math.floor(sec/60)}p${(sec%60).toString().padStart(2,'0')}s`;
  }, 1000);
}

// ──────────────────────────────────────────
// Dialogs
// ──────────────────────────────────────────
async function createDeckDialog() {
  const idx = await showModal(
    '📑 Tạo chủ đề mới',
    `<label class="label">Tên chủ đề</label>
     <input class="input" id="newDeckName" placeholder="VD: Lập trình Python, Giải tích…" autofocus>`,
    [{ label: 'Huỷ', class: 'btn-ghost' }, { label: '✅ Tạo mới', class: 'btn-primary' }]
  );
  if (idx !== 1) return;
  const name = el('newDeckName')?.value.trim();
  if (!name) return showToast('Vui lòng nhập tên chủ đề', 'warning');

  try {
    const d = await API.create_deck(name);
    showToast(`Đã tạo chủ đề "${name}"`, 'success');
    await loadDecks();
    selectDeck(d.id, name);
  } catch (e) {
    showToast('Lỗi tạo chủ đề: ' + e.message, 'error');
  }
}

async function addCardDialog() {
  if (!FC.deckId) return showToast('Hãy chọn một chủ đề trước', 'warning');

  const idx = await showModal(
    '✍️ Thêm thẻ mới',
    `<div class="flex-col gap-3">
      <div>
        <label class="label">Mặt trước — Câu hỏi</label>
        <input class="input" id="cardFront" placeholder="Khái niệm hoặc câu hỏi…">
      </div>
      <div>
        <label class="label">Mặt sau — Đáp án</label>
        <input class="input" id="cardBack" placeholder="Định nghĩa hoặc giải thích…">
      </div>
      <div>
        <label class="label">Gợi ý (tùy chọn)</label>
        <input class="input" id="cardHint" placeholder="Gợi ý liên tưởng khi cần…">
      </div>
    </div>`,
    [{ label: 'Huỷ', class: 'btn-ghost' }, { label: '💾 Lưu thẻ', class: 'btn-primary' }]
  );
  if (idx !== 1) return;

  const front = el('cardFront')?.value.trim();
  const back  = el('cardBack')?.value.trim();
  const hint  = el('cardHint')?.value.trim() || '';

  if (!front || !back) return showToast('Vui lòng nhập đủ mặt trước và mặt sau', 'warning');

  try {
    await API.add_card(FC.deckId, front, back, hint);
    showToast('Đã thêm thẻ mới', 'success');
    reloadCards();
  } catch (e) {
    showToast('Lỗi thêm thẻ: ' + e.message, 'error');
  }
}

// ──────────────────────────────────────────
// Keyboard shortcuts
// ──────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (State.currentView !== 'flashcard') return;
  if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;

  switch (e.key) {
    case ' ':
    case 'ArrowRight': e.preventDefault(); flipCard(); break;
    case '1': if (!el('srsAgain')?.disabled) rateCard(0); break;
    case '2': if (!el('srsHard')?.disabled)  rateCard(1); break;
    case '3': if (!el('srsGood')?.disabled)  rateCard(2); break;
    case '4': if (!el('srsEasy')?.disabled)  rateCard(3); break;
  }
});

// ──────────────────────────────────────────
// Register view
// ──────────────────────────────────────────
registerView('flashcard', {
  render: renderFlashcardView,
  onShow: () => {
    if (!el('deckList')) renderFlashcardView();
    else loadDecks();
  }
});
