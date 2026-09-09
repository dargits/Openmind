/**
 * SPDX-FileCopyrightText: 2026 Open-mind Contributors
 * SPDX-License-Identifier: MIT
 *
 * Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
 * Distributed under the terms of the OSI-approved MIT License.
 */

/* ════════════════════════════════════════════
   Lecture Studio View — Open-mind
   Workflow Stepper · Drag-drop · Tab redesign
════════════════════════════════════════════ */
'use strict';

const LEC = {
  lectureId: null,
  audioPath: null,
  audioUrl: null,
  title: null,
  isTranscribing: false,
  segments: [],
  fullText: '',
  quizData: null,
  quizAnswers: {},
  activeTab: 'transcript',
};

// ──────────────────────────────────────────
// Centralized Task Timer Manager
// ──────────────────────────────────────────
const TaskTimer = {
  interval: null,
  seconds: 0,
  activeElementIds: [],
  start(elementIds = []) {
    this.stop();
    this.seconds = 0;
    this.activeElementIds = Array.isArray(elementIds) ? elementIds : [elementIds];
    this.updateView();
    this.interval = setInterval(() => {
      this.seconds++;
      this.updateView();
    }, 1000);
  },
  updateView() {
    const mm = String(Math.floor(this.seconds / 60)).padStart(2, '0');
    const ss = String(this.seconds % 60).padStart(2, '0');
    const timeStr = `${mm}:${ss}`;

    const gTimer = el('lecStatusTimer');
    if (gTimer) {
      gTimer.textContent = `⏱️ ${timeStr}`;
      gTimer.style.display = 'inline-flex';
    }

    this.activeElementIds.forEach(id => {
      const elem = el(id);
      if (elem) {
        elem.textContent = `Thời gian đã chạy: ${timeStr}`;
      }
    });
  },
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    const gTimer = el('lecStatusTimer');
    if (gTimer) gTimer.style.display = 'none';
    const s = this.seconds;
    this.seconds = 0;
    return s;
  }
};

