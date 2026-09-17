/**
 * SPDX-FileCopyrightText: 2026 Open-mind Contributors
 * SPDX-License-Identifier: MIT
 *
 * Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
 * Distributed under the terms of the OSI-approved MIT License.
 */

/* ════════════════════════════════════════════
   Library View — Open-mind Pro
   Modern Responsive Design · Zero-Flicker Background Sync
   Sleek Card Architecture · Instant Action Triggers
════════════════════════════════════════════ */
'use strict';

const LIB = {
  activeFolder: '',
  searchQuery: '',
  lastDataHash: null,
};

// Tag palettes tailored for high visual clarity and beauty
const TAG_PALETTES = {
  'CNTT': {
    icon: 'laptop',
    color: '#4f46e5',
    bgGradient: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)',
    tagBg: '#eef2ff',
    tagBorder: '#c7d2fe',
  },
  'Toán': {
    icon: 'calculator',
    color: '#059669',
    bgGradient: 'linear-gradient(135deg, #d1fae5 0%, #cffafe 100%)',
    tagBg: '#ecfdf5',
    tagBorder: '#a7f3d0',
  },
  'Vật lý': {
    icon: 'atom',
    color: '#0891b2',
    bgGradient: 'linear-gradient(135deg, #cffafe 0%, #e0e7ff 100%)',
    tagBg: '#ecfeff',
    tagBorder: '#a5f3fc',
  },
  'Ngoại ngữ': {
    icon: 'globe',
    color: '#d97706',
    bgGradient: 'linear-gradient(135deg, #fef3c7 0%, #fee2e2 100%)',
    tagBg: '#fffbeb',
    tagBorder: '#fde68a',
  },
  'General': {
    icon: 'book-open',
    color: '#7c3aed',
    bgGradient: 'linear-gradient(135deg, #ede9fe 0%, #fce7f3 100%)',
    tagBg: '#f5f3ff',
    tagBorder: '#ddd6fe',
  },
};

function getPalette(tag, isPdf, isYouTube) {
  if (isPdf) {
    return {
      icon: 'file-text',
      color: '#e11d48',
      bgGradient: 'linear-gradient(135deg, #ffe4e6 0%, #fce7f3 100%)',
      tagBg: '#fff1f2',
      tagBorder: '#fecdd3',
    };
  }
  if (isYouTube) {
    return {
      icon: 'video',
      color: '#dc2626',
      bgGradient: 'linear-gradient(135deg, #fee2e2 0%, #ffedd5 100%)',
      tagBg: '#fef2f2',
      tagBorder: '#fca5a5',
    };
  }
  return TAG_PALETTES[tag] || TAG_PALETTES['General'];
}

