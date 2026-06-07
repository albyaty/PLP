const STORAGE_PREFIX = "plp-gym-log-cache-v1:";
const PROGRAM_NAME = "PLP Arm Specialization";
const CONFIG = window.PLP_CONFIG || {};
const allowSignUp = CONFIG.allowSignUp === true;

const PROGRAM = {
  cycle: [
    { dayKey: "pull-a", label: "Pull A", detail: "Fresh arms" },
    { dayKey: "legs", label: "Legs", detail: "Lean lower" },
    { dayKey: "push", label: "Push", detail: "Chest + tri" },
    { dayKey: "rest", label: "Rest", detail: "Recover" },
    { dayKey: "pull-b", label: "Pull B", detail: "Normal order" },
    { dayKey: "legs", label: "Legs", detail: "Lean lower" },
    { dayKey: "push", label: "Push", detail: "Chest + tri" },
    { dayKey: "rest", label: "Rest", detail: "Recover" },
  ],
  days: {
    "pull-a": {
      title: "Pull A",
      kicker: "Fresh-arm priority",
      note: "Arms first while fresh. Heavy close-grip press gets the best slot.",
      exercises: [
        { id: "incline-seated-db-curl", name: "Incline seated DB curl", sets: 3, reps: "8-10", focus: "Fresh biceps" },
        { id: "close-grip-smith-press", name: "Close-grip Smith press, tucked elbows", sets: 3, reps: "6-10", focus: "Fresh triceps heavy" },
        { id: "lat-pulldown", name: "Lat pulldown", sets: 3, reps: "8-12", focus: "Back" },
        { id: "smith-machine-row", name: "Smith machine row", sets: 3, reps: "8-12", focus: "Back" },
        { id: "chest-supported-db-row", name: "Chest-supported DB row", sets: 3, reps: "10-12", focus: "Back" },
        { id: "rear-delt", name: "Rear delt", sets: 2, reps: "15-20", focus: "Delt maintenance" },
      ],
    },
    "pull-b": {
      title: "Pull B",
      kicker: "Normal order",
      note: "Back first, then biceps. Keep the arm work clean and honest.",
      exercises: [
        { id: "lat-pulldown", name: "Lat pulldown", sets: 3, reps: "8-12", focus: "Back" },
        { id: "smith-machine-row", name: "Smith machine row", sets: 3, reps: "8-12", focus: "Back" },
        { id: "chest-supported-db-row", name: "Chest-supported DB row", sets: 3, reps: "10-12", focus: "Back" },
        { id: "shrugs", name: "Shrugs", sets: 3, reps: "12-15", focus: "Traps" },
        { id: "rear-delt", name: "Rear delt", sets: 2, reps: "15-20", focus: "Delt maintenance" },
        { id: "incline-seated-db-curl", name: "Incline seated DB curl", sets: 3, reps: "10-12", focus: "Biceps" },
        { id: "spider-or-hammer-curl", name: "Spider or hammer curl", sets: 3, reps: "10-12", focus: "Biceps rotation" },
      ],
    },
    push: {
      title: "Push",
      kicker: "Chest + long-head triceps",
      note: "Delts stay on maintenance. Triceps here is lighter stretch work.",
      exercises: [
        { id: "incline-smith-press", name: "Incline Smith press", sets: 3, reps: "6-10", focus: "Chest" },
        { id: "chest-press-machine", name: "Chest press machine", sets: 3, reps: "8-12", focus: "Chest" },
        { id: "pec-dec", name: "Pec dec", sets: 3, reps: "10-15", focus: "Chest" },
        { id: "lat-raise", name: "Lat raise", sets: 2, reps: "12-20", focus: "Delt maintenance" },
        { id: "overhead-db-extension", name: "Overhead DB extension", sets: 3, reps: "10-15", focus: "Long-head triceps" },
      ],
    },
    legs: {
      title: "Legs",
      kicker: "Deprioritized and lean",
      note: "Keep this efficient. Do the work, save recovery for the arm focus.",
      exercises: [
        { id: "squat", name: "Squat", sets: 3, reps: "5-8", focus: "Compound" },
        { id: "leg-press", name: "Leg press", sets: 3, reps: "10-15", focus: "Quads" },
        { id: "rdl", name: "RDL", sets: 3, reps: "8-12", focus: "Hinge" },
        { id: "calf-raise-leg-curl", name: "Calf raise / leg curl", sets: 3, reps: "10-15", focus: "Optional" },
        { id: "reverse-crunch", name: "Reverse crunch", sets: 3, reps: "12-15", focus: "Abs" },
        { id: "weighted-crunch", name: "Weighted crunch", sets: 3, reps: "12-15", focus: "Abs" },
      ],
    },
  },
};

