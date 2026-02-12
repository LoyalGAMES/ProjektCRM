// ============================================================
// GoalTracker SMART - PWA Application
// ============================================================

const API = 'api';
let currentView = 'dashboard';
let currentGoal = null;
let goals = [];
let stats = null;

// ===== API Helpers =====
async function api(endpoint, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}/${endpoint}`, opts);
  return res.json();
}

// ===== Data Helpers =====
const CATEGORIES = {
  career: { label: 'Kariera', icon: '💼' }, health: { label: 'Zdrowie', icon: '❤️' },
  finance: { label: 'Finanse', icon: '💰' }, education: { label: 'Edukacja', icon: '📚' },
  personal: { label: 'Osobiste', icon: '⭐' }, relationships: { label: 'Relacje', icon: '👥' },
  other: { label: 'Inne', icon: '📋' },
};

const PRIORITIES = {
  critical: { label: 'Krytyczny', color: '#EF4444' }, high: { label: 'Wysoki', color: '#F97316' },
  medium: { label: 'Średni', color: '#EAB308' }, low: { label: 'Niski', color: '#22C55E' },
};

const STATUSES = {
  draft: { label: 'Szkic', color: '#8B95B5' }, active: { label: 'Aktywny', color: '#4A90D9' },
  paused: { label: 'Wstrzymany', color: '#FBBF24' }, completed: { label: 'Ukończony', color: '#34D399' },
  abandoned: { label: 'Porzucony', color: '#F87171' },
};

const TASK_STATUSES = { todo: 'Do zrobienia', in_progress: 'W trakcie', done: 'Gotowe', skipped: 'Pominięto' };
const SMART_KEYS = ['smart_specific', 'smart_measurable', 'smart_achievable', 'smart_relevant', 'smart_time_bound'];
const SMART_INFO = {
  smart_specific: { letter: 'S', title: 'Specific', pl: 'Konkretny', prompt: 'Co dokładnie chcesz osiągnąć?' },
  smart_measurable: { letter: 'M', title: 'Measurable', pl: 'Mierzalny', prompt: 'Jak zmierzysz postęp?' },
  smart_achievable: { letter: 'A', title: 'Achievable', pl: 'Osiągalny', prompt: 'Czy cel jest realistyczny?' },
  smart_relevant: { letter: 'R', title: 'Relevant', pl: 'Istotny', prompt: 'Dlaczego ten cel jest ważny?' },
  smart_time_bound: { letter: 'T', title: 'Time-bound', pl: 'Określony w czasie', prompt: 'Jaki jest Twój termin?' },
};

const PROB_LABELS = { very_low: 'B. niskie', low: 'Niskie', medium: 'Średnie', high: 'Wysokie', very_high: 'B. wysokie' };
const IMPACT_LABELS = { negligible: 'Znikomy', minor: 'Mały', moderate: 'Umiarkowany', major: 'Duży', critical: 'Krytyczny' };
const PROB_VALUES = { very_low: 0.1, low: 0.3, medium: 0.5, high: 0.7, very_high: 0.9 };
const IMPACT_VALUES = { negligible: 0.1, minor: 0.3, moderate: 0.5, major: 0.7, critical: 0.9 };

function getCountdown(targetDate) {
  if (!targetDate) return { text: '---', days: 0, overdue: false };
  const target = new Date(targetDate + 'T23:59:59');
  const now = new Date();
  const diff = target - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: `${Math.abs(days)}d po terminie`, days, overdue: true };
  if (days === 0) return { text: 'Dzisiaj!', days: 0, overdue: false, today: true };
  if (days <= 7) {
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { text: `${days}d ${h}h`, days, overdue: false };
  }
  return { text: `${days} dni`, days, overdue: false };
}

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatShort(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
}

function getRiskColor(score) {
  if (score >= 0.6) return '#EF4444';
  if (score >= 0.4) return '#F97316';
  if (score >= 0.2) return '#EAB308';
  return '#22C55E';
}

function getSmartScore(goal) {
  return SMART_KEYS.filter(k => goal[k] && goal[k].trim().length > 10).length / 5;
}

// ===== Navigation =====
function navigate(view, data = null) {
  currentView = view;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  render();
}

// ===== Main Render =====
function render() {
  const mc = document.getElementById('mainContent');
  switch (currentView) {
    case 'dashboard': renderDashboard(mc); break;
    case 'goals': renderGoalsList(mc); break;
    case 'planner': renderPlanner(mc); break;
    case 'risks': renderRisks(mc); break;
    case 'settings': renderSettings(mc); break;
    case 'goalDetail': renderGoalDetail(mc); break;
    case 'goalForm': renderGoalForm(mc); break;
  }
}

// ===== DASHBOARD =====
async function renderDashboard(el) {
  stats = await api('goals.php?action=stats');
  goals = await api('goals.php?status=active');

  el.innerHTML = `
    <div class="stats-row">
      <div class="stat-card"><div class="value">${stats.active}</div><div class="label">Aktywne cele</div></div>
      <div class="stat-card success"><div class="value">${stats.completed}</div><div class="label">Ukończone</div></div>
      <div class="stat-card secondary"><div class="value">${Math.round(stats.averageProgress)}%</div><div class="label">Średni postęp</div></div>
      <div class="stat-card"><div class="value">${stats.total}</div><div class="label">Łącznie</div></div>
    </div>

    <div class="section-title">Odliczanie do celów</div>
    <div class="widgets-scroll">${goals.length ? goals.map(g => {
      const cd = getCountdown(g.target_date);
      const cat = CATEGORIES[g.category] || CATEGORIES.other;
      const pri = PRIORITIES[g.priority] || PRIORITIES.medium;
      return `<div class="countdown-widget" onclick="openGoal('${g.id}')">
        <div class="widget-header">
          <span class="cat-icon">${cat.icon}</span>
          <span class="priority-dot" style="background:${pri.color}"></span>
        </div>
        <div class="widget-title">${g.title}</div>
        <div class="countdown-val ${cd.overdue ? 'overdue' : ''}">${cd.text}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${g.progress || 0}%"></div></div>
        <div class="progress-text">${Math.round(g.progress || 0)}%</div>
      </div>`;
    }).join('') : '<div class="empty-state" style="padding:30px"><div class="empty-icon">🎯</div><div class="empty-sub">Brak aktywnych celów</div></div>'}</div>

    <div class="section-title">Zbliżające się terminy</div>
    ${(stats.upcomingDeadlines || []).map(g => {
      const cd = getCountdown(g.target_date);
      const cat = CATEGORIES[g.category] || CATEGORIES.other;
      return `<div class="deadline-card" onclick="openGoal('${g.id}')">
        <div class="left"><span class="dl-icon">${cat.icon}</span><div><div class="dl-name">${g.title}</div><div class="dl-date">${formatDate(g.target_date)}</div></div></div>
        <div class="right"><div class="countdown-badge ${cd.overdue ? 'overdue' : ''}">${cd.text}</div></div>
      </div>`;
    }).join('')}

    ${stats.highRisks?.length ? `<div class="section-title">Wysokie ryzyka</div>${stats.highRisks.map(r => `
      <div class="card risk-card" style="border-left-color:${getRiskColor(r.risk_score)}">
        <div class="risk-header"><span class="risk-title">${r.title}</span><span class="badge" style="background:${getRiskColor(r.risk_score)}20;color:${getRiskColor(r.risk_score)}">${Math.round(r.risk_score * 100)}%</span></div>
        <div style="font-size:12px;color:var(--text2)">${r.goal_title}</div>
      </div>`).join('')}` : ''}
  `;
}

// ===== GOALS LIST =====
let goalsFilter = null;
let goalsSort = 'deadline';

async function renderGoalsList(el) {
  const params = new URLSearchParams();
  if (goalsFilter) params.set('status', goalsFilter);
  params.set('sort', goalsSort);
  goals = await api(`goals.php?${params}`);

  const filters = [
    { key: '', label: 'Wszystkie' }, { key: 'active', label: 'Aktywne' },
    { key: 'draft', label: 'Szkice' }, { key: 'completed', label: 'Ukończone' },
  ];
  const sorts = [
    { key: 'deadline', label: 'Termin' }, { key: 'priority', label: 'Priorytet' },
    { key: 'progress', label: 'Postęp' }, { key: 'created', label: 'Data dodania' },
  ];

  el.innerHTML = `
    <div class="filter-row">${filters.map(f => `<span class="filter-chip ${(goalsFilter || '') === f.key ? 'active' : ''}" onclick="setGoalsFilter('${f.key}')">${f.label}</span>`).join('')}</div>
    <div class="filter-row" style="margin-bottom:16px">${sorts.map(s => `<span class="tab-item ${goalsSort === s.key ? 'active' : ''}" onclick="setGoalsSort('${s.key}')">${s.label}</span>`).join('')}</div>
    <div class="goals-grid">${goals.length ? goals.map(g => renderGoalCard(g)).join('') : '<div class="empty-state"><div class="empty-icon">🎯</div><div class="empty-title">Brak celów</div><div class="empty-sub">Dodaj swój pierwszy cel SMART</div></div>'}</div>
  `;
}

function renderGoalCard(g) {
  const cd = getCountdown(g.target_date);
  const cat = CATEGORIES[g.category] || CATEGORIES.other;
  const pri = PRIORITIES[g.priority] || PRIORITIES.medium;
  const st = STATUSES[g.status] || STATUSES.draft;
  const ss = parseFloat(g.smart_score) || 0;

  return `<div class="card goal-card" onclick="openGoal('${g.id}')">
    <div class="card-header">
      <div class="card-header-left"><span class="cat-icon">${cat.icon}</span><div><div class="goal-title">${g.title}</div><div class="goal-category">${cat.label}</div></div></div>
      <span class="badge" style="background:${st.color}20;color:${st.color}">${st.label}</span>
    </div>
    ${g.description ? `<div class="goal-desc">${g.description}</div>` : ''}
    <div class="progress-row"><div class="progress-bar"><div class="progress-fill" style="width:${g.progress || 0}%;background:${st.color}"></div></div><span class="pct">${Math.round(g.progress || 0)}%</span></div>
    <div class="meta-row">
      <span class="badge-priority" style="background:${pri.color}20"><span class="dot" style="background:${pri.color}"></span><span style="color:${pri.color}">${pri.label}</span></span>
      <span class="countdown-badge ${cd.overdue ? 'overdue' : ''}">${cd.text}</span>
      <div class="smart-mini">${'SMART'.split('').map((l, i) => `<span class="letter ${i < ss * 5 ? 'filled' : ''}">${l}</span>`).join('')}</div>
    </div>
  </div>`;
}

function setGoalsFilter(f) { goalsFilter = f || null; renderGoalsList(document.getElementById('mainContent')); }
function setGoalsSort(s) { goalsSort = s; renderGoalsList(document.getElementById('mainContent')); }

// ===== GOAL DETAIL =====
let detailTab = 'overview';

async function openGoal(id) {
  currentGoal = await api(`goals.php?id=${id}`);
  detailTab = 'overview';
  currentView = 'goalDetail';
  render();
}

function renderGoalDetail(el) {
  const g = currentGoal;
  if (!g) return;
  const cd = getCountdown(g.target_date);
  const cat = CATEGORIES[g.category] || CATEGORIES.other;
  const st = STATUSES[g.status] || STATUSES.draft;
  const ss = getSmartScore(g);

  const tabs = [
    { key: 'overview', label: 'Przegląd' }, { key: 'smart', label: 'SMART' },
    { key: 'milestones', label: 'Kamienie' }, { key: 'tasks', label: 'Zadania' },
    { key: 'risks', label: 'Ryzyka' }, { key: 'progress', label: 'Postęp' },
  ];

  el.innerHTML = `
    <div style="margin-bottom:12px"><button class="btn btn-secondary btn-sm" onclick="navigate('goals')">← Wstecz</button></div>

    <div class="card hero-card" style="border-left-color:${g.color || 'var(--primary)'}">
      <div class="hero-header">
        <span class="hero-icon">${cat.icon}</span>
        <div style="flex:1"><div class="hero-title">${g.title}</div><div class="hero-category">${cat.label}</div></div>
        <span class="badge" style="background:${st.color}20;color:${st.color}">${st.label}</span>
      </div>
      ${g.description ? `<div class="hero-desc">${g.description}</div>` : ''}
      <div class="countdown-section">
        <div class="countdown-big ${cd.overdue ? 'overdue' : ''}">${cd.text}</div>
        <div class="countdown-label">do terminu (${formatDate(g.target_date)})</div>
      </div>
      <div class="hero-progress"><div class="progress-bar lg"><div class="progress-fill" style="width:${g.progress || 0}%;background:${st.color}"></div></div><span class="pct">${Math.round(g.progress || 0)}%</span></div>
      <div class="quick-actions">
        ${g.status === 'draft' ? `<button class="btn btn-primary btn-sm" onclick="updateGoalStatus('${g.id}','active')">Aktywuj</button>` : ''}
        ${g.status === 'active' ? `<button class="btn btn-sm" style="background:var(--warning);color:#000" onclick="updateGoalStatus('${g.id}','paused')">Wstrzymaj</button><button class="btn btn-success btn-sm" onclick="updateGoalStatus('${g.id}','completed')">Ukończ</button>` : ''}
        ${g.status === 'paused' ? `<button class="btn btn-primary btn-sm" onclick="updateGoalStatus('${g.id}','active')">Wznów</button>` : ''}
        <button class="btn btn-secondary btn-sm" onclick="editGoal('${g.id}')">Edytuj</button>
        <button class="btn btn-danger btn-sm" onclick="deleteGoal('${g.id}')">Usuń</button>
      </div>
    </div>

    <div class="tabs">${tabs.map(t => `<span class="tab-item ${detailTab === t.key ? 'active' : ''}" onclick="setDetailTab('${t.key}')">${t.label}</span>`).join('')}</div>
    <div id="detailTabContent"></div>
  `;

  renderDetailTab();
}

function setDetailTab(tab) {
  detailTab = tab;
  document.querySelectorAll('.tabs .tab-item').forEach(t => t.classList.toggle('active', t.textContent === { overview: 'Przegląd', smart: 'SMART', milestones: 'Kamienie', tasks: 'Zadania', risks: 'Ryzyka', progress: 'Postęp' }[tab]));
  renderDetailTab();
}

function renderDetailTab() {
  const el = document.getElementById('detailTabContent');
  if (!el) return;
  const g = currentGoal;

  if (detailTab === 'overview') {
    const ss = getSmartScore(g);
    const mDone = (g.milestones || []).filter(m => m.is_completed == 1).length;
    const tDone = (g.tasks || []).filter(t => t.status === 'done').length;
    const highR = (g.risks || []).filter(r => r.risk_score >= 0.6).length;
    el.innerHTML = `<div class="info-grid">
      <div class="info-card"><div class="info-value" style="color:${ss >= 0.8 ? 'var(--success)' : ss >= 0.6 ? 'var(--warning)' : 'var(--danger)'}">${Math.round(ss * 100)}%</div><div class="info-label">SMART Score</div></div>
      <div class="info-card"><div class="info-value" style="color:var(--primary)">${mDone}/${(g.milestones || []).length}</div><div class="info-label">Kamienie milowe</div></div>
      <div class="info-card"><div class="info-value" style="color:var(--secondary)">${tDone}/${(g.tasks || []).length}</div><div class="info-label">Zadania</div></div>
      <div class="info-card"><div class="info-value" style="color:${highR > 0 ? 'var(--danger)' : 'var(--success)'}">${highR}</div><div class="info-label">Wysokie ryzyka</div></div>
    </div>`;
  }

  if (detailTab === 'smart') {
    const ss = getSmartScore(g);
    el.innerHTML = `
      <div class="card smart-score-card">
        <div class="score-label">Jakość celu SMART</div>
        <div class="progress-bar lg"><div class="progress-fill" style="width:${ss * 100}%;background:${ss >= 0.8 ? 'var(--success)' : ss >= 0.6 ? 'var(--warning)' : 'var(--danger)'}"></div></div>
        <div class="score-value">${Math.round(ss * 100)}%</div>
        <div class="smart-letters">${SMART_KEYS.map(k => { const i = SMART_INFO[k]; const f = g[k] && g[k].trim().length > 10; return `<span class="sl ${f ? 'filled' : ''}">${i.letter}</span>`; }).join('')}</div>
      </div>
      ${SMART_KEYS.map(k => { const i = SMART_INFO[k]; const v = g[k]; const f = v && v.trim().length > 10; return `
        <div class="card smart-card ${f ? 'filled' : ''}">
          <div class="smart-header"><span class="smart-letter-badge ${f ? 'filled' : ''}">${i.letter}</span><div><div class="field-title">${i.title}</div><div class="field-sub">${i.pl}</div></div></div>
          <div class="smart-value">${v || 'Nie zdefiniowano - uzupełnij, aby poprawić jakość celu'}</div>
        </div>`; }).join('')}
    `;
  }

  if (detailTab === 'milestones') {
    const ms = g.milestones || [];
    el.innerHTML = `
      <button class="btn btn-primary btn-sm" onclick="showAddMilestoneModal()" style="margin-bottom:12px">+ Dodaj kamień milowy</button>
      ${ms.length === 0 ? '<div class="empty-state"><div class="empty-sub">Brak kamieni milowych</div></div>' : ''}
      ${ms.map(m => `<div class="card milestone-item" onclick="toggleMilestone('${m.id}', ${m.is_completed == 1 ? 0 : 1})">
        <div class="milestone-check ${m.is_completed == 1 ? 'done' : ''}"></div>
        <div class="milestone-info"><div class="milestone-name ${m.is_completed == 1 ? 'done' : ''}">${m.title}</div>${m.target_date ? `<div class="milestone-date">${formatDate(m.target_date)}</div>` : ''}</div>
      </div>`).join('')}
    `;
  }

  if (detailTab === 'tasks') {
    const ts = g.tasks || [];
    const groups = { todo: ts.filter(t => t.status === 'todo'), in_progress: ts.filter(t => t.status === 'in_progress'), done: ts.filter(t => t.status === 'done') };
    el.innerHTML = `
      <button class="btn btn-primary btn-sm" onclick="showAddTaskModal()" style="margin-bottom:12px">+ Dodaj zadanie</button>
      ${['todo', 'in_progress', 'done'].map(s => `
        <div class="task-group-title">${TASK_STATUSES[s]} (${groups[s].length})</div>
        ${groups[s].map(t => {
          const next = t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'done' : 'todo';
          const pri = PRIORITIES[t.priority] || PRIORITIES.medium;
          return `<div class="card task-item" onclick="updateTaskStatus('${t.id}','${next}')">
            <div class="task-status-bar" style="background:${STATUSES[t.status === 'done' ? 'completed' : t.status === 'in_progress' ? 'active' : 'draft']?.color || 'var(--text3)'}"></div>
            <span class="task-title ${t.status === 'done' ? 'done' : ''}">${t.title}</span>
            <span class="badge-priority" style="background:${pri.color}20;color:${pri.color};font-size:10px">${pri.label}</span>
          </div>`;
        }).join('')}
      `).join('')}
    `;
  }

  if (detailTab === 'risks') {
    const rs = g.risks || [];
    el.innerHTML = `
      <button class="btn btn-primary btn-sm" onclick="showAddRiskModal()" style="margin-bottom:12px">+ Dodaj ryzyko</button>
      ${rs.length === 0 ? '<div class="empty-state"><div class="empty-sub">Brak zidentyfikowanych ryzyk</div></div>' : ''}
      ${rs.sort((a, b) => b.risk_score - a.risk_score).map(r => `
        <div class="card risk-card" style="border-left-color:${getRiskColor(r.risk_score)}">
          <div class="risk-header"><span class="risk-title">${r.title}</span><span class="badge" style="background:${getRiskColor(r.risk_score)}20;color:${getRiskColor(r.risk_score)}">${Math.round(r.risk_score * 100)}%</span></div>
          ${r.description ? `<div class="risk-desc">${r.description}</div>` : ''}
          <div class="risk-tags"><span class="tag">P: ${PROB_LABELS[r.probability] || r.probability}</span><span class="tag">I: ${IMPACT_LABELS[r.impact] || r.impact}</span><span class="tag">${r.category}</span></div>
          ${r.mitigation_plan ? `<div class="mitigation-box"><div class="mit-label">Plan mitygacji</div><div class="mit-text">${r.mitigation_plan}</div></div>` : ''}
          ${r.contingency_plan ? `<div class="mitigation-box"><div class="mit-label">Plan awaryjny</div><div class="mit-text">${r.contingency_plan}</div></div>` : ''}
        </div>`).join('')}
    `;
  }

  if (detailTab === 'progress') {
    const logs = g.progressLogs || [];
    el.innerHTML = `
      <button class="btn btn-primary btn-sm" onclick="showAddProgressModal()" style="margin-bottom:12px">+ Dodaj wpis postępu</button>
      ${logs.length === 0 ? '<div class="empty-state"><div class="empty-sub">Brak wpisów postępu</div></div>' : ''}
      ${logs.map(l => `
        <div class="card progress-log-card">
          <div class="progress-log-header"><span class="progress-log-date">${formatDate(l.date)}</span><span class="progress-log-pct">${Math.round(l.progress_value)}%</span></div>
          ${l.notes ? `<div class="progress-log-notes">${l.notes}</div>` : ''}
          ${l.achievements ? `<div class="progress-achievement">Osiągnięcia: ${l.achievements}</div>` : ''}
          ${l.obstacles ? `<div class="progress-obstacle">Przeszkody: ${l.obstacles}</div>` : ''}
        </div>`).join('')}
    `;
  }
}

// ===== ACTIONS =====
async function updateGoalStatus(id, status) {
  const data = { status };
  if (status === 'completed') { data.progress = 100; data.completed_date = new Date().toISOString().split('T')[0]; }
  await api(`goals.php?id=${id}`, 'PUT', data);
  await openGoal(id);
}

async function deleteGoal(id) {
  if (!confirm('Czy na pewno chcesz usunąć ten cel?')) return;
  await api(`goals.php?id=${id}`, 'DELETE');
  navigate('goals');
}

async function toggleMilestone(id, completed) {
  await api(`milestones.php?id=${id}`, 'PUT', { is_completed: completed });
  await openGoal(currentGoal.id);
}

async function updateTaskStatus(id, status) {
  await api(`tasks.php?id=${id}`, 'PUT', { status });
  await openGoal(currentGoal.id);
}

// ===== GOAL FORM =====
let editingGoalId = null;
let formStep = 0;

function editGoal(id) { editingGoalId = id; currentView = 'goalForm'; formStep = 0; render(); }
function newGoal() { editingGoalId = null; currentView = 'goalForm'; formStep = 0; render(); }

async function renderGoalForm(el) {
  let g = {};
  if (editingGoalId) {
    g = await api(`goals.php?id=${editingGoalId}`);
  }

  if (formStep === 0) {
    el.innerHTML = `
      <div style="display:flex;justify-content:center;gap:8px;margin-bottom:24px">
        <span class="btn btn-primary btn-sm">1. Podstawy</span><span style="width:40px;height:2px;background:var(--border);align-self:center"></span><span class="btn btn-secondary btn-sm" onclick="formStep=1;render()">2. SMART</span>
      </div>
      <div class="form-group"><label>Nazwa celu *</label><input class="form-input" id="fTitle" value="${g.title || ''}" placeholder="np. Nauczyć się hiszpańskiego na B2"></div>
      <div class="form-group"><label>Opis</label><textarea class="form-textarea" id="fDesc" placeholder="Szczegółowy opis celu...">${g.description || ''}</textarea></div>
      <div class="form-group"><label>Kategoria</label><div class="options-grid" id="fCategoryGrid">${Object.entries(CATEGORIES).map(([k, v]) => `<span class="option-chip ${(g.category || 'personal') === k ? 'active' : ''}" data-val="${k}" onclick="selectOption(this,'fCategory')"><span class="chip-icon">${v.icon}</span>${v.label}</span>`).join('')}</div><input type="hidden" id="fCategory" value="${g.category || 'personal'}"></div>
      <div class="form-group"><label>Priorytet</label><div class="priority-row">${Object.entries(PRIORITIES).map(([k, v]) => `<div class="priority-option ${(g.priority || 'medium') === k ? 'active' : ''}" style="border-color:${(g.priority || 'medium') === k ? v.color : 'var(--border)'}" data-val="${k}" onclick="selectPriority(this)"><div class="p-dot" style="background:${v.color}"></div><div class="p-label">${v.label}</div></div>`).join('')}</div><input type="hidden" id="fPriority" value="${g.priority || 'medium'}"></div>
      <div style="display:flex;gap:12px">
        <div class="form-group" style="flex:1"><label>Data rozpoczęcia</label><input class="form-input" id="fStartDate" type="date" value="${(g.start_date || '').split('T')[0]}"></div>
        <div class="form-group" style="flex:1"><label>Termin realizacji *</label><input class="form-input" id="fTargetDate" type="date" value="${(g.target_date || '').split('T')[0]}"></div>
      </div>
      <button class="btn btn-primary" style="width:100%;margin-top:16px" onclick="formStep=1;render()">Dalej: Zdefiniuj SMART →</button>
      <button class="btn btn-secondary" style="width:100%;margin-top:8px" onclick="navigate('goals')">Anuluj</button>
    `;
  } else {
    const ss = getSmartScore(g);
    el.innerHTML = `
      <div style="display:flex;justify-content:center;gap:8px;margin-bottom:24px">
        <span class="btn btn-secondary btn-sm" onclick="formStep=0;render()">1. Podstawy</span><span style="width:40px;height:2px;background:var(--border);align-self:center"></span><span class="btn btn-primary btn-sm">2. SMART</span>
      </div>
      <div class="card smart-score-card" id="smartScoreCard">
        <div class="score-label">Jakość celu SMART</div>
        <div class="progress-bar lg"><div class="progress-fill" id="smartBar" style="width:${ss * 100}%"></div></div>
        <div class="score-value" id="smartPct">${Math.round(ss * 100)}%</div>
        <div class="smart-letters" id="smartLetters">${SMART_KEYS.map(k => { const i = SMART_INFO[k]; const f = g[k] && g[k].trim().length > 10; return `<span class="sl ${f ? 'filled' : ''}">${i.letter}</span>`; }).join('')}</div>
      </div>
      ${SMART_KEYS.map(k => { const i = SMART_INFO[k]; return `
        <div class="form-group">
          <label style="display:flex;align-items:center;gap:8px"><span class="smart-letter-badge ${g[k] && g[k].trim().length > 10 ? 'filled' : ''}" style="width:24px;height:24px;border-radius:6px;font-size:12px">${i.letter}</span> ${i.title} <span style="font-weight:400;color:var(--text3)">- ${i.pl}</span></label>
          <div style="font-size:12px;color:var(--text3);margin-bottom:4px;font-style:italic">${i.prompt}</div>
          <textarea class="form-textarea" id="f_${k}" oninput="updateSmartPreview()">${g[k] || ''}</textarea>
        </div>`; }).join('')}
      <div class="btn-row">
        <button class="btn btn-secondary" onclick="formStep=0;render()">← Wstecz</button>
        <button class="btn btn-primary" style="flex:2" onclick="saveGoal()">${editingGoalId ? 'Zapisz zmiany' : 'Utwórz cel'}</button>
      </div>
    `;
  }
}

function selectOption(chip, inputId) {
  chip.parentElement.querySelectorAll('.option-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  document.getElementById(inputId).value = chip.dataset.val;
}

function selectPriority(el) {
  el.parentElement.querySelectorAll('.priority-option').forEach(o => { o.classList.remove('active'); o.style.borderColor = 'var(--border)'; });
  el.classList.add('active');
  const color = PRIORITIES[el.dataset.val]?.color;
  el.style.borderColor = color;
  document.getElementById('fPriority').value = el.dataset.val;
}

function updateSmartPreview() {
  const filled = SMART_KEYS.filter(k => { const v = document.getElementById(`f_${k}`)?.value; return v && v.trim().length > 10; }).length;
  const pct = Math.round((filled / 5) * 100);
  const bar = document.getElementById('smartBar');
  const txt = document.getElementById('smartPct');
  if (bar) bar.style.width = pct + '%';
  if (txt) txt.textContent = pct + '%';
  if (bar) bar.style.background = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)';
}

async function saveGoal() {
  const title = document.getElementById('fTitle')?.value || currentGoal?.title;
  const target_date = document.getElementById('fTargetDate')?.value || currentGoal?.target_date;

  if (!title) { alert('Nazwa celu jest wymagana'); return; }
  if (!target_date) { alert('Termin realizacji jest wymagany'); return; }

  const data = {
    title,
    description: document.getElementById('fDesc')?.value || '',
    category: document.getElementById('fCategory')?.value || 'personal',
    priority: document.getElementById('fPriority')?.value || 'medium',
    start_date: document.getElementById('fStartDate')?.value || null,
    target_date,
  };

  SMART_KEYS.forEach(k => { const el = document.getElementById(`f_${k}`); if (el) data[k] = el.value; });

  if (editingGoalId) {
    await api(`goals.php?id=${editingGoalId}`, 'PUT', data);
    await openGoal(editingGoalId);
  } else {
    const created = await api('goals.php', 'POST', data);
    if (created.id) await openGoal(created.id);
    else navigate('goals');
  }
}

// ===== MODALS =====
function showModal(title, content) {
  const existing = document.getElementById('modal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="modal" onclick="if(event.target===this)closeModal()">
      <div class="modal-content">
        <div class="modal-header"><h2>${title}</h2><button class="modal-close" onclick="closeModal()">×</button></div>
        ${content}
      </div>
    </div>
  `);
}