function renderLectureView() {
  el('view-lecture').innerHTML = `
<div class="lecture-layout">

  <!-- Upload Zone / Audio Player Row -->
  <div id="lecUploadRow" style="flex-shrink:0;">
    <!-- Before file is picked -->
    <div id="lecUploadZone" class="upload-zone" style="${LEC.audioPath ? 'display:none;' : ''}">
      <div class="upload-zone-icon">
        <i data-lucide="music" style="width:26px;height:26px;color:#4f46e5;"></i>
      </div>
      <div style="flex:1;text-align:left;">
        <div class="upload-zone-title">Kéo & thả file âm thanh vào đây</div>
        <div class="upload-zone-sub">MP3, WAV, M4A, AAC — hoặc nhấn để chọn file</div>
      </div>
      <button class="btn btn-primary" id="lecPickAudio"
        style="flex-shrink:0;display:inline-flex;align-items:center;gap:7px;">
        <i data-lucide="folder-open" style="width:16px;height:16px;"></i> Chọn file
      </button>
    </div>

    <!-- After file is picked -->
    <div id="lecAudioRow" style="${!LEC.audioPath ? 'display:none;' : ''}display:flex;gap:10px;align-items:center;width:100%;min-width:0;">
      <div class="upload-zone-file" style="flex:1;min-width:0;overflow:hidden;display:flex;align-items:center;gap:12px;">
        <div style="width:36px;height:36px;border-radius:9px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <i data-lucide="music" style="width:18px;height:18px;color:#4f46e5;"></i>
        </div>
        <div style="flex:1;min-width:0;overflow:hidden;display:flex;flex-direction:column;justify-content:center;">
          <div style="display:flex;align-items:center;gap:6px;min-width:0;">
            <div class="audio-filename" id="lecFileName" title="Nhấp để đổi tên bài giảng" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;">Chưa chọn file</div>
            <button class="btn btn-ghost btn-sm" id="lecRenameBtn" title="Đổi tên bài giảng / file" style="padding:2px 6px;height:24px;flex-shrink:0;display:inline-flex;align-items:center;">
              <i data-lucide="pencil" style="width:12px;height:12px;color:var(--text-muted);"></i>
            </button>
          </div>
          <div style="font-size:11px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">File âm thanh sẵn sàng</div>
        </div>
        <audio controls id="lecAudio" style="width:250px;height:32px;flex-shrink:0;"></audio>
      </div>
      <button class="btn btn-ghost btn-sm" id="lecChangeFile"
        style="flex-shrink:0;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;">
        <i data-lucide="refresh-cw" style="width:13px;height:13px;"></i> Đổi file
      </button>
      <select class="select" id="lecFolder" style="width:130px;font-size:13px;flex-shrink:0;">
        <option value="General">General</option>
        <option value="CNTT">CNTT</option>
        <option value="Toán">Toán</option>
        <option value="Vật lý">Vật lý</option>
        <option value="Ngoại ngữ">Ngoại ngữ</option>
      </select>
    </div>
  </div>

  <!-- Workflow Stepper -->
  <div style="flex-shrink:0;display:grid;grid-template-columns:repeat(5,1fr);gap:8px;" id="lecStepRow">
    <button class="step-action-btn ${LEC.lectureId ? '' : 'active-step'}" id="btnTranscribe" ${LEC.isTranscribing ? 'disabled' : ''}>
      <i data-lucide="mic" style="width:15px;height:15px;"></i>
      <span>① Phiên âm</span>
    </button>
    <button class="step-action-btn" id="btnSummary" ${!LEC.lectureId ? 'disabled' : ''}>
      <i data-lucide="sparkles" style="width:15px;height:15px;"></i>
      <span>② Tóm tắt AI</span>
    </button>
    <button class="step-action-btn" id="btnQuiz" ${!LEC.lectureId ? 'disabled' : ''}>
      <i data-lucide="check-square" style="width:15px;height:15px;"></i>
      <span>③ Tạo Quiz</span>
    </button>
    <button class="step-action-btn" id="btnCards" ${!LEC.lectureId ? 'disabled' : ''}>
      <i data-lucide="layers" style="width:15px;height:15px;"></i>
      <span>④ Tạo Thẻ nhớ</span>
    </button>
    <button class="step-action-btn" id="btnExport" ${!LEC.lectureId ? 'disabled' : ''}>
      <i data-lucide="download" style="width:15px;height:15px;"></i>
      <span>⑤ Xuất dữ liệu</span>
    </button>
  </div>

  <!-- Status / Progress Bar -->
  <div class="status-bar" id="lecStatusBar" style="display:none;align-items:center;gap:10px;padding:8px 14px;border-radius:var(--radius-md);background:#f8fafc;border:1px solid #e2e8f0;">
    <i data-lucide="loader-2" class="spin" style="width:18px;height:18px;color:#4f46e5;flex-shrink:0;"></i>
    <span class="status-text" id="lecStatusText" style="font-weight:600;font-size:13px;color:#1e293b;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Đang xử lý bài giảng…</span>
    <span class="badge badge-accent status-timer-badge" id="lecStatusTimer" style="display:none;font-family:monospace;font-weight:700;font-size:12px;padding:3px 10px;border-radius:12px;background:rgba(99,102,241,0.1);color:#4f46e5;border:1px solid rgba(99,102,241,0.2);">⏱️ 00:00</span>
    <div class="progress-inline" style="flex-shrink:0;width:120px;">
      <div class="progress-wrap" style="height:6px;">
        <div class="progress-bar progress-accent" id="lecProgressBar" style="width:0%"></div>
      </div>
    </div>
  </div>

  <!-- Content Tabs -->
  <div class="tabs">
    <div class="tab-nav">
      <button class="tab-btn active" data-tab="transcript">
        <i data-lucide="file-text" style="width:14px;height:14px;"></i> Bản ghi văn bản
      </button>
      <button class="tab-btn" data-tab="summary">
        <i data-lucide="sparkles" style="width:14px;height:14px;"></i> Tóm tắt & Sơ đồ
      </button>
      <button class="tab-btn" data-tab="quiz">
        <i data-lucide="check-circle-2" style="width:14px;height:14px;"></i> Bài kiểm tra
      </button>
      <button class="tab-btn" data-tab="flashcards">
        <i data-lucide="layers" style="width:14px;height:14px;"></i> Thẻ ghi nhớ
      </button>
      <button class="tab-btn" data-tab="chat">
        <i data-lucide="message-square" style="width:14px;height:14px;"></i> Hỏi-đáp AI
      </button>
    </div>

    <div class="tab-panels">
      <!-- 1. Transcript Panel -->
      <div class="tab-panel" id="tab-transcript">
        <div id="transcriptBox" style="height:100%;overflow-y:auto;display:flex;flex-direction:column;gap:3px;padding:2px;">
          <div class="empty-state" style="height:100%;">
            <div class="empty-icon"><i data-lucide="mic-off" style="width:48px;height:48px;color:var(--text-subtle);"></i></div>
            <div class="empty-title">Chưa có bản ghi âm</div>
            <div class="empty-sub">Chọn file âm thanh và nhấn "① Phiên âm" để bắt đầu</div>
          </div>
        </div>
      </div>

      <!-- 2. Summary & Mindmap Panel -->
      <div class="tab-panel hidden" id="tab-summary">
        <div id="summaryBox" style="overflow-y:auto;height:100%;padding:4px 2px;">
          <div class="empty-state" style="height:100%;">
            <div class="empty-icon"><i data-lucide="sparkles" style="width:48px;height:48px;color:var(--text-subtle);"></i></div>
            <div class="empty-title">Chưa có bản tóm tắt bài giảng</div>
            <div class="empty-sub">Nhấn "② Tóm tắt AI" để tự động rút trích ý chính và vẽ sơ đồ tư duy</div>
            <button class="btn btn-primary mt-3" onclick="triggerSummaryGeneration()" style="display:inline-flex;align-items:center;gap:6px;">
              <i data-lucide="sparkles" style="width:14px;height:14px;"></i> Tóm tắt ngay
            </button>
          </div>
        </div>
      </div>

      <!-- 3. Quiz Panel -->
      <div class="tab-panel hidden" id="tab-quiz">
        <div id="quizBox" style="overflow-y:auto;height:100%;padding:2px 2px;">
          <div class="empty-state" style="height:100%;">
            <div class="empty-icon"><i data-lucide="help-circle" style="width:48px;height:48px;color:var(--text-subtle);"></i></div>
            <div class="empty-title">Chưa có bài kiểm tra</div>
            <div class="empty-sub">Nhấn "③ Tạo Quiz" để AI tự động biên soạn câu hỏi trắc nghiệm</div>
          </div>
        </div>
      </div>

      <!-- 4. Flashcards Panel -->
      <div class="tab-panel hidden" id="tab-flashcards">
        <div id="flashcardsBox" style="overflow-y:auto;height:100%;padding:4px 2px;">
          <div class="empty-state" style="height:100%;">
            <div class="empty-icon"><i data-lucide="layers" style="width:48px;height:48px;color:var(--text-subtle);"></i></div>
            <div class="empty-title">Chưa có thẻ ghi nhớ</div>
            <div class="empty-sub">Nhấn "④ Tạo Thẻ nhớ" để AI trích xuất các định nghĩa quan trọng từ bài giảng</div>
            <button class="btn btn-primary mt-3" onclick="showCardsModal()" style="display:inline-flex;align-items:center;gap:6px;">
              <i data-lucide="layers" style="width:14px;height:14px;"></i> Trích xuất thẻ ngay
            </button>
          </div>
        </div>
      </div>

      <!-- 5. Chat Q&A Panel -->
      <div class="tab-panel hidden" id="tab-chat">
        <div style="display:flex;flex-direction:column;height:100%;gap:12px;">
          <div class="chat-history" id="chatHistory">
            <div class="chat-msg chat-ai" style="max-width:92%;display:flex;gap:10px;">
              <div style="width:28px;height:28px;border-radius:8px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <i data-lucide="bot" style="width:15px;height:15px;color:#4f46e5;"></i>
              </div>
              <div>Xin chào! Tôi là trợ lý AI học tập cục bộ. Hãy đặt câu hỏi về nội dung bài giảng, tôi sẽ tìm kiếm ngữ cảnh và trả lời kèm <strong>mốc thời gian</strong> để bạn đối chiếu với âm thanh gốc.</div>
            </div>
          </div>
          <div class="chat-input-row" style="flex-shrink:0;">
            <input class="input flex-1 chat-input" id="chatInput"
              placeholder="Nhập câu hỏi về bài giảng…"
              style="border-radius:var(--radius-lg);">
            <button class="btn btn-primary" id="chatSend"
              style="display:inline-flex;align-items:center;gap:6px;padding:10px 20px;">
              <i data-lucide="send" style="width:15px;height:15px;"></i> Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

</div>`;

  // ── Bind events ──
  el('lecPickAudio').addEventListener('click', pickAudio);
  el('lecRenameBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    renameLectureDialog();
  });
  el('lecFileName')?.addEventListener('click', renameLectureDialog);
  el('lecChangeFile')?.addEventListener('click', () => {
    el('lecAudioRow').style.display = 'none';
    el('lecUploadZone').style.removeProperty('display');
    LEC.audioPath = null;
    LEC.audioUrl = null;
    LEC.title = null;
    if (el('lecAudio')) el('lecAudio').src = '';
  });

  // Drag & drop on upload zone
  const zone = el('lecUploadZone');
  if (zone) {
    zone.addEventListener('click', e => {
      if (!e.target.closest('#lecPickAudio')) pickAudio();
    });
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', async e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      showToast('Kéo thả không được hỗ trợ — vui lòng dùng nút "Chọn file"', 'info');
    });
  }

  el('btnTranscribe').addEventListener('click', startTranscribe);
  el('btnSummary')?.addEventListener('click', triggerSummaryGeneration);
  el('btnQuiz').addEventListener('click', showQuizModal);
  el('btnCards').addEventListener('click', showCardsModal);
  el('btnExport').addEventListener('click', showExportMenu);

  el('chatSend').addEventListener('click', sendChat);
  el('chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });

  // Tab navigation
  qsa('.tab-btn', el('view-lecture')).forEach(btn => {
    btn.addEventListener('click', () => {
      switchTabTo(btn.dataset.tab);
    });
  });

  if (LEC.lectureId) loadLecture(LEC.lectureId);

  refreshIcons();
}

