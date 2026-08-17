// ─── Settings Controller ──────────────────────────────────────────────────────

let sttModelsMeta = {};

function renderSettingsView() {
  const container = el('settingsView');
  container.innerHTML = `
  <div class="page-header">
    <div>
      <div class="page-title">Cài đặt & Cấu hình Hệ thống</div>
      <div class="page-subtitle">Quản lý tham số mô hình AI Offline, thiết bị tính toán và dữ liệu ứng dụng.</div>
    </div>
    <div style="display:flex;gap:8px;">
      <button class="btn btn-secondary btn-sm" id="settingsRefresh" style="display:inline-flex;align-items:center;gap:6px;">
        <i data-lucide="refresh-cw" style="width:14px;height:14px;"></i> Làm mới
      </button>
      <button class="btn btn-primary btn-sm" id="settingsSave" style="display:inline-flex;align-items:center;gap:6px;">
        <i data-lucide="save" style="width:14px;height:14px;"></i> Lưu cài đặt
      </button>
    </div>
  </div>

  <div class="settings-grid">
    <!-- STT -->
    <div class="settings-section">
      <h3 style="display:flex;align-items:center;gap:8px;">
        <i data-lucide="mic" style="width:16px;height:16px;color:var(--accent);"></i>
        <span>Mô hình Nhận dạng Giọng nói (Speech-to-Text)</span>
      </h3>
      <div class="settings-row">
        <span class="settings-key">Mô hình STT chuẩn</span>
        <div style="display:inline-flex;align-items:center;gap:8px;">
          <span class="badge badge-accent" style="font-size:12px;font-weight:600;padding:6px 12px;">
            faster-whisper-small (~460 MB)
          </span>
          <span class="badge badge-muted" style="font-size:11px;">Chuẩn hóa cố định</span>
        </div>
      </div>

      <!-- Trade-off description card -->
      <div id="whisperTradeoffCard" style="background:#f8fafc;border:1px solid var(--border);border-radius:var(--radius-md);padding:12px;margin:8px 0;font-size:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span class="badge badge-accent">Tốc độ: Cân bằng (~3x Realtime)</span>
          <span class="badge badge-muted">RAM tối thiểu: ≥ 6 GB</span>
        </div>
        <p style="color:var(--text-muted);line-height:1.5;margin:0;">
          Mô hình chuẩn <strong>faster-whisper-small</strong> được tối ưu hóa cho bài giảng tiếng Việt học thuật, nhận diện chính xác các thuật ngữ công nghệ tiếng Anh (code-switching) và xử lý mượt mà trên CPU.
        </p>
      </div>

      <div class="settings-row">
        <span class="settings-key">Thiết bị chạy STT</span>
        <select class="select" id="inWhisperDevice" style="width:200px">
          <option value="cpu">CPU</option>
          <option value="cuda">GPU (NVIDIA CUDA)</option>
        </select>
      </div>
      <div class="settings-row">
        <span class="settings-key">Kiểu lượng tử hóa</span>
        <select class="select" id="inWhisperCompute" style="width:200px">
          <option value="int8">int8 (Tối ưu CPU & RAM)</option>
          <option value="float16">float16 (Mặc định GPU)</option>
          <option value="float32">float32 (Độ chính xác cao)</option>
        </select>
      </div>
      <div class="settings-row">
        <span class="settings-key">Trạng thái STT</span>
        <span class="settings-val" id="setWhisperStatus">—</span>
      </div>
    </div>

    <!-- LLM -->
    <div class="settings-section">
      <h3 style="display:flex;align-items:center;gap:8px;">
        <i data-lucide="bot" style="width:16px;height:16px;color:var(--accent);"></i>
        <span>Mô hình Ngôn ngữ Lớn (LLM Qwen 2.5)</span>
      </h3>
      <div class="settings-row">
        <span class="settings-key">Mô hình LLM chuẩn</span>
        <span class="settings-val" style="font-weight:600;">Qwen2.5-3B-Instruct (Q4_K_M GGUF · ~1.9 GB)</span>
      </div>
      <div class="settings-row">
        <span class="settings-key">Số luồng CPU (Threads)</span>
        <input class="input" type="number" id="inLlmThreads" min="1" max="16" style="width:200px" />
      </div>
      <div class="settings-row">
        <span class="settings-key">Kích thước Context</span>
        <select class="select" id="inLlmContext" style="width:200px">
          <option value="2048">2048 tokens (Tiết kiệm RAM)</option>
          <option value="4096" selected>4096 tokens (Khuyên dùng)</option>
          <option value="8192">8192 tokens (Bài giảng dài)</option>
        </select>
      </div>
      <div class="settings-row">
        <span class="settings-key">Trạng thái LLM</span>
        <span class="settings-val" id="setLlmStatus">—</span>
      </div>
    </div>

    <!-- Storage & Data -->
    <div class="settings-section">
      <h3 style="display:flex;align-items:center;gap:8px;">
        <i data-lucide="database" style="width:16px;height:16px;color:var(--accent);"></i>
        <span>Dữ liệu & Thử nghiệm</span>
      </h3>
      <div class="settings-row">
        <div>
          <div style="font-weight:500;font-size:13px;">Dữ liệu Học tập Mẫu (Demo Data)</div>
          <div style="font-size:11px;color:var(--text-muted);">Nạp bài giảng mẫu Cấu trúc dữ liệu & Thuật toán, 8 flashcards SM-2 và lịch sử học tập 7 ngày.</div>
        </div>
        <button class="btn btn-secondary btn-sm" id="btnSeedDemo" style="display:inline-flex;align-items:center;gap:6px;">
          <i data-lucide="sparkles" style="width:14px;height:14px;color:var(--accent);"></i> Nạp dữ liệu mẫu
        </button>
      </div>
      <div class="settings-row">
        <span class="settings-key">Cơ sở dữ liệu</span>
        <span class="settings-val">SQLite (data/openmind.db)</span>
      </div>
      <div class="settings-row">
        <span class="settings-key">Thư mục AI Models</span>
        <span class="settings-val">models/ (faster-whisper-small & Qwen GGUF)</span>
      </div>
      <div class="settings-row">
        <span class="settings-key">Chế độ hoạt động</span>
        <span class="settings-val" style="color:var(--success);font-weight:600;">100% Offline (Không gửi dữ liệu ra ngoài)</span>
      </div>
    </div>

    <!-- About -->
    <div class="settings-section">
      <h3 style="display:flex;align-items:center;gap:8px;">
        <i data-lucide="info" style="width:16px;height:16px;color:var(--accent);"></i>
        <span>Thông tin Ứng dụng</span>
      </h3>
      <div class="settings-row">
        <span class="settings-key">Tên ứng dụng</span>
        <span class="settings-val" style="font-weight:700;">Open-mind Pro</span>
      </div>
      <div class="settings-row">
        <span class="settings-key">Phiên bản</span>
        <span class="settings-val">v2.0.0 (Release)</span>
      </div>
      <div class="settings-row">
        <span class="settings-key">Giấy phép</span>
        <span class="settings-val">MIT License</span>
      </div>
      <div class="settings-row">
        <span class="settings-key">Công nghệ cốt lõi</span>
        <span class="settings-val">faster-whisper-small · llama-cpp · SQLite · PyWebView</span>
      </div>
    </div>
  </div>
  `;

  el('settingsRefresh').addEventListener('click', loadSettings);
  el('settingsSave').addEventListener('click', saveSettings);
  el('btnSeedDemo').addEventListener('click', handleSeedDemo);

  loadSettings();
  refreshIcons();
}