function closeModal() { document.getElementById('modal')?.remove(); }

function showAddMilestoneModal() {
  showModal('Nowy kamień milowy', `
    <div class="form-group"><label>Nazwa</label><input class="form-input" id="mTitle"></div>
    <div class="form-group"><label>Termin</label><input class="form-input" id="mDate" type="date"></div>
    <button class="btn btn-primary" style="width:100%" onclick="addMilestone()">Dodaj</button>
  `);
}

async function addMilestone() {
  await api('milestones.php', 'POST', { goal_id: currentGoal.id, title: document.getElementById('mTitle').value, target_date: document.getElementById('mDate').value || null });
  closeModal(); await openGoal(currentGoal.id);
}

function showAddTaskModal() {
  showModal('Nowe zadanie', `
    <div class="form-group"><label>Nazwa</label><input class="form-input" id="tTitle"></div>
    <div class="form-group"><label>Priorytet</label><select class="form-select" id="tPriority"><option value="low">Niski</option><option value="medium" selected>Średni</option><option value="high">Wysoki</option><option value="critical">Krytyczny</option></select></div>
    <div class="form-group"><label>Termin</label><input class="form-input" id="tDate" type="date"></div>
    <button class="btn btn-primary" style="width:100%" onclick="addTask()">Dodaj</button>
  `);
}

