/* ════════════════════════════════════════════
   Open-mind — Core App JS
   Router · State · API wrapper · Toast/Modal · Dashboard
════════════════════════════════════════════ */

'use strict';

// ──────────────────────────────────────────
// State
// ──────────────────────────────────────────
const State = {
  currentView: 'dashboard',
  lectureId: null,
  deckId: null,
  appInfo: null,
};

// ──────────────────────────────────────────
// API wrapper — wraps window.pywebview.api
// ──────────────────────────────────────────
const API = {
  async call(method, ...args) {
    try {
      const fn = window.pywebview?.api?.[method];
      if (!fn) throw new Error(`API method '${method}' not found`);
      return await fn(...args);
    } catch (err) {
      console.error(`[API] ${method}:`, err);
      throw err;
    }
  },
  get_app_info: () => API.call('get_app_info'),
  load_models: () => API.call('load_models'),
  get_model_info: () => API.call('get_model_info'),

  get_decks: () => API.call('get_decks'),
  create_deck: (n, d) => API.call('create_deck', n, d || ''),
  update_deck: (id, n, d) => API.call('update_deck', id, n, d || ''),
  delete_deck: (id) => API.call('delete_deck', id),
  get_lecture_flashcards: (id) => API.call('get_lecture_flashcards', id),
  get_lecture_decks: (id) => API.call('get_lecture_decks', id),
  get_due_cards: (id) => API.call('get_due_cards', id),
  get_all_cards: (id) => API.call('get_all_cards', id),
  add_card: (did, f, b, h) => API.call('add_card', did, f, b, h || ''),
  delete_card: (id) => API.call('delete_card', id),
  rate_card: (id, r, ef, iv, rp) => API.call('rate_card', id, r, ef, iv, rp),
  preview_srs: (r, ef, iv, rp) => API.call('preview_srs', r, ef, iv, rp),
  get_deck_progress: (id) => API.call('get_deck_progress', id),

  list_lectures: (tag, q) => API.call('list_lectures', tag || '', q || ''),
  get_lecture: (id) => API.call('get_lecture', id),
  delete_lecture: (id) => API.call('delete_lecture', id),
  pick_audio_file: () => API.call('pick_audio_file'),
  get_audio_url: (p) => API.call('get_audio_url', p),

  start_transcribe: (p, pr, lid, t, ft) => API.call('start_transcribe', p, pr || '', lid || '', t || '', ft || 'General'),
  generate_summary: (id) => API.call('generate_summary', id),
  generate_quiz: (id, n, d) => API.call('generate_quiz', id, n || 5, d || 'trung bình'),
  generate_flashcards: (id, n) => API.call('generate_flashcards', id, n || 8),
  ask_rag: (q, id) => API.call('ask_rag', q, id),
  save_quiz: (id, q) => API.call('save_quiz', id, q),
  save_quiz_result: (id, s, t, d, r) => API.call('save_quiz_result', id, s, t, d, r),

  get_stats: () => API.call('get_stats'),
  get_settings: () => API.call('get_settings'),
  seed_demo_data: (f) => API.call('seed_demo_data', f || false),

  export_txt: (id) => API.call('export_txt', id),
  export_html: (id) => API.call('export_html', id),
  export_json: (id) => API.call('export_json', id),
};

// ──────────────────────────────────────────
// Global event bus (from Python push events)
// ──────────────────────────────────────────
const EventBus = {
  _handlers: {},
  on(type, handler) { (this._handlers[type] ??= []).push(handler); },
  off(type, handler) {
    if (this._handlers[type])
      this._handlers[type] = this._handlers[type].filter(h => h !== handler);
  },
  emit(type, data) { (this._handlers[type] ?? []).forEach(h => h(data)); },
};

window.addEventListener('omEvent', e => {
  const { type, data } = e.detail;
  EventBus.emit(type, data);
});