const elements = {
  setupView: byId("setupView"),
  authView: byId("authView"),
  appShell: byId("appShell"),
  authForm: byId("authForm"),
  emailInput: byId("emailInput"),
  passwordInput: byId("passwordInput"),
  signUpButton: byId("signUpButton"),
  cycleLabel: byId("cycleLabel"),
  dayTitle: byId("dayTitle"),
  settingsButton: byId("settingsButton"),
  prevDayButton: byId("prevDayButton"),
  nextDayButton: byId("nextDayButton"),
  cycleScroller: byId("cycleScroller"),
  sessionKicker: byId("sessionKicker"),
  sessionTitle: byId("sessionTitle"),
  sessionNote: byId("sessionNote"),
  useLastAllButton: byId("useLastAllButton"),
  clearDraftButton: byId("clearDraftButton"),
  restView: byId("restView"),
  exerciseList: byId("exerciseList"),
  recentList: byId("recentList"),
  syncStatus: byId("syncStatus"),
  completionCount: byId("completionCount"),
  draftStatus: byId("draftStatus"),
  finishWorkoutButton: byId("finishWorkoutButton"),
  settingsPanel: byId("settingsPanel"),
  closeSettingsButton: byId("closeSettingsButton"),
  unitSelect: byId("unitSelect"),
  accountLabel: byId("accountLabel"),
  syncNowButton: byId("syncNowButton"),
  exportButton: byId("exportButton"),
  importInput: byId("importInput"),
  installButton: byId("installButton"),
  resetButton: byId("resetButton"),
  signOutButton: byId("signOutButton"),
  toast: byId("toast"),
};

const configured = hasSupabaseConfig(CONFIG);
const previewMode = new URLSearchParams(window.location.search).has("preview");

let state = createDefaultState();
let currentUser = null;
let supabase = null;
let saveTimer = null;
let statusTimer = null;
let toastTimer = null;
let installPrompt = null;

const shortDate = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const fullDate = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

boot();

function byId(id) {
  return document.getElementById(id);
}

async function boot() {
  wireEvents();
  registerServiceWorker();

  if (!configured && !previewMode) {
    showMode("setup");
    return;
  }

  if (previewMode && !configured) {
    currentUser = { id: "preview", email: "preview@local" };
    state = createDemoState();
    showMode("app");
    setSyncStatus("Preview only");
    render();
    return;
  }

  try {
    await initSupabaseClient();
  } catch (error) {
    showMode("setup");
    showToast(`Supabase client failed to load: ${error.message}`);
    return;
  }

  setSyncStatus("Checking session");
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    showToast(error.message);
    showMode("auth");
    return;
  }

  supabase.auth.onAuthStateChange(async (event, sessionPayload) => {
    if (event === "SIGNED_OUT") {
      currentUser = null;
      state = createDefaultState();
      showMode("auth");
      return;
    }
    if (sessionPayload?.user && sessionPayload.user.id !== currentUser?.id) {
      currentUser = sessionPayload.user;
      await loadCloudState();
    }
  });

  const session = data.session;
  if (!session?.user) {
    showMode("auth");
    return;
  }

  currentUser = session.user;
  await loadCloudState();
}