async function addTask() {
  await api('tasks.php', 'POST', { goal_id: currentGoal.id, title: document.getElementById('tTitle').value, priority: document.getElementById('tPriority').value, due_date: document.getElementById('tDate').value || null });
  closeModal(); await openGoal(currentGoal.id);
}

function showAddRiskModal() {
  showModal('Nowe ryzyko', `
    <div class="form-group"><label>Nazwa</label><input class="form-input" id="rTitle"></div>
    <div class="form-group"><label>Opis</label><textarea class="form-textarea" id="rDesc"></textarea></div>
    <div class="form-group"><label>Prawdopodobieństwo</label><select class="form-select" id="rProb"><option value="very_low">Bardzo niskie</option><option value="low">Niskie</option><option value="medium" selected>Średnie</option><option value="high">Wysokie</option><option value="very_high">Bardzo wysokie</option></select></div>
    <div class="form-group"><label>Wpływ</label><select class="form-select" id="rImpact"><option value="negligible">Znikomy</option><option value="minor">Mały</option><option value="moderate" selected>Umiarkowany</option><option value="major">Duży</option><option value="critical">Krytyczny</option></select></div>
    <div class="form-group"><label>Plan mitygacji</label><textarea class="form-textarea" id="rMitigation"></textarea></div>
    <div class="form-group"><label>Plan awaryjny</label><textarea class="form-textarea" id="rContingency"></textarea></div>
    <button class="btn btn-primary" style="width:100%" onclick="addRisk()">Dodaj</button>
  `);
}

