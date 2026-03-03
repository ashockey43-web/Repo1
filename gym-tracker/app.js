// ══════════════════════════════════════════════════════════════
// GymTracker — Main Application
// ══════════════════════════════════════════════════════════════

// ── State ─────────────────────────────────────────────────────
const App = {
  view: 'home',           // current tab: home | workout | history | progress
  workoutStep: 'equip',  // setup sub-step: equip | exercises
  selectedEquip: new Set(['none']),  // selected equipment IDs
  selectedExIds: [],     // selected exercise IDs for upcoming workout
  activeWorkout: null,   // live workout session object
  timerInterval: null,   // setInterval handle for the workout timer
  settingsOpen: false,
};

// ── Storage helpers ────────────────────────────────────────────
const Store = {
  workouts()         { return JSON.parse(localStorage.getItem('gt_workouts') || '[]'); },
  saveWorkouts(arr)  { localStorage.setItem('gt_workouts', JSON.stringify(arr)); },
  settings()         { return JSON.parse(localStorage.getItem('gt_settings') || '{"unit":"lbs"}'); },
  saveSettings(s)    { localStorage.setItem('gt_settings', JSON.stringify(s)); },
};

// ── Utility helpers ────────────────────────────────────────────
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmtDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function muscleBadgeClass(muscle) {
  const m = (muscle || '').toLowerCase();
  if (m.includes('chest'))     return 'badge-chest';
  if (m.includes('back') || m.includes('lat') || m.includes('trap')) return 'badge-back';
  if (m.includes('shoulder') || m.includes('delt')) return 'badge-shoulders';
  if (m.includes('bicep'))     return 'badge-biceps';
  if (m.includes('tricep'))    return 'badge-triceps';
  if (m.includes('quad') || m.includes('hamstring') || m.includes('glute') || m.includes('calf') || m.includes('leg')) return 'badge-legs';
  if (m.includes('core') || m.includes('ab'))  return 'badge-core';
  if (m.includes('cardio') || m.includes('full')) return 'badge-cardio';
  return 'badge-default';
}

function totalVolume(workout) {
  let v = 0;
  (workout.exercises || []).forEach(ex =>
    (ex.sets || []).forEach(s => { v += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0); })
  );
  return Math.round(v);
}

function isCardioEx(exerciseId) {
  const ex = EXERCISES.find(e => e.id === exerciseId);
  return ex && ex.type === 'cardio';
}

function totalSets(workout) {
  return (workout.exercises || []).reduce((acc, ex) => acc + (ex.sets || []).length, 0);
}

// Best set (by weight) for a given exercise across all workouts
function getBestSet(exerciseId) {
  const unit = Store.settings().unit || 'lbs';
  let best = null;
  Store.workouts().forEach(w => {
    (w.exercises || []).forEach(ex => {
      if (ex.exerciseId !== exerciseId) return;
      (ex.sets || []).forEach(s => {
        const w2 = parseFloat(s.weight) || 0;
        if (!best || w2 > parseFloat(best.weight)) best = { ...s, date: w.date };
      });
    });
  });
  return best;
}

// Last workout data for a given exercise (for pre-filling weights)
function getLastPerf(exerciseId) {
  const workouts = Store.workouts().slice().reverse();
  for (const w of workouts) {
    const ex = (w.exercises || []).find(e => e.exerciseId === exerciseId);
    if (ex && ex.sets.length > 0) return { date: w.date, sets: ex.sets };
  }
  return null;
}

// ── Navigation ─────────────────────────────────────────────────
function navigate(view) {
  // Warn if leaving active workout accidentally
  if (App.activeWorkout && view !== 'workout' && App.view === 'workout') {
    if (!confirm('You have an active workout. Leave and discard it?')) return;
    clearInterval(App.timerInterval);
    App.activeWorkout = null;
  }
  App.view = view;
  updateNav();
  renderApp();
}

function updateNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === App.view);
  });
}

// ── Master render ──────────────────────────────────────────────
function renderApp() {
  const el = document.getElementById('app');
  switch (App.view) {
    case 'home':     el.innerHTML = renderHome();    break;
    case 'workout':
      if (App.activeWorkout) {
        renderActiveWorkout();
      } else {
        App.workoutStep = 'equip';
        el.innerHTML = renderEquipmentSetup();
      }
      break;
    case 'history':  el.innerHTML = renderHistory(); break;
    case 'stats':    el.innerHTML = renderStats();   break;
  }
}

