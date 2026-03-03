'use strict';

/* ── App State ─────────────────────────────────── */
const App = {
  view: 'dashboard',   // 'dashboard' | 'subscriptions' | 'bills' | 'settings'
  modal: null,         // { type, data } or null
  confirm: null,       // { msg, onOk } or null
};

/* ── Storage ───────────────────────────────────── */
const Store = {
  subs()       { return JSON.parse(localStorage.getItem('st_subscriptions') || '[]'); },
  saveSubs(a)  { localStorage.setItem('st_subscriptions', JSON.stringify(a)); },
  bills()      { return JSON.parse(localStorage.getItem('st_bills') || '[]'); },
  saveBills(a) { localStorage.setItem('st_bills', JSON.stringify(a)); },
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

/* Current period key for a subscription's paidCycles map */
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
    // ISO week number
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

/* Due-soon urgency chip */
function urgencyChip(iso) {
  const d = daysUntil(iso);
  if (d < 0)  return '<span class="chip chip-overdue">Overdue</span>';
  if (d === 0) return '<span class="chip chip-due-soon">Today</span>';
  if (d <= 3)  return '<span class="chip chip-due-soon">In ' + d + 'd</span>';
  if (d <= 14) return '<span class="chip chip-due-soon">In ' + d + 'd</span>';
  return '<span class="chip chip-unpaid">In ' + d + 'd</span>';
}

/* ── Dashboard ─────────────────────────────────── */
function getDueSoon(days) {
  const subs = Store.subs().filter(s => s.active);
  const bills = Store.bills();
  const cutoff = days || 14;
  const items = [];

  subs.forEach(s => {
    const d = daysUntil(s.nextDue);
    if (d <= cutoff) {
      items.push({ type: 'sub', name: s.name, amount: s.cost, date: s.nextDue, days: d, paid: isSubPaid(s), id: s.id, cat: s.category, cycle: s.cycle });
    }
  });
  bills.forEach(b => {
    if (!b.paid) {
      const d = daysUntil(b.dueDate);
      if (d <= cutoff) {
        items.push({ type: 'bill', name: b.name, amount: b.amount, date: b.dueDate, days: d, paid: b.paid, id: b.id, cat: b.category, recurring: b.recurring });
      }
    }
  });

  return items.sort((a, b) => a.days - b.days);
}

function totalMonthlySpend() {
  const subs = Store.subs().filter(s => s.active);
  const bills = Store.bills().filter(b => b.recurring);
  let total = 0;
  subs.forEach(s => total += monthlyEquiv(s));
  bills.forEach(b => total += b.amount / (b.recurrMonths || 1));
  return total;
}

function renderDashboard() {
  const subs = Store.subs().filter(s => s.active);
  const bills = Store.bills();
  const dueSoon = getDueSoon(30);
  const unpaidCount = dueSoon.filter(i => !i.paid).length;
  const monthlyTotal = totalMonthlySpend();

  let html = '<div class="page">';
  html += '<div class="page-header"><span class="page-title">SubTracker</span></div>';

  // Stats row
  html += '<div class="stats-row">';
  html += `<div class="stat-card"><div class="stat-value">${fmtCost(monthlyTotal)}</div><div class="stat-label">/ month</div></div>`;
  html += `<div class="stat-card"><div class="stat-value">${subs.length}</div><div class="stat-label">Active Subs</div></div>`;
  html += `<div class="stat-card"><div class="stat-value">${unpaidCount}</div><div class="stat-label">Unpaid</div></div>`;
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
        ? `<button class="btn-mark-paid" onclick="${item.type === 'sub' ? 'toggleSubPaid' : 'toggleBillPaid'}('${item.id}')">Mark Paid</button>`
        : '';
      html += `
        <div class="due-item">
          <div class="item-icon">${catEmoji(item.cat)}</div>
          <div class="due-item-body">
            <div class="due-item-name">${escHtml(item.name)}</div>
            <div class="due-item-sub">${fmtDate(item.date)} · ${item.type === 'sub' ? cycleLabel(item.cycle) : (item.recurring ? 'Recurring' : 'One-time')}</div>
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

  return `
    <div class="item-card">
      <div class="item-icon">${catEmoji(s.category)}</div>
      <div class="item-card-body">
        <div class="item-card-name">${escHtml(s.name)}</div>
        <div class="item-card-meta">
          <span class="cat-badge ${categoryClass(s.category)}">${s.category}</span>
          ${s.autopay ? `&nbsp;<span class="chip-autopay" title="${escAttr(s.autopayInfo || 'Autopay')}">Auto</span>` : ''}
          &nbsp;${cycleLabel(s.cycle)} · Due ${fmtDate(s.nextDue)}
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
  const bills = Store.bills().sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  let html = '<div class="page">';
  html += '<div class="page-header"><span class="page-title">Bills</span>';
  html += '<button class="btn-add" onclick="openModal(\'addBill\',{})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add</button>';
  html += '</div>';

  if (bills.length === 0) {
    html += '<div class="empty-state"><div class="empty-state-icon">🧾</div><div class="empty-state-title">No bills yet</div><div class="empty-state-body">Tap Add to track your first bill.</div></div>';
  } else {
    bills.forEach(b => {
      html += renderBillCard(b);
    });
  }

  html += '</div>';
  return html;
}

function renderBillCard(b) {
  const d = daysUntil(b.dueDate);
  const paidChip = b.paid
    ? '<span class="chip chip-paid">Paid ✓</span>'
    : (d < 0 ? '<span class="chip chip-overdue">Overdue</span>' : (d <= 7 ? '<span class="chip chip-due-soon">Due soon</span>' : '<span class="chip chip-unpaid">Unpaid</span>'));

  return `
    <div class="item-card">
      <div class="item-icon">${catEmoji(b.category)}</div>
      <div class="item-card-body">
        <div class="item-card-name">${escHtml(b.name)}</div>
        <div class="item-card-meta">
          <span class="cat-badge ${categoryClass(b.category)}">${b.category}</span>
          ${b.autopay ? `&nbsp;<span class="chip-autopay" title="${escAttr(b.autopayInfo || 'Autopay')}">Auto</span>` : ''}
          &nbsp;${b.recurring ? cycleLabel(recurrLabel(b.recurrMonths)) : 'One-time'} · Due ${fmtDate(b.dueDate)}
        </div>
        ${b.autopay && b.autopayInfo ? `<div class="item-card-autopay">${escHtml(b.autopayInfo)}</div>` : ''}
      </div>
      <div class="card-right">
        <div class="item-card-cost">${fmtCost(b.amount)}</div>
        ${paidChip}
        <button class="btn-mark-paid${b.paid ? ' paid' : ''}" onclick="toggleBillPaid('${b.id}')">
          ${b.paid ? 'Paid ✓' : 'Mark Paid'}
        </button>
        <div class="item-card-actions">
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
  const map = { 1: 'monthly', 3: 'quarterly', 6: 'monthly', 12: 'yearly' };
  return map[months] || 'monthly';
}

/* ── Settings ──────────────────────────────────── */
function renderSettings() {
  return `
    <div class="page">
      <div class="page-header"><span class="page-title">Settings</span></div>

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

/* ── Modal ─────────────────────────────────────── */
const CATEGORIES = ['Entertainment', 'Utilities', 'Software', 'Health', 'Food', 'Other'];

function renderModal() {
  if (!App.modal) return '';
  const { type, data } = App.modal;
  const isSub  = type === 'addSub'  || type === 'editSub';
  const isBill = type === 'addBill' || type === 'editBill';
  const isEdit = type === 'editSub' || type === 'editBill';
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
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Autopay?</label>
          <select id="m-autopay" class="input-field" onchange="toggleAutopayField()">
            <option value="no" ${!data.autopay ? 'selected' : ''}>No</option>
            <option value="yes" ${data.autopay ? 'selected' : ''}>Yes</option>
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
            <option value="no" ${!data.recurring ? 'selected' : ''}>One-time</option>
            <option value="yes" ${data.recurring ? 'selected' : ''}>Recurring</option>
          </select>
        </div>
      </div>
      <div class="form-group" id="m-recurr-wrap" style="${data.recurring ? '' : 'display:none'}">
        <label class="form-label">Repeats every</label>
        <select id="m-recurrMonths" class="input-field">${recurrOptions}</select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Autopay?</label>
          <select id="m-autopay" class="input-field" onchange="toggleAutopayField()">
            <option value="no" ${!data.autopay ? 'selected' : ''}>No</option>
            <option value="yes" ${data.autopay ? 'selected' : ''}>Yes</option>
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

  // Modal
  let overlay = document.getElementById('modal-root');
  if (!overlay) { overlay = document.createElement('div'); overlay.id = 'modal-root'; document.body.appendChild(overlay); }
  overlay.innerHTML = renderModal() + renderConfirm();

  // Nav active state
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
  const existId     = document.getElementById('m-id')?.value;

  if (!name) { alert('Please enter a name.'); return; }
  if (isNaN(cost) || cost < 0) { alert('Please enter a valid cost.'); return; }

  const subs = Store.subs();
  if (existId) {
    const i = subs.findIndex(s => s.id === existId);
    if (i !== -1) {
      subs[i] = { ...subs[i], name, cost, cycle, category, nextDue, notes, autopay, autopayInfo };
    }
  } else {
    subs.push({ id: uid('sub'), name, cost, cycle, category, nextDue, notes, autopay, autopayInfo, active: true, paidCycles: {} });
  }
  Store.saveSubs(subs);
  closeModal();
}

function toggleSubPaid(id) {
  const subs = Store.subs();
  const sub  = subs.find(s => s.id === id);
  if (!sub) return;
  if (!sub.paidCycles) sub.paidCycles = {};
  const key = currentCycleKey(sub);
  sub.paidCycles[key] = !sub.paidCycles[key];
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
  const name        = (document.getElementById('m-name')?.value || '').trim();
  const amount      = parseFloat(document.getElementById('m-amount')?.value || 0);
  const dueDate     = document.getElementById('m-dueDate')?.value || today();
  const category    = document.getElementById('m-category')?.value || 'Other';
  const recurring   = document.getElementById('m-recurring')?.value === 'yes';
  const recurrMonths= recurring ? parseInt(document.getElementById('m-recurrMonths')?.value || 1, 10) : null;
  const notes       = (document.getElementById('m-notes')?.value || '').trim();
  const autopay     = document.getElementById('m-autopay')?.value === 'yes';
  const autopayInfo = autopay ? (document.getElementById('m-autopayInfo')?.value || '').trim() : '';
  const existId     = document.getElementById('m-id')?.value;

  if (!name) { alert('Please enter a name.'); return; }
  if (isNaN(amount) || amount < 0) { alert('Please enter a valid amount.'); return; }

  const bills = Store.bills();
  if (existId) {
    const i = bills.findIndex(b => b.id === existId);
    if (i !== -1) {
      bills[i] = { ...bills[i], name, amount, dueDate, category, recurring, recurrMonths, notes, autopay, autopayInfo };
    }
  } else {
    bills.push({ id: uid('bill'), name, amount, dueDate, category, recurring, recurrMonths, notes, autopay, autopayInfo, paid: false });
  }
  Store.saveBills(bills);
  closeModal();
}

function toggleBillPaid(id) {
  const bills = Store.bills();
  const bill  = bills.find(b => b.id === id);
  if (!bill) return;
  const wasPaid = bill.paid;
  bill.paid = !bill.paid;
  // If marking a recurring bill as paid, advance its due date
  if (!wasPaid && bill.paid && bill.recurring && bill.recurrMonths) {
    bill.dueDate = advanceDate(bill.dueDate, bill.recurrMonths);
    bill.paid = false; // reset for next cycle after advancing
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
  openConfirm('This bill will be permanently deleted.', () => deleteBill(id));
}

function deleteBill(id) {
  Store.saveBills(Store.bills().filter(b => b.id !== id));
  render();
}

/* ── Settings: export / import / clear ────────── */
function exportData() {
  const payload = { subscriptions: Store.subs(), bills: Store.bills(), exportedAt: new Date().toISOString() };
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
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  render();
}

document.addEventListener('DOMContentLoaded', init);
