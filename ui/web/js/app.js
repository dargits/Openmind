/* ════════════════════════════════════════════
   Open-mind Pro — Core App JS
   Router · State · API wrapper · Toast/Modal
════════════════════════════════════════════ */

'use strict';

// ──────────────────────────────────────────
// State
// ──────────────────────────────────────────
const State = {
  currentView: 'flashcard',
  lectureId: null,
  deckId: null,
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
  get_app_info:         ()               => API.call('get_app_info'),
  load_models:          ()               => API.call('load_models'),
  get_model_info:       ()               => API.call('get_model_info'),

  get_decks:            ()               => API.call('get_decks'),
  create_deck:          (n, d)           => API.call('create_deck', n, d || ''),
  delete_deck:          (id)             => API.call('delete_deck', id),
  get_due_cards:        (id)             => API.call('get_due_cards', id),
  get_all_cards:        (id)             => API.call('get_all_cards', id),
  add_card:             (did, f, b, h)   => API.call('add_card', did, f, b, h || ''),
  delete_card:          (id)             => API.call('delete_card', id),
  rate_card:            (id, r, ef, iv, rp) => API.call('rate_card', id, r, ef, iv, rp),
  preview_srs:          (r, ef, iv, rp)  => API.call('preview_srs', r, ef, iv, rp),
  get_deck_progress:    (id)             => API.call('get_deck_progress', id),

  list_lectures:        (tag, q)         => API.call('list_lectures', tag || '', q || ''),
  get_lecture:          (id)             => API.call('get_lecture', id),
  delete_lecture:       (id)             => API.call('delete_lecture', id),
  pick_audio_file:      ()               => API.call('pick_audio_file'),
  get_audio_url:        (p)              => API.call('get_audio_url', p),

  start_transcribe:     (p, pr, lid, t, ft) => API.call('start_transcribe', p, pr || '', lid || '', t || '', ft || 'General'),
  generate_summary:     (id)             => API.call('generate_summary', id),
  generate_quiz:        (id, n, d)       => API.call('generate_quiz', id, n || 5, d || 'trung bình'),
  generate_flashcards:  (id, n)          => API.call('generate_flashcards', id, n || 8),
  ask_rag:              (q, id)          => API.call('ask_rag', q, id),
  save_quiz_result:     (id, s, t, d, r) => API.call('save_quiz_result', id, s, t, d, r),

  get_stats:            ()               => API.call('get_stats'),
  get_settings:         ()               => API.call('get_settings'),
  seed_demo_data:       (f)              => API.call('seed_demo_data', f || false),

  export_txt:           (id)             => API.call('export_txt', id),
  export_html:          (id)             => API.call('export_html', id),
  export_json:          (id)             => API.call('export_json', id),
};

// ──────────────────────────────────────────
// Global event bus (from Python push events)
// ──────────────────────────────────────────
const EventBus = {
  _handlers: {},
  on(type, handler) {
    (this._handlers[type] ??= []).push(handler);
  },
  off(type, handler) {
    if (this._handlers[type])
      this._handlers[type] = this._handlers[type].filter(h => h !== handler);
  },
  emit(type, data) {
    (this._handlers[type] ?? []).forEach(h => h(data));
  },
};

window.addEventListener('omEvent', e => {
  const { type, data } = e.detail;
  EventBus.emit(type, data);
});

// ──────────────────────────────────────────
// Toast
// ──────────────────────────────────────────
let toastTimer = null;
function showToast(msg, type = 'info', duration = 3000) {
  const el = document.getElementById('toast');
  if (!el) return;
  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : type === 'warning' ? 'alert-triangle' : 'info';
  el.innerHTML = `<div style="display:inline-flex;align-items:center;gap:8px;"><i data-lucide="${iconName}" style="width:16px;height:16px;flex-shrink:0;"></i><span>${escHtml(msg)}</span></div>`;
  el.className = `toast ${type}`;
  refreshIcons();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), duration);
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
  });
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

// ──────────────────────────────────────────
// Helpers & Lucide Icons
// ──────────────────────────────────────────
function el(id) { return document.getElementById(id); }
function html(id, content) { el(id).innerHTML = content; }
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
  if (days < 7)  return `${days} ngày`;
  if (days < 30) return `${Math.round(days/7)} tuần`;
  if (days < 365)return `${(days/30).toFixed(1)} tháng`;
  return `${(days/365).toFixed(1)} năm`;
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  el(`view-${name}`).classList.remove('hidden');

  qsa('.nav-item').forEach(b => b.classList.remove('active'));
  qs(`.nav-item[data-view="${name}"]`)?.classList.add('active');

  Views[name].onShow?.();
  setTimeout(refreshIcons, 10);
}

// ──────────────────────────────────────────
// Sidebar nav
// ──────────────────────────────────────────
qsa('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
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
    splash.style.transition = 'opacity .4s';
    setTimeout(() => {
      splash.classList.add('hidden');
      el('app').classList.remove('hidden');
      switchView('flashcard');
      refreshTopBar();
    }, 420);
  }
}

function setSplashStatus(text, phase, progress) {
  if (el('splashStatus')) el('splashStatus').textContent = text;
  if (el('splashBar')) el('splashBar').style.width = `${Math.round(progress * 100)}%`;

  if (phase >= 1 && el('phase1')) {
    el('phase1').className = 'phase-pill' + (progress >= 0.5 ? ' done' : '');
  }
  if (phase >= 2 && el('phase2')) {
    el('phase2').className = 'phase-pill' + (progress >= 1.0 ? ' done' : '');
  }
}

EventBus.on('splash:status', ({ text, phase, progress }) => {
  setSplashStatus(text, phase, progress);
});

EventBus.on('splash:done', () => {
  dismissSplash();
});

// ──────────────────────────────────────────
// Top bar stats
// ──────────────────────────────────────────
async function refreshTopBar() {
  try {
    const info = await API.get_app_info();
    if (el('topDue')) {
      el('topDue').innerHTML = `<i data-lucide="layers" style="width:14px;height:14px;"></i> <span>${info.due_today} thẻ cần ôn</span>`;
    }
    if (el('topStreak')) {
      el('topStreak').innerHTML = `<i data-lucide="flame" style="width:14px;height:14px;color:#ea580c;"></i> <span>${info.streak} ngày</span>`;
    }
    refreshIcons();
  } catch (_) {}
}

// ──────────────────────────────────────────
// Boot
// ──────────────────────────────────────────
window.addEventListener('pywebviewready', async () => {
  setSplashStatus('Đang nạp mô hình…', 1, 0.05);

  // Show skip button after 4 seconds
  setTimeout(() => {
    if (!splashDismissed && el('splashSkipBtn')) {
      el('splashSkipBtn').classList.remove('hidden');
    }
  }, 4000);

  // Auto-dismiss after 15s max timeout to prevent any infinite hang
  splashTimeout = setTimeout(() => {
    if (!splashDismissed) {
      console.warn('[Splash] Timeout 15s reached — entering app.');
      dismissSplash();
    }
  }, 15000);

  el('splashSkipBtn')?.addEventListener('click', dismissSplash);

  try {
    await API.load_models();
  } catch (e) {
    console.error('[Boot error]', e);
    dismissSplash();
  }
});