// ══════════════════════════════════════════════════════════════
// HOME VIEW
// ══════════════════════════════════════════════════════════════
function renderHome() {
  const workouts = Store.workouts();
  const unit = Store.settings().unit || 'lbs';

  // Stats
  const total = workouts.length;
  const thisWeek = workouts.filter(w => {
    const d = new Date(w.date + 'T00:00:00');
    const now = new Date();
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return d >= weekAgo;
  }).length;

  // Streak (consecutive days with a workout, ending today or yesterday)
  let streak = 0;
  if (workouts.length) {
    const days = [...new Set(workouts.map(w => w.date))].sort().reverse();
    const todayStr = today();
    let cur = new Date(todayStr + 'T00:00:00');
    for (const d of days) {
      const wd = new Date(d + 'T00:00:00');
      const diff = Math.round((cur - wd) / 86400000);
      if (diff > 1) break;
      streak++;
      cur = wd;
    }
  }

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Date label
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  // Recent workouts (last 3)
  const recent = workouts.slice(-3).reverse();

  const recentHTML = recent.length ? recent.map(w => {
    const sets = totalSets(w);
    const vol  = totalVolume(w);
    const exNames = (w.exercises || []).map(e => e.exerciseName).join(', ');
    return `
      <div class="recent-workout">
        <div class="recent-workout-top">
          <div class="recent-workout-name">${w.name || 'Workout'}</div>
          <div class="recent-workout-date">${fmtDate(w.date)}</div>
        </div>
        <div class="recent-workout-meta">
          ${sets} sets &nbsp;·&nbsp; ${vol.toLocaleString()} ${unit} volume
        </div>
        <div class="recent-workout-meta" style="margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${exNames}
        </div>
      </div>`;
  }).join('') : '<div class="empty-state">No workouts yet. Hit that Start button! 💪</div>';

  return `
    <div class="home-view">
      <div class="home-hero">
        <div class="home-date">${dateLabel}</div>
        <div class="home-greeting">${greeting},<br><span>Athlete</span>.</div>
        <div class="stats-row">
          <div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Total</div></div>
          <div class="stat-card"><div class="stat-num">${thisWeek}</div><div class="stat-label">This Week</div></div>
          <div class="stat-card"><div class="stat-num">${streak}</div><div class="stat-label">Streak 🔥</div></div>
        </div>
        <button class="btn btn-primary" style="font-size:17px;height:54px;" onclick="startWorkoutFlow()">
          ＋ Start Workout
        </button>
      </div>

      <div class="section-title">Recent Workouts</div>
      ${recentHTML}

      <div style="padding: 16px 16px 0; display:flex; justify-content:flex-end;">
        <button class="btn btn-ghost btn-sm" onclick="openSettings()">⚙ Settings</button>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════════════════════
// EQUIPMENT SELECTION
// ══════════════════════════════════════════════════════════════
function startWorkoutFlow() {
  App.view = 'workout';
  App.workoutStep = 'equip';
  App.selectedEquip = new Set(['none']); // bodyweight always available
  App.selectedExIds = [];
  updateNav();
  document.getElementById('app').innerHTML = renderEquipmentSetup();
}

function renderEquipmentSetup() {
  const cards = ALL_EQUIPMENT.map(eq => `
    <div class="eq-card ${App.selectedEquip.has(eq.id) ? 'selected' : ''}"
         onclick="toggleEquip('${eq.id}')">
      <div class="eq-icon">${eq.icon}</div>
      <div class="eq-label">${eq.label}</div>
    </div>`).join('');

  return `
    <div class="setup-view">
      <div class="setup-header">
        <h2>What's available?</h2>
        <p>Select all equipment you have access to today.</p>
      </div>
      <div class="equipment-grid">${cards}</div>
      <div style="height:80px;"></div>
      <div class="setup-footer">
        <button class="btn btn-primary" onclick="goToExerciseSelect()">
          Continue →
        </button>
      </div>
    </div>`;
}

function toggleEquip(id) {
  if (App.selectedEquip.has(id)) {
    App.selectedEquip.delete(id);
  } else {
    App.selectedEquip.add(id);
  }
  document.getElementById('app').innerHTML = renderEquipmentSetup();
}

// ── Exercise Selection ─────────────────────────────────────────
function goToExerciseSelect() {
  App.workoutStep = 'exercises';

  // Filter exercises: an exercise is available if ALL its required
  // equipment is in selectedEquip (empty array = always available)
  const available = EXERCISES.filter(ex =>
    (ex.equipment.length === 0 ? App.selectedEquip.has('none') : ex.equipment.every(e => App.selectedEquip.has(e)))
  );

  // Auto-suggest a balanced workout
  if (App.selectedExIds.length === 0) {
    autoSuggest(available);
  }

  document.getElementById('app').innerHTML = renderExerciseSelect(available);
}

function autoSuggest(available) {
  const picks = [];
  const cats = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core'];
  cats.forEach(cat => {
    const inCat = available.filter(e => e.category === cat);
    if (inCat.length) picks.push(inCat[0].id);
  });
  App.selectedExIds = picks;
}

function renderExerciseSelect(available) {
  // Group by category
  const groups = {};
  available.forEach(ex => {
    if (!groups[ex.category]) groups[ex.category] = [];
    groups[ex.category].push(ex);
  });

  const catOrder = ['Chest','Back','Shoulders','Biceps','Triceps','Legs','Core','Cardio'];
  const sortedCats = catOrder.filter(c => groups[c]).concat(
    Object.keys(groups).filter(c => !catOrder.includes(c))
  );

  const groupsHTML = sortedCats.map(cat => {
    const items = groups[cat].map(ex => {
      const sel = App.selectedExIds.includes(ex.id);
      return `
        <div class="ex-select-card ${sel ? 'selected' : ''}" onclick="toggleExercise('${ex.id}')">
          <div class="ex-check">${sel ? '✓' : ''}</div>
          <div class="ex-select-info">
            <div class="ex-select-name">${ex.name}</div>
            <div class="ex-select-sub">${ex.muscle}${ex.secondary.length ? ' · ' + ex.secondary[0] : ''}</div>
          </div>
          <span class="badge ${muscleBadgeClass(ex.muscle)}">${ex.muscle}</span>
        </div>`;
    }).join('');
    return `<div class="ex-group-label">${cat}</div>${items}`;
  }).join('');

  const count = App.selectedExIds.length;

  return `
    <div class="setup-view">
      <div class="setup-header">
        <h2>Choose Exercises</h2>
        <p>Tap to select. Pre-selected is a suggested balanced workout.</p>
      </div>

      <div style="padding:10px 16px; display:flex; gap:8px;">
        <button class="btn btn-ghost btn-sm" onclick="selectAll(${JSON.stringify(available.map(e=>e.id))})">
          Select All
        </button>
        <button class="btn btn-ghost btn-sm" onclick="clearAll()">
          Clear
        </button>
        <button class="btn btn-ghost btn-sm" onclick="goToEquipSelect()">
          ← Back
        </button>
      </div>

      <div style="padding-bottom: 80px;">
        ${groupsHTML}
      </div>

      <div class="setup-footer">
        <button class="btn btn-primary ${count === 0 ? 'disabled' : ''}"
                ${count === 0 ? 'disabled' : ''}
                onclick="beginWorkout()">
          Start Workout (${count} exercise${count !== 1 ? 's' : ''})
        </button>
      </div>
    </div>`;
}

function toggleExercise(id) {
  const idx = App.selectedExIds.indexOf(id);
  if (idx >= 0) {
    App.selectedExIds.splice(idx, 1);
  } else {
    App.selectedExIds.push(id);
  }
  const available = EXERCISES.filter(ex =>
    (ex.equipment.length === 0 ? App.selectedEquip.has('none') : ex.equipment.every(e => App.selectedEquip.has(e)))
  );
  document.getElementById('app').innerHTML = renderExerciseSelect(available);
}

function selectAll(ids) {
  App.selectedExIds = [...ids];
  const available = EXERCISES.filter(ex =>
    (ex.equipment.length === 0 ? App.selectedEquip.has('none') : ex.equipment.every(e => App.selectedEquip.has(e)))
  );
  document.getElementById('app').innerHTML = renderExerciseSelect(available);
}

function clearAll() {
  App.selectedExIds = [];
  const available = EXERCISES.filter(ex =>
    (ex.equipment.length === 0 ? App.selectedEquip.has('none') : ex.equipment.every(e => App.selectedEquip.has(e)))
  );
  document.getElementById('app').innerHTML = renderExerciseSelect(available);
}

function goToEquipSelect() {
  document.getElementById('app').innerHTML = renderEquipmentSetup();
}

// ══════════════════════════════════════════════════════════════
// ACTIVE WORKOUT
// ══════════════════════════════════════════════════════════════
function beginWorkout() {
  if (App.selectedExIds.length === 0) return;

  const exercises = App.selectedExIds.map(id => {
    const ex = EXERCISES.find(e => e.id === id);
    return {
      exerciseId: id,
      exerciseName: ex.name,
      muscle: ex.muscle,
      category: ex.category,
      instructions: ex.instructions,
      sets: []
    };
  });

  App.activeWorkout = {
    id: uid(),
    date: today(),
    name: 'Workout',
    startTime: Date.now(),
    equipment: [...App.selectedEquip],
    exercises
  };

  renderActiveWorkout();
  startTimer();
}

function renderActiveWorkout() {
  const wk = App.activeWorkout;
  const unit = Store.settings().unit || 'lbs';
  const el = document.getElementById('app');

  const exerciseCards = wk.exercises.map((ex, i) => {
    const last = getLastPerf(ex.exerciseId);
    const best = getBestSet(ex.exerciseId);
    let lastHTML = '<span style="color:var(--text-dim)">No history yet</span>';
    if (last) {
      const topSet = last.sets.reduce((a,b) => (parseFloat(b.weight)>parseFloat(a.weight)?b:a), last.sets[0]);
      lastHTML = `Last: ${last.sets.length} sets · Best ${topSet.weight}${unit} × ${topSet.reps}`;
    }
    let prHTML = '';
    if (best) {
      prHTML = ` &nbsp;<span style="color:var(--accent)">PR: ${best.weight}${unit} × ${best.reps}</span>`;
    }

    // Suggest default weight from last session
    const defaultWeight = last
      ? last.sets[last.sets.length - 1].weight
      : 0;
    const defaultReps = last
      ? last.sets[last.sets.length - 1].reps
      : 10;

    const cardio = isCardioEx(ex.exerciseId);
    const setsHTML = renderSetsTable(ex.sets, i, unit, cardio);

    const colHeaders = cardio
      ? `<span>SESSION</span><span>DURATION</span><span>DIST</span><span></span>`
      : `<span>SET</span><span>WEIGHT</span><span>REPS</span><span></span>`;

    const logForm = cardio ? `
        <div class="log-form">
          <div class="log-inputs">
            <div class="log-input-group">
              <div class="log-input-label">Duration (min)</div>
              <div class="stepper-wrap">
                <button class="step-btn" onclick="stepVal('wt-${i}', -5)">−</button>
                <input type="number" id="wt-${i}" value="20" min="0" step="1">
                <button class="step-btn" onclick="stepVal('wt-${i}', 5)">+</button>
              </div>
            </div>
            <div class="log-input-group">
              <div class="log-input-label">Distance (mi)</div>
              <div class="stepper-wrap">
                <button class="step-btn" onclick="stepVal('rp-${i}', -0.1)">−</button>
                <input type="number" id="rp-${i}" value="0" min="0" step="0.1">
                <button class="step-btn" onclick="stepVal('rp-${i}', 0.1)">+</button>
              </div>
            </div>
          </div>
          <button class="log-set-btn" onclick="logSet(${i})">✓ Log Session</button>
        </div>` : `
        <div class="log-form">
          <div class="log-inputs">
            <div class="log-input-group">
              <div class="log-input-label">Weight (${unit})</div>
              <div class="stepper-wrap">
                <button class="step-btn" onclick="stepVal('wt-${i}', -5)">−</button>
                <input type="number" id="wt-${i}" value="${defaultWeight}" min="0" step="2.5">
                <button class="step-btn" onclick="stepVal('wt-${i}', 5)">+</button>
              </div>
            </div>
            <div class="log-input-group">
              <div class="log-input-label">Reps</div>
              <div class="stepper-wrap">
                <button class="step-btn" onclick="stepVal('rp-${i}', -1)">−</button>
                <input type="number" id="rp-${i}" value="${defaultReps}" min="0" step="1">
                <button class="step-btn" onclick="stepVal('rp-${i}', 1)">+</button>
              </div>
            </div>
          </div>
          <button class="log-set-btn" onclick="logSet(${i})">✓ Log Set</button>
        </div>`;

    return `
      <div class="exercise-card" id="ex-card-${i}">
        <div class="exercise-card-header">
          <div class="exercise-card-top">
            <div class="exercise-name">${ex.exerciseName}</div>
            <span class="badge ${muscleBadgeClass(ex.muscle)}">${ex.muscle}</span>
          </div>
          <div class="prev-best-label">${lastHTML}${prHTML}</div>
          <button class="instructions-toggle mt-8" onclick="toggleInstructions(${i})">
            ⓘ How to do this
          </button>
          <div class="ex-instructions" id="inst-${i}">${ex.instructions}</div>
        </div>

        <div class="sets-table-wrap">
          <div class="sets-header-row">${colHeaders}</div>
          <div id="sets-${i}">${setsHTML}</div>
        </div>

        ${logForm}
      </div>`;
  }).join('');

  el.innerHTML = `
    <div>
      <div class="workout-topbar">
        <div>
          <div class="workout-name-small">${wk.name}</div>
          <div id="workout-timer">00:00</div>
        </div>
        <button class="finish-btn" onclick="finishWorkout()">Finish</button>
      </div>

      ${exerciseCards}

      <div class="workout-finish-section">
        <button class="btn btn-primary" onclick="finishWorkout()" style="background:var(--success);">
          ✓ Finish Workout
        </button>
      </div>
    </div>`;
}

function renderSetsTable(sets, exIdx, unit, cardio) {
  if (!sets.length) return '';
  return sets.map((s, si) => {
    if (cardio) {
      const dist = s.distance > 0 ? `${s.distance} mi` : '—';
      return `
        <div class="set-row">
          <div class="set-num">${si + 1}</div>
          <div class="set-val">${s.duration} min</div>
          <div class="set-val">${dist}</div>
          <button class="set-del" onclick="deleteSet(${exIdx}, ${si})">✕</button>
        </div>`;
    }
    return `
      <div class="set-row">
        <div class="set-num">${si + 1}</div>
        <div class="set-val">${s.weight} ${unit}</div>
        <div class="set-val">${s.reps} reps</div>
        <button class="set-del" onclick="deleteSet(${exIdx}, ${si})">✕</button>
      </div>`;
  }).join('');
}

function stepVal(id, delta) {
  const el = document.getElementById(id);
  if (!el) return;
  let val = parseFloat(el.value) || 0;
  val = Math.max(0, val + delta);
  el.value = val;
}

function logSet(exIdx) {
  const unit = Store.settings().unit || 'lbs';
  const ex = App.activeWorkout.exercises[exIdx];
  const cardio = isCardioEx(ex.exerciseId);

  if (cardio) {
    const duration = parseFloat(document.getElementById(`wt-${exIdx}`).value) || 0;
    const distance = parseFloat(document.getElementById(`rp-${exIdx}`).value) || 0;
    if (duration === 0) { alert('Enter a duration before logging.'); return; }
    ex.sets.push({ duration, distance });
  } else {
    const wt = parseFloat(document.getElementById(`wt-${exIdx}`).value) || 0;
    const rp = parseInt(document.getElementById(`rp-${exIdx}`).value) || 0;
    if (rp === 0) { alert('Enter reps before logging a set.'); return; }
    ex.sets.push({ weight: wt, reps: rp });
  }

  const setsEl = document.getElementById(`sets-${exIdx}`);
  if (setsEl) {
    setsEl.innerHTML = renderSetsTable(ex.sets, exIdx, unit, cardio);
  }
}

function deleteSet(exIdx, setIdx) {
  const unit = Store.settings().unit || 'lbs';
  App.activeWorkout.exercises[exIdx].sets.splice(setIdx, 1);
  const setsEl = document.getElementById(`sets-${exIdx}`);
  if (setsEl) {
    setsEl.innerHTML = renderSetsTable(App.activeWorkout.exercises[exIdx].sets, exIdx, unit);
  }
}

function toggleInstructions(i) {
  const el = document.getElementById(`inst-${i}`);
  if (el) el.classList.toggle('open');
}

// ── Timer ──────────────────────────────────────────────────────
function startTimer() {
  clearInterval(App.timerInterval);
  App.timerInterval = setInterval(() => {
    const el = document.getElementById('workout-timer');
    if (!el || !App.activeWorkout) { clearInterval(App.timerInterval); return; }
    const elapsed = Math.floor((Date.now() - App.activeWorkout.startTime) / 1000);
    el.textContent = fmtDuration(elapsed);
  }, 1000);
}

// ── Finish Workout ─────────────────────────────────────────────
function finishWorkout() {
  clearInterval(App.timerInterval);

  const wk = App.activeWorkout;
  const unit = Store.settings().unit || 'lbs';
  const duration = Math.floor((Date.now() - wk.startTime) / 1000);
  const sets = totalSets(wk);
  const vol  = totalVolume(wk);
  const exCount = wk.exercises.filter(e => e.sets.length > 0).length;

  // Show completion modal
  document.getElementById('app').innerHTML += `
    <div class="modal-overlay" id="finish-modal">
      <div class="modal">
        <div style="font-size:36px;text-align:center;margin-bottom:8px;">🎉</div>
        <h2 style="text-align:center;">Workout Complete!</h2>
        <div class="modal-subtitle" style="text-align:center;">${fmtDuration(duration)} · ${fmtDate(wk.date)}</div>
        <div class="modal-stats">
          <div class="modal-stat">
            <div class="modal-stat-num">${exCount}</div>
            <div class="modal-stat-label">Exercises</div>
          </div>
          <div class="modal-stat">
            <div class="modal-stat-num">${sets}</div>
            <div class="modal-stat-label">Sets</div>
          </div>
          <div class="modal-stat">
            <div class="modal-stat-num">${vol.toLocaleString()}</div>
            <div class="modal-stat-label">${unit} Vol</div>
          </div>
        </div>
        <div class="modal-buttons">
          <button class="btn btn-primary" onclick="saveWorkout()">Save Workout</button>
          <button class="btn btn-ghost" onclick="discardWorkout()">Discard</button>
        </div>
      </div>
    </div>`;
}

function saveWorkout() {
  const wk = App.activeWorkout;
  const duration = Math.floor((Date.now() - wk.startTime) / 1000);
  wk.duration = duration;
  // Only keep exercises that have at least one logged set
  wk.exercises = wk.exercises.filter(e => e.sets.length > 0);

  const all = Store.workouts();
  all.push(wk);
  Store.saveWorkouts(all);

  App.activeWorkout = null;
  App.view = 'home';
  updateNav();
  document.getElementById('app').innerHTML = renderHome();
}

function discardWorkout() {
  App.activeWorkout = null;
  App.view = 'home';
  updateNav();
  document.getElementById('app').innerHTML = renderHome();
}

// ══════════════════════════════════════════════════════════════
// HISTORY VIEW
// ══════════════════════════════════════════════════════════════
function renderHistory() {
  const workouts = Store.workouts().slice().reverse();
  const unit = Store.settings().unit || 'lbs';

  if (!workouts.length) {
    return `
      <div class="history-view">
        <div class="page-header"><div class="page-title">History</div></div>
        <div class="empty-state" style="margin-top:60px;">
          No workouts logged yet.<br>Start your first one! 💪
        </div>
      </div>`;
  }

  const entries = workouts.map((w, i) => {
    const sets = totalSets(w);
    const vol  = totalVolume(w);
    const exNames = (w.exercises || []).map(e => e.exerciseName).join(', ');

    const detail = (w.exercises || []).map(ex => {
      const cardio = isCardioEx(ex.exerciseId);
      const setsText = (ex.sets || []).map((s, si) => {
        if (cardio) {
          const dist = s.distance > 0 ? ` · ${s.distance} mi` : '';
          return `Session ${si+1}: ${s.duration} min${dist}`;
        }
        return `Set ${si+1}: ${s.weight}${unit} × ${s.reps} reps`;
      }).join('<br>');
      return `
        <div class="history-ex-row">
          <div class="history-ex-name">${ex.exerciseName}</div>
          <div class="history-ex-sets">${setsText || 'No sets logged'}</div>
        </div>`;
    }).join('');

    return `
      <div class="history-entry" id="hist-${i}">
        <div class="history-entry-header" onclick="toggleHistory(${i})">
          <div>
            <div class="history-date">${fmtDate(w.date)}</div>
            <div class="history-name">${w.name || 'Workout'}</div>
            <div class="history-meta">${sets} sets · ${vol.toLocaleString()} ${unit} · ${(w.exercises||[]).length} exercises</div>
          </div>
          <div class="history-chevron">›</div>
        </div>
        <div class="history-detail">
          ${detail}
          <button class="btn btn-danger btn-sm" style="margin-top:12px;" onclick="deleteWorkout('${w.id}')">
            Delete Workout
          </button>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="history-view">
      <div class="page-header"><div class="page-title">History</div></div>
      <div style="padding-bottom:16px;">${entries}</div>
    </div>`;
}

function toggleHistory(i) {
  const el = document.getElementById(`hist-${i}`);
  if (el) el.classList.toggle('open');
}

function deleteWorkout(id) {
  if (!confirm('Delete this workout?')) return;
  const all = Store.workouts().filter(w => w.id !== id);
  Store.saveWorkouts(all);
  document.getElementById('app').innerHTML = renderHistory();
}

// ══════════════════════════════════════════════════════════════
// STATS VIEW (Exercise Progress + Body Measurements)
// ══════════════════════════════════════════════════════════════

// Which sub-tab is active: 'progress' | 'measurements'
App.statsTab = 'progress';

function renderStats() {
  App.statsTab = App.statsTab || 'progress';
  const progressActive = App.statsTab === 'progress';
  return `
    <div>
      <div class="page-header"><div class="page-title">Stats</div></div>
      <div class="stats-tabs">
        <button class="stats-tab ${progressActive ? 'active' : ''}"
                onclick="switchStatsTab('progress')">Exercise Progress</button>
        <button class="stats-tab ${!progressActive ? 'active' : ''}"
                onclick="switchStatsTab('measurements')">Body Measurements</button>
      </div>
      <div id="stats-content">
        ${progressActive ? renderProgress() : renderMeasurements()}
      </div>
    </div>`;
}

function switchStatsTab(tab) {
  App.statsTab = tab;
  const el = document.getElementById('stats-content');
  if (!el) return;
  el.innerHTML = tab === 'progress' ? renderProgress() : renderMeasurements();
  // Update tab button styles
  document.querySelectorAll('.stats-tab').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase().includes(tab === 'progress' ? 'exercise' : 'body'));
  });
  // Auto-populate charts
  const pSel = document.getElementById('progress-select');
  if (pSel) renderProgressChart(pSel.value);
  const mSel = document.getElementById('measurement-metric');
  if (mSel) renderMeasurementChart(mSel.value);
}

function renderProgress() {
  const workouts = Store.workouts();

  // Build list of all exercises that have been logged
  const logged = new Map();
  workouts.forEach(w => {
    (w.exercises || []).forEach(ex => {
      if (!logged.has(ex.exerciseId)) {
        logged.set(ex.exerciseId, ex.exerciseName);
      }
    });
  });

  if (!logged.size) {
    return `<div class="empty-state" style="margin-top:40px;">
      Complete some workouts first to see your progress here! 📈
    </div>`;
  }

  const options = [...logged.entries()].map(([id, name]) =>
    `<option value="${id}">${name}</option>`
  ).join('');

  return `
    <div class="progress-view">
      <select class="progress-select" id="progress-select" onchange="renderProgressChart(this.value)">
        ${options}
      </select>
      <div id="progress-content"></div>
    </div>`;
}

function renderProgressChart(exerciseId) {
  const unit = Store.settings().unit || 'lbs';
  const workouts = Store.workouts();
  const contentEl = document.getElementById('progress-content');
  if (!contentEl) return;

  const cardio = isCardioEx(exerciseId);

  // Collect all sessions with this exercise
  const sessions = [];
  workouts.forEach(w => {
    const ex = (w.exercises || []).find(e => e.exerciseId === exerciseId);
    if (ex && ex.sets.length > 0) {
      if (cardio) {
        const maxDuration = Math.max(...ex.sets.map(s => parseFloat(s.duration) || 0));
        const totalDist = ex.sets.reduce((a,s) => a + (parseFloat(s.distance)||0), 0);
        sessions.push({ date: w.date, sets: ex.sets, maxDuration, totalDist });
      } else {
        const maxWeight = Math.max(...ex.sets.map(s => parseFloat(s.weight) || 0));
        sessions.push({ date: w.date, sets: ex.sets, maxWeight });
      }
    }
  });

  if (!sessions.length) {
    contentEl.innerHTML = '<div class="progress-no-data">No data logged for this exercise yet.</div>';
    return;
  }

  if (cardio) {
    // Cardio progress: show longest duration as the PR metric
    const pr = sessions.reduce((best, s) => s.maxDuration > best.maxDuration ? s : best, sessions[0]);
    const maxD = Math.max(...sessions.map(s => s.maxDuration)) || 1;

    const chartRows = sessions.map(s => {
      const pct = Math.round((s.maxDuration / maxD) * 100);
      const dateShort = new Date(s.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return `
        <div class="chart-row">
          <div class="chart-date">${dateShort}</div>
          <div class="chart-bar-wrap"><div class="chart-bar" style="width:${pct}%;"></div></div>
          <div class="chart-val">${s.maxDuration} min</div>
        </div>`;
    }).join('');

    const historyHTML = sessions.slice().reverse().map(s => {
      const setsText = s.sets.map((st, i) => {
        const dist = st.distance > 0 ? ` · ${st.distance} mi` : '';
        return `<span>Session ${i+1}: <strong>${st.duration} min${dist}</strong></span>`;
      }).join(' &nbsp; ');
      return `
        <div class="progress-history-entry">
          <div class="progress-history-date">${fmtDate(s.date)}</div>
          <div class="progress-history-sets">${setsText}</div>
        </div>`;
    }).join('');

    contentEl.innerHTML = `
      <div class="pr-badge">
        <div class="pr-badge-label">Longest Session 🏆</div>
        <div class="pr-badge-value">${pr.maxDuration} min</div>
        <div class="pr-badge-sub">${fmtDate(pr.date)}</div>
      </div>
      <div class="section-title" style="padding-left:0;margin-bottom:8px;">Duration Per Session</div>
      <div class="progress-chart">${chartRows}</div>
      <div class="section-title" style="padding-left:0;margin-top:16px;margin-bottom:8px;">Session History</div>
      ${historyHTML}`;

  } else {
    // Strength progress
    const pr = sessions.reduce((best, s) => s.maxWeight > best.maxWeight ? s : best, sessions[0]);
    const prSet = pr.sets.reduce((a,b) => (parseFloat(b.weight) > parseFloat(a.weight) ? b : a));
    const maxW = Math.max(...sessions.map(s => s.maxWeight)) || 1;

    const chartRows = sessions.map(s => {
      const pct = Math.round((s.maxWeight / maxW) * 100);
      const dateShort = new Date(s.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return `
        <div class="chart-row">
          <div class="chart-date">${dateShort}</div>
          <div class="chart-bar-wrap"><div class="chart-bar" style="width:${pct}%;"></div></div>
          <div class="chart-val">${s.maxWeight} ${unit}</div>
        </div>`;
    }).join('');

    const historyHTML = sessions.slice().reverse().map(s => {
      const setsText = s.sets.map((st, i) =>
        `<span>Set ${i+1}: <strong>${st.weight}${unit} × ${st.reps} reps</strong></span>`
      ).join(' &nbsp; ');
      return `
        <div class="progress-history-entry">
          <div class="progress-history-date">${fmtDate(s.date)}</div>
          <div class="progress-history-sets">${setsText}</div>
        </div>`;
    }).join('');

    contentEl.innerHTML = `
      <div class="pr-badge">
        <div class="pr-badge-label">Personal Record 🏆</div>
        <div class="pr-badge-value">${prSet.weight} ${unit}</div>
        <div class="pr-badge-sub">${prSet.reps} reps · ${fmtDate(pr.date)}</div>
      </div>
      <div class="section-title" style="padding-left:0;margin-bottom:8px;">Max Weight Per Session</div>
      <div class="progress-chart">${chartRows}</div>
      <div class="section-title" style="padding-left:0;margin-top:16px;margin-bottom:8px;">Session History</div>
      ${historyHTML}`;
  }
}

// ══════════════════════════════════════════════════════════════
// BODY MEASUREMENTS
// ══════════════════════════════════════════════════════════════

const MEASUREMENT_FIELDS = [
  { key: 'bodyWeight', label: 'Body Weight', unit: 'lbs' },
  { key: 'chest',      label: 'Chest',       unit: 'in'  },
  { key: 'waist',      label: 'Waist',       unit: 'in'  },
  { key: 'hips',       label: 'Hips',        unit: 'in'  },
  { key: 'bicep',      label: 'Bicep',       unit: 'in'  },
  { key: 'thigh',      label: 'Thigh',       unit: 'in'  },
  { key: 'calves',     label: 'Calves',      unit: 'in'  },
  { key: 'forearms',   label: 'Forearms',    unit: 'in'  },
  { key: 'shoulders',  label: 'Shoulders',   unit: 'in'  },
  { key: 'neck',       label: 'Neck',        unit: 'in'  },
  { key: 'bodyFat',    label: 'Body Fat',    unit: '%'   },
];

function getMeasurements() {
  return JSON.parse(localStorage.getItem('gt_measurements') || '[]');
}
function saveMeasurements(arr) {
  localStorage.setItem('gt_measurements', JSON.stringify(arr));
}

function renderMeasurements() {
  const measurements = getMeasurements().slice().reverse();
  const unit = Store.settings().unit || 'lbs';

  const formFields = MEASUREMENT_FIELDS.map(f => {
    const displayUnit = f.key === 'bodyWeight' ? unit : f.unit;
    return `
      <div class="meas-field">
        <div class="meas-field-label">${f.label}<span class="meas-unit">${displayUnit}</span></div>
        <input class="meas-input" type="number" id="mf-${f.key}" min="0" step="0.1" placeholder="—">
      </div>`;
  }).join('');

  // Chart: only show if there's data with at least one field recorded
  const hasData = measurements.length > 0;
  const chartOptions = MEASUREMENT_FIELDS.map(f =>
    `<option value="${f.key}">${f.label}</option>`
  ).join('');

  const historyHTML = measurements.length ? measurements.map((m, i) => {
    const fields = MEASUREMENT_FIELDS
      .filter(f => m[f.key] != null && m[f.key] !== '')
      .map(f => {
        const displayUnit = f.key === 'bodyWeight' ? unit : f.unit;
        return `<span class="meas-hist-item"><strong>${f.label}:</strong> ${m[f.key]} ${displayUnit}</span>`;
      }).join('');
    return `
      <div class="meas-history-card" id="mhist-${i}">
        <div class="meas-history-header" onclick="toggleMeasHistory(${i})">
          <div>
            <div class="meas-history-date">${fmtDate(m.date)}</div>
            ${m.bodyWeight ? `<div class="meas-history-weight">${m.bodyWeight} ${unit}</div>` : ''}
          </div>
          <div class="history-chevron">›</div>
        </div>
        <div class="meas-history-detail">
          <div class="meas-hist-fields">${fields || 'No data recorded'}</div>
          <button class="btn btn-danger btn-sm" style="margin-top:10px;"
                  onclick="deleteMeasurement('${m.id}')">Delete</button>
        </div>
      </div>`;
  }).join('') : '<div class="empty-state" style="padding:24px 0;">No measurements recorded yet.</div>';

  return `
    <div class="progress-view">
      <div class="meas-form card">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px;">Log Today's Measurements</div>
        <div style="margin-bottom:10px;">
          <div class="meas-field-label">Date</div>
          <input class="input-field" type="date" id="mf-date" value="${today()}">
        </div>
        <div class="meas-grid">${formFields}</div>
        <button class="btn btn-primary" style="margin-top:14px;" onclick="saveMeasurement()">
          Save Measurements
        </button>
      </div>

      ${hasData ? `
        <div class="section-title" style="padding-left:0;margin-bottom:8px;">Progress Chart</div>
        <select class="progress-select" id="measurement-metric" onchange="renderMeasurementChart(this.value)">
          ${chartOptions}
        </select>
        <div id="measurement-chart"></div>
      ` : ''}

      <div class="section-title" style="padding-left:0;margin-top:16px;margin-bottom:8px;">History</div>
      ${historyHTML}
    </div>`;
}

function saveMeasurement() {
  const dateEl = document.getElementById('mf-date');
  if (!dateEl || !dateEl.value) { alert('Please enter a date.'); return; }

  const entry = { id: uid(), date: dateEl.value };
  let hasAny = false;
  MEASUREMENT_FIELDS.forEach(f => {
    const el = document.getElementById(`mf-${f.key}`);
    if (el && el.value !== '') {
      entry[f.key] = parseFloat(el.value);
      hasAny = true;
    }
  });

  if (!hasAny) { alert('Enter at least one measurement before saving.'); return; }

  const all = getMeasurements();
  all.push(entry);
  saveMeasurements(all);

  // Re-render the measurements tab
  const el = document.getElementById('stats-content');
  if (el) el.innerHTML = renderMeasurements();
  const mSel = document.getElementById('measurement-metric');
  if (mSel) renderMeasurementChart(mSel.value);
}

function deleteMeasurement(id) {
  if (!confirm('Delete this measurement entry?')) return;
  saveMeasurements(getMeasurements().filter(m => m.id !== id));
  const el = document.getElementById('stats-content');
  if (el) el.innerHTML = renderMeasurements();
}

function toggleMeasHistory(i) {
  const el = document.getElementById(`mhist-${i}`);
  if (el) el.classList.toggle('open');
}

function renderMeasurementChart(metricKey) {
  const unit = Store.settings().unit || 'lbs';
  const el = document.getElementById('measurement-chart');
  if (!el) return;

  const field = MEASUREMENT_FIELDS.find(f => f.key === metricKey);
  if (!field) return;

  const displayUnit = metricKey === 'bodyWeight' ? unit : field.unit;

  const data = getMeasurements()
    .filter(m => m[metricKey] != null && m[metricKey] !== '')
    .map(m => ({ date: m.date, val: parseFloat(m[metricKey]) }));

  if (!data.length) {
    el.innerHTML = '<div class="progress-no-data">No data for this measurement yet.</div>';
    return;
  }

  const maxVal = Math.max(...data.map(d => d.val)) || 1;
  const latest = data[data.length - 1];
  const first  = data[0];
  const change = latest.val - first.val;
  const changeStr = (change >= 0 ? '+' : '') + change.toFixed(1);

  const chartRows = data.map(d => {
    const pct = Math.round((d.val / maxVal) * 100);
    const dateShort = new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `
      <div class="chart-row">
        <div class="chart-date">${dateShort}</div>
        <div class="chart-bar-wrap"><div class="chart-bar" style="width:${pct}%;"></div></div>
        <div class="chart-val">${d.val} ${displayUnit}</div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="pr-badge" style="margin-bottom:12px;">
      <div class="pr-badge-label">Latest · ${fmtDate(latest.date)}</div>
      <div class="pr-badge-value">${latest.val} ${displayUnit}</div>
      <div class="pr-badge-sub">Change from first: ${changeStr} ${displayUnit}</div>
    </div>
    <div class="progress-chart">${chartRows}</div>`;
}

// ══════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════
function exportData() {
  const data = {
    workouts: Store.workouts(),
    measurements: getMeasurements(),
    settings: Store.settings()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gymtracker-backup-${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.workouts) Store.saveWorkouts(data.workouts);
      if (data.measurements) saveMeasurements(data.measurements);
      if (data.settings) Store.saveSettings(data.settings);
      alert('Data restored successfully!');
      closeSettings();
      document.getElementById('app').innerHTML = renderHome();
    } catch (err) {
      alert('Could not read backup file. Make sure it is a valid GymTracker backup.');
    }
  };
  reader.readAsText(file);
}

function openSettings() {
  const settings = Store.settings();
  const unit = settings.unit || 'lbs';

  const overlay = document.createElement('div');
  overlay.className = 'settings-overlay';
  overlay.id = 'settings-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) closeSettings(); };

  overlay.innerHTML = `
    <div class="settings-sheet">
      <div class="settings-title">Settings</div>

      <div class="settings-row">
        <div>
          <div class="settings-row-label">Weight Unit</div>
          <div class="settings-row-sub">Used for all weight inputs and history</div>
        </div>
        <div class="toggle-group">
          <div class="toggle-opt ${unit === 'lbs' ? 'active' : ''}" onclick="setUnit('lbs')">lbs</div>
          <div class="toggle-opt ${unit === 'kg' ? 'active' : ''}" onclick="setUnit('kg')">kg</div>
        </div>
      </div>

      <div class="settings-row">
        <div>
          <div class="settings-row-label">Back Up Data</div>
          <div class="settings-row-sub">Download all workouts & measurements as a file</div>
        </div>
        <button class="btn btn-sm" onclick="exportData()">Export</button>
      </div>

      <div class="settings-row">
        <div>
          <div class="settings-row-label">Restore Data</div>
          <div class="settings-row-sub">Load a previously exported backup file</div>
        </div>
        <label class="btn btn-sm" style="cursor:pointer;">
          Import
          <input type="file" accept=".json" style="display:none"
            onchange="importData(this.files[0])">
        </label>
      </div>

      <div class="settings-row">
        <div>
          <div class="settings-row-label">Clear All Data</div>
          <div class="settings-row-sub">Permanently deletes all workouts &amp; measurements</div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="clearAllData()">Clear</button>
      </div>

      <div style="margin-top:20px;">
        <button class="btn btn-ghost" style="width:100%;" onclick="closeSettings()">Done</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
}

