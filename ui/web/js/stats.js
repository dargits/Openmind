/* ════════════════════════════════════════════
   Stats View — Open-mind Pro
   Bar chart · Streak · Card states
════════════════════════════════════════════ */
'use strict';

async function renderStatsView() {
  el('view-stats').innerHTML = `
<div style="display:flex;flex-direction:column;gap:16px;height:100%;overflow-y:auto;">
  <div class="section-header" style="flex-shrink:0;">
    <h2 class="section-title" style="display:inline-flex;align-items:center;gap:8px;">
      <i data-lucide="trending-up" style="width:20px;height:20px;color:var(--accent);"></i>
      <span>Thống kê &amp; Tiến độ Học tập</span>
    </h2>
    <button class="btn btn-ghost btn-sm" id="statsRefresh" style="display:inline-flex;align-items:center;gap:6px;">
      <i data-lucide="rotate-ccw" style="width:14px;height:14px;"></i> Làm mới
    </button>
  </div>

  <!-- Metric cards -->
  <div class="stats-metrics" id="statsMetrics"></div>

  <!-- Card state row -->
  <div class="state-row" id="statsStates"></div>

  <!-- Bar chart -->
  <div class="chart-wrap">
    <div class="chart-title" style="display:inline-flex;align-items:center;gap:8px;">
      <i data-lucide="calendar" style="width:17px;height:17px;color:var(--accent);"></i>
      <span>Hoạt động học tập 14 ngày gần nhất</span>
    </div>
    <div class="chart-bars" id="statsChart"></div>
  </div>

  <!-- Recent activity list -->
  <div class="card" style="flex-shrink:0;">
    <div class="card-header">
      <span class="card-title" style="display:inline-flex;align-items:center;gap:8px;">
        <i data-lucide="clock" style="width:16px;height:16px;color:var(--accent);"></i>
        <span>Phiên học gần đây</span>
      </span>
    </div>
    <div id="statsActivity"></div>
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
    refreshIcons();
  } catch (e) {
    showToast('Lỗi tải thống kê: ' + e.message, 'error');
  }
}

function renderMetrics(stats) {
  if (!el('statsMetrics')) return;
  const cards = [
    { icon:'clock', label:'Thời gian học', value:`${stats.total_study_minutes ?? 0}`, unit:'phút', sub:`${stats.active_days ?? 0} ngày học`, color:'var(--accent)' },
    { icon:'layers', label:'Thẻ cần ôn',   value:`${stats.due_today ?? 0}`,           unit:'thẻ',  sub:`Tổng ${stats.total_cards ?? 0} flashcard`, color:'var(--warning)' },
    { icon:'check-circle-2', label:'Điểm Quiz TB',  value:`${stats.avg_quiz_score ?? 0}`,       unit:'%',    sub:`Qua ${stats.total_quizzes ?? 0} bài kiểm tra`, color:'var(--success)' },
    { icon:'flame', label:'Chuỗi Streak',         value:`${stats.streak ?? 0}`,              unit:'ngày', sub:`${stats.total_lectures ?? 0} bài giảng`, color:'#ea580c' },
  ];

  el('statsMetrics').innerHTML = cards.map(c => `
<div class="metric-card">
  <div class="metric-strip" style="background:${c.color}"></div>
  <div class="metric-label" style="display:flex;align-items:center;gap:6px;">
    <i data-lucide="${c.icon}" style="width:14px;height:14px;color:${c.color};"></i>
    <span>${c.label}</span>
  </div>
  <div class="metric-value" style="color:${c.color}">${c.value}<span style="font-size:14px;font-weight:400;color:var(--text-muted);margin-left:3px">${c.unit}</span></div>
  <div class="metric-sub">${c.sub}</div>
</div>`).join('');
}

function renderStates(states) {
  if (!el('statsStates')) return;
  const total = Object.values(states).reduce((a, b) => a + b, 0) || 1;
  const items = [
    { key:'new',      icon:'sparkles', label:'Mới tạo',       color:'var(--accent)' },
    { key:'learning', icon:'book-open', label:'Đang học',  color:'var(--warning)' },
    { key:'review',   icon:'award', label:'Đã thuộc',     color:'var(--success)' },
  ];
  el('statsStates').innerHTML = items.map(it => {
    const count = states[it.key] || 0;
    const pct   = Math.round(count / total * 100);
    return `
<div class="state-card">
  <div class="state-label" style="color:${it.color};display:flex;align-items:center;gap:6px;">
    <i data-lucide="${it.icon}" style="width:14px;height:14px;"></i>
    <span>${it.label}</span>
  </div>
  <div class="state-value" style="color:${it.color}">${count}</div>
  <div class="state-bar">
    <div class="progress-wrap"><div class="progress-bar" style="width:${pct}%;background:${it.color}"></div></div>
  </div>
  <div class="text-muted text-xs mt-2">${pct}% tổng số</div>
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
    const isToday  = d.iso === today.toISOString().slice(0,10);
    const heightPct = Math.max((d.value / maxVal) * 100, d.value > 0 ? 3 : 0);
    return `
<div class="chart-col">
  <div class="chart-val">${d.value > 0 ? Math.round(d.value)+'p' : ''}</div>
  <div class="chart-bar-wrap">
    <div class="chart-bar ${isToday ? 'today' : ''}" style="height:${heightPct}%"></div>
  </div>
  <div class="chart-date" style="${isToday ? 'color:var(--accent);font-weight:700' : ''}">${isToday ? 'Hôm nay' : d.label}</div>
</div>`;
  }).join('');
}

function renderActivity(history) {
  if (!el('statsActivity')) return;
  const today = new Date().toISOString().slice(0,10);
  const recent = history.slice(0, 7);

  if (!recent.length) {
    el('statsActivity').innerHTML = `<p class="text-muted text-sm" style="padding:16px">Chưa có phiên học nào được ghi nhận.</p>`;
    return;
  }

  el('statsActivity').innerHTML = recent.map((d, i) => {
    const isToday = d.session_date === today;
    const items   = d['SUM(items_count)'] || d.items_count || 0;
    const mins    = Math.round((d['SUM(duration_sec)'] || d.duration_sec || 0) / 60 * 10) / 10;
    return `
<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;${i < recent.length-1?'border-bottom:1px solid var(--border)':''}">
  <div style="width:8px;height:8px;border-radius:50%;background:${isToday ? 'var(--accent)' : 'var(--success)'}"></div>
  <div style="font-weight:600;width:100px;font-size:13px">${d.session_date}</div>
  <div style="color:var(--accent);font-weight:600;width:80px;font-size:13px">${items} mục</div>
  <div class="text-muted text-sm">⏱ ${mins} phút</div>
  ${isToday ? '<span class="badge badge-accent" style="margin-left:auto">Hôm nay</span>' : ''}
</div>`;
  }).join('');
}

registerView('stats', {
  render: renderStatsView,
  onShow: () => {
    if (!el('statsMetrics')) renderStatsView();
    else loadStats();
  },
});
