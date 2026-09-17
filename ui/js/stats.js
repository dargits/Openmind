/**
 * SPDX-FileCopyrightText: 2026 Open-mind Contributors
 * SPDX-License-Identifier: MIT
 *
 * Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
 * Distributed under the terms of the OSI-approved MIT License.
 */

/* ════════════════════════════════════════════
   Stats View — Open-mind
   Achievements · Heatmap · Rich charts
════════════════════════════════════════════ */
'use strict';

async function renderStatsView() {
  el('view-stats').innerHTML = `
<div style="display:flex;flex-direction:column;gap:20px;padding-bottom:24px;">

  <div class="page-header">
    <div>
      <div class="page-title" style="display:flex;align-items:center;gap:10px;">
        <i data-lucide="trending-up" style="width:22px;height:22px;color:#4f46e5;"></i>
        Tiến độ & Thống kê
      </div>
      <div class="page-subtitle">Theo dõi hành trình học tập của bạn</div>
    </div>
    <button class="btn btn-secondary btn-sm" id="statsRefresh"
      style="display:inline-flex;align-items:center;gap:6px;">
      <i data-lucide="rotate-ccw" style="width:14px;height:14px;"></i> Làm mới
    </button>
  </div>

  <!-- Metric cards -->
  <div class="stats-metrics" id="statsMetrics">
    ${['','','',''].map(() => `
      <div class="metric-card">
        <div class="shimmer" style="width:36px;height:36px;border-radius:10px;margin-bottom:14px;"></div>
        <div class="shimmer" style="height:14px;width:50%;border-radius:4px;margin-bottom:6px;"></div>
        <div class="shimmer" style="height:32px;width:70%;border-radius:6px;margin-bottom:4px;"></div>
        <div class="shimmer" style="height:12px;width:60%;border-radius:4px;"></div>
      </div>
    `).join('')}
  </div>

  <!-- Card state row -->
  <div class="state-row" id="statsStates"></div>

  <!-- Bar chart -->
  <div class="chart-wrap">
    <div class="chart-title">
      <i data-lucide="calendar" style="width:17px;height:17px;color:#4f46e5;"></i>
      Hoạt động học tập 14 ngày gần nhất
    </div>
    <div class="chart-bars" id="statsChart"></div>
  </div>

  <!-- Analytical Section: 7-Day Review Forecast & Forgetting Curve -->
  <div class="grid-2">
    <!-- 7-Day Review Forecast Calendar -->
    <div class="card" style="display:flex;flex-direction:column;">
      <div class="card-header">
        <span class="card-title">
          <i data-lucide="calendar-days" style="width:16px;height:16px;color:#4f46e5;"></i>
          Dự báo ôn tập 7 ngày tới
        </span>
        <span class="badge badge-accent" id="statsForecastTotal">0 thẻ</span>
      </div>
      <div class="forecast-container" id="statsForecastContent" style="padding:8px 0;flex:1;display:flex;flex-direction:column;justify-content:center;"></div>
    </div>

    <!-- Ebbinghaus Forgetting Curve & Memory Retention -->
    <div class="card" style="display:flex;flex-direction:column;">
      <div class="card-header">
        <span class="card-title">
          <i data-lucide="activity" style="width:16px;height:16px;color:#0891b2;"></i>
          Độ bền trí nhớ & Đường cong lãng quên
        </span>
        <span class="badge badge-success" id="statsRetentionBadge">85% ghi nhớ</span>
      </div>
      <div class="forgetting-curve-wrap" id="statsRetentionContent" style="padding:6px 0;flex:1;display:flex;flex-direction:column;justify-content:space-between;"></div>
    </div>
  </div>

  <!-- Achievements + Recent activity -->
  <div class="grid-2">
    <!-- Achievements -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">
          <i data-lucide="award" style="width:16px;height:16px;color:#d97706;"></i>
          Thành tích
        </span>
      </div>
      <div class="achievement-grid" id="statsAchievements"></div>
    </div>

    <!-- Recent sessions -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">
          <i data-lucide="clock" style="width:16px;height:16px;color:#4f46e5;"></i>
          Phiên học gần đây
        </span>
      </div>
      <div id="statsActivity"></div>
    </div>
  </div>

</div>`;

  el('statsRefresh').addEventListener('click', loadStats);
  loadStats();
}

