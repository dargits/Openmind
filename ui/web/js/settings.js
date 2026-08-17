/* ════════════════════════════════════════════
   Settings View — Open-mind Pro
════════════════════════════════════════════ */
'use strict';

let sttModelsMeta = {};

async function renderSettingsView() {
  el('view-settings').innerHTML = `
<div style="display:flex;flex-direction:column;gap:16px;max-width:760px;">
  <div class="section-header">
    <h2 class="section-title" style="display:inline-flex;align-items:center;gap:8px;">
      <i data-lucide="settings" style="width:20px;height:20px;color:var(--accent);"></i>
      <span>Cài đặt hệ thống</span>
    </h2>
    <div style="display:flex;gap:8px;">
      <button class="btn btn-ghost btn-sm" id="settingsRefresh" style="display:inline-flex;align-items:center;gap:6px;">
        <i data-lucide="rotate-ccw" style="width:14px;height:14px;"></i> Làm mới
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
        <span>Mô hình Nhận dạng Giọng nói (Whisper)</span>
      </h3>
      <div class="settings-row">
        <span class="settings-key">Cỡ mô hình STT</span>
        <select class="select" id="inWhisperSize" style="width:200px">
          <option value="tiny">Tiny (~75 MB)</option>
          <option value="base">Base (~145 MB)</option>
          <option value="small" selected>Small (~460 MB) [Khuyên dùng]</option>
          <option value="medium">Medium (~1.5 GB)</option>
        </select>
      </div>

      <!-- Trade-off description card -->
      <div id="whisperTradeoffCard" style="background:#f8fafc;border:1px solid var(--border);border-radius:var(--radius-md);padding:12px;margin:8px 0;font-size:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span id="sttSpeedBadge" class="badge badge-accent">Tốc độ: ~3x</span>
          <span id="sttRamBadge" class="badge badge-muted">RAM tối thiểu: 6GB</span>
        </div>
        <p id="sttDescText" style="color:var(--text-muted);line-height:1.5;margin:0;">Cân bằng tối ưu giữa tốc độ và độ chính xác cho tiếng Việt học thuật & thuật ngữ tiếng Anh.</p>
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
        <i data-lucide="cpu" style="width:16px;height:16px;color:var(--accent);"></i>
        <span>Mô hình Ngôn ngữ (Qwen 2.5 3B)</span>
      </h3>
      <div class="settings-row">
        <span class="settings-key">Số luồng CPU</span>
        <input type="number" class="input" id="inLlmThreads" style="width:200px" min="1" max="32">
      </div>
      <div class="settings-row">
        <span class="settings-key">Kích thước context</span>
        <select class="select" id="inLlmContext" style="width:200px">
          <option value="2048">2048 tokens (Nhanh, an toàn)</option>
          <option value="4096" selected>4096 tokens (Tiêu chuẩn)</option>
          <option value="8192">8192 tokens (Bài giảng dài)</option>
        </select>
      </div>
      <div class="settings-row">
        <span class="settings-key">Trạng thái LLM</span>
        <span class="settings-val" id="setLlmStatus">—</span>
      </div>
    </div>

    <!-- Demo Data & About -->
    <div class="settings-section" style="grid-column:1/-1">
      <h3 style="display:flex;align-items:center;gap:8px;">
        <i data-lucide="sparkles" style="width:16px;height:16px;color:var(--accent);"></i>
        <span>Dữ liệu kiểm thử & Trải nghiệm (Demo Data)</span>
      </h3>
      <div class="settings-row">
        <div>
          <div style="font-weight:600;color:var(--text);">Nạp bài giảng học thuật mẫu (Cấu trúc Dữ liệu & Giải thuật)</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
            Tự động nạp 1 bài giảng đầy đủ (Transcript + Quiz + 8 Flashcards + Lịch sử Streak) giúp ban giám khảo trải nghiệm tức thì.
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" id="btnSeedDemo" style="border-color:var(--accent-border);color:var(--accent);display:inline-flex;align-items:center;gap:6px;">
          <i data-lucide="database" style="width:14px;height:14px;"></i> Nạp dữ liệu Demo
        </button>
      </div>
    </div>

    <!-- About -->
    <div class="settings-section" style="grid-column:1/-1">
      <h3 style="display:flex;align-items:center;gap:8px;">
        <i data-lucide="info" style="width:16px;height:16px;color:var(--accent);"></i>
        <span>Thông tin ứng dụng</span>
      </h3>
      <div class="settings-row">
        <span class="settings-key">Khởi động lại khi đổi model</span>
        <span class="settings-val text-warning">Khuyên bạn khởi động lại ứng dụng khi thay đổi cỡ model STT để giải phóng RAM tối ưu.</span>
      </div>
      <div class="settings-row">
        <span class="settings-label">Phiên bản</span>
        <span class="settings-val">Open-mind v2.0 (Cuộc thi AI Mã nguồn mở)</span>
      </div>
      <div class="settings-row">
        <span class="settings-key">Công nghệ</span>
        <span class="settings-val">faster-whisper · llama-cpp · SQLite · PyWebView · 100% Offline</span>
      </div>
    </div>
  </div>
</div>`;

  el('settingsRefresh').addEventListener('click', loadSettings);
  el('settingsSave').addEventListener('click', saveSettings);
  el('btnSeedDemo').addEventListener('click', handleSeedDemo);
  
  el('inWhisperSize').addEventListener('change', (e) => {
    updateWhisperTradeoffUI(e.target.value);
  });

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

function updateWhisperTradeoffUI(selectedSize) {
  const meta = sttModelsMeta[selectedSize];
  if (!meta) return;
  if (el('sttSpeedBadge')) el('sttSpeedBadge').textContent = `Tốc độ: ${meta.speed}`;
  if (el('sttRamBadge')) el('sttRamBadge').textContent = `RAM tối thiểu: ${meta.min_ram}`;
  if (el('sttDescText')) el('sttDescText').textContent = meta.description;
}

async function loadSettings() {
  try {
    const s = await API.get_settings();
    sttModelsMeta = s.whisper_models || {};

    if (el('inWhisperSize')) {
      el('inWhisperSize').value = s.whisper_size || 'small';
      updateWhisperTradeoffUI(s.whisper_size || 'small');
    }
    if (el('inWhisperDevice'))  el('inWhisperDevice').value  = s.whisper_device || 'cpu';
    if (el('inWhisperCompute')) el('inWhisperCompute').value = s.whisper_compute_type || 'int8';
    if (el('inLlmThreads'))     el('inLlmThreads').value     = s.llm_threads || 4;
    if (el('inLlmContext'))     el('inLlmContext').value     = s.llm_context || 4096;

    const whisperOk = s.whisper_model_loaded;
    const llmOk     = s.llm_model_loaded;

    if (el('setWhisperStatus')) {
      el('setWhisperStatus').innerHTML = whisperOk
        ? `<span style="color:var(--success)">Đã sẵn sàng (${s.whisper_size})</span>`
        : `<span style="color:var(--warning)">Chưa tải</span>`;
    }
    if (el('setLlmStatus')) {
      el('setLlmStatus').innerHTML = llmOk
        ? `<span style="color:var(--success)">Đã tải</span>`
        : s.llm_available
          ? `<span style="color:var(--warning)">Chưa tải — Sẽ nạp khi tạo bài giảng</span>`
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
      whisper_size: el('inWhisperSize').value,
      whisper_device: el('inWhisperDevice').value,
      whisper_compute_type: el('inWhisperCompute').value,
      llm_threads: parseInt(el('inLlmThreads').value) || 4,
      llm_context_size: parseInt(el('inLlmContext').value) || 4096,
    };
    const res = await API.save_settings(newSettings);
    if (res.error) throw new Error(res.error);
    showToast('Đã lưu cấu hình! Model STT: ' + newSettings.whisper_size.toUpperCase(), 'success');
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