async function renderLibraryView() {
  const container = el('view-library');
  if (!container) return;

  container.innerHTML = `
<div class="library-container">

  <!-- Header -->
  <div class="library-header">
    <div class="library-title-group">
      <div style="width:38px;height:38px;border-radius:12px;background:rgba(99,102,241,0.10);border:1px solid rgba(99,102,241,0.18);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(99,102,241,0.12);">
        <i data-lucide="book-open" style="width:20px;height:20px;color:#4f46e5;"></i>
      </div>
      <div>
        <div style="display:flex;align-items:center;gap:8px;">
          <h1 class="page-title" style="margin:0;font-size:20px;font-weight:800;color:#0f172a;">Thư viện Bài giảng</h1>
          <span class="badge" id="libCountBadge" style="background:#e0e7ff;color:#4338ca;font-size:11px;font-weight:700;border:1px solid #c7d2fe;">0 bài</span>
        </div>
        <div class="page-subtitle" id="libSubtitle" style="color:var(--text-muted);font-size:12px;margin-top:2px;">Kho lưu trữ bài học & tài liệu AI</div>
      </div>
    </div>

    <!-- Search & Quick action -->
    <div style="display:flex;align-items:center;gap:10px;flex:1;justify-content:flex-end;">
      <div class="library-search-wrap">
        <i data-lucide="search" style="position:absolute;left:12px;width:15px;height:15px;color:#94a3b8;pointer-events:none;"></i>
        <input class="library-search-input" id="libSearch" placeholder="Tìm kiếm bài giảng, nội dung FTS5…" value="${escHtml(LIB.searchQuery)}" autocomplete="off">
        <button id="libSearchClear" style="display:${LIB.searchQuery ? 'flex' : 'none'};position:absolute;right:10px;background:none;border:none;color:#94a3b8;cursor:pointer;padding:4px;align-items:center;justify-content:center;" title="Xoá tìm kiếm">
          <i data-lucide="x" style="width:14px;height:14px;"></i>
        </button>
      </div>
      <button class="btn btn-primary btn-sm" id="btnLibOpenStudio" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;">
        <i data-lucide="plus" style="width:14px;height:14px;"></i> Thêm bài
      </button>
    </div>
  </div>

  <!-- Filter chips bar -->
  <div class="filter-chips-wrap" id="libFilterChips">
    <div class="filter-chip ${!LIB.activeFolder ? 'active' : ''}" data-folder="">Tất cả</div>
    <div class="filter-chip ${LIB.activeFolder === 'CNTT' ? 'active' : ''}" data-folder="CNTT"><i data-lucide="laptop" style="width:13px;height:13px;"></i>CNTT</div>
    <div class="filter-chip ${LIB.activeFolder === 'Toán' ? 'active' : ''}" data-folder="Toán"><i data-lucide="calculator" style="width:13px;height:13px;"></i>Toán</div>
    <div class="filter-chip ${LIB.activeFolder === 'Vật lý' ? 'active' : ''}" data-folder="Vật lý"><i data-lucide="atom" style="width:13px;height:13px;"></i>Vật lý</div>
    <div class="filter-chip ${LIB.activeFolder === 'Ngoại ngữ' ? 'active' : ''}" data-folder="Ngoại ngữ"><i data-lucide="globe" style="width:13px;height:13px;"></i>Ngoại ngữ</div>
    <div class="filter-chip ${LIB.activeFolder === 'General' ? 'active' : ''}" data-folder="General"><i data-lucide="book-open" style="width:13px;height:13px;"></i>General</div>
  </div>

  <!-- Cards Grid (Smooth scrolling naturally handled by parent view) -->
  <div class="library-grid" id="libGrid"></div>

</div>`;

  // Bind filter chips
  el('libFilterChips')?.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      el('libFilterChips').querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      LIB.activeFolder = chip.dataset.folder;
      loadLibrary({ silent: false });
    });
  });

  // Bind search input
  const searchInput = el('libSearch');
  const searchClear = el('libSearchClear');

  searchInput?.addEventListener('input', debounce(() => {
    LIB.searchQuery = searchInput.value || '';
    if (searchClear) searchClear.style.display = LIB.searchQuery ? 'flex' : 'none';
    loadLibrary({ silent: true });
  }, 250));

  searchClear?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    LIB.searchQuery = '';
    searchClear.style.display = 'none';
    loadLibrary({ silent: true });
  });

  el('btnLibOpenStudio')?.addEventListener('click', () => switchView('lecture'));

  refreshIcons();
  loadLibrary({ silent: false });
}

/**
 * Load lectures from SQLite database.
 * If silent = true (e.g. background sync or tab switch), preserves existing DOM
 * and updates seamlessly without flashing loaders or blank screens.
 */
async function loadLibrary(options = {}) {
  const silent = typeof options === 'object' && options !== null ? !!options.silent : !!options;
  const grid = el('libGrid');
  if (!grid) return;

  const hasExistingCards = grid.querySelectorAll('.lecture-card, .search-result-card').length > 0;

  // Only show loading indicator if grid is completely empty and not a silent refresh
  if (!silent && !hasExistingCards) {
    grid.innerHTML = `
<div style="grid-column:1/-1;display:flex;align-items:center;gap:10px;color:var(--text-muted);font-size:13px;padding:36px;justify-content:center;">
  <i data-lucide="loader-2" class="spin" style="width:20px;height:20px;color:var(--accent);"></i>
  <span>Đang tải danh sách bài giảng…</span>
</div>`;
    refreshIcons();
  }

  try {
    const query = (LIB.searchQuery || '').trim();
    let lectures = [];
    let isFtsSearch = false;

    if (query) {
      isFtsSearch = true;
      try {
        lectures = await API.search_all_lectures(query);
      } catch (err) {
        console.warn('FTS5 query fallback:', err);
        lectures = await API.list_lectures(LIB.activeFolder, query);
        isFtsSearch = false;
      }
    } else {
      lectures = await API.list_lectures(LIB.activeFolder, '');
    }

    if (!Array.isArray(lectures)) lectures = [];

    // Update subtitles and count badge in-place
    const countBadge = el('libCountBadge');
    if (countBadge) countBadge.textContent = `${lectures.length} bài`;

    const subtitle = el('libSubtitle');
    if (subtitle) {
      if (isFtsSearch) {
        subtitle.textContent = `${lectures.length} kết quả tìm kiếm cho "${query}"`;
      } else {
        subtitle.textContent = LIB.activeFolder
          ? `${lectures.length} bài giảng thuộc chuyên mục "${LIB.activeFolder}"`
          : `${lectures.length} bài giảng sẵn sàng ôn tập`;
      }
    }

    // FTS Search Results View
    if (isFtsSearch) {
      renderFtsSearchResults(lectures, query);
      return;
    }

    // Empty state
    if (!lectures.length) {
      renderEmptyLibraryState();
      return;
    }

    // Normal Library Cards View
    renderLectureCards(lectures);

  } catch (e) {
    console.error('loadLibrary error:', e);
    if (!hasExistingCards) {
      grid.innerHTML = `
<div style="grid-column:1/-1;padding:32px;color:var(--danger);display:flex;align-items:center;gap:8px;justify-content:center;">
  <i data-lucide="alert-triangle" style="width:16px;height:16px;"></i> Lỗi tải thư viện: ${escHtml(e.message)}
</div>`;
      refreshIcons();
    }
  }
}

