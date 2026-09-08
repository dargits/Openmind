/* ════════════════════════════════════════════
   Library View — Open-mind
   Filter chips · Gradient cards · Empty state
════════════════════════════════════════════ */
'use strict';

const LIB = {
  activeFolder: '',
  searchQuery: '',
};

// Tag color palettes (Light theme optimized with Lucide icons)
const TAG_PALETTES = {
  'CNTT':     { bg: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)', border: '#c7d2fe', icon: 'laptop', color: '#4338ca', badgeBg: '#ffffff', badgeBorder: '#c7d2fe' },
  'Toán':     { bg: 'linear-gradient(135deg, #d1fae5 0%, #cffafe 100%)', border: '#a7f3d0', icon: 'calculator', color: '#047857', badgeBg: '#ffffff', badgeBorder: '#a7f3d0' },
  'Vật lý':   { bg: 'linear-gradient(135deg, #cffafe 0%, #e0e7ff 100%)', border: '#a5f3fc', icon: 'atom', color: '#0e7490', badgeBg: '#ffffff', badgeBorder: '#a5f3fc' },
  'Ngoại ngữ':{ bg: 'linear-gradient(135deg, #fef3c7 0%, #fee2e2 100%)', border: '#fde68a', icon: 'globe', color: '#b45309', badgeBg: '#ffffff', badgeBorder: '#fde68a' },
  'General':  { bg: 'linear-gradient(135deg, #ede9fe 0%, #fce7f3 100%)', border: '#ddd6fe', icon: 'book-open', color: '#6d28d9', badgeBg: '#ffffff', badgeBorder: '#ddd6fe' },
};

function getPalette(tag) {
  return TAG_PALETTES[tag] || TAG_PALETTES['General'];
}

async function renderLibraryView() {
  el('view-library').innerHTML = `
<div style="display:flex;flex-direction:column;gap:20px;height:100%;padding-bottom:24px;">

  <div class="page-header">
    <div>
      <div class="page-title" style="display:flex;align-items:center;gap:10px;">
        <i data-lucide="book-open" style="width:22px;height:22px;color:#4f46e5;"></i>
        Thư viện Bài giảng
      </div>
      <div class="page-subtitle" id="libSubtitle" style="color:var(--text-muted);font-weight:500;">Đang tải…</div>
    </div>
    <div style="position:relative;display:flex;align-items:center;">
      <i data-lucide="search" style="position:absolute;left:12px;width:15px;height:15px;color:var(--text-subtle);pointer-events:none;"></i>
      <input class="input" id="libSearch" placeholder="Tìm kiếm bài giảng…"
        style="width:250px;padding-left:36px;background:#ffffff;border:1px solid #cbd5e1;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
    </div>
  </div>

  <!-- Filter chips -->
  <div class="filter-chips" id="libFilterChips">
    <div class="filter-chip active" data-folder="">Tất cả</div>
    <div class="filter-chip" data-folder="CNTT"><i data-lucide="laptop" style="width:13px;height:13px;margin-right:4px;"></i>CNTT</div>
    <div class="filter-chip" data-folder="Toán"><i data-lucide="calculator" style="width:13px;height:13px;margin-right:4px;"></i>Toán</div>
    <div class="filter-chip" data-folder="Vật lý"><i data-lucide="atom" style="width:13px;height:13px;margin-right:4px;"></i>Vật lý</div>
    <div class="filter-chip" data-folder="Ngoại ngữ"><i data-lucide="globe" style="width:13px;height:13px;margin-right:4px;"></i>Ngoại ngữ</div>
    <div class="filter-chip" data-folder="General"><i data-lucide="book-open" style="width:13px;height:13px;margin-right:4px;"></i>General</div>
  </div>

  <!-- Grid -->
  <div class="library-grid" id="libGrid" style="overflow-y:auto;flex:1;align-content:start;"></div>

</div>`;

  // Filter chips
  el('libFilterChips').querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      el('libFilterChips').querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      LIB.activeFolder = chip.dataset.folder;
      loadLibrary();
    });
  });

  // Search
  el('libSearch').addEventListener('input', debounce(() => {
    LIB.searchQuery = el('libSearch')?.value || '';
    loadLibrary();
  }, 300));

  loadLibrary();
}