async function loadStats() {
  try {
    const stats = await API.get_stats();
    renderMetrics(stats);
    renderStates(stats.card_states || {});
    renderChart(stats.daily_history || []);
    renderForecast(stats.forecast_7days || []);
    renderForgettingCurve(stats.forgetting_curve || {});
    renderActivity(stats.daily_history || []);
    renderAchievements(stats);
    refreshIcons();
  } catch (e) {
    showToast('Lỗi tải thống kê: ' + e.message, 'error');
  }
}

function renderForecast(forecast = []) {
  const container = el('statsForecastContent');
  const badgeTotal = el('statsForecastTotal');
  if (!container) return;

  if (!forecast || !forecast.length) {
    container.innerHTML = `<div class="text-xs text-muted" style="text-align:center;padding:20px;">Chưa có dữ liệu dự báo thẻ ôn tập.</div>`;
    return;
  }

  const totalDue = forecast.reduce((acc, f) => acc + (f.count || 0), 0);
  if (badgeTotal) badgeTotal.textContent = `${totalDue} thẻ trong 7 ngày`;

  const maxCount = Math.max(...forecast.map(f => f.count || 0), 1);

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(7, 1fr);gap:8px;padding:6px 2px;">
      ${forecast.map(f => {
        const pct = Math.max(Math.round((f.count / maxCount) * 100), f.count > 0 ? 12 : 4);
        const isToday = f.is_today;
        const color = isToday ? '#4f46e5' : (f.count > 0 ? '#0891b2' : '#94a3b8');
        const bg = isToday ? 'rgba(99,102,241,0.09)' : 'rgba(148,163,184,0.06)';
        return `
          <div style="background:${bg};border-radius:10px;padding:8px 4px;display:flex;flex-direction:column;align-items:center;gap:6px;border:${isToday ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent'};">
            <div style="font-size:11px;font-weight:700;color:${isToday ? '#4f46e5' : 'var(--text-muted)'};white-space:nowrap;">${f.label}</div>
            <div style="font-size:10px;color:var(--text-subtle);">${f.date.slice(5)}</div>
            <div style="width:100%;height:48px;display:flex;align-items:flex-end;justify-content:center;padding:0 6px;">
              <div style="width:100%;max-width:18px;height:${pct}%;background:${color};border-radius:4px;transition:height 0.3s ease;"></div>
            </div>
            <div style="font-size:12px;font-weight:800;color:${f.count > 0 ? color : 'var(--text-subtle)'};">${f.count}</div>
          </div>
        `;
      }).join('')}
    </div>
    <div style="font-size:11.5px;color:var(--text-muted);display:flex;align-items:center;gap:6px;margin-top:10px;padding:0 4px;">
      <i data-lucide="info" style="width:13px;height:13px;color:var(--accent);flex-shrink:0;"></i>
      <span>Thuật toán SM-2 tự động phân bổ lịch thẻ khoa học, tránh dồn ứ trước kỳ thi.</span>
    </div>
  `;
}

function renderForgettingCurve(curveData = {}) {
  const container = el('statsRetentionContent');
  const badge = el('statsRetentionBadge');
  if (!container) return;

  const points = curveData.points || [];
  const strength = curveData.strength_days || 3.0;
  const avgEase = curveData.avg_ease || 2.5;
  const retention = curveData.estimated_retention_pct || 85.0;

  if (badge) {
    badge.textContent = `~${retention}% ghi nhớ`;
    badge.className = retention >= 80 ? 'badge badge-success' : 'badge badge-accent';
  }

  // Generate SVG path for forgetting curve
  // SVG viewBox: 0 0 320 120
  // X: day 0 to 30 mapped to 30 -> 300
  // Y: retention 0 to 100 mapped to 105 -> 15
  let pathD = '';
  let areaD = '';
  const mapX = day => 30 + (day / 30) * 270;
  const mapY = ret => 105 - (ret / 100) * 90;

  if (points.length) {
    points.forEach((pt, i) => {
      const x = mapX(pt.day);
      const y = mapY(pt.retention);
      if (i === 0) {
        pathD += `M ${x} ${y}`;
        areaD += `M ${x} 105 L ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
        areaD += ` L ${x} ${y}`;
      }
    });
    const lastX = mapX(points[points.length - 1].day);
    areaD += ` L ${lastX} 105 Z`;
  }

  container.innerHTML = `
    <div style="position:relative;width:100%;height:125px;margin:2px 0;">
      <svg viewBox="0 0 320 120" style="width:100%;height:100%;overflow:visible;">
        <defs>
          <linearGradient id="curveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0891b2" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#0891b2" stop-opacity="0.0" />
          </linearGradient>
        </defs>
        <!-- Horizontal gridlines -->
        <line x1="30" y1="15" x2="300" y2="15" stroke="rgba(148,163,184,0.15)" stroke-dasharray="3,3" />
        <line x1="30" y1="60" x2="300" y2="60" stroke="rgba(148,163,184,0.15)" stroke-dasharray="3,3" />
        <line x1="30" y1="105" x2="300" y2="105" stroke="rgba(148,163,184,0.2)" />

        <text x="5" y="18" fill="var(--text-subtle)" font-size="9" font-family="sans-serif">100%</text>
        <text x="10" y="63" fill="var(--text-subtle)" font-size="9" font-family="sans-serif">50%</text>
        <text x="16" y="108" fill="var(--text-subtle)" font-size="9" font-family="sans-serif">0%</text>

        <!-- Area and Curve -->
        <path d="${areaD}" fill="url(#curveGrad)" />
        <path d="${pathD}" fill="none" stroke="#0891b2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Key Day dots -->
        ${[0, 1, 3, 7, 30].map(d => {
          const pt = points.find(p => p.day === d) || { retention: 50 };
          const cx = mapX(d);
          const cy = mapY(pt.retention);
          return `
            <circle cx="${cx}" cy="${cy}" r="3.5" fill="#0891b2" stroke="#ffffff" stroke-width="1.5" />
            <text x="${cx}" y="117" fill="var(--text-subtle)" font-size="8.5" text-anchor="middle" font-family="sans-serif">${d === 0 ? 'Hôm nay' : d + 'd'}</text>
          `;
        }).join('')}
      </svg>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 8px;background:rgba(8,145,178,0.06);border-radius:10px;margin-top:6px;">
      <div style="display:flex;flex-direction:column;gap:1px;">
        <span style="font-size:11px;color:var(--text-muted);">Độ ổn định ghi nhớ (S)</span>
        <span style="font-size:13px;font-weight:700;color:#0891b2;">${strength} ngày / chu kỳ</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:1px;text-align:right;">
        <span style="font-size:11px;color:var(--text-muted);">Hệ số dễ (Ease Factor)</span>
        <span style="font-size:13px;font-weight:700;color:var(--text);">${avgEase} / 2.5</span>
      </div>
    </div>
  `;
}