async function loadLecture(lectureId, initialTab = 'transcript') {
  if (!el('btnTranscribe')) renderLectureView();
  LEC.lectureId = lectureId;
  try {
    const lec = await API.get_lecture(lectureId);
    if (!lec || !lec.id) return;

    LEC.audioPath = lec.audio_path || null;
    LEC.segments = lec.transcript || [];
    LEC.fullText = lec.full_text || '';
    LEC.quizData = null;
    LEC.quizAnswers = {};

    if (el('lecFolder') && lec.folder_tag) el('lecFolder').value = lec.folder_tag;

    // Audio setup
    const name = lec.title || (LEC.audioPath ? LEC.audioPath.split(/[\\\/]/).pop() : '') || 'Bài giảng';
    LEC.title = name;
    if (el('lecFileName')) {
      el('lecFileName').textContent = name;
      el('lecFileName').title = name;
    }
    if (LEC.audioPath) {
      try {
        LEC.audioUrl = await API.get_audio_url(LEC.audioPath);
        if (el('lecAudio')) el('lecAudio').src = LEC.audioUrl;
        if (el('lecAudioRow')) { el('lecAudioRow').style.display = 'flex'; }
        if (el('lecUploadZone')) el('lecUploadZone').style.display = 'none';
      } catch (_) { }
    }

    // Transcript
    if (LEC.segments?.length) {
      renderTranscript(LEC.segments);
    } else if (LEC.fullText?.trim()) {
      renderTranscript([{ start: 0, text: LEC.fullText }]);
    } else {
      if (el('transcriptBox')) {
        el('transcriptBox').innerHTML = `
<div class="empty-state" style="height:100%;">
  <div class="empty-icon"><i data-lucide="file-text" style="width:48px;height:48px;color:var(--text-subtle);"></i></div>
  <div class="empty-title">${escHtml(lec.title || 'Bài giảng')}</div>
  <div class="empty-sub">Chưa có bản ghi phiên âm. Nhấn "① Phiên âm bài giảng" để bắt đầu.</div>
</div>`;
      }
    }

    // Reset chat
    if (el('chatHistory')) {
      el('chatHistory').innerHTML = `
<div class="chat-msg chat-ai" style="max-width:92%;display:flex;gap:10px;">
  <div style="width:28px;height:28px;border-radius:8px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
    <i data-lucide="bot" style="width:15px;height:15px;color:#4f46e5;"></i>
  </div>
  <div>Đã tải bài giảng <strong>${escHtml(lec.title || '')}</strong>. Bạn có thể đặt câu hỏi về nội dung bài giảng này!</div>
</div>`;
    }

    // Tóm tắt & Mindmap: Tự động nạp dữ liệu đã tạo
    renderSummary(lec.summary, lec.mindmap);

    // Quiz: Tự động nạp bài quiz đã lưu nếu có
    if (Array.isArray(lec.quiz) && lec.quiz.length) {
      LEC.quizData = lec.quiz;
      LEC.quizAnswers = {};
      renderQuiz(lec.quiz);
    } else if (el('quizBox')) {
      LEC.quizData = null;
      LEC.quizAnswers = {};
      el('quizBox').innerHTML = `
<div class="empty-state" style="height:100%;">
  <div class="empty-icon"><i data-lucide="help-circle" style="width:48px;height:48px;color:var(--text-subtle);"></i></div>
  <div class="empty-title">Chưa có bài kiểm tra</div>
  <div class="empty-sub">Nhấn "③ Tạo Quiz" để AI tự động biên soạn câu hỏi từ bài giảng này</div>
</div>`;
    }

    // Flashcards: Tự động nạp thẻ ghi nhớ của bài giảng
    try {
      const cards = await API.get_lecture_flashcards(lectureId);
      renderLectureFlashcards(cards);
    } catch (_) {}

    switchTabTo(initialTab || 'transcript');
    updateStepButtons();
    refreshIcons();
  } catch (e) {
    console.error('loadLecture error:', e);
    showToast('Lỗi tải bài giảng: ' + e.message, 'error');
  }
}

// ──────────────────────────────────────────
// Audio Picker & Rename
// ──────────────────────────────────────────
async function renameLectureDialog() {
  const currentTitle = LEC.title || el('lecFileName')?.textContent || '';
  const idx = await showModal(
    'Đổi tên bài giảng / file âm thanh',
    `<div class="flex-col gap-2">
      <label class="label">Tên hiển thị bài giảng</label>
      <input class="input w-full" id="renameLecInput" value="${escHtml(currentTitle)}" placeholder="Nhập tên bài giảng…" autofocus>
    </div>`,
    [
      { label: 'Huỷ', class: 'btn-ghost' },
      { label: 'Lưu thay đổi', class: 'btn-primary' }
    ]
  );
  if (idx !== 1) return;
  const newTitle = el('renameLecInput')?.value?.trim();
  if (!newTitle) return showToast('Tên không được để trống', 'warning');

  LEC.title = newTitle;
  if (el('lecFileName')) {
    el('lecFileName').textContent = newTitle;
    el('lecFileName').title = newTitle;
  }

  if (LEC.lectureId) {
    try {
      await API.rename_lecture(LEC.lectureId, newTitle);
      showToast(`Đã đổi tên bài giảng thành "${newTitle}"`, 'success');
      if (typeof loadLibrary === 'function') loadLibrary();
    } catch (err) {
      showToast('Lỗi khi đổi tên: ' + err.message, 'error');
    }
  } else {
    showToast(`Đã cập nhật tên hiển thị thành "${newTitle}"`, 'success');
  }
}

async function pickAudio() {
  try {
    const path = await API.pick_audio_file();
    if (!path) return;
    LEC.audioPath = path;
    LEC.audioUrl = await API.get_audio_url(path);

    const name = path.split(/[\\\/]/).pop();
    LEC.title = name;
    if (el('lecFileName')) {
      el('lecFileName').textContent = name;
      el('lecFileName').title = name;
    }
    if (el('lecAudio')) el('lecAudio').src = LEC.audioUrl;
    if (el('lecAudioRow')) { el('lecAudioRow').style.display = 'flex'; }
    if (el('lecUploadZone')) el('lecUploadZone').style.display = 'none';

    // Highlight the transcribe button
    if (el('btnTranscribe')) el('btnTranscribe').classList.add('active-step');

    showToast(`Đã chọn: ${name}`, 'success');
    refreshIcons();
  } catch (e) {
    showToast('Lỗi chọn file: ' + e.message, 'error');
  }
}

// ──────────────────────────────────────────
// Transcription
// ──────────────────────────────────────────
async function startTranscribe() {
  if (!LEC.audioPath) return showToast('Vui lòng chọn file âm thanh trước', 'warning');
  if (LEC.isTranscribing) return;

  LEC.isTranscribing = true;
  LEC.segments = [];
  LEC.fullText = '';

  showStatus('Đang nạp mô hình và phân tích giọng nói…', 0.05);
  switchTabTo('transcript');
  TaskTimer.start(['transcribeElapsedTimer']);

  if (el('transcriptBox')) {
    el('transcriptBox').innerHTML = `
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:16px;color:var(--text-muted);padding:40px 20px;">
  <i data-lucide="loader-2" class="spin" style="width:38px;height:38px;color:#4f46e5;"></i>
  <div style="font-weight:700;color:var(--text);font-size:16px;">Đang lắng nghe và trích xuất từng câu nói…</div>
  <div style="font-size:13px;max-width:520px;text-align:center;line-height:1.5;">Mô hình Whisper STT đang nhận diện giọng nói tiếng Việt và đồng bộ mốc thời gian theo thời gian thực.</div>
  <div id="transcribeElapsedTimer" style="display:inline-block;padding:6px 16px;background:rgba(99,102,241,0.08);color:#4f46e5;font-weight:700;font-size:13px;border-radius:20px;border:1px solid rgba(99,102,241,0.2);">
    Thời gian đã chạy: 00:00
  </div>
</div>`;
    refreshIcons();
  }

  const folder = el('lecFolder')?.value || 'General';
  const fallbackTitle = (LEC.audioPath.split(/[\\\/]/).pop()).replace(/\.[^.]+$/, '');
  const title = LEC.title || fallbackTitle;

  await API.start_transcribe(LEC.audioPath, '', LEC.lectureId || '', title, folder);
}

EventBus.on('transcribe:start', () => {
  showStatus('Đang chuyển đổi giọng nói thời gian thực…', 0.1);
  if (el('transcriptBox')) el('transcriptBox').innerHTML = '';
});

EventBus.on('transcribe:segment', ({ segment, progress }) => {
  LEC.segments.push(segment);
  LEC.fullText += ' ' + segment.text;
  appendSegment(segment);
  updateProgress(progress);
});