async function loadLibrary() {
  if (!el('libGrid')) return;

  el('libGrid').innerHTML = `
<div style="grid-column:1/-1;display:flex;align-items:center;gap:10px;color:var(--text-muted);font-size:13px;padding:32px;">
  <i data-lucide="loader-2" class="spin" style="width:18px;height:18px;"></i>
  Đang tải danh sách bài giảng…
</div>`;
  refreshIcons();

  try {
    const lectures = await API.list_lectures(LIB.activeFolder, LIB.searchQuery);

    if (el('libSubtitle')) {
      el('libSubtitle').textContent = `${lectures.length} bài giảng${LIB.activeFolder ? ` · ${LIB.activeFolder}` : ''}`;
    }

    if (!lectures.length) {
      el('libGrid').innerHTML = `
<div style="grid-column:1/-1;">
  <div class="empty-state">
    <div class="empty-icon"><i data-lucide="mic-off" style="width:48px;height:48px;color:var(--text-subtle);"></i></div>
    <div class="empty-title">${LIB.searchQuery ? 'Không tìm thấy bài giảng' : 'Chưa có bài giảng nào'}</div>
    <div class="empty-sub">${LIB.searchQuery
        ? `Không có kết quả cho "<strong>${escHtml(LIB.searchQuery)}</strong>"`
        : 'Vào Studio để xử lý âm thanh bài giảng, hoặc nạp dữ liệu mẫu để thử.'}</div>
    ${!LIB.searchQuery ? `
    <div style="display:flex;gap:10px;margin-top:8px;">
      <button class="btn btn-primary" id="btnLibNewLec"
        style="display:inline-flex;align-items:center;gap:6px;">
        <i data-lucide="mic" style="width:14px;height:14px;"></i> Mở Studio
      </button>
      <button class="btn btn-secondary" id="btnLibSeedDemo"
        style="display:inline-flex;align-items:center;gap:6px;">
        <i data-lucide="sparkles" style="width:14px;height:14px;"></i> Nạp dữ liệu mẫu
      </button>
    </div>` : ''}
  </div>
</div>`;

      el('btnLibNewLec')?.addEventListener('click', () => switchView('lecture'));
      el('btnLibSeedDemo')?.addEventListener('click', async () => {
        showToast('Đang nạp bài giảng demo…', 'info');
        const res = await API.seed_demo_data(true);
        if (res.success) { showToast(res.message, 'success', 3500); loadLibrary(); refreshTopBar(); }
      });

      refreshIcons();
      return;
    }

    el('libGrid').innerHTML = lectures.map(lec => {
      const tag     = lec.folder_tag || 'General';
      const palette = getPalette(tag);
      const dur     = fmtDuration(lec.duration_sec || 0);
      const date    = fmtDate(lec.created_at);

      // Badges tiến trình học tập
      const badges = [];
      if (lec.has_quiz || lec.quiz_count > 0) {
        badges.push(`<span class="badge lib-badge-jump" data-lid="${escHtml(lec.id)}" data-tab="quiz" style="background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;cursor:pointer;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:3px;" title="Nhấn để mở bài Quiz trắc nghiệm"><i data-lucide="check-circle-2" style="width:11px;height:11px;"></i> ${lec.quiz_count || 5} câu Quiz</span>`);
      }
      if (lec.flashcard_count > 0) {
        badges.push(`<span class="badge lib-badge-jump" data-lid="${escHtml(lec.id)}" data-tab="flashcards" style="background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;cursor:pointer;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:3px;" title="Nhấn để mở bộ thẻ ghi nhớ"><i data-lucide="layers" style="width:11px;height:11px;"></i> ${lec.flashcard_count} thẻ nhớ</span>`);
      }
      if (lec.has_summary) {
        badges.push(`<span class="badge lib-badge-jump" data-lid="${escHtml(lec.id)}" data-tab="summary" style="background:#fef3c7;color:#b45309;border:1px solid #fde68a;cursor:pointer;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:3px;" title="Nhấn để xem tóm tắt & mindmap"><i data-lucide="file-text" style="width:11px;height:11px;"></i> Tóm tắt</span>`);
      }
      if (!badges.length) {
        badges.push(`<span class="badge" style="background:#f8fafc;color:#94a3b8;border:1px solid #e2e8f0;font-size:11px;">Chưa tạo quiz/thẻ</span>`);
      }

      return `
<div class="lecture-card" data-lid="${escHtml(lec.id)}">
  <div class="lec-cover" style="background:${palette.bg};border-bottom:1px solid ${palette.border};">
    <div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.75);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.06);position:relative;z-index:1;border:1px solid rgba(255,255,255,0.9);">
      <i data-lucide="${palette.icon}" style="width:24px;height:24px;color:${palette.color};"></i>
    </div>
    <div style="position:relative;z-index:1;">
      <div class="lec-tag"><span class="badge" style="color:${palette.color};background:${palette.badgeBg};border:1px solid ${palette.badgeBorder};box-shadow:0 1px 3px rgba(0,0,0,0.06);font-weight:700;">${escHtml(tag)}</span></div>
    </div>
  </div>
  <div class="lec-body">
    <div class="lec-title" title="${escHtml(lec.title || '')}">${escHtml(lec.title || 'Bài giảng')}</div>
    <div class="lec-meta">
      <span style="display:inline-flex;align-items:center;gap:5px;">
        <i data-lucide="clock" style="width:13px;height:13px;"></i> ${dur}
      </span>
      <span style="display:inline-flex;align-items:center;gap:5px;">
        <i data-lucide="calendar" style="width:13px;height:13px;"></i> ${date}
      </span>
    </div>

    <!-- Learning status badges -->
    <div style="display:flex;flex-wrap:wrap;gap:5px;margin:8px 0 10px 0;">
      ${badges.join('')}
    </div>

    <div class="lec-actions">
      <button class="btn btn-primary btn-sm lib-open" data-lid="${escHtml(lec.id)}"
        style="flex:1;justify-content:center;display:inline-flex;align-items:center;gap:5px;">
        <i data-lucide="book-open" style="width:13px;height:13px;"></i> Vào học bài
      </button>
      <button class="btn btn-ghost btn-sm lib-del" data-lid="${escHtml(lec.id)}" data-title="${escHtml(lec.title || '')}"
        title="Xóa bài giảng"
        style="display:inline-flex;align-items:center;padding:6px 10px;">
        <i data-lucide="trash-2" style="width:13px;height:13px;color:var(--danger);"></i>
      </button>
    </div>
  </div>
</div>`;
    }).join('');

    el('libGrid').querySelectorAll('.lib-open').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); openLecture(btn.dataset.lid); });
    });
    el('libGrid').querySelectorAll('.lib-badge-jump').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        openLecture(btn.dataset.lid, btn.dataset.tab);
      });
    });
    el('libGrid').querySelectorAll('.lib-del').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); deleteLecture(btn.dataset.lid, btn.dataset.title); });
    });
    el('libGrid').querySelectorAll('.lecture-card').forEach(card => {
      card.addEventListener('click', () => openLecture(card.dataset.lid));
    });

    refreshIcons();
  } catch (e) {
    el('libGrid').innerHTML = `
<div style="grid-column:1/-1;padding:32px;color:var(--danger);display:flex;align-items:center;gap:8px;">
  <i data-lucide="alert-triangle" style="width:16px;height:16px;"></i> Lỗi tải thư viện: ${escHtml(e.message)}
</div>`;
  }
}