function renderMetrics(stats) {
  if (!el('statsMetrics')) return;
  const cards = [
    {
      icon: 'clock', color: '#4f46e5', bg: 'rgba(99,102,241,0.10)',
      val: `${stats.total_study_minutes ?? 0}`, unit: 'phút',
      label: 'Thời gian học',
      sub: `${stats.active_days ?? 0} ngày học tích cực`,
    },
    {
      icon: 'layers', color: '#d97706', bg: 'rgba(245,158,11,0.10)',
      val: `${stats.due_today ?? 0}`, unit: 'thẻ',
      label: 'Thẻ cần ôn hôm nay',
      sub: `Tổng ${stats.total_cards ?? 0} flashcard`,
    },
    {
      icon: 'check-circle-2', color: '#059669', bg: 'rgba(16,185,129,0.10)',
      val: `${stats.avg_quiz_score ?? 0}`, unit: '%',
      label: 'Điểm Quiz Trung bình',
      sub: `${stats.total_quizzes ?? 0} bài kiểm tra`,
    },
    {
      icon: 'flame', color: '#dc2626', bg: 'rgba(239,68,68,0.10)',
      val: `${stats.streak ?? 0}`, unit: 'ngày',
      label: 'Chuỗi Streak học tập',
      sub: `${stats.total_lectures ?? 0} bài giảng đã xử lý`,
    },
  ];

  el('statsMetrics').innerHTML = cards.map(c => `
<div class="metric-card">
  <div class="metric-glow" style="background:${c.color};"></div>
  <div class="metric-icon" style="background:${c.bg};">
    <i data-lucide="${c.icon}" style="width:20px;height:20px;color:${c.color};"></i>
  </div>
  <div class="metric-label">${c.label}</div>
  <div class="metric-value" style="color:${c.color};">
    ${c.val}<span class="metric-unit">${c.unit}</span>
  </div>
  <div class="metric-sub">${c.sub}</div>
</div>`).join('');
}