async function addRisk() {
  await api('risks.php', 'POST', { goal_id: currentGoal.id, title: document.getElementById('rTitle').value, description: document.getElementById('rDesc').value, probability: document.getElementById('rProb').value, impact: document.getElementById('rImpact').value, mitigation_plan: document.getElementById('rMitigation').value, contingency_plan: document.getElementById('rContingency').value });
  closeModal(); await openGoal(currentGoal.id);
}

function showAddProgressModal() {
  showModal('Dodaj wpis postępu', `
    <div class="form-group"><label>Postęp (%)</label><input class="form-input" id="pVal" type="number" min="0" max="100" value="${Math.round(currentGoal?.progress || 0)}"></div>
    <div class="form-group"><label>Notatki</label><textarea class="form-textarea" id="pNotes"></textarea></div>
    <div class="form-group"><label>Osiągnięcia</label><textarea class="form-textarea" id="pAch"></textarea></div>
    <div class="form-group"><label>Przeszkody</label><textarea class="form-textarea" id="pObs"></textarea></div>
    <button class="btn btn-primary" style="width:100%" onclick="addProgress()">Zapisz</button>
  `);
}

async function addProgress() {
  await api('progress.php', 'POST', { goal_id: currentGoal.id, progress_value: parseFloat(document.getElementById('pVal').value), notes: document.getElementById('pNotes').value, achievements: document.getElementById('pAch').value, obstacles: document.getElementById('pObs').value });
  closeModal(); await openGoal(currentGoal.id);
}