EventBus.on('transcribe:done', data => {
  const elapsed = TaskTimer.stop();
  LEC.isTranscribing = false;
  LEC.lectureId = data.lecture_id;
  LEC.segments = data.segments || LEC.segments;
  LEC.fullText = data.full_text || LEC.fullText;
  hideStatus();
  updateStepButtons();
  showToast(`Phiên âm xong! Đã trích xuất ${LEC.segments.length} đoạn (${fmtDuration(elapsed)}).`, 'success', 3500);
  switchTabTo('transcript');
});

EventBus.on('transcribe:error', ({ message }) => {
  TaskTimer.stop();
  LEC.isTranscribing = false;
  hideStatus();
  showToast('Lỗi phiên âm: ' + message, 'error', 4000);
});

function appendSegment(seg) {
  if (!el('transcriptBox')) return;
  const ts = fmtDuration(seg.start);
  const div = document.createElement('div');
  div.className = 'seg-line';
  div.innerHTML = `
    <span class="seg-ts" title="Nhấn để nghe" data-time="${seg.start}">${ts}</span>
    <span class="seg-text">${escHtml(seg.text)}</span>`;
  div.querySelector('.seg-ts').addEventListener('click', () => {
    const audio = el('lecAudio');
    if (audio && seg.start !== undefined) { audio.currentTime = seg.start; audio.play(); }
  });
  el('transcriptBox').appendChild(div);
  el('transcriptBox').scrollTop = el('transcriptBox').scrollHeight;
}

function renderTranscript(segs) {
  if (!el('transcriptBox') || !segs?.length) return;
  el('transcriptBox').innerHTML = segs.map(s => `
<div class="seg-line">
  <span class="seg-ts" data-time="${s.start}" title="Click để nghe từ điểm này">${fmtDuration(s.start)}</span>
  <span class="seg-text">${escHtml(s.text)}</span>
</div>`).join('');

  el('transcriptBox').querySelectorAll('.seg-ts').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = parseFloat(btn.dataset.time) || 0;
      const audio = el('lecAudio');
      if (audio) { audio.currentTime = t; audio.play(); }
    });
  });
}

// ──────────────────────────────────────────
// Quiz Generation
// ──────────────────────────────────────────
async function showQuizModal() {
  if (!LEC.lectureId) return showToast('Hãy phiên âm bài giảng trước khi tạo kiểm tra', 'warning');

  const idx = await showModal(
    'Tùy chỉnh Bài kiểm tra Trắc nghiệm',
    `<div class="flex-col gap-4">
      <div>
        <label class="label">Số lượng câu hỏi</label>
        <select class="select w-full" id="quizNumSelect" style="font-size:13px;">
          <option value="3">3 câu — Thử nhanh</option>
          <option value="5" selected>5 câu — Tiêu chuẩn (khuyên dùng)</option>
          <option value="10">10 câu — Toàn diện (tổng hợp đầy đủ)</option>
          <option value="15">15 câu — Chuyên sâu</option>
          <option value="20">20 câu — Đầy đủ nhất</option>
        </select>
      </div>
      <div>
        <label class="label">Mức độ khó</label>
        <select class="select w-full" id="quizDiffSelect" style="font-size:13px;">
          <option value="dễ">Dễ — Nhận biết khái niệm & định nghĩa cơ bản</option>
          <option value="trung bình" selected>Trung bình — Thông hiểu & Vận dụng kiến thức</option>
          <option value="khó">Khó — Phân tích sâu, trường hợp ngoại lệ & bẫy tư duy</option>
        </select>
      </div>
    </div>`,
    [
      { label: 'Huỷ', class: 'btn-ghost' },
      { label: 'Tạo câu hỏi', class: 'btn-primary' }
    ]
  );
  if (idx !== 1) return;

  const numQuestions = parseInt(el('quizNumSelect')?.value) || 5;
  const difficulty = el('quizDiffSelect')?.value || 'trung bình';

  showStatus(`AI đang phân tích và sinh ${numQuestions} câu hỏi (${difficulty})…`, 0.25);
  LEC.quizData = null;
  LEC.quizAnswers = {};
  switchTabTo('quiz');
  TaskTimer.start(['quizElapsedTimer']);

  if (el('quizBox')) el('quizBox').innerHTML = `
<div class="empty-state" style="height:100%;padding:40px 20px;">
  <i data-lucide="loader-2" class="spin" style="width:40px;height:40px;color:#4f46e5;"></i>
  <div class="empty-title" style="margin-top:16px;font-size:16px;font-weight:700;">Đang biên soạn ${numQuestions} câu hỏi trắc nghiệm…</div>
  <div class="empty-sub" style="margin-top:6px;max-width:540px;margin-left:auto;margin-right:auto;color:#64748b;line-height:1.5;">
    Mô hình AI đang phân tích toàn bộ nội dung bài giảng 100% offline trên CPU. Quá trình này thường mất khoảng 20 - 50 giây tùy số lượng câu.
  </div>
  <div id="quizElapsedTimer" style="margin-top:16px;display:inline-block;padding:6px 16px;background:rgba(99,102,241,0.08);color:#4f46e5;font-weight:700;font-size:13px;border-radius:20px;border:1px solid rgba(99,102,241,0.2);">
    Thời gian đã chạy: 00:00
  </div>
</div>`;
  refreshIcons();

  await API.generate_quiz(LEC.lectureId, numQuestions, difficulty);
}

// Global alias for modal trigger buttons
window.openQuizModal = showQuizModal;

EventBus.on('quiz:done', ({ quiz }) => {
  const elapsed = TaskTimer.stop();
  hideStatus();
  const questions = Array.isArray(quiz) ? quiz : (quiz.questions || []);
  LEC.quizData = questions;
  renderQuiz(questions);
  switchTabTo('quiz');
  showToast(`Đã tạo xong ${questions.length} câu hỏi trắc nghiệm (${fmtDuration(elapsed)})!`, 'success');
});

EventBus.on('quiz:error', ({ message }) => {
  TaskTimer.stop();
  hideStatus();
  showToast('Lỗi sinh quiz: ' + message, 'error', 5000);
  if (el('quizBox')) {
    el('quizBox').innerHTML = `
<div class="empty-state" style="height:100%;padding:40px 20px;">
  <i data-lucide="alert-triangle" style="width:42px;height:42px;color:#ef4444;"></i>
  <div class="empty-title" style="margin-top:14px;color:#b91c1c;font-weight:700;">Không thể tạo câu hỏi trắc nghiệm</div>
  <div class="empty-sub" style="max-width:520px;margin:8px auto 20px;color:#64748b;line-height:1.5;">${escapeHtml(message)}</div>
  <button class="btn btn-primary" onclick="openQuizModal()" style="display:inline-flex;align-items:center;gap:8px;">
    <i data-lucide="rotate-ccw" style="width:16px;height:16px;"></i> Thử lại
  </button>
</div>`;
    refreshIcons();
  }
});