function renderStates(states) {
  if (!el('statsStates')) return;
  const total = Object.values(states).reduce((a, b) => a + b, 0) || 1;
  const items = [
    { key: 'new',      icon: 'sparkles',    label: 'Thẻ mới',     color: '#4f46e5' },
    { key: 'learning', icon: 'book-open',   label: 'Đang học',    color: '#d97706' },
    { key: 'review',   icon: 'shield-check',label: 'Đã thuộc',    color: '#059669' },
  ];
  el('statsStates').innerHTML = items.map(it => {
    const count = states[it.key] || 0;
    const pct   = Math.round(count / total * 100);
    return `
<div class="state-card">
  <div class="state-label" style="color:${it.color};">
    <i data-lucide="${it.icon}" style="width:14px;height:14px;"></i>
    <span>${it.label}</span>
  </div>
  <div class="state-value" style="color:${it.color};">${count}</div>
  <div class="state-bar">
    <div class="progress-wrap">
      <div class="progress-bar" style="width:${pct}%;background:${it.color};"></div>
    </div>
  </div>
  <div class="text-xs text-muted mt-2">${pct}% tổng số</div>
</div>`;
  }).join('');
}

function renderChart(history) {
  if (!el('statsChart')) return;

  const today = new Date();
  const dateMap = {};
  history.forEach(h => {
    const key = h.session_date;
    dateMap[key] = (h['SUM(duration_sec)'] || h.duration_sec || 0) / 60;
  });

  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    days.push({ iso, label: `${d.getDate()}/${d.getMonth()+1}`, value: dateMap[iso] || 0 });
  }

  const maxVal = Math.max(...days.map(d => d.value), 1);

  el('statsChart').innerHTML = days.map(d => {
    const isToday   = d.iso === today.toISOString().slice(0, 10);
    const heightPct = Math.max((d.value / maxVal) * 100, d.value > 0 ? 4 : 0);
    return `
<div class="chart-col" title="${d.label}: ${Math.round(d.value)} phút">
  <div class="chart-val">${d.value > 0 ? Math.round(d.value)+'p' : ''}</div>
  <div class="chart-bar-wrap">
    <div class="chart-bar ${isToday ? 'today' : ''}" style="height:${heightPct}%"></div>
  </div>
  <div class="chart-date" style="${isToday ? 'color:#4f46e5;font-weight:700;' : ''}">${isToday ? 'Hôm nay' : d.label}</div>
</div>`;
  }).join('');
}

