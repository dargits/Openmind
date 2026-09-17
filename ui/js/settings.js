/**
 * SPDX-FileCopyrightText: 2026 Open-mind Contributors
 * SPDX-License-Identifier: MIT
 *
 * Purpose: Open-mind - Professional AI Study & Academic Lecture Copilot.
 * Distributed under the terms of the OSI-approved MIT License.
 */

/* ════════════════════════════════════════════
   Settings View — Open-mind Commercial Edition
   AI Engines · Speech Recognition · Storage · System
════════════════════════════════════════════ */
'use strict';

let sttModelsMeta = {};
let currentSettings = null;
let isLlmDownloading = false;

function renderSettingsView() {
  const container = el('view-settings');
  if (!container) return;
  container.innerHTML = `
<div style="display:flex;flex-direction:column;gap:20px;padding-bottom:32px;max-width:960px;margin:0 auto;">

  <!-- Header -->
  <div class="page-header" style="border-bottom:1px solid var(--glass-border);padding-bottom:16px;">
    <div>
      <div class="page-title" style="display:flex;align-items:center;gap:10px;font-size:20px;font-weight:700;">
        <i data-lucide="sliders" style="width:22px;height:22px;color:#4f46e5;"></i>
        Cài đặt Hệ thống
      </div>
      <div class="page-subtitle" style="font-size:13px;color:var(--text-muted);margin-top:3px;">
        Tùy biến động cơ trí tuệ nhân tạo, nhận diện giọng nói và quản trị dữ liệu
      </div>
    </div>
    <div style="display:flex;gap:8px;">
      <button class="btn btn-ghost btn-sm" id="settingsRefresh" style="display:inline-flex;align-items:center;gap:6px;">
        <i data-lucide="refresh-cw" style="width:14px;height:14px;"></i> Làm mới
      </button>
      <button class="btn btn-primary btn-sm" id="settingsSave" style="display:inline-flex;align-items:center;gap:6px;">
        <i data-lucide="check" style="width:14px;height:14px;"></i> Đã lưu tự động
      </button>
    </div>
  </div>

  <!-- 1. AI INTELLIGENCE ENGINE -->
  <div class="card" style="border: 1px solid var(--glass-border); background: var(--glass-card);">
    <div class="card-header">
      <span class="card-title" style="display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;">
        <i data-lucide="sparkles" style="width:18px;height:18px;color:#6366f1;"></i>
        Động cơ Trí tuệ Nhân tạo (AI Engine)
      </span>
      <span class="badge" id="hybridActiveBadge" style="background:rgba(99,102,241,0.1);color:#4f46e5;font-weight:600;">Đám mây</span>
    </div>

    <div class="settings-row" style="align-items:flex-start;">
      <div>
        <div class="settings-key" style="font-weight:600;">Chế độ xử lý ngôn ngữ</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
          Áp dụng cho Tóm tắt, Sơ đồ tư duy, Trắc nghiệm, Thẻ nhớ và Trợ lý Q&A
        </div>
      </div>
      <select class="select" id="inAiEngineMode" style="width:260px;font-weight:600;">
        <option value="cloud">⚡ Tăng tốc Đám mây (Khuyên dùng)</option>
        <option value="local">🖥️ Xử lý Cục bộ (On-device)</option>
      </select>
    </div>

    <!-- Cloud Sub-panel -->
    <div id="cloudSettingsPanel" style="margin-top:14px;padding-top:14px;border-top:1px dashed var(--glass-border);">
      <div class="settings-row">
        <span class="settings-key">Nhà cung cấp dịch vụ</span>
        <select class="select" id="inCloudProvider" style="width:260px;">
          <option value="gemini">Google Gemini API</option>
          <option value="openai_compatible">OpenAI Compatible (Groq, DeepSeek, OpenAI)</option>
        </select>
      </div>

      <!-- Gemini Section -->
      <div id="panelGeminiFields">
        <div class="settings-row">
          <div>
            <div class="settings-key">Google Gemini API Key</div>
            <div style="font-size:11px;color:var(--text-muted);">Khóa API cá nhân của bạn từ Google AI Studio</div>
          </div>
          <div style="display:flex;gap:6px;width:360px;">
            <input class="input" type="password" id="inGeminiKey" placeholder="Dán API Key tại đây…" style="flex:1;">
            <button class="btn btn-ghost btn-sm" id="toggleGeminiKey" type="button" title="Hiện/Ẩn Key"><i data-lucide="eye" style="width:14px;height:14px;"></i></button>
          </div>
        </div>
        <div class="settings-row">
          <span class="settings-key">Mô hình AI</span>
          <select class="select" id="inGeminiModel" style="width:280px;font-weight:600;">
            <option value="gemini-3.8-flash">Gemini 3.8 Flash (Thông minh nhất)</option>
            <option value="gemini-3.5-flash">Gemini 3.5 Flash (Cân bằng)</option>
            <option value="gemini-3.5-flash-lite" selected>Gemini 3.5 Flash Lite (500 lượt/ngày - Siêu tốc)</option>
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (500 lượt/ngày - Ổn định)</option>
          </select>
        </div>
      </div>

      <!-- OpenAI Compatible Section -->
      <div id="panelOpenAIFields" style="display:none;">
        <div class="settings-row">
          <div>
            <div class="settings-key">API Key</div>
            <div style="font-size:11px;color:var(--text-muted);">Khóa truy cập dịch vụ</div>
          </div>
          <div style="display:flex;gap:6px;width:360px;">
            <input class="input" type="password" id="inOpenAIKey" placeholder="sk-… / gsk_…" style="flex:1;">
            <button class="btn btn-ghost btn-sm" id="toggleOpenAIKey" type="button" title="Hiện/Ẩn Key"><i data-lucide="eye" style="width:14px;height:14px;"></i></button>
          </div>
        </div>
        <div class="settings-row">
          <span class="settings-key">Endpoint URL</span>
          <input class="input" type="text" id="inOpenAIBaseUrl" placeholder="https://api.groq.com/openai/v1" style="width:360px;">
        </div>
        <div class="settings-row">
          <span class="settings-key">Tên mô hình</span>
          <input class="input" type="text" id="inOpenAIModel" placeholder="gpt-4o-mini hoặc llama-3.3-70b-versatile" style="width:360px;">
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;">
        <div style="font-size:11px;color:var(--text-muted);">
          <i data-lucide="shield" style="width:12px;height:12px;display:inline-block;vertical-align:middle;"></i> API Key được lưu an toàn trên máy cục bộ của bạn
        </div>
        <button class="btn btn-secondary btn-sm" id="btnTestCloudConnection" style="display:inline-flex;align-items:center;gap:6px;">
          <i data-lucide="activity" style="width:14px;height:14px;color:#0891b2;"></i> Kiểm tra kết nối
        </button>
      </div>
      <div id="cloudTestResult" style="display:none;margin-top:12px;font-size:12px;padding:10px 14px;border-radius:var(--radius-md);"></div>
    </div>

    <!-- Local Sub-panel -->
    <div id="localSettingsPanel" style="display:none;margin-top:14px;padding-top:14px;border-top:1px dashed var(--glass-border);">
      <!-- On-Demand Model Download Box -->
      <div id="localLlmBox" style="margin-bottom:16px;padding:14px 16px;border-radius:var(--radius-md);background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.15);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
          <div style="flex:1;min-width:240px;">
            <div style="font-weight:700;font-size:13px;display:flex;align-items:center;gap:6px;" id="localLlmBoxTitle">
              <i data-lucide="cpu" style="width:16px;height:16px;color:#4f46e5;"></i>
              Mô hình Qwen 2.5 3B Instruct GGUF (~2.1 GB)
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px;line-height:1.5;" id="localLlmBoxDesc">
              Mô hình ngôn ngữ xử lý ngoại tuyến (Offline) 100% trên thiết bị, bảo mật tuyệt đối và không cần Internet.
            </div>
          </div>
          <div id="localLlmActionContainer" style="flex-shrink:0;margin-top:2px;">
            <!-- Dynamic button or badge -->
          </div>
        </div>

        <!-- Download progress bar container (hidden by default) -->
        <div id="localLlmProgressContainer" style="display:none;margin-top:14px;padding-top:12px;border-top:1px dashed rgba(99,102,241,0.2);">
          <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:6px;">
            <span id="localLlmProgressStatus" style="color:#4f46e5;">Đang chuẩn bị tải…</span>
            <span id="localLlmProgressPercent" style="color:var(--text);font-variant-numeric:tabular-nums;">0%</span>
          </div>
          <div style="width:100%;height:8px;background:rgba(99,102,241,0.12);border-radius:99px;overflow:hidden;margin-bottom:8px;">
            <div id="localLlmProgressBar" style="width:0%;height:100%;background:linear-gradient(90deg,#4f46e5,#06b6d4);border-radius:99px;transition:width 0.25s;"></div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span id="localLlmProgressDetails" style="font-size:11px;color:var(--text-muted);font-variant-numeric:tabular-nums;">0.0 / 2100.0 MB</span>
            <button class="btn btn-ghost btn-sm" id="btnCancelLlmDownload" type="button" style="font-size:11px;padding:2px 8px;color:#ef4444;height:24px;display:inline-flex;align-items:center;gap:4px;">
              <i data-lucide="x" style="width:12px;height:12px;"></i> Hủy tải
            </button>
          </div>
        </div>
      </div>

      <div class="settings-row">
        <span class="settings-key">Số luồng CPU</span>
        <input class="input" type="number" id="inLlmThreads" min="1" max="16" style="width:180px;" placeholder="4">
      </div>
      <div class="settings-row">
        <span class="settings-key">Kích thước ngữ cảnh (Context)</span>
        <select class="select" id="inLlmContext" style="width:220px;">
          <option value="2048">2048 tokens</option>
          <option value="4096" selected>4096 tokens (Chuẩn)</option>
          <option value="8192">8192 tokens (Mở rộng)</option>
        </select>
      </div>
      <div class="settings-row">
        <span class="settings-key">Trạng thái mô hình</span>
        <span class="settings-val" id="setLlmStatus">—</span>
      </div>
    </div>
  </div>

  <!-- 2. SPEECH RECOGNITION (STT) -->
  <div class="card" style="border: 1px solid var(--glass-border); background: var(--glass-card);">
    <div class="card-header">
      <span class="card-title" style="display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;">
        <i data-lucide="mic" style="width:18px;height:18px;color:#4f46e5;"></i>
        Nhận dạng Giọng nói trên Thiết bị (Speech Recognition)
      </span>
      <div style="display:flex;align-items:center;gap:6px;">
        <div class="status-dot" id="sttStatusDot" style="background:var(--text-subtle);"></div>
        <span style="font-size:12px;color:var(--text-muted);" id="sttStatusLabel">—</span>
      </div>
    </div>

    <div style="font-size:12px;color:var(--text-muted);line-height:1.6;margin-bottom:12px;">
      Âm thanh bài giảng được xử lý trực tiếp trên máy bằng <strong>faster-whisper-small</strong> với độ trễ thấp, hỗ trợ chuẩn hóa thuật ngữ chuyên ngành và bảo đảm file âm thanh không cần tải lên mạng.
    </div>

    <div class="settings-row">
      <span class="settings-key">Bộ vi xử lý âm thanh</span>
      <select class="select" id="inWhisperDevice" style="width:220px;">
        <option value="cpu">CPU</option>
        <option value="cuda">GPU (NVIDIA CUDA)</option>
      </select>
    </div>
    <div class="settings-row">
      <span class="settings-key">Phương thức lượng tử hóa</span>
      <select class="select" id="inWhisperCompute" style="width:220px;">
        <option value="int8">int8 — Tối ưu CPU & Bộ nhớ</option>
        <option value="float16">float16 — Cho GPU</option>
        <option value="float32">float32 — Tiêu chuẩn</option>
      </select>
    </div>
    <div class="settings-row">
      <span class="settings-key">Trạng thái STT</span>
      <span class="settings-val" id="setWhisperStatus">—</span>
    </div>
  </div>

  <!-- 3. AUTO-PIPELINE -->
  <div class="card" style="border: 1px solid var(--glass-border); background: var(--glass-card);">
    <div class="card-header">
      <span class="card-title" style="display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;">
        <i data-lucide="zap" style="width:18px;height:18px;color:#f59e0b;"></i>
        Xử lý Tự động (Auto-Pipeline)
      </span>
      <span class="badge" id="autoPipelineBadge" style="background:rgba(245,158,11,0.1);color:#d97706;font-weight:600;">Bật</span>
    </div>

    <div class="settings-row" style="align-items:flex-start;">
      <div>
        <div class="settings-key" style="font-weight:600;">Tự động tạo Tóm tắt + Quiz + Flashcards</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
          Sau khi phiên âm xong, AI sẽ tự động xử lý toàn bộ — không cần bấm thêm
        </div>
      </div>
      <label class="toggle-switch" title="Bật/tắt xử lý tự động" style="flex-shrink:0;">
        <input type="checkbox" id="inAutoProcess">
        <span class="toggle-slider"></span>
      </label>
    </div>

    <div id="autoPipelineOptions" style="margin-top:14px;padding-top:14px;border-top:1px dashed var(--glass-border);display:flex;flex-direction:column;gap:10px;">
      <div class="settings-row">
        <div>
          <div class="settings-key">Số câu Quiz tự động</div>
          <div style="font-size:11px;color:var(--text-muted);">Số câu hỏi trắc nghiệm khi pipeline chạy tự động</div>
        </div>
        <select class="select" id="inAutoPipelineQuizCount" style="width:180px;">
          <option value="3">3 câu — Nhanh</option>
          <option value="5">5 câu — Tiêu chuẩn</option>
          <option value="10">10 câu — Toàn diện</option>
        </select>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-key">Số Flashcard tự động</div>
          <div style="font-size:11px;color:var(--text-muted);">Số thẻ ghi nhớ khi pipeline chạy tự động</div>
        </div>
        <select class="select" id="inAutoPipelineCardCount" style="width:180px;">
          <option value="5">5 thẻ — Nhanh</option>
          <option value="10">10 thẻ — Tiêu chuẩn</option>
          <option value="15">15 thẻ — Đầy đủ</option>
          <option value="20">20 thẻ — Chuyên sâu</option>
        </select>
      </div>
    </div>
  </div>

  <!-- 4. LIBRARY & DATA -->
  <div class="card" style="border: 1px solid var(--glass-border); background: var(--glass-card);">
    <div class="card-header">
      <span class="card-title" style="display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;">
        <i data-lucide="database" style="width:18px;height:18px;color:#059669;"></i>
        Cơ sở Dữ liệu & Lưu trữ (Storage)
      </span>
      <span class="badge" style="background:rgba(5,150,105,0.1);color:#059669;font-weight:600;">SQLite WAL</span>
    </div>

    <div class="settings-row">
      <div>
        <div style="font-weight:600;font-size:13px;color:var(--text);">Nạp dữ liệu bài giảng mẫu</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
          Tạo bài giảng mẫu kèm đầy đủ tóm tắt, sơ đồ tư duy, flashcard và bài kiểm tra
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" id="btnSeedDemo" style="display:inline-flex;align-items:center;gap:6px;">
        <i data-lucide="download" style="width:14px;height:14px;"></i> Nạp dữ liệu mẫu
      </button>
    </div>
  </div>

  <!-- 4. ABOUT -->
  <div class="card" style="border: 1px solid var(--glass-border); background: var(--glass-card);">
    <div class="card-header">
      <span class="card-title" style="display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;">
        <i data-lucide="info" style="width:18px;height:18px;color:#8b5cf6;"></i>
        Thông tin Phiên bản
      </span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px;">
      <div class="settings-row">
        <span class="settings-key">Sản phẩm</span>
        <span class="settings-val" style="font-weight:600;">Open-mind Pro</span>
      </div>
      <div class="settings-row">
        <span class="settings-key">Phiên bản</span>
        <span class="badge badge-accent">v2.1 Pro</span>
      </div>
      <div class="settings-row">
        <span class="settings-key">Kiến trúc</span>
        <span class="settings-val">Hybrid (Local STT + Cloud/On-device LLM)</span>
      </div>
      <div class="settings-row">
        <span class="settings-key">Bản quyền</span>
        <span class="settings-val">MIT Open Source</span>
      </div>
    </div>
  </div>

</div>`;

  // Bind Events
  el('settingsRefresh')?.addEventListener('click', loadSettings);
  el('settingsSave')?.addEventListener('click', () => saveSettings(false));
  el('btnSeedDemo')?.addEventListener('click', handleSeedDemo);
  el('btnCancelLlmDownload')?.addEventListener('click', handleCancelLlmDownload);

  el('inCloudProvider')?.addEventListener('change', () => {
    updateProviderVisibility();
    saveSettings(true);
  });
  el('inAiEngineMode')?.addEventListener('change', () => {
    const mode = el('inAiEngineMode')?.value || 'cloud';
    updateModeDisplay();
    if (mode === 'local' && currentSettings && !currentSettings.llm_available && !isLlmDownloading) {
      showToast('ℹ️ Mô hình Offline (Qwen 2.5 ~2.1GB) chưa được cài đặt. Hãy bấm "Tải mô hình Offline" bên dưới để sử dụng.', 'warning', 5000);
    }
    saveSettings(true);
  });

  el('toggleGeminiKey')?.addEventListener('click', () => togglePasswordVisibility('inGeminiKey'));
  el('toggleOpenAIKey')?.addEventListener('click', () => togglePasswordVisibility('inOpenAIKey'));

  el('btnTestCloudConnection')?.addEventListener('click', handleTestConnection);

  // Auto-save listeners
  ['inGeminiKey', 'inOpenAIKey'].forEach(id => {
    el(id)?.addEventListener('blur', () => saveSettings(true));
    el(id)?.addEventListener('change', () => saveSettings(true));
  });
  ['inGeminiModel', 'inOpenAIBaseUrl', 'inOpenAIModel', 'inWhisperDevice', 'inWhisperCompute', 'inLlmThreads', 'inLlmContext'].forEach(id => {
    el(id)?.addEventListener('change', () => saveSettings(true));
  });

  // Auto-pipeline toggle
  el('inAutoProcess')?.addEventListener('change', () => {
    const isOn = el('inAutoProcess').checked;
    const opts = el('autoPipelineOptions');
    const badge = el('autoPipelineBadge');
    if (opts) opts.style.display = isOn ? 'flex' : 'none';
    if (badge) {
      badge.textContent = isOn ? 'Bật' : 'Tắt';
      badge.style.background = isOn ? 'rgba(245,158,11,0.1)' : 'rgba(148,163,184,0.1)';
      badge.style.color = isOn ? '#d97706' : '#94a3b8';
    }
    saveSettings(true);
  });
  ['inAutoPipelineQuizCount', 'inAutoPipelineCardCount'].forEach(id => {
    el(id)?.addEventListener('change', () => saveSettings(true));
  });

  loadSettings();
  refreshIcons();
}