async function initSupabaseClient() {
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

function wireEvents() {
  elements.signUpButton.hidden = !allowSignUp;

  elements.authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await signIn();
  });

  elements.signUpButton.addEventListener("click", signUp);
  elements.prevDayButton.addEventListener("click", () => moveCycle(-1));
  elements.nextDayButton.addEventListener("click", () => moveCycle(1));
  elements.useLastAllButton.addEventListener("click", loadAllLastWeights);
  elements.clearDraftButton.addEventListener("click", clearCurrentDraft);
  elements.finishWorkoutButton.addEventListener("click", finishWorkout);
  elements.settingsButton.addEventListener("click", openSettings);
  elements.closeSettingsButton.addEventListener("click", closeSettings);
  elements.settingsPanel.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-settings]")) {
      closeSettings();
    }
  });
  elements.unitSelect.addEventListener("change", () => {
    state.settings.unit = elements.unitSelect.value;
    touchAndSave("Unit changed");
    render();
  });
  elements.syncNowButton.addEventListener("click", () => syncNow(true));
  elements.exportButton.addEventListener("click", exportBackup);
  elements.importInput.addEventListener("change", importBackup);
  elements.resetButton.addEventListener("click", resetData);
  elements.signOutButton.addEventListener("click", signOut);
  elements.installButton.addEventListener("click", installApp);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    elements.installButton.hidden = false;
  });

  window.addEventListener("online", () => syncNow(false));
}

async function signIn() {
  if (!supabase) {
    return;
  }
  const email = elements.emailInput.value.trim();
  const password = elements.passwordInput.value;
  setSyncStatus("Signing in");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    showToast(error.message);
    setSyncStatus("Not signed in");
    return;
  }
  currentUser = data.user;
  await loadCloudState();
}

async function signUp() {
  if (!allowSignUp) {
    showToast("Signups are disabled. Create your user in Supabase Auth.");
    return;
  }
  if (!supabase) {
    return;
  }
  const email = elements.emailInput.value.trim();
  const password = elements.passwordInput.value;
  if (!email || password.length < 6) {
    showToast("Use an email and a password with at least 6 characters.");
    return;
  }
  setSyncStatus("Creating account");
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    showToast(error.message);
    setSyncStatus("Not signed in");
    return;
  }
  if (data.user && data.session) {
    currentUser = data.user;
    await loadCloudState();
  } else {
    showToast("Account created. Check your email if confirmation is enabled.");
    setSyncStatus("Confirm email");
  }
}

async function signOut() {
  if (!supabase) {
    return;
  }
  await syncNow(false);
  await supabase.auth.signOut();
  currentUser = null;
  state = createDefaultState();
  showMode("auth");
  closeSettings();
}

async function loadCloudState() {
  if (!currentUser || !supabase) {
    showMode("auth");
    return;
  }

  showMode("app");
  setSyncStatus("Syncing");

  const { data, error } = await supabase
    .from("workout_state")
    .select("state, updated_at")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (error) {
    const cached = getCachedRecord();
    if (cached?.state) {
      state = normalizeState(cached.state);
      setSyncStatus("Offline cache");
      render();
      return;
    }
    showToast(error.message);
    setSyncStatus("Sync failed");
    render();
    return;
  }

  const cached = getCachedRecord();
  if (!data) {
    state = normalizeState(cached?.state || createDefaultState());
    await syncNow(false);
    render();
    return;
  }

  const cloudState = normalizeState(data.state);
  const shouldPreferCache =
    cached?.pending &&
    cached.state?.updatedAt &&
    new Date(cached.state.updatedAt).getTime() > new Date(cloudState.updatedAt || data.updated_at).getTime();

  state = shouldPreferCache ? normalizeState(cached.state) : cloudState;
  cacheState(false);
  setSyncStatus("Synced");
  render();

  if (shouldPreferCache) {
    await syncNow(false);
  }
}

function showMode(mode) {
  elements.setupView.hidden = mode !== "setup";
  elements.authView.hidden = mode !== "auth";
  elements.appShell.hidden = mode !== "app";
}

