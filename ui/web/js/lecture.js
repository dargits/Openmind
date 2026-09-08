/* ════════════════════════════════════════════
   Lecture Studio View — Open-mind
   Workflow Stepper · Drag-drop · Tab redesign
════════════════════════════════════════════ */
'use strict';

const LEC = {
  lectureId: null,
  audioPath: null,
  audioUrl: null,
  isTranscribing: false,
  segments: [],
  fullText: '',
  quizData: null,
  quizAnswers: {},
  activeTab: 'transcript',
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
    <div id="lecAudioRow" style="${!LEC.audioPath ? 'display:none;' : ''}display:flex;gap:10px;align-items:center;">
      <div class="upload-zone-file" style="flex:1;">
        <div style="width:36px;height:36px;border-radius:9px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <i data-lucide="music" style="width:18px;height:18px;color:#4f46e5;"></i>
        </div>
        <div style="flex:1;min-width:0;">
          <div class="audio-filename" id="lecFileName">Chưa chọn file</div>
          <div style="font-size:11px;color:var(--text-muted);">File âm thanh đang được tải</div>
        </div>
        <audio controls id="lecAudio" style="width:280px;height:32px;"></audio>
      </div>
      <button class="btn btn-ghost btn-sm" id="lecChangeFile"
        style="flex-shrink:0;display:inline-flex;align-items:center;gap:5px;">
        <i data-lucide="refresh-cw" style="width:13px;height:13px;"></i> Đổi file
      </button>
      <select class="select" id="lecFolder" style="width:140px;font-size:13px;">
        <option value="General">General</option>
        <option value="CNTT">CNTT</option>
        <option value="Toán">Toán</option>
        <option value="Vật lý">Vật lý</option>
        <option value="Ngoại ngữ">Ngoại ngữ</option>
      </select>
    </div>
  </div>

  <!-- Workflow Stepper -->
  <div style="flex-shrink:0;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;" id="lecStepRow">
    <button class="step-action-btn ${LEC.lectureId ? '' : 'active-step'}" id="btnTranscribe" ${LEC.isTranscribing ? 'disabled' : ''}>
      <i data-lucide="mic" style="width:15px;height:15px;"></i>
      <span>① Phiên âm bài giảng</span>
    </button>
    <button class="step-action-btn" id="btnQuiz" ${!LEC.lectureId ? 'disabled' : ''}>
      <i data-lucide="check-square" style="width:15px;height:15px;"></i>
      <span>② Tạo Quiz trắc nghiệm</span>
    </button>
    <button class="step-action-btn" id="btnCards" ${!LEC.lectureId ? 'disabled' : ''}>
      <i data-lucide="layers" style="width:15px;height:15px;"></i>
      <span>③ Tạo Flashcards</span>
    </button>
    <button class="step-action-btn" id="btnExport" ${!LEC.lectureId ? 'disabled' : ''}>
      <i data-lucide="download" style="width:15px;height:15px;"></i>
      <span>④ Xuất dữ liệu</span>
    </button>
  </div>

  <!-- Status / Progress Bar -->
  <div class="status-bar" id="lecStatusBar" style="display:none;">
    <i data-lucide="loader-2" class="spin" style="width:18px;height:18px;color:#4f46e5;flex-shrink:0;"></i>
    <span class="status-text" id="lecStatusText">Đang xử lý bài giảng…</span>
    <div class="progress-inline">
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
      <button class="tab-btn" data-tab="quiz">
        <i data-lucide="check-circle-2" style="width:14px;height:14px;"></i> Bài kiểm tra
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
            <div class="empty-sub">Chọn file âm thanh và nhấn "① Phiên âm bài giảng" để bắt đầu</div>
          </div>
        </div>
      </div>

      <!-- 2. Quiz Panel -->
      <div class="tab-panel hidden" id="tab-quiz">
        <div id="quizBox" style="overflow-y:auto;height:100%;padding:2px 2px;">
          <div class="empty-state" style="height:100%;">
            <div class="empty-icon"><i data-lucide="help-circle" style="width:48px;height:48px;color:var(--text-subtle);"></i></div>
            <div class="empty-title">Chưa có bài kiểm tra</div>
            <div class="empty-sub">Nhấn "② Tạo Quiz trắc nghiệm" để AI tự động biên soạn câu hỏi</div>
          </div>
        </div>
      </div>

      <!-- 3. Chat Q&A Panel -->
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
  el('lecChangeFile')?.addEventListener('click', () => {
    el('lecAudioRow').style.display = 'none';
    el('lecUploadZone').style.removeProperty('display');
    LEC.audioPath = null;
    LEC.audioUrl = null;
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
      // pywebview doesn't support native drop, but we handle the event gracefully
      showToast('Kéo thả không được hỗ trợ — vui lòng dùng nút "Chọn file"', 'info');
    });
  }

  el('btnTranscribe').addEventListener('click', startTranscribe);
  el('btnQuiz').addEventListener('click', showQuizModal);
  el('btnCards').addEventListener('click', showCardsModal);
  el('btnExport').addEventListener('click', showExportMenu);

  el('chatSend').addEventListener('click', sendChat);
  el('chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });

  // Tab navigation
  qsa('.tab-btn', el('view-lecture')).forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.tab-btn', el('view-lecture')).forEach(b => b.classList.remove('active'));
      qsa('.tab-panel', el('view-lecture')).forEach(p => p.classList.add('hidden'));
      btn.classList.add('active');
      el(`tab-${btn.dataset.tab}`).classList.remove('hidden');
      LEC.activeTab = btn.dataset.tab;
    });
  });

  if (LEC.lectureId) loadLecture(LEC.lectureId);

  refreshIcons();
}