function renderQuiz(questions) {
  if (!el('quizBox')) return;
  if (!questions?.length) {
    el('quizBox').innerHTML = `<div style="text-align:center;padding:36px;color:var(--danger);">Không có câu hỏi nào được tạo. Vui lòng thử lại.</div>`;
    return;
  }

  el('quizBox').innerHTML = `
<div style="display:flex;flex-direction:column;gap:16px;padding:4px;max-width:820px;margin:0 auto;">
  <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.20);padding:14px 20px;border-radius:var(--radius-lg);">
    <span style="font-weight:800;font-size:14px;color:#4338ca;display:flex;align-items:center;gap:8px;">
      <i data-lucide="file-text" style="width:16px;height:16px;"></i> BÀI KIỂM TRA TRẮC NGHIỆM
    </span>
    <div style="display:flex;align-items:center;gap:8px;">
      <span class="badge badge-accent">${questions.length} câu hỏi</span>
      <button class="btn btn-ghost btn-sm" onclick="openQuizModal()" title="Tạo bộ câu hỏi mới từ AI" style="font-size:12px;display:inline-flex;align-items:center;gap:4px;padding:4px 10px;">
        <i data-lucide="sparkles" style="width:13px;height:13px;color:#6366f1;"></i> Tạo mới
      </button>
    </div>
  </div>

  ${questions.map((q, i) => {
    const opts = q.options || q.choices || [];
    return `
<div class="quiz-card" id="qcard-${i}">
  <div class="quiz-num text-accent">CÂU ${i + 1} / ${questions.length}</div>
  <div class="quiz-question">${escHtml(q.question)}</div>
  <div class="quiz-options">
    ${opts.map((o, oi) =>
      `<button class="quiz-opt" data-q="${i}" data-o="${oi}">${escHtml(typeof o === 'string' ? o : o.text || o)}</button>`
    ).join('')}
  </div>
  <div class="quiz-explanation" id="qexp-${i}">
    <i data-lucide="lightbulb" style="width:14px;height:14px;color:var(--warning);display:inline-block;vertical-align:middle;margin-right:4px;"></i><strong>Giải thích:</strong> ${escHtml(q.explanation || q.reason || '')}
  </div>
</div>`;
  }).join('')}

  <button class="btn btn-primary btn-full" id="btnSubmitQuiz" style="padding:14px;font-size:15px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px;">
    <i data-lucide="check-circle-2" style="width:18px;height:18px;"></i>
    <span>Nộp bài & Chấm điểm</span>
  </button>
</div>`;

  el('quizBox').querySelectorAll('.quiz-opt').forEach(btn => {
    btn.addEventListener('click', function () {
      const qi = parseInt(this.dataset.q);
      el('quizBox').querySelectorAll(`.quiz-opt[data-q="${qi}"]`).forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      LEC.quizAnswers[qi] = parseInt(this.dataset.o);
    });
  });

  el('btnSubmitQuiz').addEventListener('click', submitQuiz);
  refreshIcons();
}

async function submitQuiz() {
  const questions = LEC.quizData || [];
  if (!questions.length) return;

  let score = 0;
  const details = [];

  questions.forEach((q, i) => {
    const opts = q.options || q.choices || [];
    const userIdx = LEC.quizAnswers[i];
    const correctIdx = typeof q.correct_index === 'number' ? q.correct_index
      : opts.findIndex(o => o.correct || o.is_correct);
    const isCorrect = userIdx === correctIdx;
    if (isCorrect) score++;
    details.push({ question: q.question, userIdx, correctIdx, isCorrect });

    const card = el(`qcard-${i}`);
    if (!card) return;
    card.querySelectorAll('.quiz-opt').forEach((b, oi) => {
      if (oi === correctIdx) b.classList.add('correct');
      else if (oi === userIdx && !isCorrect) b.classList.add('wrong');
    });
    const exp = el(`qexp-${i}`);
    if (exp) exp.classList.add('show');
  });

  el('btnSubmitQuiz')?.remove();
  const pct = Math.round(score / questions.length * 100);
  const cls = pct >= 80 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-danger';
  const msg = pct >= 80 ? 'Xuất sắc! Bạn đã nắm rất vững bài học.' : pct >= 50 ? 'Khá tốt! Hãy xem lại các câu trả lời chưa đúng.' : 'Cần xem lại bài giảng và ôn tập thêm nhé.';

  const resultEl = document.createElement('div');
  resultEl.innerHTML = `
<div class="card" style="text-align:center;padding:28px;border:1px solid var(--accent-border);background:var(--accent-dim);margin-bottom:16px;animation:scaleIn .3s ease;">
  <div style="font-size:48px;font-weight:900;color:var(--text);font-family:var(--font-heading);">${score} / ${questions.length}</div>
  <div style="margin:10px 0;"><span class="badge ${cls}" style="font-size:14px;padding:7px 24px;">${pct}% Chính xác</span></div>
  <p class="text-muted" style="font-size:13px;margin-top:8px;">${msg}</p>
  <div style="display:flex;justify-content:center;gap:12px;margin-top:16px;">
    <button class="btn btn-outline" id="btnRetakeQuiz" style="display:inline-flex;align-items:center;gap:6px;">
      <i data-lucide="rotate-ccw" style="width:15px;height:15px;"></i> Làm lại bài này
    </button>
    <button class="btn btn-primary" onclick="openQuizModal()" style="display:inline-flex;align-items:center;gap:6px;">
      <i data-lucide="sparkles" style="width:15px;height:15px;"></i> Tạo bài quiz mới
    </button>
  </div>
</div>`;
  el('quizBox').prepend(resultEl);
  el('quizBox').scrollTop = 0;

  resultEl.querySelector('#btnRetakeQuiz')?.addEventListener('click', () => {
    LEC.quizAnswers = {};
    renderQuiz(questions);
  });

  if (LEC.lectureId) {
    await API.save_quiz_result(LEC.lectureId, score, questions.length, 'trung bình', details);
  }
  showToast(`Kết quả: ${score}/${questions.length} (${pct}%)`, pct >= 70 ? 'success' : 'warning');
  if (pct >= 80) {
    setTimeout(() => {
      const c = document.createElement('div');
      c.className = 'confetti-container';
      document.body.appendChild(c);
      const colors = ['#4f46e5', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];
      for (let i = 0; i < 28; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-piece';
        p.style.cssText = `left:${Math.random() * 100}vw;top:${Math.random() * 40}vh;background:${colors[i % colors.length]};animation-duration:${0.6 + Math.random() * 0.5}s;animation-delay:${Math.random() * 0.3}s;transform:rotate(${Math.random() * 360}deg);`;
        c.appendChild(p);
      }
      setTimeout(() => c.remove(), 1200);
    }, 300);
  }
}

// ──────────────────────────────────────────
// Summary & Mindmap
// ──────────────────────────────────────────
async function triggerSummaryGeneration() {
  if (!LEC.lectureId) return showToast('Hãy phiên âm bài giảng trước khi tạo tóm tắt', 'warning');
  if (!LEC.fullText?.trim()) return showToast('Bài giảng chưa có nội dung văn bản để tóm tắt', 'warning');

  showStatus('Mô hình AI đang tóm tắt phân cấp và vẽ sơ đồ tư duy…', 0.3);
  switchTabTo('summary');
  TaskTimer.start(['summaryElapsedTimer']);

  if (el('summaryBox')) el('summaryBox').innerHTML = `
<div class="empty-state" style="height:100%;padding:40px 20px;">
  <i data-lucide="loader-2" class="spin" style="width:40px;height:40px;color:#6366f1;"></i>
  <div class="empty-title" style="margin-top:16px;font-size:16px;font-weight:700;">Đang tạo tóm tắt phân cấp & vẽ sơ đồ tư duy…</div>
  <div class="empty-sub" style="margin-top:6px;max-width:540px;margin-left:auto;margin-right:auto;color:#64748b;line-height:1.5;">
    Mô hình AI đang trích xuất các luận điểm cốt lõi, tóm tắt các phần và thiết lập cây phân cấp sơ đồ tư duy (Mindmap). Quá trình này thường mất khoảng 15 - 35 giây.
  </div>
  <div id="summaryElapsedTimer" style="margin-top:16px;display:inline-block;padding:6px 16px;background:rgba(99,102,241,0.08);color:#4f46e5;font-weight:700;font-size:13px;border-radius:20px;border:1px solid rgba(99,102,241,0.2);">
    Thời gian đã chạy: 00:00
  </div>
</div>`;
  refreshIcons();

  await API.generate_summary(LEC.lectureId);
}