function renderActivity(history) {
  if (!el('statsActivity')) return;
  const today  = new Date().toISOString().slice(0, 10);
  const recent = history.slice(0, 7);

  if (!recent.length) {
    el('statsActivity').innerHTML = `
<div class="empty-state" style="padding:28px 16px;">
  <i data-lucide="bar-chart-2" style="width:36px;height:36px;color:var(--text-subtle);margin:0 auto 6px;display:block;"></i>
  <div class="text-sm text-muted">Chưa có phiên học nào được ghi nhận</div>
</div>`;
    return;
  }

  el('statsActivity').innerHTML = recent.map((d, i) => {
    const isToday = d.session_date === today;
    const items   = d['SUM(items_count)'] || d.items_count || 0;
    const mins    = Math.round((d['SUM(duration_sec)'] || d.duration_sec || 0) / 60 * 10) / 10;
    return `
<div style="display:flex;align-items:center;gap:12px;padding:10px 0;${i < recent.length-1 ? 'border-bottom:1px solid var(--glass-border);' : ''}">
  <div style="width:8px;height:8px;border-radius:50%;background:${isToday ? 'var(--accent)' : 'var(--success)'};flex-shrink:0;box-shadow:0 0 6px ${isToday ? 'rgba(99,102,241,0.5)' : 'rgba(16,185,129,0.4)'};"></div>
  <div style="font-weight:600;width:90px;font-size:13px;">${d.session_date}</div>
  <div style="color:#4f46e5;font-weight:700;font-size:13px;">${items} mục</div>
  <div class="text-muted text-sm" style="display:inline-flex;align-items:center;gap:3px;"><i data-lucide="clock" style="width:12px;height:12px;"></i>${mins}p</div>
  ${isToday ? '<span class="badge badge-accent" style="margin-left:auto;">Hôm nay</span>' : ''}
</div>`;
  }).join('');
}

function renderAchievements(stats) {
  if (!el('statsAchievements')) return;

  const streak     = stats.streak         || 0;
  const totalCards = stats.total_cards    || 0;
  const totalLecs  = stats.total_lectures || 0;
  const quizScore  = stats.avg_quiz_score || 0;
  const studyMins  = stats.total_study_minutes || 0;

  const achievements = [
    { icon: 'flame',      name: 'Streak 3 ngày',     desc: '3 ngày liên tiếp',    earned: streak >= 3,        color: '#dc2626' },
    { icon: 'zap',        name: 'Streak 7 ngày',     desc: 'Học liên tục 1 tuần', earned: streak >= 7,        color: '#d97706' },
    { icon: 'award',      name: 'Streak 30 ngày',    desc: 'Kiên trì 1 tháng',    earned: streak >= 30,       color: '#4f46e5' },
    { icon: 'layers',     name: '10 thẻ đầu tiên',   desc: 'Bắt đầu hành trình',  earned: totalCards >= 10,   color: '#059669' },
    { icon: 'book-open',  name: '100 thẻ ghi nhớ',   desc: 'Thu thập kiến thức',  earned: totalCards >= 100,  color: '#0891b2' },
    { icon: 'mic',        name: 'Bài giảng đầu tiên',desc: 'Xử lý âm thanh',      earned: totalLecs >= 1,     color: '#7c3aed' },
    { icon: 'target',     name: 'Quiz xuất sắc',     desc: 'Điểm TB ≥ 80%',       earned: quizScore >= 80,    color: '#dc2626' },
    { icon: 'clock',      name: 'Học 1 tiếng',       desc: 'Tổng 60 phút học',    earned: studyMins >= 60,    color: '#059669' },
  ];

  el('statsAchievements').innerHTML = achievements.map(a => `
<div class="achievement-badge ${a.earned ? 'earned' : ''}" title="${a.earned ? 'Đã đạt' : 'Chưa đạt'}">
  <div class="ach-icon" style="opacity:${a.earned ? 1 : 0.35};display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:${a.earned ? 'rgba(255,255,255,0.8)' : 'transparent'};">
    <i data-lucide="${a.icon}" style="width:20px;height:20px;color:${a.earned ? a.color : 'var(--text-subtle)'};"></i>
  </div>
  <div>
    <div class="ach-name" style="color:${a.earned ? 'var(--text)' : 'var(--text-muted)'};">${a.name}</div>
    <div class="ach-desc">${a.desc}</div>
  </div>
  ${a.earned ? '<i data-lucide="check-circle-2" style="width:16px;height:16px;color:var(--success);margin-left:auto;flex-shrink:0;"></i>' : ''}
</div>`).join('');
}

registerView('stats', {
  render: renderStatsView,
  onShow: () => {
    if (!el('statsMetrics')) renderStatsView();
    else loadStats();
  },
});
