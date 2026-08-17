/* ════════════════════════════════════════════
   Library View — Open-mind Pro
════════════════════════════════════════════ */
'use strict';

async function renderLibraryView() {
  el('view-library').innerHTML = `
<div style="display:flex;flex-direction:column;gap:16px;height:100%;">
  <div class="section-header">
    <h2 class="section-title" style="display:inline-flex;align-items:center;gap:8px;">
      <i data-lucide="book-open" style="width:20px;height:20px;color:var(--accent);"></i>
      <span>Thư viện Bài giảng</span>
    </h2>
    <div class="flex gap-2 items-center">
      <div style="position:relative;display:flex;align-items:center;">
        <i data-lucide="search" style="position:absolute;left:10px;width:15px;height:15px;color:var(--text-muted);"></i>
        <input class="input" id="libSearch" placeholder="Tìm kiếm bài giảng…" style="width:220px;padding-left:32px;">
      </div>
      <select class="select" id="libFolder">
        <option value="">Tất cả danh mục</option>
        <option value="General">General</option>
        <option value="CNTT">CNTT</option>
        <option value="Toán">Toán</option>
        <option value="Vật lý">Vật lý</option>
        <option value="Ngoại ngữ">Ngoại ngữ</option>
      </select>
    </div>
  </div>
  <div class="library-grid" id="libGrid" style="overflow-y:auto;flex:1;align-content:start;"></div>
</div>`;

  el('libSearch').addEventListener('input', debounce(() => loadLibrary(), 300));
  el('libFolder').addEventListener('change', () => loadLibrary());
  loadLibrary();
}

async function loadLibrary() {
  if (!el('libGrid')) return;
  const search = el('libSearch')?.value || '';
  const folder = el('libFolder')?.value || '';

  el('libGrid').innerHTML = `<div style="color:var(--text-muted);font-size:13px;display:flex;align-items:center;gap:8px;"><i data-lucide="loader-2" class="spin" style="width:16px;height:16px;"></i> Đang tải danh sách bài giảng…</div>`;
  refreshIcons();

  try {
    const lectures = await API.list_lectures(folder, search);
    if (!lectures.length) {
      el('libGrid').innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-muted);">
          <i data-lucide="folder-open" style="width:48px;height:48px;opacity:0.35;margin-bottom:12px;"></i>
          <div style="font-size:15px;font-weight:700;color:var(--text);">Chưa có bài giảng nào</div>
          <p style="font-size:13px;margin-top:4px;">Vào Studio để xử lý âm thanh bài giảng hoặc nạp dữ liệu mẫu</p>
          <button class="btn btn-primary btn-sm mt-3" id="btnLibSeedDemo" style="display:inline-flex;align-items:center;gap:6px;">
            <i data-lucide="sparkles" style="width:14px;height:14px;"></i> Nạp bài giảng mẫu (Demo)
          </button>
        </div>`;
      el('btnLibSeedDemo')?.addEventListener('click', async () => {
        showToast('Đang nạp bài giảng demo…', 'info');
        const res = await API.seed_demo_data(true);
        if (res.success) {
          showToast(res.message, 'success', 3500);
          loadLibrary();
          refreshTopBar();
        }
      });
      refreshIcons();
      return;
    }

    el('libGrid').innerHTML = lectures.map(lec => {
      const dur = fmtDuration(lec.duration_sec || 0);
      const date = fmtDate(lec.created_at);
      const tag  = lec.folder_tag || 'General';
      return `
<div class="lecture-card" data-lid="${escHtml(lec.id)}">
  <div class="lec-tag"><span class="badge badge-accent">${escHtml(tag)}</span></div>
  <div class="lec-title">${escHtml(lec.title || 'Bài giảng')}</div>
  <div class="lec-meta" style="display:flex;align-items:center;gap:12px;">
    <span style="display:inline-flex;align-items:center;gap:4px;"><i data-lucide="clock" style="width:13px;height:13px;"></i> ${dur}</span>
    <span style="display:inline-flex;align-items:center;gap:4px;"><i data-lucide="calendar" style="width:13px;height:13px;"></i> ${date}</span>
  </div>
  <div class="lec-actions">
    <button class="btn btn-ghost btn-sm lib-open" data-lid="${escHtml(lec.id)}" style="display:inline-flex;align-items:center;gap:4px;">
      <i data-lucide="play" style="width:13px;height:13px;"></i> Mở học
    </button>
    <button class="btn btn-danger btn-sm lib-del" data-lid="${escHtml(lec.id)}" data-title="${escHtml(lec.title || '')}" style="display:inline-flex;align-items:center;padding:6px 10px;">
      <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
    </button>
  </div>
</div>`;
    }).join('');

    el('libGrid').querySelectorAll('.lib-open').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); openLecture(btn.dataset.lid); });
    });
    el('libGrid').querySelectorAll('.lib-del').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); deleteLecture(btn.dataset.lid, btn.dataset.title); });
    });
    el('libGrid').querySelectorAll('.lecture-card').forEach(card => {
      card.addEventListener('click', () => openLecture(card.dataset.lid));
    });
    refreshIcons();
  } catch (e) {
    el('libGrid').innerHTML = `<div style="color:var(--danger)">Lỗi tải thư viện: ${escHtml(e.message)}</div>`;
  }
}

function openLecture(lectureId) {
  switchView('lecture');
  if (typeof loadLecture === 'function') {
    loadLecture(lectureId);
  }
}

async function deleteLecture(lectureId, title) {
  const idx = await showModal(
    'Xoá bài giảng',
    `<p>Bạn chắc muốn xoá bài giảng <strong>${escHtml(title)}</strong>?<br>
     <span style="color:var(--danger);font-size:12px">Thao tác này không thể hoàn tác.</span></p>`,
    [{ label: 'Huỷ', class: 'btn-ghost' }, { label: 'Xoá vĩnh viễn', class: 'btn-danger' }]
  );
  if (idx !== 1) return;
  try {
    await API.delete_lecture(lectureId);
    showToast('✅ Đã xoá bài giảng', 'success');
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