function closeSettings() {
  const el = document.getElementById('settings-overlay');
  if (el) el.remove();
  // Re-render home if we're on it (unit change may affect display)
  if (App.view === 'home') {
    document.getElementById('app').innerHTML = renderHome();
  }
}

function setUnit(unit) {
  Store.saveSettings({ ...Store.settings(), unit });
  closeSettings();
  openSettings();
}

function clearAllData() {
  if (!confirm('This will permanently delete ALL your workout history. Are you sure?')) return;
  localStorage.removeItem('gt_workouts');
  closeSettings();
  document.getElementById('app').innerHTML = renderHome();
}

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Register service worker for offline support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // Bottom nav clicks
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });

  // First render
  renderApp();

  // After progress view renders, auto-show first exercise chart
  document.getElementById('app').addEventListener('change', (e) => {
    if (e.target.id === 'progress-select') {
      renderProgressChart(e.target.value);
    }
  });

  // Auto-populate charts when stats tab opens
  const observer = new MutationObserver(() => {
    const pSel = document.getElementById('progress-select');
    const pContent = document.getElementById('progress-content');
    if (pSel && pContent && pContent.innerHTML === '') {
      renderProgressChart(pSel.value);
    }
    const mSel = document.getElementById('measurement-metric');
    const mContent = document.getElementById('measurement-chart');
    if (mSel && mContent && mContent.innerHTML === '') {
      renderMeasurementChart(mSel.value);
    }
  });
  observer.observe(document.getElementById('app'), { childList: true, subtree: false });
});