function render() {
  const active = getActiveCycleItem();
  const day = PROGRAM.days[active.dayKey];

  elements.cycleLabel.textContent = PROGRAM_NAME;
  elements.dayTitle.textContent = active.dayKey === "rest" ? "Rest" : day.title;
  elements.unitSelect.value = state.settings.unit;
  elements.accountLabel.textContent = currentUser?.email || "Signed in";

  renderCycleRail();
  renderRecent();

  if (active.dayKey === "rest") {
    elements.sessionKicker.textContent = "Program rhythm";
    elements.sessionTitle.textContent = "Rest";
    elements.sessionNote.textContent = "Recovery slot between the training days.";
    elements.restView.hidden = false;
    elements.exerciseList.hidden = true;
    elements.useLastAllButton.hidden = true;
    elements.clearDraftButton.hidden = true;
    elements.finishWorkoutButton.textContent = "Next gym day";
    elements.completionCount.textContent = "Rest slot";
    return;
  }

  elements.sessionKicker.textContent = day.kicker;
  elements.sessionTitle.textContent = day.title;
  elements.sessionNote.textContent = day.note;
  elements.restView.hidden = true;
  elements.exerciseList.hidden = false;
  elements.useLastAllButton.hidden = false;
  elements.clearDraftButton.hidden = false;
  elements.finishWorkoutButton.textContent = "Finish workout";

  renderExercises(active.dayKey, day);
  updateCompletionCount();
}