function openLecture(lectureId, initialTab = 'transcript') {
  switchView('lecture');
  if (typeof loadLecture === 'function') loadLecture(lectureId, initialTab);
}

async function deleteLecture(lectureId, title) {
  const idx = await showModal(
    'Xoá bài giảng',
    `<p style="color:var(--text-muted);">Bạn chắc muốn xoá bài giảng <strong style="color:var(--text);">${escHtml(title)}</strong>?<br>
     <span style="color:var(--danger);font-size:12px;margin-top:6px;display:flex;align-items:center;gap:4px;"><i data-lucide="alert-triangle" style="width:13px;height:13px;"></i> Thao tác này không thể hoàn tác — toàn bộ transcript, quiz, thẻ liên quan sẽ bị xoá.</span></p>`,
    [{ label: 'Huỷ', class: 'btn-ghost' }, { label: 'Xoá vĩnh viễn', class: 'btn-danger' }]
  );
  if (idx !== 1) return;
  try {
    await API.delete_lecture(lectureId);
    showToast('Đã xoá bài giảng', 'success');
    loadLibrary();
  } catch (e) {
    showToast('Lỗi xoá: ' + e.message, 'error');
  }
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

registerView('library', {
  render: renderLibraryView,
  onShow: () => {
    if (!el('libGrid')) renderLibraryView();
    else loadLibrary();
  },
});