async function loadLecture(lectureId) {
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
    if (LEC.audioPath) {
      try {
        LEC.audioUrl = await API.get_audio_url(LEC.audioPath);
        const name = LEC.audioPath.split(/[\\\/]/).pop() || lec.title;
        if (el('lecFileName')) el('lecFileName').textContent = name;
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

    // Reset quiz
    if (el('quizBox')) {
      el('quizBox').innerHTML = `
<div class="empty-state" style="height:100%;">
  <div class="empty-icon"><i data-lucide="help-circle" style="width:48px;height:48px;color:var(--text-subtle);"></i></div>
  <div class="empty-title">Chưa có bài kiểm tra</div>
  <div class="empty-sub">Nhấn "② Tạo Quiz trắc nghiệm" để AI tự động biên soạn câu hỏi từ bài giảng này</div>
</div>`;
    }

    switchTabTo('transcript');
    updateStepButtons();
    refreshIcons();
  } catch (e) {
    console.error('loadLecture error:', e);
    showToast('Lỗi tải bài giảng: ' + e.message, 'error');
  }
}

// ──────────────────────────────────────────
// Audio Picker
// ──────────────────────────────────────────
async function pickAudio() {
  try {
    const path = await API.pick_audio_file();
    if (!path) return;
    LEC.audioPath = path;
    LEC.audioUrl = await API.get_audio_url(path);

    const name = path.split(/[\\\/]/).pop();
    if (el('lecFileName')) el('lecFileName').textContent = name;
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
  if (el('transcriptBox')) {
    el('transcriptBox').innerHTML = `
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:16px;color:var(--text-muted);">
  <i data-lucide="loader-2" class="spin" style="width:36px;height:36px;color:#4f46e5;"></i>
  <div style="font-weight:700;color:var(--text);">Đang lắng nghe và trích xuất từng câu nói…</div>
  <div style="font-size:12px;">Quá trình này có thể mất vài phút tùy độ dài bài giảng</div>
</div>`;
    refreshIcons();
  }

  const folder = el('lecFolder')?.value || 'General';
  const title = (LEC.audioPath.split(/[\\\/]/).pop()).replace(/\.[^.]+$/, '');

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
  LEC.isTranscribing = false;
  LEC.lectureId = data.lecture_id;
  LEC.segments = data.segments || LEC.segments;
  LEC.fullText = data.full_text || LEC.fullText;
  hideStatus();
  updateStepButtons();
  showToast(`Phiên âm xong! Đã trích xuất ${LEC.segments.length} đoạn hội thoại.`, 'success', 3500);
  switchTabTo('transcript');
});

EventBus.on('transcribe:error', ({ message }) => {
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
          <option value="3">3 câu — Kiểm tra nhanh</option>
          <option value="5" selected>5 câu — Tiêu chuẩn</option>
          <option value="8">8 câu — Toàn diện</option>
          <option value="10">10 câu — Đầy đủ</option>
          <option value="15">15 câu — Chuyên sâu</option>
        </select>
      </div>
      <div>
        <label class="label">Mức độ khó</label>
        <select class="select w-full" id="quizDiffSelect" style="font-size:13px;">
          <option value="dễ">Dễ — Khái niệm cơ bản & định nghĩa</option>
          <option value="trung bình" selected>Trung bình — Hiểu & Vận dụng kiến thức</option>
          <option value="khó">Khó — Phân tích, suy luận & câu bẫy</option>
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

  showStatus(`AI đang sinh ${numQuestions} câu hỏi (${difficulty})…`, 0.25);
  LEC.quizData = null;
  LEC.quizAnswers = {};
  switchTabTo('quiz');
  if (el('quizBox')) el('quizBox').innerHTML = `
<div class="empty-state" style="height:100%;">
  <i data-lucide="loader-2" class="spin" style="width:36px;height:36px;color:#4f46e5;"></i>
  <div class="empty-title" style="margin-top:12px;">Đang biên soạn ${numQuestions} câu hỏi…</div>
  <div class="empty-sub">Vui lòng đợi — AI đang phân tích nội dung bài giảng</div>
</div>`;
  refreshIcons();

  await API.generate_quiz(LEC.lectureId, numQuestions, difficulty);
}

EventBus.on('quiz:done', ({ quiz }) => {
  hideStatus();
  const questions = Array.isArray(quiz) ? quiz : (quiz.questions || []);
  LEC.quizData = questions;
  renderQuiz(questions);
  switchTabTo('quiz');
  showToast(`Đã tạo xong ${questions.length} câu hỏi trắc nghiệm!`, 'success');
});

EventBus.on('quiz:error', ({ message }) => {
  hideStatus();
  showToast('Lỗi sinh quiz: ' + message, 'error', 4000);
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
    <span class="badge badge-accent">${questions.length} câu hỏi</span>
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
</div>`;
  el('quizBox').prepend(resultEl);
  el('quizBox').scrollTop = 0;

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
// Flashcard Generation
// ──────────────────────────────────────────
async function showCardsModal() {
  if (!LEC.lectureId) return showToast('Hãy phiên âm bài giảng trước khi tạo thẻ ghi nhớ', 'warning');

  const idx = await showModal(
    'Tạo Bộ Flashcards từ Bài giảng',
    `<div class="flex-col gap-3">
      <div>
        <label class="label">Số lượng thẻ muốn rút trích</label>
        <select class="select w-full" id="cardsNumSelect" style="font-size:13px;">
          <option value="5">5 thẻ</option>
          <option value="8" selected>8 thẻ (Khuyên dùng)</option>
          <option value="10">10 thẻ</option>
          <option value="15">15 thẻ — Chi tiết</option>
          <option value="20">20 thẻ — Đầy đủ nhất</option>
        </select>
      </div>
      <p class="text-muted text-sm" style="font-size:12px;line-height:1.6;background:var(--glass-light);padding:12px;border-radius:var(--radius-md);border:1px solid var(--glass-border);">
        AI sẽ tự động trích xuất các <strong>định nghĩa, thuật ngữ</strong> và <strong>khái niệm quan trọng</strong> kèm gợi ý liên tưởng chuẩn Spaced Repetition (SM-2).
      </p>
    </div>`,
    [
      { label: 'Huỷ', class: 'btn-ghost' },
      { label: 'Tạo thẻ ngay', class: 'btn-primary' }
    ]
  );
  if (idx !== 1) return;

  const numCards = parseInt(el('cardsNumSelect')?.value) || 8;
  showStatus(`AI đang rút trích ${numCards} flashcards từ bài giảng…`, 0.3);
  await API.generate_flashcards(LEC.lectureId, numCards);
}

EventBus.on('flashcards:done', ({ count, deck_name }) => {
  hideStatus();
  showToast(`Đã tạo ${count} thẻ trong bộ "${deck_name}"! Vào "Thẻ ghi nhớ" để ôn tập.`, 'success', 5000);
});

EventBus.on('flashcards:error', ({ message }) => {
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
}

function updateStepButtons() {
  const has = !!LEC.lectureId;
  ['btnQuiz', 'btnCards', 'btnExport'].forEach(id => {
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