function updateModeDisplay() {
  const mode = el('inAiEngineMode')?.value || 'cloud';
  const badge = el('hybridActiveBadge');
  const cloudPanel = el('cloudSettingsPanel');
  const localPanel = el('localSettingsPanel');

  if (mode === 'cloud') {
    if (badge) {
      badge.textContent = 'Đám mây';
      badge.style.background = 'rgba(6, 182, 212, 0.15)';
      badge.style.color = '#0891b2';
    }
    if (cloudPanel) cloudPanel.style.display = 'block';
    if (localPanel) localPanel.style.display = 'none';
  } else {
    if (badge) {
      badge.textContent = 'Cục bộ';
      badge.style.background = 'rgba(99, 102, 241, 0.12)';
      badge.style.color = '#4f46e5';
    }
    if (cloudPanel) cloudPanel.style.display = 'none';
    if (localPanel) localPanel.style.display = 'block';
  }
}

function updateProviderVisibility() {
  const prov = el('inCloudProvider')?.value || 'gemini';
  const geminiPanel = el('panelGeminiFields');
  const openaiPanel = el('panelOpenAIFields');
  if (prov === 'gemini') {
    if (geminiPanel) geminiPanel.style.display = 'block';
    if (openaiPanel) openaiPanel.style.display = 'none';
  } else {
    if (geminiPanel) geminiPanel.style.display = 'none';
    if (openaiPanel) openaiPanel.style.display = 'block';
  }
}

