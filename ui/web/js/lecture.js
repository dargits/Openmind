/* ════════════════════════════════════════════
   Lecture Studio View — Open-mind Pro (Redesigned)
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

  <!-- Header Toolbar -->
  <div class="lecture-toolbar">
    <button class="btn btn-primary" id="lecPickAudio" style="box-shadow: 0 4px 14px rgba(37, 99, 235, 0.22); font-weight:700;">
      <i data-lucide="music" style="width:16px;height:16px;"></i> Chọn file âm thanh
    </button>
    
    <div class="audio-player" id="lecAudioPlayer" style="flex:1; display:${LEC.audioPath ? 'flex' : 'none'}; border-radius: var(--radius-lg);">
      <span class="audio-filename" id="lecFileName"></span>
      <audio controls id="lecAudio" style="flex:1; height:36px;"></audio>
    </div>

    <div class="flex gap-2 items-center" style="margin-left:auto;">
      <span style="font-size:12px; font-weight:700; color:var(--text-muted);">Thư mục:</span>
      <select class="select" id="lecFolder" style="width:130px; font-weight:600;">
        <option value="General">General</option>
        <option value="CNTT">CNTT</option>
        <option value="Toán">Toán</option>
        <option value="Vật lý">Vật lý</option>
        <option value="Ngoại ngữ">Ngoại ngữ</option>
      </select>
    </div>
  </div>

  <!-- Main Workflow Action Buttons -->
  <div class="lecture-action-row">
    <button class="step-btn ${LEC.lectureId ? '' : 'active'}" id="btnTranscribe" ${LEC.isTranscribing ? 'disabled' : ''}>
      <i data-lucide="mic" style="width:16px;height:16px;"></i> Chuyển giọng nói → Văn bản
    </button>
    <button class="step-btn" id="btnQuiz" ${!LEC.lectureId ? 'disabled' : ''}>
      <i data-lucide="check-square" style="width:16px;height:16px;"></i> Tạo bài kiểm tra trắc nghiệm
    </button>
    <button class="step-btn" id="btnCards" ${!LEC.lectureId ? 'disabled' : ''}>
      <i data-lucide="layers" style="width:16px;height:16px;"></i> Tạo bộ thẻ Flashcards
    </button>
    <button class="step-btn" id="btnExport" ${!LEC.lectureId ? 'disabled' : ''}>
      <i data-lucide="download" style="width:16px;height:16px;"></i> Xuất dữ liệu bài học
    </button>
  </div>

  <!-- Status / Progress Bar -->
  <div class="status-bar" id="lecStatusBar" style="display:none; border-radius: var(--radius-md); padding: 10px 18px;">
    <i data-lucide="loader-2" class="spin" style="width:18px;height:18px;color:var(--accent);"></i>
    <span class="status-text" id="lecStatusText" style="font-weight:700;">Đang xử lý bài giảng…</span>
    <div class="progress-inline" style="flex: 0 0 240px;">
      <div class="progress-wrap" style="height:8px;"><div class="progress-bar progress-accent" id="lecProgressBar" style="width:0%"></div></div>
    </div>
  </div>

  <!-- Content Tabs -->
  <div class="tabs">
    <div class="tab-nav" style="padding: 5px; gap: 6px; background:#e2e8f0; border-radius: var(--radius-lg);">
      <button class="tab-btn active" data-tab="transcript" style="display:inline-flex;align-items:center;gap:6px;">
        <i data-lucide="file-text" style="width:15px;height:15px;"></i> Bản ghi văn bản (Transcript)
      </button>
      <button class="tab-btn" data-tab="quiz" style="display:inline-flex;align-items:center;gap:6px;">
        <i data-lucide="check-circle-2" style="width:15px;height:15px;"></i> Bài kiểm tra trắc nghiệm (Quiz)
      </button>
      <button class="tab-btn" data-tab="chat" style="display:inline-flex;align-items:center;gap:6px;">
        <i data-lucide="message-square" style="width:15px;height:15px;"></i> Trợ lý Hỏi - Đáp AI (Q&amp;A)
      </button>
    </div>

    <div class="tab-panels">
      <!-- 1. Transcript Panel -->
      <div class="tab-panel" id="tab-transcript">
        <div id="transcriptBox" style="height:100%; overflow-y:auto; display:flex; flex-direction:column; gap:4px; padding: 4px;">
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); font-size:14px; gap:10px;">
            <i data-lucide="mic" style="width:48px;height:48px;opacity:0.35;"></i>
            <div style="font-weight:700; color:var(--text);">Chưa có bản ghi âm bài giảng nào</div>
            <div style="font-size:12px;">Hãy bấm "Chọn file âm thanh" bên trên rồi nhấn "Chuyển giọng nói → Văn bản"</div>
          </div>
        </div>
      </div>

      <!-- 2. Quiz Panel -->
      <div class="tab-panel hidden" id="tab-quiz">
        <div id="quizBox" style="overflow-y:auto; height:100%; padding: 6px 2px;">
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); font-size:13px; gap:10px;">
            <i data-lucide="check-circle" style="width:48px;height:48px;opacity:0.35;"></i>
            <div style="font-weight:700; color:var(--text);">Chưa có câu hỏi trắc nghiệm</div>
            <div style="font-size:12px;">Bấm nút "Tạo bài kiểm tra trắc nghiệm" bên trên để AI tự động trích xuất câu hỏi</div>
          </div>
        </div>
      </div>

      <!-- 3. Chat Q&A Panel -->
      <div class="tab-panel hidden" id="tab-chat">
        <div style="display:flex; flex-direction:column; height:100%; gap:12px;">
          <div class="chat-history" id="chatHistory">
            <div class="chat-msg chat-ai" style="max-width:90%; display:flex; gap:10px;">
              <i data-lucide="bot" style="width:20px;height:20px;flex-shrink:0;color:var(--accent);"></i>
              <div>Xin chào! Tôi là trợ lý AI học tập cục bộ. Bạn có thể đặt bất kỳ câu hỏi nào về nội dung bài giảng này, tôi sẽ đối chiếu ngữ cảnh và trả lời kèm mốc thời gian phát chính xác.</div>
            </div>
          </div>
          <div class="flex gap-2" style="flex-shrink:0;">
            <input class="input flex-1" id="chatInput" placeholder="Nhập câu hỏi cần giải đáp về bài giảng…" style="border-radius: var(--radius-md); font-size:13px;">
            <button class="btn btn-primary" id="chatSend" style="font-weight:700; padding:0 24px; display:inline-flex; align-items:center; gap:6px;">
              <i data-lucide="send" style="width:15px;height:15px;"></i> Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`;

  // Bind events
  el('lecPickAudio').addEventListener('click', pickAudio);
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

  // Restore state if returning to view
  if (LEC.lectureId) {
    loadLecture(LEC.lectureId);
  }
}

async function loadLecture(lectureId) {
  if (!el('btnTranscribe')) {
    renderLectureView();
  }
  LEC.lectureId = lectureId;
  try {
    const lec = await API.get_lecture(lectureId);
    if (!lec || !lec.id) return;
    
    LEC.audioPath = lec.audio_path || null;
    LEC.segments = lec.transcript || [];
    LEC.fullText = lec.full_text || '';
    LEC.quizData = null;
    LEC.quizAnswers = {};
    
    // Set folder dropdown if available
    if (el('lecFolder') && lec.folder_tag) {
      el('lecFolder').value = lec.folder_tag;
    }
    
    // Audio Player setup
    if (LEC.audioPath) {
      try {
        LEC.audioUrl = await API.get_audio_url(LEC.audioPath);
        const name = LEC.audioPath.split(/[\\/]/).pop() || lec.title;
        if (el('lecFileName')) el('lecFileName').textContent = name;
        if (el('lecAudio')) el('lecAudio').src = LEC.audioUrl;
        if (el('lecAudioPlayer')) el('lecAudioPlayer').style.display = 'flex';
      } catch (_) {
        if (el('lecAudioPlayer')) el('lecAudioPlayer').style.display = 'none';
      }
    } else {
      if (el('lecAudioPlayer')) el('lecAudioPlayer').style.display = 'none';
      if (el('lecAudio')) el('lecAudio').src = '';
    }
    
    // Render Transcript
    if (LEC.segments && LEC.segments.length > 0) {
      renderTranscript(LEC.segments);
    } else if (LEC.fullText && LEC.fullText.trim()) {
      renderTranscript([{ start: 0, text: LEC.fullText }]);
    } else {
      if (el('transcriptBox')) {
        el('transcriptBox').innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); font-size:14px; gap:10px;">
            <i data-lucide="file-text" style="width:48px;height:48px;opacity:0.35;"></i>
            <div style="font-weight:700; color:var(--text);">${escHtml(lec.title || 'Bài giảng')}</div>
            <div style="font-size:12px;">Bài giảng chưa có nội dung phiên âm. Hãy nhấn "Chuyển giọng nói → Văn bản"</div>
          </div>`;
      }
    }
    
    // Reset Chat & Quiz panels
    if (el('chatHistory')) {
      el('chatHistory').innerHTML = `
        <div class="chat-msg chat-ai" style="max-width:90%; display:flex; gap:10px;">
          <i data-lucide="bot" style="width:20px;height:20px;flex-shrink:0;color:var(--accent);"></i>
          <div>Xin chào! Tôi là trợ lý AI học tập cục bộ. Bạn có thể đặt bất kỳ câu hỏi nào về bài giảng <strong>${escHtml(lec.title || '')}</strong>, tôi sẽ đối chiếu ngữ cảnh và trả lời kèm mốc thời gian phát chính xác.</div>
        </div>`;
    }
    if (el('quizBox')) {
      el('quizBox').innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); font-size:13px; gap:10px;">
          <i data-lucide="check-circle" style="width:48px;height:48px;opacity:0.35;"></i>
          <div style="font-weight:700; color:var(--text);">Chưa có bài kiểm tra cho bài giảng này</div>
          <div style="font-size:12px;">Bấm nút "Tạo bài kiểm tra trắc nghiệm" bên trên để AI tự động trích xuất câu hỏi</div>
        </div>`;
    }
    
    switchTabTo('transcript');
    updateStepButtons();
    refreshIcons();
  } catch (e) {
    console.error('Error loading lecture:', e);
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

    const name = path.split(/[\\/]/).pop();
    el('lecFileName').textContent = name;
    el('lecAudio').src = LEC.audioUrl;
    el('lecAudioPlayer').style.display = 'flex';
    showToast(`✅ Đã chọn tệp: ${name}`, 'success');
  } catch (e) {
    showToast('Lỗi chọn file: ' + e.message, 'error');
  }
}

// ──────────────────────────────────────────
// Speech-to-Text Transcription
// ──────────────────────────────────────────
async function startTranscribe() {
  if (!LEC.audioPath) return showToast('Vui lòng chọn file âm thanh trước', 'warning');
  if (LEC.isTranscribing) return;

  LEC.isTranscribing = true;
  LEC.segments = [];
  LEC.fullText = '';

  showStatus('Đang nạp mô hình và phân tích giọng nói…', 0.05);
  el('transcriptBox').innerHTML = '<div style="color:var(--text-muted); padding:16px; font-size:13px;">Đang lắng nghe và trích xuất từng câu nói…</div>';

  const folder = el('lecFolder')?.value || 'General';
  const title  = (LEC.audioPath.split(/[\\/]/).pop()).replace(/\.[^.]+$/, '');

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
  LEC.segments  = data.segments || LEC.segments;
  LEC.fullText  = data.full_text || LEC.fullText;
  hideStatus();
  updateStepButtons();
  showToast(`✅ Phiên âm xong! Đã trích xuất ${LEC.segments.length} đoạn hội thoại.`, 'success', 3500);
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
  div.innerHTML = `<span class="seg-ts">${ts}</span><span class="seg-text">${escHtml(seg.text)}</span>`;
  el('transcriptBox').appendChild(div);
  el('transcriptBox').scrollTop = el('transcriptBox').scrollHeight;
}

function renderTranscript(segs) {
  if (!el('transcriptBox')) return;
  if (!segs || !segs.length) return;
  el('transcriptBox').innerHTML = segs.map(s =>
    `<div class="seg-line">
      <span class="seg-ts">${fmtDuration(s.start)}</span>
      <span class="seg-text">${escHtml(s.text)}</span>
    </div>`
  ).join('');
}

// ──────────────────────────────────────────
// Modal: Quiz Generation
// ──────────────────────────────────────────
async function showQuizModal() {
  if (!LEC.lectureId) return showToast('Hãy phiên âm bài giảng trước khi tạo kiểm tra', 'warning');

  const idx = await showModal(
    '🎯 Tùy chỉnh Bài kiểm tra Trắc nghiệm',
    `<div class="flex-col gap-4">
      <div>
        <label class="label" style="font-weight:700; margin-bottom:6px; display:block;">Số lượng câu hỏi trắc nghiệm</label>
        <select class="select w-full" id="quizNumSelect" style="font-size:13px; padding:8px 12px;">
          <option value="3">3 câu hỏi (Làm nhanh)</option>
          <option value="5" selected>5 câu hỏi (Tiêu chuẩn)</option>
          <option value="8">8 câu hỏi (Toàn diện)</option>
          <option value="10">10 câu hỏi (Đầy đủ)</option>
          <option value="15">15 câu hỏi (Chuyên sâu)</option>
        </select>
      </div>
      <div>
        <label class="label" style="font-weight:700; margin-bottom:6px; display:block;">Mức độ khó</label>
        <select class="select w-full" id="quizDiffSelect" style="font-size:13px; padding:8px 12px;">
          <option value="dễ">Dễ (Khái niệm cơ bản & định nghĩa)</option>
          <option value="trung bình" selected>Trung bình (Hiểu & Vận dụng kiến thức)</option>
          <option value="khó">Khó (Phân tích, suy luận & câu hỏi bẫy)</option>
        </select>
      </div>
    </div>`,
    [
      { label: 'Huỷ', class: 'btn-ghost' },
      { label: '🚀 Bắt đầu tạo câu hỏi', class: 'btn-primary' }
    ]
  );

  if (idx !== 1) return;

  const numQuestions = parseInt(el('quizNumSelect')?.value) || 5;
  const difficulty = el('quizDiffSelect')?.value || 'trung bình';

  showStatus(`AI đang sinh ${numQuestions} câu hỏi trắc nghiệm (${difficulty})…`, 0.25);
  LEC.quizData = null;
  LEC.quizAnswers = {};
  switchTabTo('quiz');
  el('quizBox').innerHTML = `<div style="text-align:center; padding:48px; color:var(--text-muted);"><div class="spin" style="font-size:32px; margin-bottom:12px;">⚙️</div><div style="font-weight:700; font-size:14px;">Đang biên soạn ${numQuestions} câu hỏi trắc nghiệm…</div><div style="font-size:12px; margin-top:4px;">Vui lòng đợi vài giây</div></div>`;

  await API.generate_quiz(LEC.lectureId, numQuestions, difficulty);
}

EventBus.on('quiz:done', ({ quiz }) => {
  hideStatus();
  const questions = Array.isArray(quiz) ? quiz : (quiz.questions || []);
  LEC.quizData = questions;
  renderQuiz(questions);
  switchTabTo('quiz');
  showToast(`✅ Đã tạo xong ${questions.length} câu hỏi trắc nghiệm!`, 'success');
});

EventBus.on('quiz:error', ({ message }) => {
  hideStatus();
  showToast('Lỗi sinh quiz: ' + message, 'error', 4000);
});

function renderQuiz(questions) {
  if (!el('quizBox')) return;
  if (!questions || !questions.length) {
    el('quizBox').innerHTML = `<div style="text-align:center; padding:36px; color:var(--danger);">Không có câu hỏi nào được tạo. Vui lòng thử lại.</div>`;
    return;
  }

  el('quizBox').innerHTML = `
    <div style="display:flex; flex-direction:column; gap:16px; padding:4px; max-width:800px; margin:0 auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; background:#ffffff; border:1px solid var(--border); padding:12px 18px; border-radius:var(--radius-lg);">
        <span style="font-weight:800; font-size:14px; color:var(--text);">📝 BÀI KIỂM TRA TRẮC NGHIỆM</span>
        <span class="badge badge-accent" style="font-size:12px;">Tổng: ${questions.length} câu</span>
      </div>

      ${questions.map((q, i) => {
        const opts = q.options || q.choices || [];
        return `
        <div class="quiz-card" id="qcard-${i}">
          <div class="quiz-num text-accent">CÂU ${i+1} / ${questions.length}</div>
          <div class="quiz-question">${escHtml(q.question)}</div>
          <div class="quiz-options">
            ${opts.map((o, oi) =>
              `<button class="quiz-opt" data-q="${i}" data-o="${oi}">${escHtml(typeof o === 'string' ? o : o.text || o)}</button>`
            ).join('')}
          </div>
          <div class="quiz-explanation" id="qexp-${i}">💡 <strong>Giải thích:</strong> ${escHtml(q.explanation || q.reason || '')}</div>
        </div>`;
      }).join('')}
      
      <button class="btn btn-primary" id="btnSubmitQuiz" style="padding:14px; font-size:15px; font-weight:800; border-radius:var(--radius-md); box-shadow:0 4px 14px rgba(37,99,235,0.25);">
        ✅ Nộp bài &amp; Chấm điểm ngay
      </button>
    </div>`;

  // Option selection
  el('quizBox').querySelectorAll('.quiz-opt').forEach(btn => {
    btn.addEventListener('click', function() {
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
                     : opts.findIndex(o => (o.correct || o.is_correct));
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
  
  const resultEl = document.createElement('div');
  resultEl.innerHTML = `
    <div class="card" style="text-align:center; padding:28px; border:2px solid var(--accent); border-radius:var(--radius-xl); box-shadow:var(--shadow-card);">
      <div style="font-size:42px; font-weight:800; color:var(--text);">${score} / ${questions.length}</div>
      <div style="margin:8px 0;"><span class="badge ${cls}" style="font-size:15px; padding:6px 24px;">${pct}% Chính xác</span></div>
      <p class="text-muted text-sm mt-3" style="font-size:13px;">${pct >= 80 ? '🎉 Xuất sắc! Bạn đã nắm rất vững kiến thức bài học.' : pct >= 50 ? '👍 Khá tốt! Hãy xem lại các câu sai bên dưới.' : '📚 Cần xem lại bài giảng và ôn tập thêm nhé.'}</p>
    </div>`;
  el('quizBox').prepend(resultEl);
  el('quizBox').scrollTop = 0;

  if (LEC.lectureId) {
    await API.save_quiz_result(LEC.lectureId, score, questions.length, 'trung bình', details);
  }
  showToast(`Kết quả kiểm tra: ${score}/${questions.length} (${pct}%)`, pct >= 70 ? 'success' : 'warning');
}

// ──────────────────────────────────────────
// Modal: Flashcard Generation
// ──────────────────────────────────────────
async function showCardsModal() {
  if (!LEC.lectureId) return showToast('Hãy phiên âm bài giảng trước khi tạo thẻ ghi nhớ', 'warning');

  const idx = await showModal(
    '📑 Tùy chỉnh Rút trích Thẻ Flashcards',
    `<div class="flex-col gap-3">
      <div>
        <label class="label" style="font-weight:700; margin-bottom:6px; display:block;">Số lượng thẻ Flashcard muốn rút trích</label>
        <select class="select w-full" id="cardsNumSelect" style="font-size:13px; padding:8px 12px;">
          <option value="5">5 thẻ ghi nhớ</option>
          <option value="8" selected>8 thẻ ghi nhớ (Khuyên dùng)</option>
          <option value="10">10 thẻ ghi nhớ</option>
          <option value="15">15 thẻ ghi nhớ (Chi tiết)</option>
          <option value="20">20 thẻ ghi nhớ (Đầy đủ nhất)</option>
        </select>
      </div>
      <p class="text-muted text-sm" style="font-size:12px; line-height:1.5;">
        AI sẽ tự động trích xuất các định nghĩa, thuật ngữ và khái niệm quan trọng nhất kèm gợi ý liên tưởng chuẩn Spaced Repetition (SM-2).
      </p>
    </div>`,
    [
      { label: 'Huỷ', class: 'btn-ghost' },
      { label: '🚀 Bắt đầu tạo thẻ', class: 'btn-primary' }
    ]
  );

  if (idx !== 1) return;

  const numCards = parseInt(el('cardsNumSelect')?.value) || 8;
  showStatus(`AI đang rút trích ${numCards} thẻ flashcards từ bài giảng…`, 0.3);
  await API.generate_flashcards(LEC.lectureId, numCards);
}

EventBus.on('flashcards:done', ({ count, deck_name }) => {
  hideStatus();
  showToast(`✅ Đã tạo thành công ${count} thẻ trong bộ "${deck_name}"! Bạn có thể vào mục "Thẻ ghi nhớ" để ôn tập.`, 'success', 5000);
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
  appendChat('ai', '<span class="spin">⚙️</span> Đang đối chiếu ngữ cảnh bài giảng…', true);
  await API.ask_rag(q, LEC.lectureId);
}

EventBus.on('rag:done', ({ answer, citations }) => {
  qs('.chat-thinking')?.remove();
  const citHtml = citations?.length
    ? `<div class="chat-citation">📌 Mốc thời gian liên quan: ${citations.map(c => `<span class="badge badge-accent" style="margin-right:4px;">${fmtDuration(c.start)}</span>`).join('')}</div>`
    : '';
  appendChat('ai', escHtml(answer).replace(/\n/g, '<br>') + citHtml);
});

EventBus.on('rag:error', ({ message }) => {
  qs('.chat-thinking')?.remove();
  appendChat('ai', `❌ ${escHtml(message)}`);
});

function appendChat(role, htmlContent, isThinking = false) {
  if (!el('chatHistory')) return;
  const div = document.createElement('div');
  div.className = `chat-msg chat-${role}${isThinking ? ' chat-thinking' : ''}`;
  div.innerHTML = htmlContent;
  el('chatHistory').appendChild(div);
  el('chatHistory').scrollTop = el('chatHistory').scrollHeight;
  return div;
}

// ──────────────────────────────────────────
// Export
// ──────────────────────────────────────────
async function showExportMenu() {
  if (!LEC.lectureId) return showToast('Cần có bài giảng để xuất', 'warning');
  const idx = await showModal(
    '📤 Xuất dữ liệu bài học',
    `<p class="text-muted text-sm mb-3">Chọn định dạng xuất bạn mong muốn:</p>`,
    [
      { label: '📄 Văn bản (.txt)', class: 'btn-ghost' },
      { label: '🌐 Báo cáo HTML', class: 'btn-ghost' },
      { label: '📦 Gói JSON (Đầy đủ)', class: 'btn-ghost' },
      { label: 'Huỷ', class: 'btn-ghost' },
    ]
  );
  if (idx === 3 || idx === -1) return;
  try {
    let result;
    if      (idx === 0) result = await API.export_txt(LEC.lectureId);
    else if (idx === 1) result = await API.export_html(LEC.lectureId);
    else if (idx === 2) result = await API.export_json(LEC.lectureId);

    if (result?.path)           showToast(`✅ Đã xuất thành công: ${result.path.split(/[\\/]/).pop()}`, 'success');
    else if (result?.cancelled) showToast('Đã huỷ xuất file', 'info');
    else if (result?.error)     showToast('Lỗi: ' + result.error, 'error');
  } catch (e) {
    showToast('Lỗi xuất file: ' + e.message, 'error');
  }
}

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────
function showStatus(text, progress = 0) {
  if (!el('lecStatusBar')) return;
  el('lecStatusBar').style.display = 'flex';
  el('lecStatusText').textContent = text;
  el('lecProgressBar').style.width = `${Math.round(progress * 100)}%`;
}

function updateProgress(progress) {
  if (el('lecProgressBar')) el('lecProgressBar').style.width = `${Math.round(progress * 100)}%`;
}

function hideStatus() {
  if (!el('lecStatusBar')) return;
  el('lecStatusBar').style.display = 'none';
}

function updateStepButtons() {
  const has = !!LEC.lectureId;
  ['btnQuiz','btnCards','btnExport'].forEach(id => {
    if (el(id)) el(id).disabled = !has;
  });
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

EventBus.on('llm:status', ({ text }) => { showStatus(text, 0.5); });

// ──────────────────────────────────────────
// Register View
// ──────────────────────────────────────────
registerView('lecture', {
  render: renderLectureView,
  onShow: () => {
    if (!el('btnTranscribe')) {
      renderLectureView();
    }
    if (LEC.lectureId) {
      loadLecture(LEC.lectureId);
    }
  },
});