// ──────────────────────────────────────────
// Toast
// ──────────────────────────────────────────
let toastTimer = null;
function showToast(msg, type = 'info', duration = 3200) {
  const el_ = document.getElementById('toast');
  if (!el_) return;
  const iconMap = {
    success: 'check-circle',
    error: 'alert-circle',
    warning: 'alert-triangle',
    info: 'info',
  };
  const iconName = iconMap[type] || 'info';
  el_.innerHTML = `<i data-lucide="${iconName}" style="width:16px;height:16px;flex-shrink:0;"></i><span>${escHtml(msg)}</span>`;
  el_.className = `toast ${type}`;
  refreshIcons();
  clearTimeout(toastTimer);
  el_.classList.remove('hidden');
  toastTimer = setTimeout(() => el_.classList.add('hidden'), duration);
}

// ──────────────────────────────────────────
// Modal
// ──────────────────────────────────────────
function showModal(title, bodyHtml, actions = []) {
  return new Promise(resolve => {
    const overlay = document.getElementById('modalOverlay');
    const box = document.getElementById('modalBox');

    const actionsHtml = actions.map((a, i) =>
      `<button class="btn ${a.class || 'btn-ghost'}" data-idx="${i}">${a.label}</button>`
    ).join('');

    box.innerHTML = `
      <div class="modal-title">${title}</div>
      <div class="modal-body">${bodyHtml}</div>
      <div class="modal-actions">${actionsHtml}</div>
    `;

    box.querySelectorAll('[data-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.classList.add('hidden');
        resolve(parseInt(btn.dataset.idx));
      });
    });

    overlay.classList.remove('hidden');
    overlay.addEventListener('click', e => {
      if (e.target === overlay) { overlay.classList.add('hidden'); resolve(-1); }
    }, { once: true });

    refreshIcons();
  });
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

// ──────────────────────────────────────────
// Helpers & Lucide Icons
// ──────────────────────────────────────────
function el(id) { return document.getElementById(id); }
function html(id, c) { const e = el(id); if (e) e.innerHTML = c; }
function qs(sel, parent = document) { return parent.querySelector(sel); }
function qsa(sel, parent = document) { return [...parent.querySelectorAll(sel)]; }

function refreshIcons() {
  try {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  } catch (err) {
    console.warn('[Lucide] Error creating icons:', err);
  }
}

function fmtDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function fmtInterval(days) {
  if (days <= 0) return 'hôm nay';
  if (days === 1) return '1 ngày';
  if (days < 7) return `${days} ngày`;
  if (days < 30) return `${Math.round(days / 7)} tuần`;
  if (days < 365) return `${(days / 30).toFixed(1)} tháng`;
  return `${(days / 365).toFixed(1)} năm`;
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function fmtDateShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'Hôm nay';
  if (diff === 1) return 'Hôm qua';
  return `${diff} ngày trước`;
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function greetingText() {
  const h = new Date().getHours();
  if (h < 6) return 'Chào buổi khuya';
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

// Compute XP/level from total cards reviewed
function computeLevel(totalCards) {
  const lvl = Math.floor(totalCards / 50) + 1;
  const curr = totalCards % 50;
  const next = 50;
  return { level: lvl, current: curr, max: next, pct: Math.round(curr / next * 100) };
}

// ──────────────────────────────────────────
// View registry
// ──────────────────────────────────────────
const Views = {};

function registerView(name, { render, onShow }) {
  Views[name] = { render, onShow };
}

function switchView(name) {
  if (!Views[name]) return;
  State.currentView = name;

  qsa('.view').forEach(v => v.classList.add('hidden'));
  const target = el(`view-${name}`);
  if (target) {
    target.classList.remove('hidden');
    target.style.animation = 'none';
    requestAnimationFrame(() => { target.style.animation = 'fadeIn 0.25s ease'; });
  }

  qsa('.nav-item').forEach(b => b.classList.remove('active'));
  qs(`.nav-item[data-view="${name}"]`)?.classList.add('active');

  Views[name].onShow?.();
  setTimeout(refreshIcons, 20);
}

// ──────────────────────────────────────────
// Sidebar nav
// ──────────────────────────────────────────
qsa('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

// ──────────────────────────────────────────
// Top bar stats
// ──────────────────────────────────────────
async function refreshTopBar() {
  try {
    const info = await API.get_app_info();
    State.appInfo = info;

    if (el('topDue')) {
      el('topDue').innerHTML = `<i data-lucide="layers" style="width:13px;height:13px;"></i> <span>${info.due_today} thẻ cần ôn</span>`;
    }
    if (el('topStreak')) {
      const s = info.streak || 0;
      el('topStreak').innerHTML = `<i data-lucide="flame" class="flame-icon" style="width:13px;height:13px;"></i> <span>${s} ngày streak</span>`;
    }

    // Sidebar due badge
    const due = info.due_today || 0;
    const badge = el('sidebarDueBadge');
    if (badge) {
      if (due > 0) {
        badge.textContent = due;
        badge.style.display = '';
      } else {
        badge.style.display = 'none';
      }
    }

    // XP / level sidebar
    const totalCards = (info.total_cards || 0);
    const xp = computeLevel(totalCards);
    if (el('sidebarXpLabel')) el('sidebarXpLabel').textContent = `Cấp độ ${xp.level} · ${totalCards} thẻ`;
    if (el('sidebarXpBar')) el('sidebarXpBar').style.width = `${xp.pct}%`;
    if (el('sidebarXpText')) el('sidebarXpText').textContent = `${xp.current} / ${xp.max} XP`;

    refreshIcons();
  } catch (_) { }
}

// ──────────────────────────────────────────
// DASHBOARD VIEW
// ──────────────────────────────────────────
async function renderDashboardView() {
  el('view-dashboard').innerHTML = `
<div class="dashboard-layout" style="padding-bottom:24px;">

  <!-- Hero card -->
  <div class="hero-card" style="position:relative;">
    <div style="max-width:calc(100% - 140px);">
      <div class="hero-greeting" id="dashGreeting">${greetingText()}, Học viên!</div>
      <div class="hero-title" id="dashHeroTitle">Sẵn sàng học hôm nay chưa?</div>
      <div class="hero-subtitle" id="dashHeroSub">Đang tải thông tin học tập…</div>
      <div class="hero-actions">
        <button class="btn btn-primary" id="dashStudyBtn" style="display:inline-flex;align-items:center;gap:7px;">
          <i data-lucide="play-circle" style="width:17px;height:17px;"></i> Ôn thẻ ngay
        </button>
        <button class="btn btn-secondary" id="dashNewLecBtn" style="display:inline-flex;align-items:center;gap:7px;">
          <i data-lucide="mic" style="width:16px;height:16px;"></i> Mở bài giảng
        </button>
      </div>
    </div>

    <!-- Goal ring -->
    <div class="goal-ring-wrap" id="dashRingWrap">
      <svg class="ring-svg" viewBox="0 0 90 90">
        <circle class="ring-track" cx="45" cy="45" r="37"/>
        <circle class="ring-fill" id="dashRingFill" cx="45" cy="45" r="37"
          stroke-dasharray="232" stroke-dashoffset="232"/>
        <text class="ring-label" x="45" y="48" text-anchor="middle" id="dashRingLabel">0</text>
        <text class="ring-sublabel" x="45" y="60" text-anchor="middle">Hôm nay</text>
      </svg>
    </div>
  </div>

  <!-- Stats row -->
  <div class="dash-stats" id="dashStats">
    ${['', '', '', ''].map(() => `
      <div class="dash-stat-card">
        <div class="dash-stat-icon shimmer" style="width:36px;height:36px;border-radius:10px;"></div>
        <div class="shimmer" style="height:28px;width:60%;margin:12px 0 4px;border-radius:6px;"></div>
        <div class="shimmer" style="height:14px;width:80%;border-radius:6px;"></div>
      </div>
    `).join('')}
  </div>

  <!-- Quick actions -->
  <div>
    <div class="section-header" style="margin-bottom:14px;">
      <h2 class="section-title" style="font-size:16px;">
        <i data-lucide="zap" style="width:18px;height:18px;color:#4f46e5;"></i>
        Truy cập nhanh
      </h2>
    </div>
    <div class="quick-actions">
      <div class="qa-card qa-primary" id="qaFlashcard">
        <div class="qa-icon" style="background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);">
          <i data-lucide="layers" style="width:22px;height:22px;color:#4f46e5;"></i>
        </div>
        <div>
          <div class="qa-title">Ôn Flashcard</div>
          <div class="qa-sub" id="qaFcSub">Tải thông tin…</div>
        </div>
      </div>

      <div class="qa-card" id="qaLecture">
        <div class="qa-icon" style="background:rgba(6,182,212,0.12);border:1px solid rgba(6,182,212,0.25);">
          <i data-lucide="mic" style="width:22px;height:22px;color:#0891b2;"></i>
        </div>
        <div>
          <div class="qa-title">Studio Bài giảng</div>
          <div class="qa-sub">Xử lý & phân tích âm thanh</div>
        </div>
      </div>

      <div class="qa-card" id="qaLibrary">
        <div class="qa-icon" style="background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.25);">
          <i data-lucide="book-open" style="width:22px;height:22px;color:#059669;"></i>
        </div>
        <div>
          <div class="qa-title">Thư viện</div>
          <div class="qa-sub" id="qaLibSub">Tải thông tin…</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom row: recent lectures + streak heatmap -->
  <div class="grid-2">

    <!-- Recent lectures -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">
          <i data-lucide="clock" style="width:16px;height:16px;color:#4f46e5;"></i>
          Bài giảng gần đây
        </span>
        <button class="btn btn-ghost btn-sm" id="dashViewAllLib"
          style="display:inline-flex;align-items:center;gap:4px;font-size:11px;">
          Xem tất cả <i data-lucide="chevron-right" style="width:13px;height:13px;"></i>
        </button>
      </div>
      <div id="dashRecentLectures">
        <div class="flex items-center gap-3" style="padding:14px;color:var(--text-muted);font-size:13px;">
          <i data-lucide="loader-2" class="spin" style="width:16px;height:16px;"></i> Đang tải…
        </div>
      </div>
    </div>

    <!-- Streak & heatmap -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">
          <i data-lucide="flame" style="width:16px;height:16px;color:#dc2626;"></i>
          Streak & Hoạt động
        </span>
        <span class="badge badge-danger" id="dashStreakBadge" style="display:inline-flex;align-items:center;gap:3px;"><i data-lucide="flame" style="width:12px;height:12px;"></i> 0 ngày</span>
      </div>
      <div id="dashHeatmap" style="overflow-x:auto;">
        <div class="flex items-center gap-2" style="padding:14px;color:var(--text-muted);font-size:13px;">
          <i data-lucide="loader-2" class="spin" style="width:16px;height:16px;"></i> Đang tải…
        </div>
      </div>
      <div class="divider"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;" id="dashMiniStats"></div>
    </div>

  </div>

</div>`;

  // Bind quick actions
  el('qaFlashcard')?.addEventListener('click', () => switchView('flashcard'));
  el('qaLecture')?.addEventListener('click', () => switchView('lecture'));
  el('qaLibrary')?.addEventListener('click', () => switchView('library'));
  el('dashStudyBtn')?.addEventListener('click', () => switchView('flashcard'));
  el('dashNewLecBtn')?.addEventListener('click', () => switchView('lecture'));
  el('dashViewAllLib')?.addEventListener('click', () => switchView('library'));

  refreshIcons();
  loadDashboardData();
}

async function loadDashboardData() {
  try {
    const [info, stats, lectures] = await Promise.all([
      API.get_app_info(),
      API.get_stats(),
      API.list_lectures('', '').catch(() => []),
    ]);

    State.appInfo = info;

    // ── Hero ──
    const due = info.due_today || 0;
    const streak = info.streak || 0;

    if (due > 0) {
      el('dashHeroTitle').textContent = `Bạn có ${due} thẻ cần ôn hôm nay`;
      el('dashHeroSub').textContent = `Học đều đặn giúp ghi nhớ lâu bền — chỉ cần vài phút!`;
    } else {
      el('dashHeroTitle').textContent = `Tuyệt vời! Không còn thẻ nào hôm nay`;
      el('dashHeroSub').textContent = `Bạn đã hoàn thành việc ôn tập. Tiếp tục học thêm bài giảng mới!`;
    }

    // Goal ring
    const totalToday = Math.max(due, 0);
    const target = Math.max(totalToday, 10);
    const done = target - due;
    const pct = Math.max(Math.min(done / target, 1), 0);
    const circumference = 2 * Math.PI * 37;
    const offset = circumference * (1 - pct);
    const ringFill = el('dashRingFill');
    if (ringFill) {
      ringFill.setAttribute('stroke-dasharray', circumference.toFixed(1));
      setTimeout(() => ringFill.setAttribute('stroke-dashoffset', offset.toFixed(1)), 100);
    }
    if (el('dashRingLabel')) el('dashRingLabel').textContent = due;

    // ── Stat cards ──
    const statCards = [
      {
        icon: 'layers', color: '#4f46e5', bg: 'rgba(99,102,241,0.10)',
        val: stats.due_today ?? 0, unit: 'thẻ',
        label: 'Cần ôn hôm nay', sub: `${stats.total_cards ?? 0} tổng số thẻ`,
      },
      {
        icon: 'flame', color: '#dc2626', bg: 'rgba(239,68,68,0.10)',
        val: streak, unit: 'ngày',
        label: 'Streak học tập', sub: `${stats.active_days ?? 0} ngày học`,
      },
      {
        icon: 'check-circle-2', color: '#059669', bg: 'rgba(16,185,129,0.10)',
        val: stats.avg_quiz_score ?? 0, unit: '%',
        label: 'Điểm Quiz TB', sub: `${stats.total_quizzes ?? 0} bài kiểm tra`,
      },
      {
        icon: 'book-open', color: '#0891b2', bg: 'rgba(6,182,212,0.10)',
        val: stats.total_lectures ?? 0, unit: 'bài',
        label: 'Bài giảng', sub: `${Math.round((stats.total_study_minutes ?? 0))} phút học`,
      },
    ];

    if (el('dashStats')) {
      el('dashStats').innerHTML = statCards.map(c => `
<div class="dash-stat-card">
  <div class="dash-stat-icon" style="background:${c.bg};">
    <i data-lucide="${c.icon}" style="width:20px;height:20px;color:${c.color};"></i>
  </div>
  <div class="dash-stat-val" style="color:${c.color};">${c.val}<span style="font-size:14px;font-weight:400;color:var(--text-muted);margin-left:3px;">${c.unit}</span></div>
  <div class="dash-stat-label">${c.label}</div>
  <div class="text-xs text-subtle mt-1">${c.sub}</div>
</div>`).join('');
    }

    // ── Flashcard quick action sub ──
    if (el('qaFcSub')) el('qaFcSub').textContent = `${due} thẻ cần ôn · ${stats.total_cards ?? 0} tổng số`;
    if (el('qaLibSub')) el('qaLibSub').textContent = `${stats.total_lectures ?? 0} bài giảng đã xử lý`;

    // ── Streak badge ──
    if (el('dashStreakBadge')) el('dashStreakBadge').innerHTML = `<i data-lucide="flame" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:3px;"></i>${streak} ngày`;

    // ── Heatmap (14 days) ──
    renderDashHeatmap(stats.daily_history || []);

    // ── Mini stats ──
    const miniStats = [
      { label: 'Thẻ đã học', val: stats.total_cards ?? 0, color: '#4f46e5' },
      { label: 'Thời gian học', val: `${Math.round(stats.total_study_minutes ?? 0)}p`, color: '#059669' },
    ];
    if (el('dashMiniStats')) {
      el('dashMiniStats').innerHTML = miniStats.map(m => `
<div style="text-align:center;padding:10px;">
  <div style="font-size:22px;font-weight:800;color:${m.color};">${m.val}</div>
  <div class="text-xs text-muted mt-1">${m.label}</div>
</div>`).join('');
    }

    // ── Recent lectures ──
    if (el('dashRecentLectures')) {
      if (!lectures.length) {
        el('dashRecentLectures').innerHTML = `
<div class="empty-state" style="padding:28px 16px;gap:10px;">
  <i data-lucide="mic-off" style="width:36px;height:36px;color:var(--text-subtle);margin:0 auto 4px;display:block;"></i>
  <div style="font-size:13px;font-weight:700;color:var(--text);">Chưa có bài giảng</div>
  <button class="btn btn-primary btn-sm" id="dashSeedDemo"
    style="display:inline-flex;align-items:center;gap:5px;margin-top:4px;">
    <i data-lucide="sparkles" style="width:13px;height:13px;"></i> Nạp dữ liệu mẫu
  </button>
</div>`;
        el('dashSeedDemo')?.addEventListener('click', async () => {
          showToast('Đang nạp dữ liệu mẫu…', 'info');
          const res = await API.seed_demo_data(true);
          if (res.success) { showToast(res.message, 'success', 3500); loadDashboardData(); refreshTopBar(); }
        });
      } else {
        const tagColors = {
          'CNTT': ['#e0e7ff', '#4338ca'],
          'Toán': ['#d1fae5', '#047857'],
          'Vật lý': ['#cffafe', '#0e7490'],
          'Ngoại ngữ': ['#fef3c7', '#b45309'],
          'General': ['#ede9fe', '#6d28d9'],
        };
        el('dashRecentLectures').innerHTML = lectures.slice(0, 4).map(lec => {
          const tag = lec.folder_tag || 'General';
          const [bg, clr] = tagColors[tag] || tagColors['General'];
          const dur = fmtDuration(lec.duration_sec || 0);
          return `
<div class="recent-lecture-item" data-lid="${escHtml(lec.id)}">
  <div class="lecture-thumb" style="background:${bg};display:flex;align-items:center;justify-content:center;">
    <i data-lucide="mic" style="width:18px;height:18px;color:${clr};"></i>
  </div>
  <div class="lecture-info">
    <div class="lecture-name">${escHtml(lec.title || 'Bài giảng')}</div>
    <div class="lecture-meta">${escHtml(tag)} · ${dur} · ${fmtDate(lec.created_at)}</div>
  </div>
  <i data-lucide="chevron-right" style="width:16px;height:16px;color:var(--text-subtle);flex-shrink:0;"></i>
</div>`;
        }).join('');

        el('dashRecentLectures').querySelectorAll('.recent-lecture-item').forEach(item => {
          item.addEventListener('click', () => {
            switchView('lecture');
            if (typeof loadLecture === 'function') loadLecture(item.dataset.lid);
          });
        });
      }
    }

    refreshIcons();
  } catch (e) {
    console.error('[Dashboard] Error loading:', e);
  }
}

function renderDashHeatmap(history) {
  if (!el('dashHeatmap')) return;

  const today = new Date();
  const dateMap = {};
  history.forEach(h => {
    const key = h.session_date;
    const mins = (h['SUM(duration_sec)'] || h.duration_sec || 0) / 60;
    dateMap[key] = Math.min(4, Math.floor(mins / 10) + (mins > 0 ? 1 : 0));
  });

  const days = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const lbl = `${d.getDate()}/${d.getMonth() + 1}`;
    days.push({ iso, label: lbl, level: dateMap[iso] || 0 });
  }

  // 4 rows of 7 days each
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  el('dashHeatmap').innerHTML = `
<div style="display:flex;gap:4px;padding:8px 0;">
  ${weeks.map(week => `
  <div style="display:flex;flex-direction:column;gap:4px;">
    ${week.map(d => `
    <div class="heatmap-day has-${d.level}" title="${d.label}: ${d.level > 0 ? d.level * 10 + '+ phút' : 'Chưa học'}"></div>
    `).join('')}
  </div>`).join('')}
</div>
<div style="display:flex;gap:4px;align-items:center;font-size:10px;color:var(--text-subtle);margin-top:4px;">
  <span>Ít</span>
  <div style="width:12px;height:12px;background:var(--glass-medium);border-radius:2px;"></div>
  <div style="width:12px;height:12px;background:rgba(99,102,241,0.25);border-radius:2px;"></div>
  <div style="width:12px;height:12px;background:rgba(99,102,241,0.55);border-radius:2px;"></div>
  <div style="width:12px;height:12px;background:rgba(99,102,241,0.85);border-radius:2px;box-shadow:0 0 6px rgba(99,102,241,0.5);"></div>
  <span>Nhiều</span>
</div>`;
}

registerView('dashboard', {
  render: renderDashboardView,
  onShow: () => {
    if (!el('dashStats') || !el('dashStats').querySelector('.dash-stat-card')) {
      renderDashboardView();
    } else {
      loadDashboardData();
    }
  },
});

// ──────────────────────────────────────────
// Splash / startup
// ──────────────────────────────────────────
let splashTimeout = null;
let splashDismissed = false;

function dismissSplash() {
  if (splashDismissed) return;
  splashDismissed = true;
  clearTimeout(splashTimeout);

  const splash = el('splash');
  if (splash) {
    splash.style.opacity = '0';
    splash.style.transition = 'opacity .45s';
    setTimeout(() => {
      splash.classList.add('hidden');
      el('app').classList.remove('hidden');
      switchView('dashboard');
      refreshTopBar();
    }, 460);
  }
}

function setSplashStatus(text, phase, progress) {
  if (el('splashStatus')) el('splashStatus').textContent = text;
  if (el('splashBar')) el('splashBar').style.width = `${Math.round(progress * 100)}%`;

  if (phase >= 1 && el('phase1'))
    el('phase1').className = 'phase-pill' + (progress >= 0.5 ? ' done' : '');
  if (phase >= 2 && el('phase2'))
    el('phase2').className = 'phase-pill' + (progress >= 1.0 ? ' done' : '');
}

EventBus.on('splash:status', ({ text, phase, progress }) => setSplashStatus(text, phase, progress));
EventBus.on('splash:done', () => dismissSplash());

// Lắng nghe log debug prompt từ AI
EventBus.on('debug:prompt', ({ type, title, prompt }) => {
  const typeLabel = type === 'quiz' ? 'QUIZ (TRẮC NGHIỆM)' : 'FLASHCARDS (THẺ GHI NHỚ)';
  console.group(`%c🤖 [DEBUG AI PROMPT] ${typeLabel} — ${title || 'Bài giảng'}`, 'color: #4f46e5; font-weight: bold; font-size: 13px; padding: 2px 6px; background: #e0e7ff; border-radius: 4px;');
  console.log(`%c📝 Nội dung Prompt gửi tới LLM:`, 'color: #0f172a; font-weight: bold;');
  console.log(prompt);
  console.log(`%c📊 Độ dài: ${prompt.length} ký tự (~${prompt.split(/\s+/).length} từ)`, 'color: #64748b; font-style: italic;');
  console.groupEnd();
});

// ──────────────────────────────────────────
// Boot
// ──────────────────────────────────────────
window.addEventListener('pywebviewready', async () => {
  setSplashStatus('Đang nạp mô hình AI…', 1, 0.05);

  setTimeout(() => {
    if (!splashDismissed && el('splashSkipBtn'))
      el('splashSkipBtn').classList.remove('hidden');
  }, 4000);

  splashTimeout = setTimeout(() => {
    if (!splashDismissed) { console.warn('[Splash] Timeout 15s'); dismissSplash(); }
  }, 15000);

  el('splashSkipBtn')?.addEventListener('click', dismissSplash);

  try {
    await API.load_models();
  } catch (e) {
    console.error('[Boot error]', e);
    dismissSplash();
  }
});