function renderLectureCards(lectures) {
  const grid = el('libGrid');
  if (!grid) return;

  grid.innerHTML = lectures.map(lec => {
    const tag = lec.folder_tag || 'General';
    const isPdf = !lec.audio_path || (lec.audio_path && lec.audio_path.toLowerCase().endsWith('.pdf'));
    const isYouTube = (lec.title && lec.title.toLowerCase().startsWith('ytsave_')) || (lec.audio_path && lec.audio_path.includes('downloads'));
    const palette = getPalette(tag, isPdf, isYouTube);
    const dur = fmtDuration(lec.duration_sec || 0);
    const date = fmtDate(lec.created_at);

    // Badges / pills
    const pills = [];
    if (lec.has_quiz || lec.quiz_count > 0) {
      pills.push(`
        <span class="lec-pill lec-pill-quiz lib-badge-jump" data-lid="${escHtml(lec.id)}" data-tab="quiz" title="Làm trắc nghiệm">
          <i data-lucide="check-circle-2" style="width:12px;height:12px;"></i> ${lec.quiz_count || 5} Quiz
        </span>
      `);
    }
    if (lec.flashcard_count > 0) {
      pills.push(`
        <span class="lec-pill lec-pill-flashcards lib-badge-jump" data-lid="${escHtml(lec.id)}" data-tab="flashcards" title="Ôn tập thẻ nhớ">
          <i data-lucide="layers" style="width:12px;height:12px;"></i> ${lec.flashcard_count} Thẻ
        </span>
      `);
    }
    if (lec.has_summary) {
      pills.push(`
        <span class="lec-pill lec-pill-summary lib-badge-jump" data-lid="${escHtml(lec.id)}" data-tab="summary" title="Xem tóm tắt & Mindmap">
          <i data-lucide="file-text" style="width:12px;height:12px;"></i> Tóm tắt
        </span>
      `);
    }
    if (lec.notes_count > 0) {
      pills.push(`
        <span class="lec-pill lec-pill-notes lib-badge-jump" data-lid="${escHtml(lec.id)}" data-tab="notes" title="Xem ghi chú cá nhân">
          <i data-lucide="edit-3" style="width:12px;height:12px;"></i> ${lec.notes_count} Ghi chú
        </span>
      `);
    }
    if (!pills.length) {
      pills.push(`
        <span class="lec-pill" style="background:#f8fafc;color:#94a3b8;border-color:#e2e8f0;cursor:default;">
          <i data-lucide="sparkles" style="width:11px;height:11px;"></i> Đã sẵn sàng
        </span>
      `);
    }

    const typeBadge = isPdf
      ? `<span style="display:inline-flex;align-items:center;gap:3px;color:#e11d48;font-weight:600;"><i data-lucide="file-text" style="width:12px;height:12px;"></i> Slide / PDF</span>`
      : isYouTube
        ? `<span style="display:inline-flex;align-items:center;gap:3px;color:#dc2626;font-weight:600;"><i data-lucide="video" style="width:12px;height:12px;"></i> YouTube · ${dur}</span>`
        : `<span style="display:inline-flex;align-items:center;gap:3px;"><i data-lucide="clock" style="width:12px;height:12px;"></i> ${dur}</span>`;

    return `
<div class="lecture-card" data-lid="${escHtml(lec.id)}">
  <!-- Card Header -->
  <div class="lec-card-header">
    <div class="lec-card-icon" style="background:${palette.bgGradient};color:${palette.color};">
      <i data-lucide="${palette.icon}" style="width:22px;height:22px;"></i>
    </div>
    <div class="lec-card-header-meta">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <span class="lec-card-tag" style="color:${palette.color};background:${palette.tagBg};border-color:${palette.tagBorder};">
          ${escHtml(tag)}
        </span>
        <span class="lec-card-date"><i data-lucide="calendar" style="width:11px;height:11px;"></i> ${date}</span>
      </div>
      <div class="lec-card-time">
        ${typeBadge}
      </div>
    </div>
  </div>

  <!-- Card Body -->
  <div class="lec-card-body">
    <h3 class="lec-card-title" title="${escHtml(lec.title || '')}">
      ${escHtml(lec.title || 'Bài giảng')}
    </h3>

    <!-- Feature pills -->
    <div class="lec-card-pills">
      ${pills.join('')}
    </div>
  </div>

  <!-- Card Footer: Always pinned to bottom -->
  <div class="lec-card-footer">
    <button class="lec-btn-study lib-open" data-lid="${escHtml(lec.id)}">
      <i data-lucide="book-open" style="width:14px;height:14px;"></i> Vào học bài
    </button>
    <button class="lec-btn-del lib-del" data-lid="${escHtml(lec.id)}" data-title="${escHtml(lec.title || '')}" title="Xoá bài giảng">
      <i data-lucide="trash-2" style="width:15px;height:15px;"></i>
    </button>
  </div>
</div>`;
  }).join('');

  // Bind events on cards
  grid.querySelectorAll('.lib-open').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openLecture(btn.dataset.lid);
    });
  });

  grid.querySelectorAll('.lib-badge-jump').forEach(pill => {
    pill.addEventListener('click', e => {
      e.stopPropagation();
      openLecture(pill.dataset.lid, pill.dataset.tab);
    });
  });

  grid.querySelectorAll('.lib-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      deleteLecture(btn.dataset.lid, btn.dataset.title);
    });
  });

  grid.querySelectorAll('.lecture-card').forEach(card => {
    card.addEventListener('click', () => openLecture(card.dataset.lid));
  });

  refreshIcons();
}