// ===== PLANNER =====
let plannerView = 'timeline';
let plannerMonth = new Date();

async function renderPlanner(el) {
  goals = await api('goals.php');
  const active = goals.filter(g => g.status === 'active' || g.status === 'draft');

  el.innerHTML = `
    <div class="view-switch">
      <button class="vs-btn ${plannerView === 'timeline' ? 'active' : ''}" onclick="setPlannerView('timeline')">Oś czasu</button>
      <button class="vs-btn ${plannerView === 'calendar' ? 'active' : ''}" onclick="setPlannerView('calendar')">Kalendarz</button>
      <button class="vs-btn ${plannerView === 'kanban' ? 'active' : ''}" onclick="setPlannerView('kanban')">Kanban</button>
    </div>
    <div id="plannerContent"></div>
  `;

  renderPlannerContent(active);
}

function setPlannerView(v) { plannerView = v; renderPlanner(document.getElementById('mainContent')); }

function renderPlannerContent(active) {
  const el = document.getElementById('plannerContent');

  if (plannerView === 'timeline') {
    const sorted = [...active].sort((a, b) => new Date(a.target_date) - new Date(b.target_date));
    const now = new Date();
    el.innerHTML = `
      <div class="today-marker"><div class="today-dot"></div><span class="today-text">Dzisiaj - ${now.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</span><div class="today-line"></div></div>
      ${sorted.map((g, i) => {
        const cd = getCountdown(g.target_date);
        const cat = CATEGORIES[g.category] || CATEGORIES.other;
        const startD = g.start_date ? new Date(g.start_date) : new Date(g.created_at);
        const endD = new Date(g.target_date);
        const total = (endD - startD) / (1000 * 60 * 60 * 24);
        const elapsed = (now - startD) / (1000 * 60 * 60 * 24);
        const timePct = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
        const behind = timePct > (parseFloat(g.progress) || 0) + 20;

        return `<div class="timeline-item">
          <div class="timeline-left"><div class="timeline-dot" style="background:${g.color || 'var(--primary)'}"></div>${i < sorted.length - 1 ? '<div class="timeline-line"></div>' : ''}</div>
          <div class="card timeline-content" onclick="openGoal('${g.id}')">
            <div class="timeline-header"><span class="timeline-icon">${cat.icon}</span><div style="flex:1"><div class="timeline-goal-title">${g.title}</div><div class="timeline-date">${formatShort(g.start_date)} → ${formatDate(g.target_date)}</div></div><span class="countdown-badge ${cd.overdue ? 'overdue' : ''}">${cd.text}</span></div>
            <div class="dual-progress">
              <div class="progress-row-mini"><span class="p-label">Postęp</span><div class="progress-bar"><div class="progress-fill" style="width:${g.progress || 0}%"></div></div><span class="p-pct">${Math.round(g.progress || 0)}%</span></div>
              <div class="progress-row-mini"><span class="p-label">Czas</span><div class="progress-bar"><div class="progress-fill" style="width:${Math.round(timePct)}%;background:${behind ? 'var(--warning)' : 'var(--text3)'}"></div></div><span class="p-pct">${Math.round(timePct)}%</span></div>
            </div>
            ${behind ? '<div class="alert-banner">Cel może być opóźniony</div>' : ''}
          </div>
        </div>`;
      }).join('')}
    `;
  }

  if (plannerView === 'kanban') {
    const cols = [
      { key: 'draft', label: 'Szkice', color: 'var(--text3)' },
      { key: 'active', label: 'Aktywne', color: 'var(--primary)' },
      { key: 'paused', label: 'Wstrzymane', color: 'var(--warning)' },
      { key: 'completed', label: 'Ukończone', color: 'var(--success)' },
    ];
    el.innerHTML = `<div class="kanban-scroll">${cols.map(c => {
      const cg = goals.filter(g => g.status === c.key);
      return `<div class="kanban-col">
        <div class="kanban-col-header" style="border-bottom-color:${c.color}"><span class="col-name" style="color:${c.color}">${c.label}</span><span class="col-count">${cg.length}</span></div>
        ${cg.map(g => { const cat = CATEGORIES[g.category] || CATEGORIES.other; return `<div class="kanban-card" onclick="openGoal('${g.id}')"><div class="k-icon">${cat.icon}</div><div class="k-title">${g.title}</div><div class="k-meta"><span class="k-pct">${Math.round(g.progress || 0)}%</span></div><div class="progress-bar" style="height:3px"><div class="progress-fill" style="width:${g.progress || 0}%;background:${c.color}"></div></div></div>`; }).join('')}
      </div>`;
    }).join('')}</div>`;
  }

  if (plannerView === 'calendar') {
    const yr = plannerMonth.getFullYear(), mo = plannerMonth.getMonth();
    const firstDay = new Date(yr, mo, 1);
    const lastDay = new Date(yr, mo + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDow = (firstDay.getDay() + 6) % 7;
    const today = new Date().toISOString().split('T')[0];
    const moName = plannerMonth.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });

    let cells = '';
    for (let i = 0; i < startDow; i++) cells += '<div class="cal-day"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = ds === today;
      const dayGoals = goals.filter(g => g.target_date && g.target_date.startsWith(ds));
      cells += `<div class="cal-day ${isToday ? 'today' : ''}">${d}${dayGoals.map(g => `<div class="goal-dot" style="background:${g.color || 'var(--primary)'}"></div>`).join('')}</div>`;
    }

    el.innerHTML = `
      <div class="month-nav"><button onclick="changeMonth(-1)">‹</button><span class="month-title">${moName}</span><button onclick="changeMonth(1)">›</button></div>
      <div class="cal-headers">${['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map(d => `<span class="cal-header">${d}</span>`).join('')}</div>
      <div class="cal-grid">${cells}</div>
    `;
  }
}