function renderSummary(summary, mindmap) {
  if (!el('summaryBox')) return;
  const hasOverview = summary && (summary.overview || (Array.isArray(summary.key_takeaways) && summary.key_takeaways.length));
  const hasMindmap = mindmap && (mindmap.topic || (Array.isArray(mindmap.children) && mindmap.children.length));

  if (!hasOverview && !hasMindmap) {
    el('summaryBox').innerHTML = `
<div class="empty-state" style="height:100%;padding:40px 20px;">
  <i data-lucide="sparkles" style="width:44px;height:44px;color:#6366f1;"></i>
  <div class="empty-title" style="margin-top:14px;font-size:16px;font-weight:700;">Chưa có bản tóm tắt bài giảng</div>
  <div class="empty-sub" style="max-width:480px;margin:6px auto 16px;color:#64748b;line-height:1.5;">
    AI sẽ trích xuất luận điểm cốt lõi, tóm tắt từng phần và tự động xây dựng sơ đồ tư duy (Mindmap).
  </div>
  <button class="btn btn-primary" onclick="triggerSummaryGeneration()" style="display:inline-flex;align-items:center;gap:6px;">
    <i data-lucide="sparkles" style="width:14px;height:14px;"></i> Tóm tắt ngay bằng AI
  </button>
</div>`;
    refreshIcons();
    return;
  }

  const overviewHtml = summary?.overview ? `
<div class="card" style="padding:18px 20px;border:1px solid rgba(99,102,241,0.18);background:rgba(99,102,241,0.03);border-radius:var(--radius-lg);margin-bottom:14px;">
  <div style="font-weight:800;color:#4338ca;font-size:14px;display:flex;align-items:center;gap:8px;margin-bottom:8px;">
    <i data-lucide="book-open" style="width:16px;height:16px;"></i> TỔNG QUAN BÀI GIẢNG
  </div>
  <div style="line-height:1.7;color:var(--text);font-size:13.5px;">${escHtml(summary.overview)}</div>
</div>` : '';

  const takeaways = Array.isArray(summary?.key_takeaways) ? summary.key_takeaways : [];
  const takeawaysHtml = takeaways.length ? `
<div class="card" style="padding:18px 20px;border:1px solid #e2e8f0;background:#ffffff;border-radius:var(--radius-lg);margin-bottom:14px;">
  <div style="font-weight:800;color:#0f172a;font-size:14px;display:flex;align-items:center;gap:8px;margin-bottom:10px;">
    <i data-lucide="check-circle" style="width:16px;height:16px;color:#059669;"></i> LUẬN ĐIỂM & THUẬT NGỮ CỐT LÕI
  </div>
  <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;">
    ${takeaways.map(item => `
      <li style="display:flex;align-items:flex-start;gap:8px;font-size:13px;line-height:1.6;color:var(--text);">
        <i data-lucide="arrow-right" style="width:13px;height:13px;color:#4f46e5;flex-shrink:0;margin-top:4px;"></i>
        <span>${escHtml(item)}</span>
      </li>
    `).join('')}
  </ul>
</div>` : '';

  const sections = Array.isArray(summary?.sections) ? summary.sections : [];
  const sectionsHtml = sections.length ? `
<div class="card" style="padding:18px 20px;border:1px solid #e2e8f0;background:#ffffff;border-radius:var(--radius-lg);margin-bottom:14px;">
  <div style="font-weight:800;color:#0f172a;font-size:14px;display:flex;align-items:center;gap:8px;margin-bottom:10px;">
    <i data-lucide="list" style="width:16px;height:16px;color:#d97706;"></i> NỘI DUNG TỪNG PHẦN
  </div>
  <div style="display:flex;flex-direction:column;gap:10px;">
    ${sections.map((sec, idx) => `
      <div style="padding:10px 14px;background:#f8fafc;border-radius:var(--radius-md);border:1px solid #e2e8f0;">
        <div style="font-weight:700;font-size:13px;color:#1e293b;display:flex;justify-content:space-between;">
          <span>${idx + 1}. ${escHtml(sec.title || '')}</span>
          ${sec.timestamp ? `<span class="badge" style="font-size:11px;">⏱️ ${escHtml(sec.timestamp)}</span>` : ''}
        </div>
        <div style="font-size:12.5px;color:#64748b;margin-top:4px;line-height:1.5;">${escHtml(sec.summary || '')}</div>
      </div>
    `).join('')}
  </div>
</div>` : '';

  // Mindmap Visualizer
  function renderMindmapNode(node) {
    if (!node) return '';
    const title = node.topic || node.title || node.name || 'Chủ đề';
    const children = Array.isArray(node.children) ? node.children : [];
    return `
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:#ffffff;border:1px solid rgba(99,102,241,0.25);border-radius:20px;font-size:12.5px;font-weight:700;color:#4338ca;box-shadow:0 1px 3px rgba(0,0,0,0.04);width:fit-content;">
          <i data-lucide="folder-tree" style="width:13px;height:13px;color:#6366f1;"></i>
          <span>${escHtml(title)}</span>
        </div>
        ${children.length ? `
          <div style="padding-left:18px;border-left:2px dashed #cbd5e1;margin-left:8px;display:flex;flex-direction:column;gap:8px;">
            ${children.map(renderMindmapNode).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  const mindmapHtml = hasMindmap ? `
<div class="card" style="padding:18px 20px;border:1px solid rgba(99,102,241,0.20);background:#fbfcfe;border-radius:var(--radius-lg);margin-bottom:14px;">
  <div style="font-weight:800;color:#3730a3;font-size:14px;display:flex;align-items:center;gap:8px;margin-bottom:12px;">
    <i data-lucide="git-branch" style="width:16px;height:16px;color:#6366f1;"></i> SƠ ĐỒ TƯ DUY (MINDMAP PHÂN CẤP)
  </div>
  <div style="padding:10px 4px;">
    ${renderMindmapNode(mindmap)}
  </div>
</div>` : '';

  el('summaryBox').innerHTML = `
<div style="max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:4px;">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding:4px 0;">
    <span style="font-weight:800;color:var(--text);font-size:14px;display:flex;align-items:center;gap:6px;">
      <i data-lucide="sparkles" style="width:16px;height:16px;color:#6366f1;"></i> TỔNG HỢP KIẾN THỨC BÀI HỌC
    </span>
    <button class="btn btn-ghost btn-sm" onclick="triggerSummaryGeneration()" title="Tạo lại tóm tắt mới" style="font-size:12px;display:inline-flex;align-items:center;gap:4px;">
      <i data-lucide="rotate-ccw" style="width:13px;height:13px;"></i> Tạo lại
    </button>
  </div>
  ${overviewHtml}
  ${takeawaysHtml}
  ${sectionsHtml}
  ${mindmapHtml}
</div>`;
  refreshIcons();
}

EventBus.on('summary:done', ({ summary, mindmap }) => {
  const elapsed = TaskTimer.stop();
  hideStatus();
  renderSummary(summary, mindmap);
  switchTabTo('summary');
  showToast(`Đã tạo xong tóm tắt & sơ đồ tư duy (${fmtDuration(elapsed)})!`, 'success');
});

EventBus.on('summary:error', ({ message }) => {
  TaskTimer.stop();
  hideStatus();
  showToast('Lỗi tạo tóm tắt: ' + message, 'error', 4000);
});

// ──────────────────────────────────────────
// Flashcard Generation & Study
// ──────────────────────────────────────────
async function showCardsModal() {
  if (!LEC.lectureId) return showToast('Hãy phiên âm bài giảng trước khi tạo thẻ ghi nhớ', 'warning');

  const idx = await showModal(
    'Tạo Bộ Flashcards từ Bài giảng',
    `<div class="flex-col gap-3">
      <div>
        <label class="label">Số lượng thẻ muốn rút trích</label>
        <select class="select w-full" id="cardsNumSelect" style="font-size:13px;">
          <option value="5">5 thẻ — Thử nhanh</option>
          <option value="8">8 thẻ — Cơ bản</option>
          <option value="10" selected>10 thẻ — Tiêu chuẩn (khuyên dùng)</option>
          <option value="15">15 thẻ — Toàn diện</option>
          <option value="20">20 thẻ — Chi tiết nhất</option>
        </select>
      </div>
      <p class="text-muted text-sm" style="font-size:12px;line-height:1.6;background:var(--glass-light);padding:12px;border-radius:var(--radius-md);border:1px solid var(--glass-border);">
        AI sẽ tự động trích xuất các <strong>định nghĩa, thuật ngữ</strong> và <strong>khái niệm quan trọng</strong> kèm gợi ý liên tưởng chuẩn Spaced Repetition (SM-2 & Active Recall).
      </p>
    </div>`,
    [
      { label: 'Huỷ', class: 'btn-ghost' },
      { label: 'Tạo thẻ ngay', class: 'btn-primary' }
    ]
  );
  if (idx !== 1) return;

  const numCards = parseInt(el('cardsNumSelect')?.value) || 10;
  showStatus(`AI đang rút trích ${numCards} flashcards từ bài giảng…`, 0.3);
  switchTabTo('flashcards');
  TaskTimer.start(['cardsElapsedTimer']);

  if (el('flashcardsBox')) el('flashcardsBox').innerHTML = `
<div class="empty-state" style="height:100%;padding:40px 20px;">
  <i data-lucide="loader-2" class="spin" style="width:40px;height:40px;color:#059669;"></i>
  <div class="empty-title" style="margin-top:16px;font-size:16px;font-weight:700;">Đang rút trích ${numCards} thẻ ghi nhớ flashcards…</div>
  <div class="empty-sub" style="margin-top:6px;max-width:540px;margin-left:auto;margin-right:auto;color:#64748b;line-height:1.5;">
    Mô hình AI đang phân tích toàn bộ nội dung bài giảng để xây dựng các câu hỏi tự kiểm tra chuẩn SM-2 & Active Recall. Quá trình này thường mất khoảng 20 - 45 giây.
  </div>
  <div id="cardsElapsedTimer" style="margin-top:16px;display:inline-block;padding:6px 16px;background:rgba(5,150,105,0.08);color:#059669;font-weight:700;font-size:13px;border-radius:20px;border:1px solid rgba(5,150,105,0.2);">
    Thời gian đã chạy: 00:00
  </div>
</div>`;
  refreshIcons();

  await API.generate_flashcards(LEC.lectureId, numCards);
}

function renderLectureFlashcards(cards) {
  if (!el('flashcardsBox')) return;
  const list = Array.isArray(cards) ? cards : [];
  LEC.flashcards = list;

  if (!list.length) {
    el('flashcardsBox').innerHTML = `
<div class="empty-state" style="height:100%;padding:40px 20px;">
  <i data-lucide="layers" style="width:44px;height:44px;color:#059669;"></i>
  <div class="empty-title" style="margin-top:14px;font-size:16px;font-weight:700;">Chưa có thẻ ghi nhớ nào</div>
  <div class="empty-sub" style="max-width:480px;margin:6px auto 16px;color:#64748b;line-height:1.5;">
    Tự động trích xuất các định nghĩa, công thức và khái niệm trọng tâm thành bộ Flashcard kèm gợi ý liên tưởng chuẩn Spaced Repetition (SM-2).
  </div>
  <button class="btn btn-primary" onclick="showCardsModal()" style="display:inline-flex;align-items:center;gap:6px;">
    <i data-lucide="layers" style="width:14px;height:14px;"></i> Tạo Flashcards ngay
  </button>
</div>`;
    refreshIcons();
    return;
  }

  el('flashcardsBox').innerHTML = `
<div style="max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:14px;">
  <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(5,150,105,0.06);border:1px solid rgba(5,150,105,0.20);padding:12px 18px;border-radius:var(--radius-lg);">
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="font-weight:800;font-size:14px;color:#065f46;display:flex;align-items:center;gap:6px;">
        <i data-lucide="layers" style="width:16px;height:16px;"></i> THẺ GHI NHỚ BÀI GIẢNG
      </span>
      <span class="badge" style="background:#d1fae5;color:#065f46;border:1px solid #a7f3d0;font-weight:700;">${list.length} thẻ</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px;">
      <button class="btn btn-primary btn-sm" id="btnStudyCardsNow" style="display:inline-flex;align-items:center;gap:6px;background:#059669;border-color:#059669;">
        <i data-lucide="play" style="width:13px;height:13px;"></i> Ôn tập lật thẻ
      </button>
      <button class="btn btn-ghost btn-sm" onclick="showCardsModal()" title="Trích xuất thêm thẻ" style="font-size:12px;display:inline-flex;align-items:center;gap:4px;">
        <i data-lucide="plus" style="width:13px;height:13px;"></i> Thêm thẻ
      </button>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(260px, 1fr));gap:12px;">
    ${list.map((c, i) => `
      <div class="card" id="fc-card-${c.id || i}" style="padding:16px;border:1px solid #e2e8f0;border-radius:var(--radius-md);display:flex;flex-direction:column;gap:8px;background:#ffffff;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;font-weight:800;color:#059669;background:#ecfdf5;padding:2px 8px;border-radius:12px;border:1px solid #a7f3d0;">THẺ #${i + 1}</span>
          <button class="btn btn-ghost btn-sm btn-del-card" data-cid="${c.id}" title="Xoá thẻ" style="padding:2px 6px;height:22px;">
            <i data-lucide="trash-2" style="width:12px;height:12px;color:var(--danger);"></i>
          </button>
        </div>
        <div style="font-weight:700;font-size:13.5px;color:#0f172a;line-height:1.5;">${escHtml(c.front)}</div>
        <div class="fc-back-content" id="fc-back-${i}" style="display:none;padding:10px;background:#f8fafc;border-radius:var(--radius-sm);border-left:3px solid #059669;font-size:13px;color:#334155;line-height:1.5;animation:fadeUp .2s ease;">
          <div style="font-weight:600;color:#065f46;font-size:11px;margin-bottom:2px;">ĐÁP ÁN:</div>
          ${escHtml(c.back)}
          ${c.hint ? `<div style="font-size:11px;color:#d97706;margin-top:6px;"><i data-lucide="lightbulb" style="width:11px;height:11px;display:inline-block;vertical-align:middle;"></i> Gợi ý: ${escHtml(c.hint)}</div>` : ''}
        </div>
        <button class="btn btn-outline btn-sm btn-toggle-card" data-idx="${i}" style="margin-top:auto;font-size:12px;padding:6px 10px;display:inline-flex;align-items:center;justify-content:center;gap:4px;">
          <i data-lucide="eye" style="width:13px;height:13px;"></i> <span>Xem đáp án</span>
        </button>
      </div>
    `).join('')}
  </div>
</div>`;

  el('btnStudyCardsNow')?.addEventListener('click', studyLectureFlashcards);

  el('flashcardsBox').querySelectorAll('.btn-toggle-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.dataset.idx;
      const backEl = el(`fc-back-${idx}`);
      if (!backEl) return;
      const isHidden = backEl.style.display === 'none';
      backEl.style.display = isHidden ? 'block' : 'none';
      btn.innerHTML = isHidden
        ? '<i data-lucide="eye-off" style="width:13px;height:13px;"></i> <span>Ẩn đáp án</span>'
        : '<i data-lucide="eye" style="width:13px;height:13px;"></i> <span>Xem đáp án</span>';
      refreshIcons();
    });
  });

  el('flashcardsBox').querySelectorAll('.btn-del-card').forEach(btn => {
    btn.addEventListener('click', async () => {
      const cid = btn.dataset.cid;
      if (!cid) return;
      try {
        await API.delete_card(cid);
        showToast('Đã xóa thẻ', 'info');
        const cards = await API.get_lecture_flashcards(LEC.lectureId);
        renderLectureFlashcards(cards);
      } catch (err) {
        showToast('Lỗi khi xóa thẻ', 'error');
      }
    });
  });

  refreshIcons();
}