function renderFtsSearchResults(lectures, query) {
  const grid = el('libGrid');
  if (!grid) return;

  if (!lectures.length) {
    grid.innerHTML = `
<div style="grid-column:1/-1;">
  <div class="empty-state" style="padding:48px 24px;text-align:center;">
    <div class="empty-icon"><i data-lucide="search-x" style="width:48px;height:48px;color:var(--text-subtle);"></i></div>
    <div class="empty-title">Không tìm thấy kết quả cho "${escHtml(query)}"</div>
    <div class="empty-sub" style="margin-top:6px;">Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để xem toàn bộ thư viện.</div>
  </div>
</div>`;
    refreshIcons();
    return;
  }

  grid.innerHTML = `
<div style="grid-column:1/-1;display:flex;flex-direction:column;gap:10px;">
  <div style="font-size:12.5px;font-weight:700;color:var(--text-muted);letter-spacing:0.03em;text-transform:uppercase;margin-bottom:2px;">
    Kết quả tìm kiếm toàn văn (FTS5) — ${lectures.length} bài giảng
  </div>
  ${lectures.map(r => `
  <div class="search-result-card" data-lid="${escHtml(r.id)}" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:16px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:all 0.18s;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
    <div style="width:40px;height:40px;border-radius:10px;background:#eef2ff;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <i data-lucide="file-text" style="width:18px;height:18px;color:#4f46e5;"></i>
    </div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:14.5px;font-weight:700;color:#0f172a;margin-bottom:4px;">${escHtml(r.title)}</div>
      ${r.snippet ? `<div class="search-result-snippet" style="font-size:12.5px;color:#475569;line-height:1.4;">${r.snippet}</div>` : ''}
      <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;font-size:11.5px;">
        <span class="badge" style="background:#f1f5f9;color:#475569;">${r.folder_tag || 'General'}</span>
        ${r.has_summary ? '<span class="badge" style="background:#ecfdf5;color:#059669;">✓ Tóm tắt</span>' : ''}
        ${r.has_quiz ? '<span class="badge" style="background:#eef2ff;color:#4338ca;">✓ Quiz</span>' : ''}
        ${r.flashcard_count > 0 ? `<span class="badge" style="background:#fffbeb;color:#b45309;">✓ ${r.flashcard_count} thẻ</span>` : ''}
      </div>
    </div>
    <i data-lucide="chevron-right" style="width:16px;height:16px;color:#94a3b8;flex-shrink:0;"></i>
  </div>
  `).join('')}
</div>`;

  grid.querySelectorAll('.search-result-card').forEach(card => {
    card.addEventListener('click', () => openLecture(card.dataset.lid));
  });

  refreshIcons();
}