function changeMonth(delta) {
  plannerMonth = new Date(plannerMonth.getFullYear(), plannerMonth.getMonth() + delta, 1);
  renderPlanner(document.getElementById('mainContent'));
}

// ===== RISKS (global view) =====
async function renderRisks(el) {
  goals = await api('goals.php');
  let allRisks = [];
  for (const g of goals) {
    const full = await api(`goals.php?id=${g.id}`);
    (full.risks || []).forEach(r => { r.goal_title = g.title; allRisks.push(r); });
  }

  // Build matrix
  const probs = ['very_high', 'high', 'medium', 'low', 'very_low'];
  const impacts = ['negligible', 'minor', 'moderate', 'major', 'critical'];

  let matrixHTML = `<div style="display:inline-grid;grid-template-columns:60px repeat(5,56px);gap:3px">`;
  matrixHTML += `<div></div>${impacts.map(i => `<div class="matrix-header">${IMPACT_LABELS[i]}</div>`).join('')}`;
  for (const p of probs) {
    matrixHTML += `<div class="matrix-label">${PROB_LABELS[p]}</div>`;
    for (const i of impacts) {
      const score = (PROB_VALUES[p]) * (IMPACT_VALUES[i]);
      const bg = getRiskColor(score);
      const count = allRisks.filter(r => r.probability === p && r.impact === i).length;
      matrixHTML += `<div class="matrix-cell" style="background:${bg}30;border-color:${bg}60">${count ? `<div class="risk-count" style="background:${bg}">${count}</div>` : ''}</div>`;
    }
  }
  matrixHTML += '</div>';

  el.innerHTML = `
    <div class="section-title">Macierz Ryzyk</div>
    <div style="font-size:13px;color:var(--text2);margin-bottom:16px">Prawdopodobieństwo vs Wpływ</div>
    <div class="matrix-container">${matrixHTML}</div>
    <div class="legend">
      <span class="legend-item"><span class="legend-dot" style="background:#22C55E"></span>Niskie</span>
      <span class="legend-item"><span class="legend-dot" style="background:#EAB308"></span>Średnie</span>
      <span class="legend-item"><span class="legend-dot" style="background:#F97316"></span>Wysokie</span>
      <span class="legend-item"><span class="legend-dot" style="background:#EF4444"></span>Krytyczne</span>
    </div>
    <div class="stats-row">
      <div class="stat-card" style="border-left-color:#EF4444"><div class="value" style="color:#EF4444">${allRisks.filter(r => r.risk_score >= 0.5).length}</div><div class="label">Krytyczne</div></div>
      <div class="stat-card" style="border-left-color:#F97316"><div class="value" style="color:#F97316">${allRisks.filter(r => r.risk_score >= 0.3 && r.risk_score < 0.5).length}</div><div class="label">Wysokie</div></div>
      <div class="stat-card" style="border-left-color:#EAB308"><div class="value" style="color:#EAB308">${allRisks.filter(r => r.risk_score >= 0.15 && r.risk_score < 0.3).length}</div><div class="label">Średnie</div></div>
      <div class="stat-card" style="border-left-color:#22C55E"><div class="value" style="color:#22C55E">${allRisks.filter(r => r.risk_score < 0.15).length}</div><div class="label">Niskie</div></div>
    </div>
    <div class="section-title">Lista Ryzyk</div>
    ${allRisks.length === 0 ? '<div class="empty-state"><div class="empty-icon">🛡️</div><div class="empty-title">Brak ryzyk</div></div>' : ''}
    ${allRisks.sort((a, b) => b.risk_score - a.risk_score).map(r => `
      <div class="card risk-card" style="border-left-color:${getRiskColor(r.risk_score)}">
        <div class="risk-header"><span class="risk-title">${r.title}</span><span class="badge" style="background:${getRiskColor(r.risk_score)}20;color:${getRiskColor(r.risk_score)}">${Math.round(r.risk_score * 100)}%</span></div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:4px">${r.goal_title}</div>
        ${r.description ? `<div class="risk-desc">${r.description}</div>` : ''}
        <div class="risk-tags"><span class="tag">P: ${PROB_LABELS[r.probability]}</span><span class="tag">I: ${IMPACT_LABELS[r.impact]}</span></div>
        ${r.mitigation_plan ? `<div class="mitigation-box"><div class="mit-label">Plan mitygacji</div><div class="mit-text">${r.mitigation_plan}</div></div>` : ''}
      </div>`).join('')}
  `;
}