async function studyLectureFlashcards() {
  if (!LEC.lectureId) return;
  try {
    const decks = await API.get_lecture_decks(LEC.lectureId);
    if (decks && decks.length > 0) {
      switchView('flashcard');
      if (typeof selectDeck === 'function') {
        selectDeck(decks[0].id, decks[0].name);
      }
    } else {
      showToast('Bài giảng chưa có bộ thẻ để ôn tập', 'warning');
    }
  } catch (err) {
    showToast('Lỗi mở bộ thẻ: ' + err.message, 'error');
  }
}

EventBus.on('flashcards:done', async ({ count, deck_name, all_cards }) => {
  const elapsed = TaskTimer.stop();
  hideStatus();
  showToast(`Đã tạo ${count} thẻ trong bộ "${deck_name}" (${fmtDuration(elapsed)})!`, 'success', 4000);
  if (all_cards && Array.isArray(all_cards)) {
    renderLectureFlashcards(all_cards);
  } else if (LEC.lectureId) {
    const cards = await API.get_lecture_flashcards(LEC.lectureId);
    renderLectureFlashcards(cards);
  }
  switchTabTo('flashcards');
});

EventBus.on('flashcards:error', ({ message }) => {
  TaskTimer.stop();
  hideStatus();
  showToast('Lỗi tạo thẻ: ' + message, 'error', 4000);
});