function togglePasswordVisibility(inputId) {
  const inp = el(inputId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

async function handleTestConnection() {
  const prov = el('inCloudProvider')?.value || 'gemini';
  const apiKey = prov === 'gemini' ? el('inGeminiKey')?.value : el('inOpenAIKey')?.value;
  const model = prov === 'gemini' ? el('inGeminiModel')?.value : el('inOpenAIModel')?.value;
  const baseUrl = prov === 'gemini' ? '' : el('inOpenAIBaseUrl')?.value;

  const resultBox = el('cloudTestResult');
  if (!apiKey || !apiKey.trim()) {
    showToast('Vui lòng nhập API Key trước khi kiểm tra!', 'warning');
    return;
  }

  if (resultBox) {
    resultBox.style.display = 'block';
    resultBox.style.background = 'rgba(99, 102, 241, 0.08)';
    resultBox.style.color = 'var(--text)';
    resultBox.innerHTML = '⏳ Đang xác thực kết nối API…';
  }

  try {
    const res = await API.test_cloud_connection(prov, apiKey, model, baseUrl);
    if (res.ok) {
      await saveSettings(true);
      if (resultBox) {
        resultBox.style.background = 'rgba(16, 185, 129, 0.12)';
        resultBox.style.color = '#065f46';
        resultBox.innerHTML = `<strong>${escHtml(res.message)}</strong><div style="font-size:11px;margin-top:3px;color:#047857;">Cấu hình đã được lưu và sẵn sàng hoạt động.</div>`;
      }
      showToast('Kết nối thành công & đã tự động lưu cấu hình!', 'success');
    } else {
      if (resultBox) {
        resultBox.style.background = 'rgba(239, 68, 68, 0.12)';
        resultBox.style.color = '#991b1b';
        resultBox.innerHTML = `<strong>${escHtml(res.message)}</strong>`;
      }
      showToast('Không thể kết nối đến Cloud API', 'error');
    }
  } catch (err) {
    if (resultBox) {
      resultBox.style.background = 'rgba(239, 68, 68, 0.12)';
      resultBox.style.color = '#991b1b';
      resultBox.innerHTML = `<strong>Lỗi: ${escHtml(err.message)}</strong>`;
    }
    showToast('Lỗi kiểm tra kết nối', 'error');
  }
}

async function handleSeedDemo() {
  try {
    showToast('Đang nạp dữ liệu học tập mẫu…', 'info');
    const res = await API.seed_demo_data(true);
    if (res.success) {
      showToast(res.message, 'success', 3500);
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
    currentSettings = s;
    sttModelsMeta = s.whisper_models || {};

    if (el('inWhisperDevice'))  el('inWhisperDevice').value  = s.whisper_device || 'cpu';
    if (el('inWhisperCompute')) el('inWhisperCompute').value = s.whisper_compute_type || 'int8';
    if (el('inLlmThreads'))     el('inLlmThreads').value     = s.llm_threads || 4;
    if (el('inLlmContext'))     el('inLlmContext').value      = s.llm_context || 4096;

    // Hybrid fields
    if (el('inAiEngineMode'))   el('inAiEngineMode').value   = s.ai_engine_mode || 'cloud';
    if (el('inCloudProvider'))  el('inCloudProvider').value  = s.cloud_provider || 'gemini';
    if (el('inGeminiKey'))      el('inGeminiKey').value      = s.gemini_api_key || '';
    if (el('inGeminiModel'))    el('inGeminiModel').value    = s.gemini_model || 'gemini-3.5-flash-lite';
    if (el('inOpenAIKey'))      el('inOpenAIKey').value      = s.openai_api_key || '';
    if (el('inOpenAIBaseUrl'))  el('inOpenAIBaseUrl').value  = s.openai_base_url || 'https://api.openai.com/v1';
    if (el('inOpenAIModel'))    el('inOpenAIModel').value    = s.openai_model || 'gpt-4o-mini';

    // Auto-Pipeline fields
    const autoOn = s.auto_process !== false;
    if (el('inAutoProcess'))             el('inAutoProcess').checked = autoOn;
    if (el('inAutoPipelineQuizCount'))   el('inAutoPipelineQuizCount').value = String(s.auto_process_quiz_count || 5);
    if (el('inAutoPipelineCardCount'))   el('inAutoPipelineCardCount').value = String(s.auto_process_card_count || 10);
    const opts = el('autoPipelineOptions');
    const badge = el('autoPipelineBadge');
    if (opts) opts.style.display = autoOn ? 'flex' : 'none';
    if (badge) {
      badge.textContent = autoOn ? 'Bật' : 'Tắt';
      badge.style.background = autoOn ? 'rgba(245,158,11,0.1)' : 'rgba(148,163,184,0.1)';
      badge.style.color = autoOn ? '#d97706' : '#94a3b8';
    }

    updateModeDisplay();
    updateProviderVisibility();

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
        ? `<span style="color:#059669;font-weight:600;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="check-circle-2" style="width:14px;height:14px;"></i> Sẵn sàng</span>`
        : `<span style="color:var(--text-muted);display:inline-flex;align-items:center;gap:4px;"><i data-lucide="clock" style="width:14px;height:14px;"></i> Tự nạp khi xử lý bài giảng</span>`;
    }

    updateLocalLlmUi(s);
    refreshIcons();
  } catch (e) {
    showToast('Lỗi tải cài đặt: ' + e.message, 'error');
  }
}

function updateLocalLlmUi(s) {
  const llmOk = s?.llm_model_loaded;
  const llmAvail = s?.llm_available;
  const downloading = isLlmDownloading || s?.llm_downloading;

  const actionContainer = el('localLlmActionContainer');
  const progressContainer = el('localLlmProgressContainer');
  const boxDesc = el('localLlmBoxDesc');

  if (downloading) {
    if (progressContainer) progressContainer.style.display = 'block';
    if (actionContainer) {
      actionContainer.innerHTML = `<span class="badge" style="background:rgba(99,102,241,0.15);color:#4f46e5;font-weight:600;display:inline-flex;align-items:center;gap:6px;">
        <i data-lucide="loader-2" class="spin" style="width:13px;height:13px;"></i> Đang tải (~2.1 GB)…
      </span>`;
    }
  } else if (llmAvail) {
    if (progressContainer) progressContainer.style.display = 'none';
    if (actionContainer) {
      actionContainer.innerHTML = `<span class="badge" style="background:rgba(16,185,129,0.12);color:#059669;font-weight:600;display:inline-flex;align-items:center;gap:4px;">
        <i data-lucide="check-circle-2" style="width:13px;height:13px;"></i> Đã cài đặt
      </span>`;
    }
    if (boxDesc) {
      boxDesc.textContent = 'Mô hình đã sẵn sàng hoạt động 100% ngoại tuyến trên thiết bị của bạn.';
    }
  } else {
    if (progressContainer) progressContainer.style.display = 'none';
    if (actionContainer) {
      actionContainer.innerHTML = `<button class="btn btn-primary btn-sm" id="btnDownloadLocalLlm" type="button" style="display:inline-flex;align-items:center;gap:6px;font-weight:600;">
        <i data-lucide="hard-drive-download" style="width:14px;height:14px;"></i> Tải mô hình Offline (~2.1 GB)
      </button>`;
      el('btnDownloadLocalLlm')?.addEventListener('click', handleStartLlmDownload);
    }
    if (boxDesc) {
      boxDesc.textContent = 'Chưa có file mô hình trên máy. Nhấn nút tải về để sử dụng các tính năng AI không cần mạng.';
    }
  }

  // LLM status row
  if (el('setLlmStatus')) {
    el('setLlmStatus').innerHTML = llmOk
      ? `<span style="color:#059669;font-weight:600;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="check-circle-2" style="width:14px;height:14px;"></i> Đã nạp vào bộ nhớ</span>`
      : llmAvail
        ? `<span style="color:#0891b2;font-weight:600;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="check" style="width:14px;height:14px;"></i> Sẵn sàng nạp khi cần</span>`
        : downloading
          ? `<span style="color:#6366f1;font-weight:600;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="loader-2" class="spin" style="width:14px;height:14px;"></i> Đang tải về máy…</span>`
          : `<span style="color:#dc2626;font-weight:600;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="alert-circle" style="width:14px;height:14px;"></i> Chưa tải về</span>`;
  }
}

async function handleStartLlmDownload() {
  if (isLlmDownloading) return;
  isLlmDownloading = true;
  updateLocalLlmUi(currentSettings);

  const progContainer = el('localLlmProgressContainer');
  if (progContainer) progContainer.style.display = 'block';
  if (el('localLlmProgressStatus')) el('localLlmProgressStatus').textContent = 'Đang kết nối máy chủ HuggingFace…';
  if (el('localLlmProgressPercent')) el('localLlmProgressPercent').textContent = '0%';
  if (el('localLlmProgressBar')) el('localLlmProgressBar').style.width = '0%';
  if (el('localLlmProgressDetails')) el('localLlmProgressDetails').textContent = 'Khởi tạo tiến trình tải (~2.1 GB)…';

  try {
    const res = await API.download_local_llm();
    if (res.status === 'already_available') {
      isLlmDownloading = false;
      showToast(res.message, 'success');
      await loadSettings();
    }
  } catch (err) {
    isLlmDownloading = false;
    showToast('Lỗi khi tải mô hình: ' + err.message, 'error');
    updateLocalLlmUi(currentSettings);
  }
}

async function handleCancelLlmDownload() {
  try {
    const res = await API.cancel_local_llm_download();
    if (res.ok) {
      showToast('Đang hủy tiến trình tải…', 'info');
    }
  } catch (err) {
    showToast('Không thể hủy: ' + err.message, 'error');
  }
}

// EventBus Listeners for Local LLM download
EventBus.on('llm_download:start', () => {
  isLlmDownloading = true;
  updateLocalLlmUi(currentSettings);
  refreshIcons();
});

EventBus.on('llm_download:progress', (data) => {
  isLlmDownloading = true;
  const progContainer = el('localLlmProgressContainer');
  if (progContainer) progContainer.style.display = 'block';
  if (el('localLlmProgressStatus')) el('localLlmProgressStatus').textContent = data.text || 'Đang tải…';
  if (el('localLlmProgressPercent')) el('localLlmProgressPercent').textContent = `${data.percent || 0}%`;
  if (el('localLlmProgressBar')) el('localLlmProgressBar').style.width = `${Math.min(100, Math.max(0, data.percent || 0))}%`;
  if (el('localLlmProgressDetails')) {
    const spd = data.speed ? ` • ${data.speed}` : '';
    el('localLlmProgressDetails').textContent = `${data.downloaded_mb || 0} / ${data.total_mb || 2100} MB${spd}`;
  }
});

EventBus.on('llm_download:done', (data) => {
  isLlmDownloading = false;
  showToast(data.message || '✓ Đã tải và cài đặt mô hình Offline thành công!', 'success', 4000);
  loadSettings();
});

EventBus.on('llm_download:cancelled', (data) => {
  isLlmDownloading = false;
  showToast(data.message || 'Đã hủy tải mô hình.', 'info');
  loadSettings();
});

EventBus.on('llm_download:error', (data) => {
  isLlmDownloading = false;
  showToast(data.message || 'Lỗi tải mô hình.', 'error', 4000);
  loadSettings();
});

async function saveSettings(silent = false) {
  try {
    const newSettings = {
      whisper_size:        'small',
      whisper_device:       el('inWhisperDevice')?.value  || 'cpu',
      whisper_compute_type: el('inWhisperCompute')?.value || 'int8',
      llm_threads:          parseInt(el('inLlmThreads')?.value) || 4,
      llm_context_size:     parseInt(el('inLlmContext')?.value) || 4096,
      // Hybrid settings
      ai_engine_mode:       el('inAiEngineMode')?.value   || 'cloud',
      cloud_provider:       el('inCloudProvider')?.value  || 'gemini',
      gemini_api_key:       el('inGeminiKey')?.value?.trim() || '',
      gemini_model:         el('inGeminiModel')?.value    || 'gemini-3.5-flash-lite',
      openai_api_key:       el('inOpenAIKey')?.value?.trim() || '',
      openai_base_url:      el('inOpenAIBaseUrl')?.value?.trim() || 'https://api.openai.com/v1',
      openai_model:         el('inOpenAIModel')?.value?.trim() || 'gpt-4o-mini',
      // Auto-Pipeline
      auto_process:         el('inAutoProcess')?.checked ?? true,
      auto_process_quiz_count: parseInt(el('inAutoPipelineQuizCount')?.value) || 5,
      auto_process_card_count: parseInt(el('inAutoPipelineCardCount')?.value) || 10,
    };

    const res = await API.save_settings?.(newSettings) || {};
    if (res.error) throw new Error(res.error);

    updateModeDisplay();
    if (!silent) {
      showToast('Đã lưu cài đặt thành công!', 'success');
    }
  } catch (e) {
    if (!silent) {
      showToast('Lỗi lưu cài đặt: ' + e.message, 'error');
    }
  }
}

registerView('settings', {
  render: renderSettingsView,
  onShow: () => {
    if (!el('settingsRefresh')) renderSettingsView();
    else loadSettings();
  },
});