// ===== SETTINGS =====
function renderSettings(el) {
  el.innerHTML = `
    <div class="card setting-card">
      <h3>O aplikacji</h3>
      <div class="app-about">
        <div class="app-name">GoalTracker SMART</div>
        <div class="app-ver">Wersja 1.0.0 (PWA)</div>
        <div class="app-desc">Twój osobisty asystent w planowaniu i realizacji celów zgodnie z metodologią SMART. Zarządzaj celami, planuj etapy, monitoruj ryzyka i śledź postępy na każdym urządzeniu.</div>
      </div>
    </div>
    <div class="card setting-card">
      <h3>Instalacja na iPadzie</h3>
      <div style="font-size:14px;color:var(--text2);line-height:1.6">
        1. Otwórz tę stronę w Safari<br>
        2. Stuknij ikonę udostępniania (kwadrat ze strzałką)<br>
        3. Wybierz "Dodaj do ekranu początkowego"<br>
        4. Aplikacja pojawi się jako ikona na ekranie głównym
      </div>
    </div>
    <div class="card setting-card">
      <h3>Synchronizacja</h3>
      <div style="font-size:14px;color:var(--text2);line-height:1.6">
        Dane są przechowywane w bazie MySQL i synchronizowane automatycznie. Aplikacja działa na każdym urządzeniu z przeglądarką.
      </div>
      <div class="status-indicator"><div class="status-dot" style="background:var(--success)"></div><span style="font-size:13px;color:var(--text2)">Połączono z bazą danych</span></div>
    </div>
  `;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // Tab navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });

  // FAB
  document.getElementById('fab').addEventListener('click', newGoal);

  // Initial render
  navigate('dashboard');
});
