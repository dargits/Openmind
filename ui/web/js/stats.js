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
        <i data-lucide="trending-up" style="width:22px;height:22px;color:#a5b4fc;"></i>
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
      <i data-lucide="calendar" style="width:17px;height:17px;color:#a5b4fc;"></i>
      Hoạt động học tập 14 ngày gần nhất
    </div>
    <div class="chart-bars" id="statsChart"></div>
  </div>

  <!-- Achievements + Recent activity -->
  <div class="grid-2">
    <!-- Achievements -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">
          <i data-lucide="award" style="width:16px;height:16px;color:#fbbf24;"></i>
          Thành tích
        </span>
      </div>
      <div class="achievement-grid" id="statsAchievements"></div>
    </div>

    <!-- Recent sessions -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">
          <i data-lucide="clock" style="width:16px;height:16px;color:#a5b4fc;"></i>
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
    renderActivity(stats.daily_history || []);
    renderAchievements(stats);
    refreshIcons();
  } catch (e) {
    showToast('Lỗi tải thống kê: ' + e.message, 'error');
  }
}

function renderMetrics(stats) {
  if (!el('statsMetrics')) return;
  const cards = [
    {
      icon: 'clock', color: '#a5b4fc', bg: 'rgba(99,102,241,0.12)',
      val: `${stats.total_study_minutes ?? 0}`, unit: 'phút',
      label: 'Thời gian học',
      sub: `${stats.active_days ?? 0} ngày học tích cực`,
    },
    {
      icon: 'layers', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',
      val: `${stats.due_today ?? 0}`, unit: 'thẻ',
      label: 'Thẻ cần ôn hôm nay',
      sub: `Tổng ${stats.total_cards ?? 0} flashcard`,
    },
    {
      icon: 'check-circle-2', color: '#34d399', bg: 'rgba(16,185,129,0.12)',
      val: `${stats.avg_quiz_score ?? 0}`, unit: '%',
      label: 'Điểm Quiz Trung bình',
      sub: `${stats.total_quizzes ?? 0} bài kiểm tra`,
    },
    {
      icon: 'flame', color: '#f87171', bg: 'rgba(239,68,68,0.12)',
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
    { key: 'new',      icon: 'sparkles',    label: 'Thẻ mới',     color: '#a5b4fc' },
    { key: 'learning', icon: 'book-open',   label: 'Đang học',    color: '#fbbf24' },
    { key: 'review',   icon: 'shield-check',label: 'Đã thuộc',    color: '#34d399' },
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
  <div class="chart-date" style="${isToday ? 'color:#a5b4fc;font-weight:700;' : ''}">${isToday ? 'Hôm nay' : d.label}</div>
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
  <div style="font-size:32px;opacity:0.35;">📊</div>
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
  <div style="color:#a5b4fc;font-weight:700;font-size:13px;">${items} mục</div>
  <div class="text-muted text-sm">⏱ ${mins}p</div>
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
    { icon: '🔥', name: 'Streak 3 ngày',    desc: '3 ngày liên tiếp',  earned: streak >= 3 },
    { icon: '⚡', name: 'Streak 7 ngày',    desc: 'Học liên tục 1 tuần', earned: streak >= 7 },
    { icon: '🏅', name: 'Streak 30 ngày',   desc: 'Kiên trì 1 tháng',   earned: streak >= 30 },
    { icon: '🃏', name: '10 thẻ đầu tiên', desc: 'Bắt đầu hành trình', earned: totalCards >= 10 },
    { icon: '📚', name: '100 thẻ ghi nhớ', desc: 'Thu thập kiến thức',  earned: totalCards >= 100 },
    { icon: '🎙️', name: 'Bài giảng đầu tiên', desc: 'Xử lý âm thanh',  earned: totalLecs >= 1 },
    { icon: '🎯', name: 'Quiz xuất sắc',   desc: 'Điểm TB ≥ 80%',       earned: quizScore >= 80 },
    { icon: '⏰', name: 'Học 1 tiếng',     desc: 'Tổng 60 phút học',    earned: studyMins >= 60 },
  ];

  el('statsAchievements').innerHTML = achievements.map(a => `
<div class="achievement-badge ${a.earned ? 'earned' : ''}" title="${a.earned ? '✅ Đã đạt' : '🔒 Chưa đạt'}">
  <div class="ach-icon" style="opacity:${a.earned ? 1 : 0.3};">${a.icon}</div>
  <div>
    <div class="ach-name" style="color:${a.earned ? 'var(--text)' : 'var(--text-muted)'};">${a.name}</div>
    <div class="ach-desc">${a.desc}</div>
  </div>
  ${a.earned ? '<span style="margin-left:auto;font-size:14px;">✅</span>' : ''}
</div>`).join('');
}

registerView('stats', {
  render: renderStatsView,
  onShow: () => {
    if (!el('statsMetrics')) renderStatsView();
    else loadStats();
  },
});