async function handleSeedDemo() {
  try {
    showToast('Đang nạp dữ liệu học tập mẫu…', 'info');
    const res = await API.seed_demo_data(true);
    if (res.success) {
      showToast(res.message, 'success', 4000);
      refreshTopBar();
    } else {
      showToast(res.message, 'error');
    }
  } catch (e) {
    showToast('Lỗi khi nạp demo: ' + e.message, 'error');
  }
}

async function loadSettings() {
  try {
    const s = await API.get_settings();
    sttModelsMeta = s.whisper_models || {};

    if (el('inWhisperDevice'))  el('inWhisperDevice').value  = s.whisper_device || 'cpu';
    if (el('inWhisperCompute')) el('inWhisperCompute').value = s.whisper_compute_type || 'int8';
    if (el('inLlmThreads'))     el('inLlmThreads').value     = s.llm_threads || 4;
    if (el('inLlmContext'))     el('inLlmContext').value     = s.llm_context || 4096;

    const whisperOk = s.whisper_model_loaded;
    const llmOk     = s.llm_model_loaded;

    if (el('setWhisperStatus')) {
      el('setWhisperStatus').innerHTML = whisperOk
        ? `<span style="color:var(--success)">Đã sẵn sàng (small)</span>`
        : `<span style="color:var(--warning)">Sẽ tự nạp khi ghi âm/chuyển văn bản</span>`;
    }
    if (el('setLlmStatus')) {
      el('setLlmStatus').innerHTML = llmOk
        ? `<span style="color:var(--success)">Đã nạp</span>`
        : s.llm_available
          ? `<span style="color:var(--warning)">Sẽ nạp khi tạo bài giảng/hỏi đáp</span>`
          : `<span style="color:var(--danger)">Không tìm thấy file model GGUF</span>`;
    }
    refreshIcons();
  } catch (e) {
    showToast('Lỗi tải cài đặt: ' + e.message, 'error');
  }
}

async function saveSettings() {
  try {
    const newSettings = {
      whisper_size: 'small',
      whisper_device: el('inWhisperDevice').value,
      whisper_compute_type: el('inWhisperCompute').value,
      llm_threads: parseInt(el('inLlmThreads').value) || 4,
      llm_context_size: parseInt(el('inLlmContext').value) || 4096,
    };
    const res = await API.save_settings(newSettings);
    if (res.error) throw new Error(res.error);
    showToast('Đã lưu cấu hình thành công!', 'success');
  } catch (e) {
    showToast('Lỗi lưu cài đặt: ' + e.message, 'error');
  }
}

registerView('settings', {
  render: renderSettingsView,
  onShow: () => {
    if (!el('settingsRefresh')) renderSettingsView();
    else loadSettings();
  },
});