function renderEmptyLibraryState() {
  const grid = el('libGrid');
  if (!grid) return;

  grid.innerHTML = `
<div style="grid-column:1/-1;">
  <div class="empty-state" style="padding:48px 24px;text-align:center;">
    <div class="empty-icon" style="margin-bottom:12px;"><i data-lucide="book-open" style="width:48px;height:48px;color:#c7d2fe;"></i></div>
    <div class="empty-title" style="font-size:16px;font-weight:700;color:#0f172a;">Chưa có bài giảng nào trong thư viện</div>
    <div class="empty-sub" style="color:#64748b;font-size:13px;margin:6px 0 18px 0;">Vào Studio để xử lý âm thanh bài giảng, nhập Slide PDF hoặc nạp dữ liệu mẫu ban đầu.</div>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
      <button class="btn btn-primary" id="btnLibNewLec" style="display:inline-flex;align-items:center;gap:6px;">
        <i data-lucide="mic" style="width:14px;height:14px;"></i> Mở Studio Bài giảng
      </button>
      <button class="btn btn-secondary" id="btnLibSeedDemo" style="display:inline-flex;align-items:center;gap:6px;">
        <i data-lucide="sparkles" style="width:14px;height:14px;"></i> Nạp bài giảng mẫu
      </button>
    </div>
  </div>
</div>`;

  el('btnLibNewLec')?.addEventListener('click', () => switchView('lecture'));
  el('btnLibSeedDemo')?.addEventListener('click', async () => {
    showToast('Đang nạp bài giảng mẫu…', 'info');
    const res = await API.seed_demo_data(true);
    if (res.success) {
      showToast(res.message, 'success', 3500);
      loadLibrary({ silent: false });
      refreshTopBar();
    }
  });

  refreshIcons();
}

function openLecture(lectureId, initialTab = 'transcript') {
  State.lectureId = lectureId;
  switchView('lecture');
  if (typeof loadLecture === 'function') {
    loadLecture(lectureId, initialTab);
  }
}

async function deleteLecture(lectureId, title) {
  const idx = await showModal(
    'Xoá bài giảng',
    `<p style="color:var(--text-muted);font-size:13.5px;line-height:1.5;">Bạn chắc chắn muốn xoá bài giảng <strong style="color:var(--text);">${escHtml(title)}</strong>?<br>
     <span style="color:var(--danger);font-size:12px;margin-top:8px;display:flex;align-items:center;gap:5px;">
       <i data-lucide="alert-triangle" style="width:14px;height:14px;flex-shrink:0;"></i>
       Thao tác này không thể hoàn tác — toàn bộ transcript, quiz, thẻ nhớ và ghi chú sẽ bị xoá khỏi cơ sở dữ liệu.
     </span></p>`,
    [{ label: 'Huỷ', class: 'btn-ghost' }, { label: 'Xoá vĩnh viễn', class: 'btn-danger' }]
  );
  if (idx !== 1) return;

  try {
    // Optimistic UI: Smoothly shrink & fade out card immediately
    const card = el('libGrid')?.querySelector(`.lecture-card[data-lid="${lectureId}"]`);
    if (card) {
      card.style.transition = 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)';
      card.style.transform = 'scale(0.92) translateY(8px)';
      card.style.opacity = '0';
      setTimeout(() => {
        card.remove();
        // Update count badge immediately
        const remaining = el('libGrid')?.querySelectorAll('.lecture-card').length || 0;
        const countBadge = el('libCountBadge');
        if (countBadge) countBadge.textContent = `${remaining} bài`;
      }, 220);
    }

    await API.delete_lecture(lectureId);
    showToast('Đã xoá bài giảng thành công', 'success');

    // Silent background sync
    loadLibrary({ silent: true });
    refreshTopBar();
    if (typeof loadDashboardData === 'function') {
      loadDashboardData({ silent: true });
    }
  } catch (e) {
    showToast('Lỗi xoá bài giảng: ' + e.message, 'error');
    loadLibrary({ silent: false });
  }
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

registerView('library', {
  render: renderLibraryView,
  onShow: () => {
    if (!el('libGrid')) {
      renderLibraryView();
    } else {
      // Silent refresh: checks latest DB in background without white screen or spinner!
      loadLibrary({ silent: true });
    }
  },
});