// ──────────────────────────────────────────
// Chat / Q&A (RAG)
// ──────────────────────────────────────────
async function sendChat() {
  if (!LEC.lectureId) return showToast('Cần có bài giảng để hỏi đáp', 'warning');
  const q = el('chatInput')?.value.trim();
  if (!q) return;
  el('chatInput').value = '';

  appendChat('user', escHtml(q));

  // Typing indicator
  const thinkEl = document.createElement('div');
  thinkEl.className = 'chat-msg chat-ai chat-thinking';
  thinkEl.style.cssText = 'max-width:92%;display:flex;gap:10px;align-items:flex-start;';
  thinkEl.innerHTML = `
    <div style="width:28px;height:28px;border-radius:8px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.20);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <i data-lucide="bot" style="width:15px;height:15px;color:#4f46e5;"></i>
    </div>
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>`;
  el('chatHistory')?.appendChild(thinkEl);
  el('chatHistory').scrollTop = el('chatHistory').scrollHeight;
  refreshIcons();

  await API.ask_rag(q, LEC.lectureId);
}

EventBus.on('rag:done', ({ answer, citations }) => {
  qs('.chat-thinking')?.remove();
  const citHtml = citations?.length
    ? `<div class="chat-citation"><span style="display:inline-flex;align-items:center;gap:4px;"><i data-lucide="clock" style="width:12px;height:12px;color:var(--accent);"></i> Mốc thời gian:</span> ${citations.map(c =>
      `<span class="chat-citation-chip">${fmtDuration(c.start)}</span>`
    ).join('')}</div>`
    : '';
  appendChat('ai', escHtml(answer).replace(/\n/g, '<br>') + citHtml);
});

EventBus.on('rag:error', ({ message }) => {
  qs('.chat-thinking')?.remove();
  appendChat('ai', `<span style="display:inline-flex;align-items:center;gap:5px;color:var(--danger);"><i data-lucide="alert-triangle" style="width:14px;height:14px;"></i> ${escHtml(message)}</span>`);
});

function appendChat(role, htmlContent) {
  if (!el('chatHistory')) return;
  const div = document.createElement('div');
  div.style.cssText = 'max-width:92%;display:flex;gap:10px;align-items:flex-start;';

  if (role === 'user') {
    div.innerHTML = `<div class="chat-user" style="margin-left:auto;">${htmlContent}</div>`;
  } else {
    div.innerHTML = `
      <div style="width:28px;height:28px;border-radius:8px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.20);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <i data-lucide="bot" style="width:15px;height:15px;color:#4f46e5;"></i>
      </div>
      <div class="chat-ai">${htmlContent}</div>`;
  }

  el('chatHistory').appendChild(div);
  el('chatHistory').scrollTop = el('chatHistory').scrollHeight;
  refreshIcons();
}

// ──────────────────────────────────────────
// Export
// ──────────────────────────────────────────
async function showExportMenu() {
  if (!LEC.lectureId) return showToast('Cần có bài giảng để xuất', 'warning');
  const idx = await showModal(
    'Xuất dữ liệu bài học',
    `<p class="text-muted" style="font-size:13px;margin-bottom:4px;">Chọn định dạng xuất mong muốn:</p>`,
    [
      { label: 'Văn bản (.txt)', class: 'btn-ghost' },
      { label: 'Báo cáo HTML', class: 'btn-ghost' },
      { label: 'Gói JSON', class: 'btn-ghost' },
      { label: 'Huỷ', class: 'btn-ghost' },
    ]
  );
  if (idx === 3 || idx === -1) return;
  try {
    let result;
    if (idx === 0) result = await API.export_txt(LEC.lectureId);
    else if (idx === 1) result = await API.export_html(LEC.lectureId);
    else if (idx === 2) result = await API.export_json(LEC.lectureId);

    if (result?.path) showToast(`Đã xuất: ${result.path.split(/[\\\/]/).pop()}`, 'success');
    else if (result?.cancelled) showToast('Đã huỷ xuất file', 'info');
    else if (result?.error) showToast('Lỗi: ' + result.error, 'error');
  } catch (e) {
    showToast('Lỗi xuất file: ' + e.message, 'error');
  }
}

// ──────────────────────────────────────────
// Status helpers
// ──────────────────────────────────────────
function showStatus(text, progress = 0) {
  if (!el('lecStatusBar')) return;
  el('lecStatusBar').style.display = 'flex';
  if (el('lecStatusText')) el('lecStatusText').textContent = text;
  if (el('lecProgressBar')) el('lecProgressBar').style.width = `${Math.round(progress * 100)}%`;
}

function updateProgress(progress) {
  if (el('lecProgressBar')) el('lecProgressBar').style.width = `${Math.round(progress * 100)}%`;
}

function hideStatus() {
  if (el('lecStatusBar')) el('lecStatusBar').style.display = 'none';
  TaskTimer.stop();
}

function updateStepButtons() {
  const has = !!LEC.lectureId;
  ['btnSummary', 'btnQuiz', 'btnCards', 'btnExport'].forEach(id => {
    if (el(id)) el(id).disabled = !has;
  });
  // Mark transcribe as done if we have a lectureId
  if (has && el('btnTranscribe')) {
    el('btnTranscribe').classList.remove('active-step');
  }
}

function switchTabTo(tab) {
  qsa('.tab-btn', el('view-lecture')).forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  qsa('.tab-panel', el('view-lecture')).forEach(p => {
    p.classList.toggle('hidden', p.id !== `tab-${tab}`);
  });
  LEC.activeTab = tab;
}

EventBus.on('llm:status', ({ text }) => showStatus(text, 0.5));

// ──────────────────────────────────────────
// Register View
// ──────────────────────────────────────────
registerView('lecture', {
  render: renderLectureView,
  onShow: () => {
    if (!el('btnTranscribe')) renderLectureView();
    if (LEC.lectureId) loadLecture(LEC.lectureId);
  },
});
