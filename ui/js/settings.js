/**
 * SPDX-FileCopyrightText: 2026 Open-mind Contributors
 * SPDX-License-Identifier: MIT
 *
 * Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
 * Distributed under the terms of the OSI-approved MIT License.
 */

/* ════════════════════════════════════════════
   Settings View — Open-mind
   AI Models · Interface · Data management
════════════════════════════════════════════ */
'use strict';

let sttModelsMeta = {};

function renderSettingsView() {
  const container = el('view-settings');
  if (!container) return;
  container.innerHTML = `
<div style="display:flex;flex-direction:column;gap:20px;padding-bottom:24px;">

  <div class="page-header">
    <div>
      <div class="page-title" style="display:flex;align-items:center;gap:10px;">
        <i data-lucide="settings" style="width:22px;height:22px;color:#4f46e5;"></i>
        Cài đặt & Cấu hình
      </div>
      <div class="page-subtitle">Quản lý mô hình AI Offline, thiết bị và dữ liệu ứng dụng</div>
    </div>
    <div style="display:flex;gap:8px;">
      <button class="btn btn-ghost btn-sm" id="settingsRefresh"
        style="display:inline-flex;align-items:center;gap:6px;">
        <i data-lucide="refresh-cw" style="width:14px;height:14px;"></i> Làm mới
      </button>
      <button class="btn btn-primary btn-sm" id="settingsSave"
        style="display:inline-flex;align-items:center;gap:6px;">
        <i data-lucide="save" style="width:14px;height:14px;"></i> Lưu cài đặt
      </button>
    </div>
  </div>

  <!-- Model status overview -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
    <!-- STT Status card -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">
          <i data-lucide="mic" style="width:16px;height:16px;color:#4f46e5;"></i>
          Nhận dạng Giọng nói (STT)
        </span>
        <div style="display:flex;align-items:center;gap:6px;">
          <div class="status-dot" id="sttStatusDot" style="background:var(--text-subtle);"></div>
          <span style="font-size:11px;color:var(--text-muted);" id="sttStatusLabel">—</span>
        </div>
      </div>
      <div style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.18);border-radius:var(--radius-md);padding:12px;margin-bottom:14px;font-size:12px;color:var(--text-muted);line-height:1.6;">
        Mô hình <strong style="color:#4338ca;">faster-whisper-small</strong> (~460 MB) được tối ưu cho bài giảng tiếng Việt học thuật, nhận diện chính xác thuật ngữ công nghệ (code-switching) và xử lý mượt trên CPU.
      </div>
      <div class="settings-row">
        <span class="settings-key">Thiết bị chạy STT</span>
        <select class="select" id="inWhisperDevice" style="width:180px;">
          <option value="cpu">CPU</option>
          <option value="cuda">GPU (NVIDIA CUDA)</option>
        </select>
      </div>
      <div class="settings-row">
        <span class="settings-key">Kiểu lượng tử hóa</span>
        <select class="select" id="inWhisperCompute" style="width:180px;">
          <option value="int8">int8 — Tối ưu CPU & RAM</option>
          <option value="float16">float16 — Mặc định GPU</option>
          <option value="float32">float32 — Chính xác cao</option>
        </select>
      </div>
      <div class="settings-row">
        <span class="settings-key">Trạng thái</span>
        <span class="settings-val" id="setWhisperStatus">—</span>
      </div>
    </div>

    <!-- LLM Status card -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">
          <i data-lucide="bot" style="width:16px;height:16px;color:#0891b2;"></i>
          Mô hình Ngôn ngữ (LLM)
        </span>
        <div style="display:flex;align-items:center;gap:6px;">
          <div class="status-dot" id="llmStatusDot" style="background:var(--text-subtle);"></div>
          <span style="font-size:11px;color:var(--text-muted);" id="llmStatusLabel">—</span>
        </div>
      </div>
      <div style="background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.18);border-radius:var(--radius-md);padding:12px;margin-bottom:14px;font-size:12px;color:var(--text-muted);line-height:1.6;">
        Mô hình <strong style="color:#0e7490;">Qwen 2.5 3B Instruct (Q4_K_M)</strong> (~1.9 GB) chạy hoàn toàn cục bộ qua llama.cpp — không gửi dữ liệu ra ngoài.
      </div>
      <div class="settings-row">
        <span class="settings-key">Mô hình LLM</span>
        <span class="settings-val" style="color:#0891b2;font-weight:700;">Qwen2.5-3B Q4_K_M GGUF</span>
      </div>
      <div class="settings-row">
        <span class="settings-key">Số luồng CPU</span>
        <input class="input" type="number" id="inLlmThreads" min="1" max="16"
          style="width:180px;" placeholder="4">
      </div>
      <div class="settings-row">
        <span class="settings-key">Kích thước Context</span>
        <select class="select" id="inLlmContext" style="width:180px;">
          <option value="2048">2048 tokens — Tiết kiệm RAM</option>
          <option value="4096" selected>4096 tokens — Khuyên dùng</option>
          <option value="8192">8192 tokens — Bài giảng dài</option>
        </select>
      </div>
      <div class="settings-row">
        <span class="settings-key">Trạng thái</span>
        <span class="settings-val" id="setLlmStatus">—</span>
      </div>
    </div>
  </div>

  <!-- Data & Privacy -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">
        <i data-lucide="database" style="width:16px;height:16px;color:#059669;"></i>
        Dữ liệu & Quyền riêng tư
      </span>
      <span class="badge badge-success" style="display:inline-flex;align-items:center;gap:4px;">
        <i data-lucide="shield-check" style="width:12px;height:12px;"></i> 100% Offline
      </span>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">
      <div style="background:var(--glass-light);border:1px solid var(--glass-border);border-radius:var(--radius-md);padding:14px;text-align:center;">
        <div style="display:flex;justify-content:center;margin-bottom:6px;"><i data-lucide="hard-drive" style="width:22px;height:22px;color:#4f46e5;"></i></div>
        <div style="font-size:12px;font-weight:700;color:var(--text);">Local Only</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Dữ liệu chỉ lưu trên máy bạn</div>
      </div>
      <div style="background:var(--glass-light);border:1px solid var(--glass-border);border-radius:var(--radius-md);padding:14px;text-align:center;">
        <div style="display:flex;justify-content:center;margin-bottom:6px;"><i data-lucide="shield-alert" style="width:22px;height:22px;color:#059669;"></i></div>
        <div style="font-size:12px;font-weight:700;color:var(--text);">Zero Telemetry</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Không gửi bất kỳ tracking nào</div>
      </div>
      <div style="background:var(--glass-light);border:1px solid var(--glass-border);border-radius:var(--radius-md);padding:14px;text-align:center;">
        <div style="display:flex;justify-content:center;margin-bottom:6px;"><i data-lucide="plane" style="width:22px;height:22px;color:#0891b2;"></i></div>
        <div style="font-size:12px;font-weight:700;color:var(--text);">Air-gap Ready</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Hoạt động không cần Internet</div>
      </div>
    </div>

    <div class="settings-row">
      <div>
        <div style="font-weight:600;font-size:13px;color:var(--text);">Cơ sở dữ liệu</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">SQLite WAL Mode — data/openmind.db</div>
      </div>
      <span class="badge badge-muted">SQLite v3</span>
    </div>
    <div class="settings-row">
      <div>
        <div style="font-weight:600;font-size:13px;color:var(--text);">Dữ liệu Mẫu (Demo)</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Nạp bài giảng DSA mẫu, 8 flashcards và lịch sử học tập 7 ngày</div>
      </div>
      <button class="btn btn-secondary btn-sm" id="btnSeedDemo"
        style="display:inline-flex;align-items:center;gap:6px;flex-shrink:0;">
        <i data-lucide="sparkles" style="width:13px;height:13px;color:#4f46e5;"></i> Nạp demo
      </button>
    </div>
  </div>

  <!-- About -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">
        <i data-lucide="info" style="width:16px;height:16px;color:#4f46e5;"></i>
        Thông tin Ứng dụng
      </span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;">
      <div class="settings-row" style="grid-column:1/-1;">
        <span class="settings-key">Tên ứng dụng</span>
        <span class="settings-val" style="font-family:var(--font-heading);letter-spacing:-0.01em;">Open-mind</span>
      </div>
      <div class="settings-row">
        <span class="settings-key">Phiên bản</span>
        <span class="badge badge-accent">v2.0.0</span>
      </div>
      <div class="settings-row">
        <span class="settings-key">Giấy phép</span>
        <span class="settings-val">MIT License</span>
      </div>
      <div class="settings-row">
        <span class="settings-key">STT Engine</span>
        <span class="badge badge-muted">faster-whisper-small</span>
      </div>
      <div class="settings-row">
        <span class="settings-key">LLM Engine</span>
        <span class="badge badge-muted">Qwen2.5-3B via llama.cpp</span>
      </div>
      <div class="settings-row">
        <span class="settings-key">UI Runtime</span>
        <span class="badge badge-muted">PyWebView + Vanilla JS</span>
      </div>
      <div class="settings-row">
        <span class="settings-key">SRS Algorithm</span>
        <span class="badge badge-muted">SuperMemo-2 (SM-2)</span>
      </div>
    </div>
  </div>

</div>`;

  el('settingsRefresh')?.addEventListener('click', loadSettings);
  el('settingsSave')?.addEventListener('click', saveSettings);
  el('btnSeedDemo')?.addEventListener('click', handleSeedDemo);

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
    if (el('inLlmContext'))     el('inLlmContext').value      = s.llm_context || 4096;

    const whisperOk = s.whisper_model_loaded;
    const llmOk     = s.llm_model_loaded;
    const llmAvail  = s.llm_available;

    // STT status dot
    if (el('sttStatusDot')) {
      el('sttStatusDot').className = `status-dot ${whisperOk ? 'online' : 'offline'}`;
    }
    if (el('sttStatusLabel')) {
      el('sttStatusLabel').textContent = whisperOk ? 'Sẵn sàng' : 'Chưa nạp';
    }
    if (el('setWhisperStatus')) {
      el('setWhisperStatus').innerHTML = whisperOk
        ? `<span style="color:#059669;font-weight:700;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="check-circle-2" style="width:14px;height:14px;"></i> Đã sẵn sàng</span>`
        : `<span style="color:#d97706;font-weight:600;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="clock" style="width:14px;height:14px;"></i> Sẽ tự nạp khi cần</span>`;
    }

    // LLM status dot
    if (el('llmStatusDot')) {
      el('llmStatusDot').className = `status-dot ${llmOk ? 'online' : llmAvail ? 'loading' : 'offline'}`;
    }
    if (el('llmStatusLabel')) {
      el('llmStatusLabel').textContent = llmOk ? 'Đã nạp' : llmAvail ? 'Sẵn sàng' : 'Không tìm thấy';
    }
    if (el('setLlmStatus')) {
      el('setLlmStatus').innerHTML = llmOk
        ? `<span style="color:#059669;font-weight:700;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="check-circle-2" style="width:14px;height:14px;"></i> Đã nạp</span>`
        : llmAvail
          ? `<span style="color:#d97706;font-weight:600;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="clock" style="width:14px;height:14px;"></i> Sẽ nạp khi tạo nội dung</span>`
          : `<span style="color:#dc2626;font-weight:700;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="alert-circle" style="width:14px;height:14px;"></i> Không tìm thấy GGUF</span>`;
    }

    refreshIcons();
  } catch (e) {
    showToast('Lỗi tải cài đặt: ' + e.message, 'error');
  }
}

async function saveSettings() {
  try {
    const newSettings = {
      whisper_size:        'small',
      whisper_device:       el('inWhisperDevice')?.value  || 'cpu',
      whisper_compute_type: el('inWhisperCompute')?.value || 'int8',
      llm_threads:          parseInt(el('inLlmThreads')?.value) || 4,
      llm_context_size:     parseInt(el('inLlmContext')?.value) || 4096,
    };
    const res = await API.save_settings?.(newSettings) || {};
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
