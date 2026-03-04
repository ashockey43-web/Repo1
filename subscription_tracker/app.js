'use strict';

/* ── App State ─────────────────────────────────── */
const App = {
  view: 'dashboard',   // 'dashboard' | 'subscriptions' | 'bills' | 'settings'
  modal: null,         // { type, data } or null
  confirm: null,       // { msg, onOk } or null
};

/* ── Storage ───────────────────────────────────── */
const Store = {
  subs()          { return JSON.parse(localStorage.getItem('st_subscriptions') || '[]'); },
  saveSubs(a)     { localStorage.setItem('st_subscriptions', JSON.stringify(a)); },
  bills()         { return JSON.parse(localStorage.getItem('st_bills') || '[]'); },
  saveBills(a)    { localStorage.setItem('st_bills', JSON.stringify(a)); },
  settings()      { return JSON.parse(localStorage.getItem('st_settings') || '{"person1":"Me","person2":"Husband"}'); },
  saveSettings(o) { localStorage.setItem('st_settings', JSON.stringify(o)); },
};

/* ── Utilities ─────────────────────────────────── */
function uid(prefix) {
  return (prefix || 'id') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDateFull(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtCost(n) {
  return '$' + Number(n).toFixed(2);
}

function daysUntil(iso) {
  const now = new Date(); now.setHours(0,0,0,0);
  const due = new Date(iso + 'T00:00:00');
  return Math.round((due - now) / 86400000);
}

function cycleLabel(cycle) {
  return { monthly: 'Monthly', yearly: 'Yearly', quarterly: 'Quarterly', weekly: 'Weekly' }[cycle] || cycle;
}

function cycleMonths(cycle) {
  return { monthly: 1, quarterly: 3, yearly: 12, weekly: 0.25 }[cycle] || 1;
}

function monthlyEquiv(sub) {
  return sub.cost / cycleMonths(sub.cycle);
}

function currentCycleKey(sub) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  if (sub.cycle === 'monthly') return `${y}-${m}`;
  if (sub.cycle === 'yearly')  return `${y}`;
  if (sub.cycle === 'quarterly') {
    const q = Math.ceil((now.getMonth() + 1) / 3);
    return `${y}-Q${q}`;
  }
  if (sub.cycle === 'weekly') {
    const d = new Date(now);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const wk = new Date(d.getFullYear(), 0, 4);
    const week = 1 + Math.round(((d - wk) / 86400000 - 3 + (wk.getDay() + 6) % 7) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2,'0')}`;
  }
  return `${y}-${m}`;
}

function isSubPaid(sub) {
  return !!(sub.paidCycles && sub.paidCycles[currentCycleKey(sub)]);
}

function categoryClass(cat) {
  return 'cat-' + (cat || 'other').toLowerCase();
}

function catEmoji(cat) {
  const map = {
    Entertainment: '🎬', Utilities: '💡', Software: '💻',
    Health: '❤️', Food: '🍔', Other: '📦'
  };
  return map[cat] || '📦';
}

function urgencyChip(iso) {
  const d = daysUntil(iso);
  if (d < 0)   return '<span class="chip chip-overdue">Overdue</span>';
  if (d === 0) return '<span class="chip chip-due-soon">Today</span>';
  if (d <= 14) return '<span class="chip chip-due-soon">In ' + d + 'd</span>';
  return '<span class="chip chip-unpaid">In ' + d + 'd</span>';
}

/* ── People helpers ────────────────────────────── */
function getSettings() {
  return Store.settings();
}

function personLabel(responsible, splitPct) {
  const s = getSettings();
  if (responsible === 'person2') return s.person2;
  if (responsible === 'split') {
    const pct = splitPct ?? 50;
    return pct === 50 ? '50/50' : `${pct}/${100 - pct}`;
  }
  return s.person1;
}

function personChipHtml(responsible, splitPct) {
  const label = escHtml(personLabel(responsible, splitPct));
  const cls = responsible === 'person2' ? 'chip-person2'
            : responsible === 'split'   ? 'chip-split'
            : 'chip-person1';
  return `<span class="${cls}">${label}</span>`;
}

/* ── Bill hierarchy helpers ────────────────────── */
function billChildrenOf(parentId, allBills) {
  return allBills.filter(b => b.parentId === parentId);
}

function trackedAmount(parentBill, allBills) {
  return billChildrenOf(parentBill.id, allBills).reduce((sum, c) => sum + (c.amount || 0), 0);
}

/* ── Dashboard ─────────────────────────────────── */
function getDueSoon(days) {
  const subs  = Store.subs().filter(s => s.active);
  const bills = Store.bills();
  const cutoff = days || 14;
  const items = [];

  subs.forEach(s => {
    const d = daysUntil(s.nextDue);
    if (d <= cutoff) {
      items.push({ type: 'sub', name: s.name, amount: s.cost, date: s.nextDue, days: d,
                   paid: isSubPaid(s), id: s.id, cat: s.category, cycle: s.cycle });
    }
  });
  bills.forEach(b => {
    if (!b.paid) {
      const d = daysUntil(b.dueDate);
      if (d <= cutoff) {
        items.push({ type: 'bill', name: b.name, amount: b.amount, date: b.dueDate, days: d,
                     paid: b.paid, id: b.id, cat: b.category, recurring: b.recurring,
                     variable: b.variableAmount, parentId: b.parentId || null });
      }
    }
  });

  return items.sort((a, b) => a.days - b.days);
}

function totalMonthlySpend() {
  const subs  = Store.subs().filter(s => s.active);
  // Exclude child bills to avoid double-counting
  const bills = Store.bills().filter(b => b.recurring && !b.parentId);
  let total = 0;
  subs.forEach(s  => total += monthlyEquiv(s));
  bills.forEach(b => total += b.amount / (b.recurrMonths || 1));
  return total;
}

function personMonthlyTotals() {
  const s = getSettings();
  const subs  = Store.subs().filter(s => s.active);
  const bills = Store.bills().filter(b => b.recurring && !b.parentId);
  let p1 = 0, p2 = 0;

  function distribute(amount, item) {
    const resp = item.responsible || 'person1';
    const pct  = item.splitPct ?? 50;
    if (resp === 'person2') { p2 += amount; }
    else if (resp === 'split') { p1 += amount * (pct / 100); p2 += amount * ((100 - pct) / 100); }
    else { p1 += amount; }
  }

  subs.forEach(s  => distribute(monthlyEquiv(s), s));
  bills.forEach(b => distribute(b.amount / (b.recurrMonths || 1), b));
  return { person1: p1, person2: p2, p1name: s.person1, p2name: s.person2 };
}

function renderDashboard() {
  const subs       = Store.subs().filter(s => s.active);
  const dueSoon    = getDueSoon(30);
  const unpaidCount= dueSoon.filter(i => !i.paid).length;
  const monthlyTotal = totalMonthlySpend();
  const persons    = personMonthlyTotals();

  let html = '<div class="page">';
  html += '<div class="page-header"><span class="page-title">SubTracker</span></div>';

  // Stats row
  html += '<div class="stats-row">';
  html += `<div class="stat-card"><div class="stat-value">${fmtCost(monthlyTotal)}</div><div class="stat-label">/ month</div></div>`;
  html += `<div class="stat-card"><div class="stat-value">${subs.length}</div><div class="stat-label">Active Subs</div></div>`;
  html += `<div class="stat-card"><div class="stat-value">${unpaidCount}</div><div class="stat-label">Unpaid</div></div>`;
  html += '</div>';

  // Per-person breakdown
  html += '<div class="person-row">';
  html += `<div class="person-card person-card--p1">
             <div class="person-card-name">${escHtml(persons.p1name)}</div>
             <div class="person-card-amount">${fmtCost(persons.person1)}<span class="person-card-mo">/mo</span></div>
           </div>`;
  html += `<div class="person-card person-card--p2">
             <div class="person-card-name">${escHtml(persons.p2name)}</div>
             <div class="person-card-amount">${fmtCost(persons.person2)}<span class="person-card-mo">/mo</span></div>
           </div>`;
  html += '</div>';

  // Due soon
  html += '<div class="section-header">Due in the next 30 days</div>';

  if (dueSoon.length === 0) {
    html += '<div class="empty-state"><div class="empty-state-icon">🎉</div><div class="empty-state-title">All clear!</div><div class="empty-state-body">Nothing due in the next 30 days.</div></div>';
  } else {
    dueSoon.forEach(item => {
      const paidChip = item.paid
        ? '<span class="chip chip-paid">Paid ✓</span>'
        : urgencyChip(item.date);
      const markBtn = !item.paid
        ? `<button class="btn-mark-paid" onclick="${item.type === 'sub' ? `toggleSubPaid('${item.id}')` : (item.variable ? `openPayVariable('${item.id}')` : `toggleBillPaid('${item.id}')`)}">Mark Paid</button>`
        : '';
      const parentNote = item.parentId
        ? `<span class="due-via">via ${escHtml(billNameById(item.parentId))}</span>`
        : '';
      html += `
        <div class="due-item">
          <div class="item-icon">${catEmoji(item.cat)}</div>
          <div class="due-item-body">
            <div class="due-item-name">${escHtml(item.name)}</div>
            <div class="due-item-sub">${fmtDate(item.date)} · ${item.type === 'sub' ? cycleLabel(item.cycle) : (item.recurring ? 'Recurring' : 'One-time')}${parentNote}</div>
          </div>
          <div class="due-item-right">
            <div class="due-item-amount">${fmtCost(item.amount)}</div>
            ${paidChip}
            ${markBtn}
          </div>
        </div>`;
    });
  }

  html += '</div>';
  return html;
}

function billNameById(id) {
  const b = Store.bills().find(b => b.id === id);
  return b ? b.name : '';
}

/* ── Subscriptions ─────────────────────────────── */
function renderSubscriptions() {
  const subs = Store.subs().filter(s => s.active).sort((a, b) => a.nextDue.localeCompare(b.nextDue));

  let html = '<div class="page">';
  html += '<div class="page-header"><span class="page-title">Subscriptions</span>';
  html += '<button class="btn-add" onclick="openModal(\'addSub\',{})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add</button>';
  html += '</div>';

  if (subs.length === 0) {
    html += '<div class="empty-state"><div class="empty-state-icon">💳</div><div class="empty-state-title">No subscriptions yet</div><div class="empty-state-body">Tap Add to track your first subscription.</div></div>';
  } else {
    subs.forEach(s => {
      const paid = isSubPaid(s);
      const d = daysUntil(s.nextDue);
      html += renderSubCard(s, paid, d);
    });
  }

  html += '</div>';
  return html;
}

function renderSubCard(s, paid, d) {
  const paidChip = paid
    ? '<span class="chip chip-paid">Paid ✓</span>'
    : (d < 0 ? '<span class="chip chip-overdue">Overdue</span>' : (d <= 7 ? '<span class="chip chip-due-soon">Due soon</span>' : '<span class="chip chip-unpaid">Unpaid</span>'));

  const resp = s.responsible || 'person1';
  const spct = s.splitPct ?? 50;

  return `
    <div class="item-card">
      <div class="item-icon">${catEmoji(s.category)}</div>
      <div class="item-card-body">
        <div class="item-card-name">${escHtml(s.name)}</div>
        <div class="item-card-meta">
          <span class="cat-badge ${categoryClass(s.category)}">${s.category}</span>
          ${personChipHtml(resp, spct)}
          ${s.autopay ? `<span class="chip-autopay" title="${escAttr(s.autopayInfo || 'Autopay')}">Auto</span>` : ''}
          ${cycleLabel(s.cycle)} · Due ${fmtDate(s.nextDue)}
        </div>
        ${s.autopay && s.autopayInfo ? `<div class="item-card-autopay">${escHtml(s.autopayInfo)}</div>` : ''}
      </div>
      <div class="card-right">
        <div class="item-card-cost">${fmtCost(s.cost)}</div>
        ${paidChip}
        <button class="btn-mark-paid${paid ? ' paid' : ''}" onclick="toggleSubPaid('${s.id}')">
          ${paid ? 'Paid ✓' : 'Mark Paid'}
        </button>
        <div class="item-card-actions">
          <button class="btn-icon" onclick="openHistory('sub','${s.id}')" title="History">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </button>
          <button class="btn-icon" onclick="openEditSub('${s.id}')" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon" onclick="confirmDeleteSub('${s.id}')" title="Delete" style="color:var(--danger)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>
    </div>`;
}

/* ── Bills ─────────────────────────────────────── */
function renderBills() {
  const allBills = Store.bills();
  const topLevel = allBills.filter(b => !b.parentId).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  // Build map: parentId → children[]
  const childMap = {};
  allBills.filter(b => b.parentId).forEach(b => {
    if (!childMap[b.parentId]) childMap[b.parentId] = [];
    childMap[b.parentId].push(b);
  });

  let html = '<div class="page">';
  html += '<div class="page-header"><span class="page-title">Bills</span>';
  html += '<button class="btn-add" onclick="openModal(\'addBill\',{})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add</button>';
  html += '</div>';

  if (allBills.length === 0) {
    html += '<div class="empty-state"><div class="empty-state-icon">🧾</div><div class="empty-state-title">No bills yet</div><div class="empty-state-body">Tap Add to track your first bill.</div></div>';
  } else {
    const renderedChildIds = new Set();

    topLevel.forEach(parent => {
      const children = (childMap[parent.id] || []).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      html += renderBillCard(parent, false, children);
      children.forEach(child => {
        html += `<div class="bill-child-wrapper">
                   <span class="tree-connector">└</span>
                   ${renderBillCard(child, true, [])}
                 </div>`;
        renderedChildIds.add(child.id);
      });
    });

    // Orphans: children whose parent was deleted
    allBills.filter(b => b.parentId && !renderedChildIds.has(b.id)).forEach(b => {
      html += renderBillCard(b, false, []);
    });
  }

  html += '</div>';
  return html;
}

function renderBillCard(b, isChild, children) {
  const d = daysUntil(b.dueDate);
  const paidChip = b.paid
    ? '<span class="chip chip-paid">Paid ✓</span>'
    : (d < 0 ? '<span class="chip chip-overdue">Overdue</span>' : (d <= 7 ? '<span class="chip chip-due-soon">Due soon</span>' : '<span class="chip chip-unpaid">Unpaid</span>'));

  const resp = b.responsible || 'person1';
  const spct = b.splitPct ?? 50;

  // Tracked amount line for parent bills that have children
  let trackedLine = '';
  if (!isChild && children && children.length > 0) {
    const tracked = children.reduce((sum, c) => sum + (c.amount || 0), 0);
    const pct = b.amount > 0 ? Math.round((tracked / b.amount) * 100) : 0;
    trackedLine = `<div class="tracked-line">
      Tracked: ${fmtCost(tracked)} of ${fmtCost(b.amount)}
      <span class="tracked-pct">(${pct}%)</span>
    </div>`;
  }

  return `
    <div class="item-card${isChild ? ' item-card--child' : ''}">
      <div class="item-icon">${catEmoji(b.category)}</div>
      <div class="item-card-body">
        <div class="item-card-name">${escHtml(b.name)}</div>
        <div class="item-card-meta">
          <span class="cat-badge ${categoryClass(b.category)}">${b.category}</span>
          ${personChipHtml(resp, spct)}
          ${b.autopay ? `<span class="chip-autopay" title="${escAttr(b.autopayInfo || 'Autopay')}">Auto</span>` : ''}
          ${b.variableAmount ? '<span class="chip-variable">Variable</span>' : ''}
          ${b.recurring ? cycleLabel(recurrLabel(b.recurrMonths)) : 'One-time'} · Due ${fmtDate(b.dueDate)}
        </div>
        ${b.autopay && b.autopayInfo ? `<div class="item-card-autopay">${escHtml(b.autopayInfo)}</div>` : ''}
        ${trackedLine}
      </div>
      <div class="card-right">
        <div class="item-card-cost">${b.variableAmount ? '<span class="cost-tilde">~</span>' : ''}${fmtCost(b.amount)}</div>
        ${paidChip}
        <button class="btn-mark-paid${b.paid ? ' paid' : ''}" onclick="${b.variableAmount && !b.paid ? `openPayVariable('${b.id}')` : `toggleBillPaid('${b.id}')`}">
          ${b.paid ? 'Paid ✓' : 'Mark Paid'}
        </button>
        <div class="item-card-actions">
          <button class="btn-icon" onclick="openHistory('bill','${b.id}')" title="History">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </button>
          <button class="btn-icon" onclick="openEditBill('${b.id}')" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon" onclick="confirmDeleteBill('${b.id}')" title="Delete" style="color:var(--danger)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>
    </div>`;
}

function recurrLabel(months) {
  const map = { 1: 'monthly', 3: 'quarterly', 6: 'semi-annual', 12: 'yearly' };
  return map[months] || 'monthly';
}

/* ── Settings ──────────────────────────────────── */
function renderSettings() {
  const s = getSettings();
  return `
    <div class="page">
      <div class="page-header"><span class="page-title">Settings</span></div>

      <div class="section-header">People</div>
      <div class="settings-section">
        <div class="settings-row">
          <div class="settings-row-label">Person 1</div>
          <input id="s-person1" class="input-field settings-name-input" type="text"
            value="${escAttr(s.person1)}" placeholder="e.g. Me">
        </div>
        <div class="settings-row">
          <div class="settings-row-label">Person 2</div>
          <input id="s-person2" class="input-field settings-name-input" type="text"
            value="${escAttr(s.person2)}" placeholder="e.g. Husband">
        </div>
        <div class="settings-row" style="justify-content:flex-end">
          <button class="btn-primary btn-sm" onclick="savePeopleSettings()">Save Names</button>
        </div>
      </div>

      <div class="section-header">Data</div>
      <div class="settings-section">
        <div class="settings-row">
          <div>
            <div class="settings-row-label">Export Backup</div>
            <div class="settings-row-sub">Download all data as JSON</div>
          </div>
          <button class="btn-secondary btn-sm" onclick="exportData()">Export</button>
        </div>
        <div class="settings-row">
          <div>
            <div class="settings-row-label">Import Backup</div>
            <div class="settings-row-sub">Restore from a JSON file</div>
          </div>
          <button class="btn-secondary btn-sm" onclick="document.getElementById('import-file').click()">Import</button>
        </div>
        <input type="file" id="import-file" accept=".json" style="display:none" onchange="importData(this)">
      </div>

      <div class="section-header">Danger Zone</div>
      <div class="settings-section">
        <div class="settings-row">
          <div>
            <div class="settings-row-label">Clear All Data</div>
            <div class="settings-row-sub">Permanently delete everything</div>
          </div>
          <button class="btn-danger btn-sm" onclick="confirmClearAll()">Clear</button>
        </div>
      </div>

      <div style="text-align:center;margin-top:32px;color:var(--muted);font-size:0.75rem">SubTracker v1.0</div>
    </div>`;
}

function savePeopleSettings() {
  const p1 = (document.getElementById('s-person1')?.value || '').trim();
  const p2 = (document.getElementById('s-person2')?.value || '').trim();
  if (!p1 || !p2) { alert('Both names are required.'); return; }
  Store.saveSettings({ person1: p1, person2: p2 });
  render();
}

/* ── Modal ─────────────────────────────────────── */
const CATEGORIES = ['Entertainment', 'Utilities', 'Software', 'Health', 'Food', 'Other'];

function responsibleFields(data) {
  const s    = getSettings();
  const resp = data.responsible || 'person1';
  const spct = data.splitPct ?? 50;
  const showCustom = resp === 'split' && spct !== 50;

  return `
    <div class="form-group">
      <label class="form-label">Responsible</label>
      <select id="m-responsible" class="input-field" onchange="toggleSplitField()">
        <option value="person1" ${resp === 'person1' ? 'selected' : ''}>${escHtml(s.person1)}</option>
        <option value="person2" ${resp === 'person2' ? 'selected' : ''}>${escHtml(s.person2)}</option>
        <option value="split"   ${resp === 'split' && spct === 50  ? 'selected' : ''}>Split equally (50/50)</option>
        <option value="custom"  ${resp === 'split' && spct !== 50  ? 'selected' : ''}>Custom split</option>
      </select>
    </div>
    <div class="form-group" id="m-split-wrap" style="${showCustom ? '' : 'display:none'}">
      <label class="form-label">${escHtml(s.person1)}'s share (%)</label>
      <input id="m-splitPct" class="input-field" type="number" min="0" max="100"
        value="${showCustom ? spct : 50}" placeholder="50">
    </div>`;
}

function renderModal() {
  if (!App.modal) return '';
  const { type, data } = App.modal;
  const isSub  = type === 'addSub'  || type === 'editSub';
  const isBill = type === 'addBill' || type === 'editBill';
  const isEdit = type === 'editSub' || type === 'editBill';

  if (type === 'payVariable') {
    return `
      <div class="modal-overlay" onclick="overlayClose(event)">
        <div class="modal-sheet">
          <div class="modal-handle"></div>
          <div class="modal-title">Enter this month's amount</div>
          <div class="form-group">
            <label class="form-label">Amount ($)</label>
            <input id="m-var-amount" class="input-field" type="number" step="0.01" min="0"
              placeholder="0.00" value="${data.amount || ''}" autofocus>
          </div>
          <p style="font-size:0.8rem;color:var(--muted);margin-bottom:4px">
            Last amount: ${fmtCost(data.amount || 0)}
          </p>
          <div class="modal-actions">
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn-primary" onclick="saveVariablePayment('${data.id}')">Mark Paid</button>
          </div>
        </div>
      </div>`;
  }

  if (type === 'history') {
    const payments = data.payments || [];
    const rows = payments.length === 0
      ? '<div class="history-empty">No payment records yet.</div>'
      : payments.map(p => `
          <div class="history-row">
            <div class="history-row-left">
              <div class="history-period">${escHtml(p.period)}</div>
              <div class="history-date">Paid ${escHtml(p.paidAt)}</div>
            </div>
            <div class="history-amount">${fmtCost(p.amount)}</div>
          </div>`).join('');

    return `
      <div class="modal-overlay" onclick="overlayClose(event)">
        <div class="modal-sheet">
          <div class="modal-handle"></div>
          <div class="modal-title">Payment History</div>
          <div class="history-name">${escHtml(data.name)}</div>
          <div class="history-list">${rows}</div>
          <div class="modal-actions">
            <button class="btn-secondary" onclick="closeModal()" style="flex:1">Close</button>
          </div>
        </div>
      </div>`;
  }

  const title  = isEdit ? (isSub ? 'Edit Subscription' : 'Edit Bill') : (isSub ? 'New Subscription' : 'New Bill');
  const onSave = isSub ? 'saveSubscription()' : 'saveBill()';

  const catOptions = CATEGORIES.map(c =>
    `<option value="${c}" ${data.category === c ? 'selected' : ''}>${c}</option>`
  ).join('');

  let fields = '';

  if (isSub) {
    const cycleOptions = [
      ['monthly','Monthly'], ['quarterly','Quarterly'], ['yearly','Yearly'], ['weekly','Weekly']
    ].map(([v,l]) => `<option value="${v}" ${data.cycle === v ? 'selected' : ''}>${l}</option>`).join('');

    fields = `
      <div class="form-group">
        <label class="form-label">Name</label>
        <input id="m-name" class="input-field" type="text" placeholder="e.g. Netflix" value="${escAttr(data.name || '')}" autocomplete="off">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Cost ($)</label>
          <input id="m-cost" class="input-field" type="number" step="0.01" min="0" placeholder="0.00" value="${data.cost || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Cycle</label>
          <select id="m-cycle" class="input-field">${cycleOptions}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Category</label>
          <select id="m-category" class="input-field">${catOptions}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Next Due</label>
          <input id="m-nextDue" class="input-field" type="date" value="${data.nextDue || today()}">
        </div>
      </div>
      ${responsibleFields(data)}
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Autopay?</label>
          <select id="m-autopay" class="input-field" onchange="toggleAutopayField()">
            <option value="no"  ${!data.autopay ? 'selected' : ''}>No</option>
            <option value="yes" ${data.autopay  ? 'selected' : ''}>Yes</option>
          </select>
        </div>
      </div>
      <div class="form-group" id="m-autopay-wrap" style="${data.autopay ? '' : 'display:none'}">
        <label class="form-label">Payment method</label>
        <input id="m-autopayInfo" class="input-field" type="text" placeholder="e.g. Chase Visa ending 4242" value="${escAttr(data.autopayInfo || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Notes (optional)</label>
        <input id="m-notes" class="input-field" type="text" placeholder="Any notes" value="${escAttr(data.notes || '')}">
      </div>
      ${isEdit ? `<input type="hidden" id="m-id" value="${data.id}">` : ''}`;
  }

  if (isBill) {
    const recurrOptions = [
      ['1','Monthly'], ['3','Quarterly'], ['6','Semi-annual'], ['12','Yearly']
    ].map(([v,l]) => `<option value="${v}" ${String(data.recurrMonths) === v ? 'selected' : ''}>${l}</option>`).join('');

    // Build parent bill options (top-level bills only, excluding self)
    const allBills     = Store.bills();
    const editingId    = data.id || null;
    const childIds     = new Set(allBills.filter(b => b.parentId).map(b => b.parentId));
    const parentOpts   = allBills
      .filter(b => !b.parentId && b.id !== editingId && !childIds.has(b.id))
      .map(b => `<option value="${escAttr(b.id)}" ${data.parentId === b.id ? 'selected' : ''}>${escHtml(b.name)}</option>`)
      .join('');

    fields = `
      <div class="form-group">
        <label class="form-label">Name</label>
        <input id="m-name" class="input-field" type="text" placeholder="e.g. Electric Bill" value="${escAttr(data.name || '')}" autocomplete="off">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Amount ($)</label>
          <input id="m-amount" class="input-field" type="number" step="0.01" min="0" placeholder="0.00" value="${data.amount || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Due Date</label>
          <input id="m-dueDate" class="input-field" type="date" value="${data.dueDate || today()}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Category</label>
          <select id="m-category" class="input-field">${catOptions}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Recurring?</label>
          <select id="m-recurring" class="input-field" onchange="toggleRecurrField()">
            <option value="no"  ${!data.recurring ? 'selected' : ''}>One-time</option>
            <option value="yes" ${data.recurring  ? 'selected' : ''}>Recurring</option>
          </select>
        </div>
      </div>
      <div class="form-group" id="m-recurr-wrap" style="${data.recurring ? '' : 'display:none'}">
        <label class="form-label">Repeats every</label>
        <select id="m-recurrMonths" class="input-field">${recurrOptions}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Amount type</label>
        <select id="m-variableAmount" class="input-field">
          <option value="no"  ${!data.variableAmount ? 'selected' : ''}>Fixed — same every time</option>
          <option value="yes" ${data.variableAmount  ? 'selected' : ''}>Variable — changes each cycle</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Paid via (optional)</label>
        <select id="m-parentId" class="input-field">
          <option value="">Direct payment</option>
          ${parentOpts}
        </select>
      </div>
      ${responsibleFields(data)}
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Autopay?</label>
          <select id="m-autopay" class="input-field" onchange="toggleAutopayField()">
            <option value="no"  ${!data.autopay ? 'selected' : ''}>No</option>
            <option value="yes" ${data.autopay  ? 'selected' : ''}>Yes</option>
          </select>
        </div>
      </div>
      <div class="form-group" id="m-autopay-wrap" style="${data.autopay ? '' : 'display:none'}">
        <label class="form-label">Payment method</label>
        <input id="m-autopayInfo" class="input-field" type="text" placeholder="e.g. Chase Visa ending 4242" value="${escAttr(data.autopayInfo || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Notes (optional)</label>
        <input id="m-notes" class="input-field" type="text" placeholder="Any notes" value="${escAttr(data.notes || '')}">
      </div>
      ${isEdit ? `<input type="hidden" id="m-id" value="${data.id}">` : ''}`;
  }

  return `
    <div class="modal-overlay" onclick="overlayClose(event)">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-title">${title}</div>
        ${fields}
        <div class="modal-actions">
          <button class="btn-secondary" onclick="closeModal()">Cancel</button>
          <button class="btn-primary" onclick="${onSave}">Save</button>
        </div>
      </div>
    </div>`;
}

function toggleRecurrField() {
  const el = document.getElementById('m-recurr-wrap');
  if (el) el.style.display = document.getElementById('m-recurring').value === 'yes' ? '' : 'none';
}

function toggleAutopayField() {
  const el = document.getElementById('m-autopay-wrap');
  if (el) el.style.display = document.getElementById('m-autopay').value === 'yes' ? '' : 'none';
}

function toggleSplitField() {
  const el  = document.getElementById('m-split-wrap');
  if (el) el.style.display = document.getElementById('m-responsible').value === 'custom' ? '' : 'none';
}

/* ── Confirm overlay ───────────────────────────── */
function renderConfirm() {
  if (!App.confirm) return '';
  return `
    <div class="confirm-overlay">
      <div class="confirm-card">
        <div class="confirm-title">Are you sure?</div>
        <div class="confirm-body">${App.confirm.msg}</div>
        <div class="confirm-btns">
          <button class="btn-secondary" onclick="closeConfirm()">Cancel</button>
          <button class="btn-danger" onclick="doConfirm()">Delete</button>
        </div>
      </div>
    </div>`;
}

/* ── Render engine ─────────────────────────────── */
function render() {
  const views = {
    dashboard: renderDashboard,
    subscriptions: renderSubscriptions,
    bills: renderBills,
    settings: renderSettings,
  };
  document.getElementById('app').innerHTML = (views[App.view] || renderDashboard)();

  let overlay = document.getElementById('modal-root');
  if (!overlay) { overlay = document.createElement('div'); overlay.id = 'modal-root'; document.body.appendChild(overlay); }
  overlay.innerHTML = renderModal() + renderConfirm();

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === App.view);
  });
}

function navigate(view) {
  App.view = view;
  render();
}

/* ── Modal helpers ─────────────────────────────── */
function openModal(type, data) {
  App.modal = { type, data: data || {} };
  render();
}

function openHistory(type, id) {
  const item = type === 'sub'
    ? Store.subs().find(s => s.id === id)
    : Store.bills().find(b => b.id === id);
  if (item) openModal('history', { ...item, _type: type });
}

function openEditSub(id) {
  const sub = Store.subs().find(s => s.id === id);
  if (sub) openModal('editSub', sub);
}

function openEditBill(id) {
  const bill = Store.bills().find(b => b.id === id);
  if (bill) openModal('editBill', bill);
}

function closeModal() {
  App.modal = null;
  render();
}

function overlayClose(e) {
  if (e.target === e.currentTarget) closeModal();
}

/* ── Confirm helpers ───────────────────────────── */
function openConfirm(msg, onOk) {
  App.confirm = { msg, onOk };
  render();
}

function closeConfirm() {
  App.confirm = null;
  render();
}

function doConfirm() {
  if (App.confirm && App.confirm.onOk) App.confirm.onOk();
  App.confirm = null;
  render();
}

/* ── Responsible helpers ───────────────────────── */
function readResponsible() {
  const val  = document.getElementById('m-responsible')?.value || 'person1';
  const isSplit = val === 'split' || val === 'custom';
  const responsible = isSplit ? 'split' : val;
  const splitPct    = isSplit
    ? Math.min(100, Math.max(0, parseInt(document.getElementById('m-splitPct')?.value || '50', 10)))
    : 50;
  return { responsible, splitPct };
}

/* ── Save / Delete Subscriptions ───────────────── */
function saveSubscription() {
  const name     = (document.getElementById('m-name')?.value || '').trim();
  const cost     = parseFloat(document.getElementById('m-cost')?.value || 0);
  const cycle    = document.getElementById('m-cycle')?.value || 'monthly';
  const category = document.getElementById('m-category')?.value || 'Other';
  const nextDue  = document.getElementById('m-nextDue')?.value || today();
  const notes       = (document.getElementById('m-notes')?.value || '').trim();
  const autopay     = document.getElementById('m-autopay')?.value === 'yes';
  const autopayInfo = autopay ? (document.getElementById('m-autopayInfo')?.value || '').trim() : '';
  const { responsible, splitPct } = readResponsible();
  const existId     = document.getElementById('m-id')?.value;

  if (!name) { alert('Please enter a name.'); return; }
  if (isNaN(cost) || cost < 0) { alert('Please enter a valid cost.'); return; }

  const subs = Store.subs();
  if (existId) {
    const i = subs.findIndex(s => s.id === existId);
    if (i !== -1) {
      subs[i] = { ...subs[i], name, cost, cycle, category, nextDue, notes, autopay, autopayInfo, responsible, splitPct };
    }
  } else {
    subs.push({ id: uid('sub'), name, cost, cycle, category, nextDue, notes, autopay, autopayInfo, responsible, splitPct, active: true, paidCycles: {} });
  }
  Store.saveSubs(subs);
  closeModal();
}

function toggleSubPaid(id) {
  const subs = Store.subs();
  const sub  = subs.find(s => s.id === id);
  if (!sub) return;
  if (!sub.paidCycles) sub.paidCycles = {};
  if (!sub.payments)   sub.payments   = [];
  const key     = currentCycleKey(sub);
  const wasPaid = !!sub.paidCycles[key];
  sub.paidCycles[key] = !wasPaid;
  if (!wasPaid) {
    // Marking as paid — record it
    sub.payments.unshift({ paidAt: today(), amount: sub.cost, period: key });
  } else {
    // Un-marking — remove the most recent record for this period
    const idx = sub.payments.findIndex(p => p.period === key);
    if (idx !== -1) sub.payments.splice(idx, 1);
  }
  Store.saveSubs(subs);
  render();
}

function confirmDeleteSub(id) {
  openConfirm('This subscription will be permanently deleted.', () => deleteSub(id));
}

function deleteSub(id) {
  Store.saveSubs(Store.subs().filter(s => s.id !== id));
  render();
}

/* ── Save / Delete Bills ───────────────────────── */
function saveBill() {
  const name           = (document.getElementById('m-name')?.value || '').trim();
  const amount         = parseFloat(document.getElementById('m-amount')?.value || 0);
  const dueDate        = document.getElementById('m-dueDate')?.value || today();
  const category       = document.getElementById('m-category')?.value || 'Other';
  const recurring      = document.getElementById('m-recurring')?.value === 'yes';
  const recurrMonths   = recurring ? parseInt(document.getElementById('m-recurrMonths')?.value || 1, 10) : null;
  const variableAmount = document.getElementById('m-variableAmount')?.value === 'yes';
  const parentId       = document.getElementById('m-parentId')?.value || null;
  const notes          = (document.getElementById('m-notes')?.value || '').trim();
  const autopay        = document.getElementById('m-autopay')?.value === 'yes';
  const autopayInfo    = autopay ? (document.getElementById('m-autopayInfo')?.value || '').trim() : '';
  const { responsible, splitPct } = readResponsible();
  const existId        = document.getElementById('m-id')?.value;

  if (!name) { alert('Please enter a name.'); return; }
  if (isNaN(amount) || amount < 0) { alert('Please enter a valid amount.'); return; }

  // Guard: cannot nest a bill that already has children
  if (parentId && existId) {
    const hasChildren = Store.bills().some(b => b.parentId === existId);
    if (hasChildren) {
      alert('This bill has sub-bills and cannot itself be nested under another bill.');
      return;
    }
  }

  const bills = Store.bills();
  if (existId) {
    const i = bills.findIndex(b => b.id === existId);
    if (i !== -1) {
      bills[i] = { ...bills[i], name, amount, dueDate, category, recurring, recurrMonths,
                   variableAmount, parentId, notes, autopay, autopayInfo, responsible, splitPct };
    }
  } else {
    bills.push({ id: uid('bill'), name, amount, dueDate, category, recurring, recurrMonths,
                 variableAmount, parentId, notes, autopay, autopayInfo, responsible, splitPct, paid: false });
  }
  Store.saveBills(bills);
  closeModal();
}

function openPayVariable(id) {
  const bill = Store.bills().find(b => b.id === id);
  if (bill) openModal('payVariable', bill);
}

function saveVariablePayment(id) {
  const newAmount = parseFloat(document.getElementById('m-var-amount')?.value || 0);
  if (isNaN(newAmount) || newAmount < 0) { alert('Please enter a valid amount.'); return; }
  const bills = Store.bills();
  const bill  = bills.find(b => b.id === id);
  if (!bill) return;
  if (!bill.payments) bill.payments = [];
  bill.payments.unshift({ paidAt: today(), amount: newAmount, period: fmtDateFull(bill.dueDate) });
  bill.amount = newAmount;
  if (bill.recurring && bill.recurrMonths) {
    bill.dueDate = advanceDate(bill.dueDate, bill.recurrMonths);
  } else {
    bill.paid = true;
  }
  Store.saveBills(bills);
  closeModal();
}

function toggleBillPaid(id) {
  const bills = Store.bills();
  const bill  = bills.find(b => b.id === id);
  if (!bill) return;
  if (!bill.payments) bill.payments = [];
  const wasPaid = bill.paid;
  bill.paid = !bill.paid;
  if (!wasPaid && bill.paid) {
    // Record the payment before possibly advancing date
    bill.payments.unshift({ paidAt: today(), amount: bill.amount, period: fmtDateFull(bill.dueDate) });
    if (bill.recurring && bill.recurrMonths) {
      bill.dueDate = advanceDate(bill.dueDate, bill.recurrMonths);
      bill.paid = false; // reset for next cycle
    }
  }
  Store.saveBills(bills);
  render();
}

function advanceDate(iso, months) {
  const d = new Date(iso + 'T12:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function confirmDeleteBill(id) {
  const hasChildren = Store.bills().some(b => b.parentId === id);
  const msg = hasChildren
    ? 'This bill and all its sub-bills will be permanently deleted.'
    : 'This bill will be permanently deleted.';
  openConfirm(msg, () => deleteBill(id));
}

function deleteBill(id) {
  // Cascade: also delete child bills
  Store.saveBills(Store.bills().filter(b => b.id !== id && b.parentId !== id));
  render();
}

/* ── Settings: export / import / clear ────────── */
function exportData() {
  const payload = { subscriptions: Store.subs(), bills: Store.bills(), settings: Store.settings(), exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'subtracker-backup-' + today() + '.json';
  a.click();
}

function importData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.subscriptions) Store.saveSubs(data.subscriptions);
      if (data.bills)         Store.saveBills(data.bills);
      if (data.settings)      Store.saveSettings(data.settings);
      input.value = '';
      render();
      alert('Import successful!');
    } catch {
      alert('Invalid backup file.');
    }
  };
  reader.readAsText(file);
}

function confirmClearAll() {
  App.confirm = { msg: 'All subscriptions and bills will be permanently deleted. This cannot be undone.', onOk: clearAll };
  render();
}

function clearAll() {
  Store.saveSubs([]);
  Store.saveBills([]);
  render();
}

/* ── XSS helpers ───────────────────────────────── */
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escAttr(str) {
  return escHtml(str);
}

/* ── Init ──────────────────────────────────────── */
function init() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  render();
}

document.addEventListener('DOMContentLoaded', init);