function renderCycleRail() {
  const fragment = document.createDocumentFragment();
  PROGRAM.cycle.forEach((slot, index) => {
    const button = document.createElement("button");
    button.className = "cycle-chip";
    button.type = "button";
    if (index === state.currentCycleIndex) {
      button.classList.add("is-active");
    }
    if (slot.dayKey === "rest") {
      button.classList.add("is-rest");
    }
    button.append(slot.label, createTextElement("span", slot.detail));
    button.addEventListener("click", () => {
      state.currentCycleIndex = index;
      touchAndSave("Day changed");
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    fragment.append(button);
  });
  elements.cycleScroller.replaceChildren(fragment);
}

function renderExercises(dayKey, day) {
  const fragment = document.createDocumentFragment();
  day.exercises.forEach((exercise, index) => {
    fragment.append(renderExerciseCard(dayKey, exercise, index));
  });
  elements.exerciseList.replaceChildren(fragment);
}

function renderExerciseCard(dayKey, exercise, index) {
  const sets = ensureDraftSets(dayKey, exercise);
  const last = state.lastByExercise[exercise.id];
  const ready = isReadyToAddLoad(exercise, last);

  const article = document.createElement("article");
  article.className = "exercise-card";
  if (ready) {
    article.classList.add("is-ready");
  }
  article.style.animationDelay = `${Math.min(index * 28, 180)}ms`;

  const head = createElement("div", "exercise-head");
  const number = createTextElement("span", "0".concat(String(index + 1)).slice(-2));
  number.className = "exercise-number";
  const main = createElement("div");
  const titleRow = createElement("div", "exercise-title-row");
  const titleWrap = createElement("div");
  const title = createTextElement("h3", exercise.name);
  const target = createTextElement("p", `${exercise.sets} sets x ${exercise.reps} reps / ${exercise.focus}`);
  target.className = "target-line";
  titleWrap.append(title, target);
  if (last) {
    titleWrap.append(createTextElement("p", `Last ${formatDate(last.date)}: ${formatSets(last.sets)}`, "last-line"));
  } else {
    titleWrap.append(createTextElement("p", "No last workout yet.", "last-line"));
  }
  titleRow.append(titleWrap);
  if (ready) {
    titleRow.append(createTextElement("span", "Add load next time", "status-badge"));
  }
  main.append(titleRow);
  head.append(number, main);

  const table = createElement("div", "set-table");
  const header = createElement("div", "set-header");
  ["Set", "Target", "Weight", "Reps", "Done"].forEach((label) => {
    header.append(createTextElement("span", label));
  });
  table.append(header);

  sets.forEach((set, setIndex) => {
    table.append(renderSetRow(dayKey, exercise, set, setIndex));
  });

  const actions = createElement("div", "card-actions");
  const loadButton = createTextElement("button", "Load weights", "mini-button");
  loadButton.type = "button";
  loadButton.disabled = !last;
  loadButton.addEventListener("click", () => {
    loadLastWeightsForExercise(dayKey, exercise, false);
    render();
    showToast(`Loaded ${exercise.name} weights.`);
  });

  const addSetButton = createTextElement("button", "Add set", "mini-button");
  addSetButton.type = "button";
  addSetButton.addEventListener("click", () => {
    ensureDraftSets(dayKey, exercise).push(createEmptySet());
    touchAndSave("Set added");
    render();
  });
  actions.append(loadButton, addSetButton);

  const noteLabel = createElement("label", "note-field");
  noteLabel.append(createTextElement("span", "Note for next time"));
  const textarea = document.createElement("textarea");
  textarea.value = state.notes[exercise.id] || "";
  textarea.placeholder = "Cues, setup, pain, machine number, grip, next target...";
  textarea.addEventListener("input", () => {
    state.notes[exercise.id] = textarea.value;
    touchAndSave("Note saved");
  });
  noteLabel.append(textarea);

  article.append(head, table, actions, noteLabel);
  return article;
}

function renderSetRow(dayKey, exercise, set, setIndex) {
  const row = createElement("div", "set-row");
  row.append(createTextElement("span", String(setIndex + 1), "set-number"));

  const targetCell = createElement("span", "set-target");
  if (setIndex >= exercise.sets) {
    const removeButton = createTextElement("button", "Remove", "mini-button");
    removeButton.type = "button";
    removeButton.addEventListener("click", () => {
      const sets = ensureDraftSets(dayKey, exercise);
      sets.splice(setIndex, 1);
      touchAndSave("Set removed");
      render();
    });
    targetCell.append(removeButton);
  } else {
    targetCell.textContent = exercise.reps;
  }
  row.append(targetCell);

  const weightInput = document.createElement("input");
  weightInput.className = "set-input";
  weightInput.type = "text";
  weightInput.inputMode = "decimal";
  weightInput.autocomplete = "off";
  weightInput.placeholder = state.settings.unit;
  weightInput.value = set.weight || "";
  weightInput.setAttribute("aria-label", `${exercise.name} set ${setIndex + 1} weight`);
  weightInput.addEventListener("input", () => {
    updateSet(dayKey, exercise, setIndex, { weight: weightInput.value });
  });
  row.append(weightInput);

  const repsInput = document.createElement("input");
  repsInput.className = "set-input";
  repsInput.type = "number";
  repsInput.inputMode = "numeric";
  repsInput.min = "0";
  repsInput.step = "1";
  repsInput.autocomplete = "off";
  repsInput.placeholder = "0";
  repsInput.value = set.reps || "";
  repsInput.setAttribute("aria-label", `${exercise.name} set ${setIndex + 1} reps`);
  repsInput.addEventListener("input", () => {
    updateSet(dayKey, exercise, setIndex, { reps: repsInput.value });
  });
  row.append(repsInput);

  const doneCell = createElement("span", "done-cell");
  const doneInput = document.createElement("input");
  doneInput.type = "checkbox";
  doneInput.checked = Boolean(set.done);
  doneInput.setAttribute("aria-label", `${exercise.name} set ${setIndex + 1} done`);
  doneInput.addEventListener("change", () => {
    updateSet(dayKey, exercise, setIndex, { done: doneInput.checked });
  });
  doneCell.append(doneInput);
  row.append(doneCell);

  return row;
}

function renderRecent() {
  const logs = state.logs.slice(0, 5);
  if (!logs.length) {
    elements.recentList.replaceChildren(createTextElement("p", "No completed sessions yet.", "empty-state"));
    return;
  }

  const fragment = document.createDocumentFragment();
  logs.forEach((log) => {
    const item = createElement("div", "recent-item");
    item.append(createTextElement("strong", `${log.dayTitle} / ${fullDate.format(new Date(log.date))}`));
    item.append(createTextElement("span", `${countLoggedSets(log.entries)} sets logged`));
    fragment.append(item);
  });
  elements.recentList.replaceChildren(fragment);
}

function updateSet(dayKey, exercise, setIndex, patch) {
  const sets = ensureDraftSets(dayKey, exercise);
  sets[setIndex] = { ...sets[setIndex], ...patch };
  getDraft(dayKey).updatedAt = new Date().toISOString();
  updateCompletionCount();
  touchAndSave("Set saved");
}

function updateCompletionCount() {
  const active = getActiveCycleItem();
  if (active.dayKey === "rest") {
    elements.completionCount.textContent = "Rest slot";
    return;
  }
  const day = PROGRAM.days[active.dayKey];
  const planned = day.exercises.reduce((total, exercise) => total + exercise.sets, 0);
  const logged = day.exercises.reduce((total, exercise) => {
    const sets = ensureDraftSets(active.dayKey, exercise);
    return total + sets.filter(isLoggedSet).length;
  }, 0);
  elements.completionCount.textContent = `${logged}/${planned} sets logged`;
}

function moveCycle(delta) {
  state.currentCycleIndex = wrapIndex(state.currentCycleIndex + delta);
  touchAndSave("Day changed");
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearCurrentDraft() {
  const active = getActiveCycleItem();
  if (active.dayKey === "rest") {
    return;
  }
  if (!window.confirm("Clear today's unsaved set entries? Notes and history stay.")) {
    return;
  }
  delete state.drafts[active.dayKey];
  touchAndSave("Draft cleared");
  render();
}

function loadAllLastWeights() {
  const active = getActiveCycleItem();
  if (active.dayKey === "rest") {
    return;
  }
  const day = PROGRAM.days[active.dayKey];
  let loaded = 0;
  day.exercises.forEach((exercise) => {
    if (loadLastWeightsForExercise(active.dayKey, exercise, true)) {
      loaded += 1;
    }
  });
  touchAndSave("Weights loaded");
  render();
  showToast(loaded ? `Loaded weights for ${loaded} exercises.` : "No previous weights yet.");
}

function loadLastWeightsForExercise(dayKey, exercise, skipSave) {
  const last = state.lastByExercise[exercise.id];
  if (!last?.sets?.length) {
    return false;
  }
  const sets = ensureDraftSets(dayKey, exercise);
  last.sets.forEach((lastSet, index) => {
    if (!sets[index]) {
      sets[index] = createEmptySet();
    }
    sets[index].weight = lastSet.weight || "";
    sets[index].reps = "";
    sets[index].done = false;
  });
  getDraft(dayKey).updatedAt = new Date().toISOString();
  if (!skipSave) {
    touchAndSave("Weights loaded");
  }
  return true;
}

function finishWorkout() {
  const active = getActiveCycleItem();
  if (active.dayKey === "rest") {
    advanceToNextTrainingDay();
    touchAndSave("Rest skipped");
    render();
    return;
  }

  const day = PROGRAM.days[active.dayKey];
  const entries = day.exercises
    .map((exercise) => {
      const sets = ensureDraftSets(active.dayKey, exercise)
        .map((set, index) => ({ ...set, setNumber: index + 1 }))
        .filter(isLoggedSet);
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        target: `${exercise.sets} x ${exercise.reps}`,
        noteSnapshot: state.notes[exercise.id] || "",
        sets,
      };
    })
    .filter((entry) => entry.sets.length > 0);

  const loggedSetCount = countLoggedSets(entries);
  if (!loggedSetCount && !window.confirm("Finish without logging any sets?")) {
    return;
  }

  const log = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date: new Date().toISOString(),
    cycleIndex: state.currentCycleIndex,
    dayKey: active.dayKey,
    dayTitle: day.title,
    entries,
  };

  state.logs.unshift(log);
  state.logs = state.logs.slice(0, 120);

  entries.forEach((entry) => {
    state.lastByExercise[entry.exerciseId] = {
      date: log.date,
      dayTitle: log.dayTitle,
      exerciseName: entry.exerciseName,
      target: entry.target,
      sets: entry.sets.map(({ setNumber, weight, reps, done }) => ({ setNumber, weight, reps, done })),
    };
  });

  delete state.drafts[active.dayKey];
  advanceToNextTrainingDay();
  touchAndSave("Workout saved");
  render();
  showToast(`${day.title} saved.`);
}

function advanceToNextTrainingDay() {
  let next = wrapIndex(state.currentCycleIndex + 1);
  while (PROGRAM.cycle[next].dayKey === "rest") {
    next = wrapIndex(next + 1);
  }
  state.currentCycleIndex = next;
}

function getDraft(dayKey) {
  if (!state.drafts[dayKey]) {
    state.drafts[dayKey] = { updatedAt: null, exercises: {} };
  }
  return state.drafts[dayKey];
}

function ensureDraftSets(dayKey, exercise) {
  const draft = getDraft(dayKey);
  let sets = draft.exercises[exercise.id];
  if (!Array.isArray(sets)) {
    sets = [];
  }
  sets = sets.map(normalizeSet);
  while (sets.length < exercise.sets) {
    sets.push(createEmptySet());
  }
  draft.exercises[exercise.id] = sets;
  return sets;
}

function createEmptySet() {
  return { weight: "", reps: "", done: false };
}

function normalizeSet(set) {
  return {
    weight: set?.weight == null ? "" : String(set.weight),
    reps: set?.reps == null ? "" : String(set.reps),
    done: Boolean(set?.done),
  };
}

function isLoggedSet(set) {
  return Boolean(String(set.reps || "").trim() || set.done);
}

function countLoggedSets(entries = []) {
  return entries.reduce((total, entry) => total + (entry.sets || []).filter(isLoggedSet).length, 0);
}

function isReadyToAddLoad(exercise, last) {
  const top = getTopRepTarget(exercise.reps);
  if (!top || !last?.sets || last.sets.length < exercise.sets) {
    return false;
  }
  return last.sets.slice(0, exercise.sets).every((set) => Number(set.reps) >= top);
}

function getTopRepTarget(repRange) {
  const numbers = String(repRange).match(/\d+/g);
  if (!numbers?.length) {
    return null;
  }
  return Math.max(...numbers.map(Number));
}

function getActiveCycleItem() {
  return PROGRAM.cycle[state.currentCycleIndex] || PROGRAM.cycle[0];
}

function wrapIndex(index) {
  return (index + PROGRAM.cycle.length) % PROGRAM.cycle.length;
}

function formatDate(date) {
  if (!date) {
    return "";
  }
  return shortDate.format(new Date(date));
}

function formatSets(sets) {
  if (!sets?.length) {
    return "no sets logged";
  }
  return sets
    .map((set) => {
      const weight = String(set.weight || "").trim();
      const reps = String(set.reps || "").trim();
      if (weight && reps) {
        return `${weight} ${state.settings.unit} x ${reps}`;
      }
      if (reps) {
        return `${reps} reps`;
      }
      if (weight) {
        return `${weight} ${state.settings.unit}`;
      }
      return "done";
    })
    .join(", ");
}

function createElement(tag, className) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  return element;
}

function createTextElement(tag, text, className) {
  const element = createElement(tag, className);
  element.textContent = text;
  return element;
}

function hasSupabaseConfig(config) {
  return (
    typeof config.supabaseUrl === "string" &&
    typeof config.supabaseAnonKey === "string" &&
    config.supabaseUrl.startsWith("https://") &&
    !config.supabaseUrl.includes("YOUR-") &&
    config.supabaseAnonKey.length > 30 &&
    !config.supabaseAnonKey.includes("YOUR-")
  );
}

function createDefaultState() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    currentCycleIndex: 0,
    notes: {},
    lastByExercise: {},
    logs: [],
    drafts: {},
    settings: { unit: "lb" },
  };
}

function normalizeState(candidate) {
  const base = createDefaultState();
  const source = candidate && typeof candidate === "object" ? candidate : {};
  const merged = {
    ...base,
    ...source,
    notes: isObject(source.notes) ? source.notes : {},
    lastByExercise: isObject(source.lastByExercise) ? source.lastByExercise : {},
    drafts: isObject(source.drafts) ? source.drafts : {},
    logs: Array.isArray(source.logs) ? source.logs : [],
    settings: { ...base.settings, ...(isObject(source.settings) ? source.settings : {}) },
  };
  if (!Number.isInteger(merged.currentCycleIndex) || merged.currentCycleIndex < 0 || merged.currentCycleIndex >= PROGRAM.cycle.length) {
    merged.currentCycleIndex = 0;
  }
  if (!["lb", "kg"].includes(merged.settings.unit)) {
    merged.settings.unit = "lb";
  }
  return merged;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function touchAndSave(status) {
  state.updatedAt = new Date().toISOString();
  cacheState(true);
  scheduleSync();
  setDraftStatus(status || "Saved");
}

function scheduleSync() {
  if (!currentUser || !supabase || previewMode) {
    setSyncStatus(previewMode ? "Preview only" : "Not synced");
    return;
  }
  window.clearTimeout(saveTimer);
  setSyncStatus("Saving");
  saveTimer = window.setTimeout(() => {
    syncNow(false);
  }, 520);
}

async function syncNow(showSuccessToast) {
  if (!currentUser || !supabase || previewMode) {
    return;
  }
  window.clearTimeout(saveTimer);
  setSyncStatus("Syncing");
  const { error } = await supabase
    .from("workout_state")
    .upsert({ user_id: currentUser.id, state }, { onConflict: "user_id" });
  if (error) {
    cacheState(true);
    setSyncStatus("Will retry");
    if (showSuccessToast) {
      showToast(error.message);
    }
    return;
  }
  cacheState(false);
  setSyncStatus("Synced");
  setDraftStatus("Synced");
  if (showSuccessToast) {
    showToast("Synced to cloud.");
  }
}

function cacheState(pending) {
  if (!currentUser) {
    return;
  }
  localStorage.setItem(
    getCacheKey(),
    JSON.stringify({
      state,
      pending: Boolean(pending),
      cachedAt: new Date().toISOString(),
    }),
  );
}

function getCachedRecord() {
  if (!currentUser) {
    return null;
  }
  try {
    const raw = localStorage.getItem(getCacheKey());
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getCacheKey() {
  return `${STORAGE_PREFIX}${currentUser.id}`;
}

function setSyncStatus(text) {
  elements.syncStatus.textContent = text;
}

function setDraftStatus(text) {
  elements.draftStatus.textContent = text;
  window.clearTimeout(statusTimer);
  if (text !== "Synced") {
    statusTimer = window.setTimeout(() => {
      elements.draftStatus.textContent = previewMode ? "Preview only" : "Synced";
    }, 1400);
  }
}

function openSettings() {
  elements.settingsPanel.hidden = false;
}

function closeSettings() {
  elements.settingsPanel.hidden = true;
}

function exportBackup() {
  const payload = {
    app: "PLP Gym Log",
    version: 1,
    exportedAt: new Date().toISOString(),
    state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `plp-gym-log-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Backup exported.");
}

async function importBackup() {
  const file = elements.importInput.files?.[0];
  elements.importInput.value = "";
  if (!file) {
    return;
  }
  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    const importedState = payload.state || payload;
    if (!window.confirm("Import this backup and replace your current cloud state?")) {
      return;
    }
    state = normalizeState(importedState);
    touchAndSave("Backup imported");
    await syncNow(true);
    render();
  } catch (error) {
    showToast(`Import failed: ${error.message}`);
  }
}

async function resetData() {
  if (!window.confirm("Reset all workouts, notes, drafts, and history for this account?")) {
    return;
  }
  state = createDefaultState();
  touchAndSave("Reset saved");
  await syncNow(true);
  render();
}

async function installApp() {
  if (!installPrompt) {
    showToast("On iPhone use Share, then Add to Home Screen.");
    return;
  }
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  elements.installButton.hidden = true;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 3200);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || window.location.protocol === "file:") {
    return;
  }
  navigator.serviceWorker.register("./sw.js").catch(() => {
    setSyncStatus("Online only");
  });
}

function createDemoState() {
  const demo = createDefaultState();
  demo.notes["close-grip-smith-press"] = "Bench one notch below shoulder height. Warm elbows first.";
  demo.notes["incline-seated-db-curl"] = "Keep shoulder pinned. Do not chase swing reps.";
  demo.lastByExercise["close-grip-smith-press"] = {
    date: new Date(Date.now() - 4 * 86400000).toISOString(),
    dayTitle: "Pull A",
    exerciseName: "Close-grip Smith press, tucked elbows",
    target: "3 x 6-10",
    sets: [
      { setNumber: 1, weight: "145", reps: "9", done: true },
      { setNumber: 2, weight: "145", reps: "8", done: true },
      { setNumber: 3, weight: "135", reps: "10", done: true },
    ],
  };
  demo.logs.push({
    id: "demo-log",
    date: new Date(Date.now() - 4 * 86400000).toISOString(),
    cycleIndex: 0,
    dayKey: "pull-a",
    dayTitle: "Pull A",
    entries: [
      {
        exerciseId: "close-grip-smith-press",
        exerciseName: "Close-grip Smith press, tucked elbows",
        target: "3 x 6-10",
        noteSnapshot: demo.notes["close-grip-smith-press"],
        sets: demo.lastByExercise["close-grip-smith-press"].sets,
      },
    ],
  });
  return demo;
}
