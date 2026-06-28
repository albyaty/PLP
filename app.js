const STORAGE_PREFIX = "plp-gym-log-cache-v1:";
const PROGRAM_NAME = "PLP Arm Specialization";
const PROGRAM_TEMPLATE_VERSION = 5;
const SYNCED_CYCLE_DAY_KEYS = new Set(["push", "legs"]);
const CONFIG = window.PLP_CONFIG || {};
const allowSignUp = CONFIG.allowSignUp === true;
const SNAPSHOT_LIMIT = 10;
const SYNC_HISTORY_LIMIT = 5;
const REMOTE_CONFLICT_SKEW_MS = 1000;

const DEFAULT_PROGRAM = {
  cycle: [
    { dayKey: "push", label: "Push", detail: "Chest + tri" },
    { dayKey: "legs", label: "Abs & Legs", detail: "Abs first" },
    { dayKey: "pull-a", label: "Pull A", detail: "Fresh arms" },
    { dayKey: "rest", label: "Rest", detail: "Recover" },
    { dayKey: "push", label: "Push", detail: "Chest + tri" },
    { dayKey: "legs", label: "Abs & Legs", detail: "Abs first" },
    { dayKey: "pull-b", label: "Pull B", detail: "Back priority" },
    { dayKey: "rest", label: "Rest", detail: "Recover" },
  ],
  days: {
    "pull-a": {
      title: "Pull A",
      kicker: "Biceps/triceps priority",
      note: "Arms first fresh: 7 biceps sets plus heavy close-grip press. Use straps on back work.",
      exercises: [
        { id: "incline-seated-db-curl", name: "Incline seated DB curl", sets: 4, reps: "8-10", focus: "Fresh biceps / lengthened bias" },
        { id: "hammer-curl", name: "Hammer curl", sets: 3, reps: "10-12", focus: "Brachialis / brachioradialis" },
        { id: "close-grip-smith-press", name: "Close-grip Smith press, tucked", sets: 3, reps: "6-10", focus: "Fresh triceps heavy" },
        { id: "lat-pulldown", name: "Lat pulldown", sets: 3, reps: "8-12", focus: "Back / use straps" },
        { id: "chest-supported-db-row", name: "Chest-supported DB row", sets: 3, reps: "10-12", focus: "Back / use straps" },
        { id: "rear-delt", name: "Rear delt", sets: 2, reps: "15-20", focus: "Delt maintenance" },
      ],
    },
    "pull-b": {
      title: "Pull B",
      kicker: "Back priority",
      note: "Back gets your fresh, full effort. Triceps gets a fresh long-head dose, then biceps finishes with incline curls and hammer curls.",
      exercises: [
        { id: "lat-pulldown", name: "Lat pulldown", sets: 3, reps: "8-12", focus: "Back" },
        { id: "smith-machine-row", name: "Smith machine row", sets: 3, reps: "8-12", focus: "Back" },
        { id: "chest-supported-db-row", name: "Chest-supported DB row", sets: 3, reps: "10-12", focus: "Back" },
        { id: "rear-delt", name: "Rear delt", sets: 2, reps: "15-20", focus: "Delt maintenance" },
        { id: "overhead-db-extension", name: "Overhead DB extension", sets: 3, reps: "10-15", focus: "Fresh triceps / long head" },
        { id: "incline-seated-db-curl", name: "Incline seated DB curl", sets: 3, reps: "10-12", focus: "Secondary biceps dose" },
        { id: "hammer-curl", name: "Hammer curl", sets: 2, reps: "10-12", focus: "Brachialis top-up" },
      ],
    },
    push: {
      title: "Push",
      kicker: "Chest + long-head triceps",
      note: "Chest, priority long-head triceps, delt maintenance, then a light fresh biceps top-up.",
      exercises: [
        { id: "incline-smith-press", name: "Incline Smith press", sets: 3, reps: "6-10", focus: "Chest" },
        { id: "chest-press-machine", name: "Chest press machine", sets: 3, reps: "8-12", focus: "Chest" },
        { id: "pec-dec", name: "Pec dec", sets: 3, reps: "10-15", focus: "Chest" },
        { id: "overhead-db-extension", name: "Overhead DB extension", sets: 3, reps: "10-15", focus: "Long-head triceps" },
        { id: "lat-raise", name: "Lat raise", sets: 2, reps: "12-20", focus: "Delt maintenance" },
        { id: "db-curl", name: "DB curl", sets: 2, reps: "10-15", focus: "Light fresh biceps dose" },
      ],
    },
    legs: {
      title: "Abs & Legs",
      kicker: "Abs first, lean lower",
      note: "Abs get the fresh slot. Keep crunches 1-2 reps shy of failure and rest before squatting.",
      exercises: [
        { id: "reverse-crunch", name: "Reverse crunch", sets: 3, reps: "12-15", focus: "Abs priority" },
        { id: "weighted-crunch", name: "Weighted crunch", sets: 3, reps: "12-15", focus: "Abs" },
        { id: "squat", name: "Squat", sets: 3, reps: "5-8", focus: "Compound" },
        { id: "leg-press", name: "Leg press", sets: 3, reps: "10-15", focus: "Quads" },
        { id: "rdl", name: "RDL", sets: 3, reps: "8-12", focus: "Hinge" },
        { id: "calf-raise", name: "Calf raise", sets: 3, reps: "10-15", focus: "Optional" },
      ],
    },
  },
};

const LEGACY_PROGRAM_TEMPLATE_V4 = {
  cycle: [
    { dayKey: "push", label: "Push", detail: "Chest + tri" },
    { dayKey: "legs", label: "Abs & Legs", detail: "Abs first" },
    { dayKey: "pull-a", label: "Pull A", detail: "Fresh arms" },
    { dayKey: "rest", label: "Rest", detail: "Recover" },
    { dayKey: "push", label: "Push", detail: "Chest + tri" },
    { dayKey: "legs", label: "Abs & Legs", detail: "Abs first" },
    { dayKey: "pull-b", label: "Pull B", detail: "Back priority" },
    { dayKey: "rest", label: "Rest", detail: "Recover" },
  ],
  days: {
    "pull-a": {
      title: "Pull A",
      kicker: "Biceps/triceps priority",
      note: "Arms first fresh: 7 biceps sets plus heavy close-grip press. Use straps on back work.",
      exercises: [
        { id: "incline-seated-db-curl", name: "Incline seated DB curl", sets: 4, reps: "8-10", focus: "Fresh biceps / lengthened bias" },
        { id: "hammer-curl", name: "Hammer curl", sets: 3, reps: "10-12", focus: "Brachialis / brachioradialis" },
        { id: "close-grip-smith-press", name: "Close-grip Smith press, tucked", sets: 3, reps: "6-10", focus: "Fresh triceps heavy" },
        { id: "lat-pulldown", name: "Lat pulldown", sets: 3, reps: "8-12", focus: "Back / use straps" },
        { id: "chest-supported-db-row", name: "Chest-supported DB row", sets: 3, reps: "10-12", focus: "Back / use straps" },
        { id: "rear-delt", name: "Rear delt", sets: 2, reps: "15-20", focus: "Delt maintenance" },
      ],
    },
    "pull-b": {
      title: "Pull B",
      kicker: "Back priority",
      note: "Back gets your fresh, full effort. Biceps is one lighter secondary pump at the end.",
      exercises: [
        { id: "lat-pulldown", name: "Lat pulldown", sets: 3, reps: "8-12", focus: "Back" },
        { id: "smith-machine-row", name: "Smith machine row", sets: 3, reps: "8-12", focus: "Back" },
        { id: "chest-supported-db-row", name: "Chest-supported DB row", sets: 3, reps: "10-12", focus: "Back" },
        { id: "shrugs", name: "Shrugs", sets: 3, reps: "12-15", focus: "Traps" },
        { id: "rear-delt", name: "Rear delt", sets: 2, reps: "15-20", focus: "Delt maintenance" },
        { id: "spider-curl", name: "Spider curl", sets: 3, reps: "10-12", focus: "Shortened-bias biceps pump" },
      ],
    },
    push: {
      title: "Push",
      kicker: "Chest + long-head triceps",
      note: "Chest, priority long-head triceps, delt maintenance, then a light fresh biceps top-up.",
      exercises: [
        { id: "incline-smith-press", name: "Incline Smith press", sets: 3, reps: "6-10", focus: "Chest" },
        { id: "chest-press-machine", name: "Chest press machine", sets: 3, reps: "8-12", focus: "Chest" },
        { id: "pec-dec", name: "Pec dec", sets: 3, reps: "10-15", focus: "Chest" },
        { id: "overhead-db-extension", name: "Overhead DB extension", sets: 3, reps: "10-15", focus: "Long-head triceps" },
        { id: "lat-raise", name: "Lat raise", sets: 2, reps: "12-20", focus: "Delt maintenance" },
        { id: "db-curl", name: "DB curl", sets: 2, reps: "10-15", focus: "Light fresh biceps dose" },
      ],
    },
    legs: {
      title: "Abs & Legs",
      kicker: "Abs first, lean lower",
      note: "Abs get the fresh slot. Keep crunches shy of failure and rest before squatting.",
      exercises: [
        { id: "reverse-crunch", name: "Reverse crunch", sets: 3, reps: "12-15", focus: "Abs priority" },
        { id: "weighted-crunch", name: "Weighted crunch", sets: 3, reps: "12-15", focus: "Abs" },
        { id: "squat", name: "Squat", sets: 3, reps: "5-8", focus: "Compound" },
        { id: "leg-press", name: "Leg press", sets: 3, reps: "10-15", focus: "Quads" },
        { id: "rdl", name: "RDL", sets: 3, reps: "8-12", focus: "Hinge" },
        { id: "leg-curl", name: "Leg curl", sets: 3, setsLabel: "2-3", reps: "10-15", focus: "Recommended knee flexion" },
        { id: "calf-raise", name: "Calf raise", sets: 3, reps: "10-15", focus: "Optional" },
      ],
    },
  },
};
const LEGACY_CYCLE_V2 = [
  { dayKey: "pull-a", label: "Pull A", detail: "Fresh arms" },
  { dayKey: "legs", label: "Legs", detail: "Lean lower" },
  { dayKey: "push", label: "Push", detail: "Chest + tri" },
  { dayKey: "rest", label: "Rest", detail: "Recover" },
  { dayKey: "pull-b", label: "Pull B", detail: "Normal order" },
  { dayKey: "legs", label: "Legs", detail: "Lean lower" },
  { dayKey: "push", label: "Push", detail: "Chest + tri" },
  { dayKey: "rest", label: "Rest", detail: "Recover" },
];

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
  editDayButton: byId("editDayButton"),
  clearDraftButton: byId("clearDraftButton"),
  restView: byId("restView"),
  restTitle: byId("restTitle"),
  restNote: byId("restNote"),
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
  restorePointLabel: byId("restorePointLabel"),
  restorePointGrid: byId("restorePointGrid"),
  redoSyncButton: byId("redoSyncButton"),
  exportButton: byId("exportButton"),
  importInput: byId("importInput"),
  installButton: byId("installButton"),
  resetButton: byId("resetButton"),
  signOutButton: byId("signOutButton"),
  programPanel: byId("programPanel"),
  closeProgramButton: byId("closeProgramButton"),
  programTitle: byId("programTitle"),
  dayDetailsForm: byId("dayDetailsForm"),
  programDayNameInput: byId("programDayNameInput"),
  programDayDetailInput: byId("programDayDetailInput"),
  programDayNoteInput: byId("programDayNoteInput"),
  programExerciseBlock: byId("programExerciseBlock"),
  programExerciseCount: byId("programExerciseCount"),
  programExerciseList: byId("programExerciseList"),
  addExistingForm: byId("addExistingForm"),
  existingExerciseSelect: byId("existingExerciseSelect"),
  customExerciseForm: byId("customExerciseForm"),
  customExerciseNameInput: byId("customExerciseNameInput"),
  customExerciseSetsInput: byId("customExerciseSetsInput"),
  customExerciseRepsInput: byId("customExerciseRepsInput"),
  customExerciseFocusInput: byId("customExerciseFocusInput"),
  resetDayBlock: byId("resetDayBlock"),
  resetDayButton: byId("resetDayButton"),
  toast: byId("toast"),
};

const configured = hasSupabaseConfig(CONFIG);
const previewMode = new URLSearchParams(window.location.search).has("preview");
const localPreviewHost = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);

let state = createDefaultState();
let currentUser = null;
let supabase = null;
let saveTimer = null;
let statusTimer = null;
let toastTimer = null;
let installPrompt = null;
let editingExerciseIndex = null;
let lastCloudUpdatedAt = null;
let lastLoadedState = null;
let syncInFlight = false;
let syncQueued = false;

const shortDate = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const fullDate = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const restoreDate = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const restoreTime = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

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

  if (previewMode && localPreviewHost) {
    currentUser = { id: "preview", email: "preview@local" };
    state = createDemoState();
    lastLoadedState = cloneState(state);
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
      lastCloudUpdatedAt = null;
      lastLoadedState = null;
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
  elements.editDayButton.addEventListener("click", openProgramEditor);
  elements.clearDraftButton.addEventListener("click", clearCurrentDraft);
  elements.finishWorkoutButton.addEventListener("click", finishWorkout);
  elements.settingsButton.addEventListener("click", openSettings);
  elements.closeSettingsButton.addEventListener("click", closeSettings);
  elements.settingsPanel.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-settings]")) {
      closeSettings();
    }
  });
  elements.closeProgramButton.addEventListener("click", closeProgramEditor);
  elements.programPanel.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-program]")) {
      closeProgramEditor();
    }
  });
  elements.dayDetailsForm.addEventListener("submit", updateProgramDayDetails);
  elements.addExistingForm.addEventListener("submit", addExistingExerciseToDay);
  elements.customExerciseForm.addEventListener("submit", addCustomExerciseToDay);
  elements.resetDayButton.addEventListener("click", resetCurrentDayProgram);
  elements.unitSelect.addEventListener("change", () => {
    state.settings.unit = elements.unitSelect.value;
    touchAndSave("Unit changed");
    render();
  });
  elements.syncNowButton.addEventListener("click", () => syncNow(true));
  elements.redoSyncButton.addEventListener("click", redoRestoredSync);
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
  window.addEventListener("focus", refreshFromCloudIfSafe);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      refreshFromCloudIfSafe();
    }
  });
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
  lastCloudUpdatedAt = null;
  lastLoadedState = null;
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

  const { data, error } = await fetchRemoteStateRecord();

  if (error) {
    const cached = getCachedRecord();
    if (cached?.state) {
      state = normalizeState(cached.state);
      lastCloudUpdatedAt = cached.cloudUpdatedAt || null;
      lastLoadedState = cached.baseState ? normalizeState(cached.baseState) : cloneState(state);
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
    lastCloudUpdatedAt = null;
    lastLoadedState = cached?.baseState ? normalizeState(cached.baseState) : cloneState(state);
    await syncNow(false);
    render();
    return;
  }

  const cloudState = normalizeState(data.state);
  lastCloudUpdatedAt = data.updated_at || cloudState.updatedAt || null;
  const shouldPreferCache =
    cached?.pending &&
    cached.state?.updatedAt &&
    getTimestamp(cached.state.updatedAt) > getTimestamp(cloudState.updatedAt || data.updated_at);

  state = shouldPreferCache ? normalizeState(cached.state) : cloudState;
  lastLoadedState = shouldPreferCache ? normalizeState(cached.baseState || cloudState) : cloneState(state);
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
  const day = getProgram().days[active.dayKey];
  const activeDisplay = getCycleSlotDisplay(active, state.currentCycleIndex);

  elements.cycleLabel.textContent = PROGRAM_NAME;
  elements.dayTitle.textContent = activeDisplay.label;
  elements.unitSelect.value = state.settings.unit;
  elements.accountLabel.textContent = currentUser?.email || "Signed in";

  renderCycleRail();
  renderRecent();
  renderRestoreControls();

  if (active.dayKey === "rest") {
    elements.sessionKicker.textContent = activeDisplay.detail;
    elements.sessionTitle.textContent = activeDisplay.label;
    elements.sessionNote.textContent = getCycleSlotNote(active, day);
    elements.restTitle.textContent = activeDisplay.label;
    elements.restNote.textContent = getCycleSlotNote(active, day);
    elements.restView.hidden = false;
    elements.exerciseList.hidden = true;
    elements.editDayButton.hidden = false;
    elements.clearDraftButton.hidden = true;
    elements.finishWorkoutButton.textContent = "Next gym day";
    elements.completionCount.textContent = "Rest slot";
    if (!elements.programPanel.hidden) {
      renderProgramEditor();
    }
    return;
  }

  elements.sessionKicker.textContent = activeDisplay.detail;
  elements.sessionTitle.textContent = activeDisplay.label;
  elements.sessionNote.textContent = getCycleSlotNote(active, day);
  elements.restView.hidden = true;
  elements.exerciseList.hidden = false;
  elements.editDayButton.hidden = false;
  elements.clearDraftButton.hidden = false;
  elements.finishWorkoutButton.textContent = "Finish workout";

  renderExercises(active.dayKey, day);
  updateCompletionCount();

  if (!elements.programPanel.hidden) {
    renderProgramEditor();
  }
}

function renderCycleRail() {
  const fragment = document.createDocumentFragment();
  getProgram().cycle.forEach((slot, index) => {
    const display = getCycleSlotDisplay(slot, index);
    const button = document.createElement("button");
    button.className = "cycle-chip";
    button.type = "button";
    if (index === state.currentCycleIndex) {
      button.classList.add("is-active");
    }
    if (slot.dayKey === "rest") {
      button.classList.add("is-rest");
    }
    button.append(display.label, createTextElement("span", display.detail));
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
  const target = createTextElement("p", `${formatExerciseTarget(exercise)} / ${exercise.focus}`);
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
  const addSetButton = createTextElement("button", "Add set", "mini-button");
  addSetButton.type = "button";
  addSetButton.addEventListener("click", () => {
    ensureDraftSets(dayKey, exercise).push(createEmptySet());
    touchAndSave("Set added");
    render();
  });
  actions.append(addSetButton);

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

function renderRestoreControls() {
  const history = normalizeSyncHistory(state.syncHistory);
  const redoHistory = normalizeSyncHistory(state.redoHistory);
  const redo = redoHistory[0];
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < SYNC_HISTORY_LIMIT; index += 1) {
    fragment.append(renderRestorePointButton(history[index], index));
  }
  elements.restorePointGrid.replaceChildren(fragment);
  elements.redoSyncButton.disabled = !redo;
  elements.restorePointLabel.textContent = history.length
    ? "Choose a saved sync point if something gets overwritten."
    : "No previous sync saved yet.";
}

function renderRestorePointButton(entry, index) {
  const button = createElement("button", "restore-point-button");
  button.type = "button";
  button.disabled = !entry;
  button.append(createTextElement("strong", String(index + 1)));
  if (entry) {
    const formatted = formatRestorePointDate(entry.savedAt);
    button.append(createTextElement("span", formatted.date), createTextElement("small", formatted.time));
    button.title = `Restore sync point ${index + 1} from ${formatHistoryDate(entry.savedAt)}`;
    button.addEventListener("click", () => restoreSyncAtIndex(index));
  } else {
    button.append(createTextElement("span", "Empty"), createTextElement("small", "--"));
    button.title = `Restore sync point ${index + 1} is empty`;
  }
  return button;
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
  const day = getProgram().days[active.dayKey];
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

function finishWorkout() {
  const active = getActiveCycleItem();
  if (active.dayKey === "rest") {
    advanceToNextTrainingDay();
    touchAndSave("Rest skipped");
    render();
    return;
  }

  const day = getProgram().days[active.dayKey];
  const entries = day.exercises
    .map((exercise) => {
      const sets = ensureDraftSets(active.dayKey, exercise)
        .map((set, index) => ({ ...set, setNumber: index + 1 }))
        .filter(isLoggedSet);
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        target: formatExerciseTargetCompact(exercise),
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
    dayTitle: getDayDisplayBase(active).label,
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
  const cycle = getProgram().cycle;
  while (cycle[next].dayKey === "rest") {
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
  const draftKey = getExerciseDraftKey(exercise);
  let sets = draft.exercises[draftKey];
  if (!Array.isArray(sets)) {
    sets = [];
  }
  sets = sets.map(normalizeSet);
  while (sets.length < exercise.sets) {
    sets.push(createEmptySet());
  }
  draft.exercises[draftKey] = sets;
  return sets;
}

function getExerciseDraftKey(exercise) {
  return exercise.slotId || exercise.id;
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
  const cycle = getProgram().cycle;
  return cycle[state.currentCycleIndex] || cycle[0];
}

function getCycleSlotDisplay(slot, index) {
  if (!slot) {
    return { label: "", detail: "" };
  }
  const syncInfo = getSyncedCycleInfo(slot.dayKey, index);
  const base = getDayDisplayBase(slot);
  if (!syncInfo.isSynced || !shouldShowSyncedOccurrence(slot.dayKey)) {
    return base;
  }
  return {
    label: `${base.label} ${syncInfo.occurrence}`,
    detail: base.detail,
  };
}

function getDayDisplayBase(slot) {
  const day = getProgram().days[slot.dayKey];
  if (slot.dayKey === "rest") {
    return {
      label: cleanText(slot.label) || "Rest",
      detail: Object.prototype.hasOwnProperty.call(slot || {}, "detail") ? cleanText(slot.detail) : "Recover",
    };
  }
  return {
    label: cleanText(slot.label) || cleanText(day?.title) || "Training",
    detail: Object.prototype.hasOwnProperty.call(slot || {}, "detail") ? cleanText(slot.detail) : cleanText(day?.kicker),
  };
}

function shouldShowSyncedOccurrence(dayKey) {
  if (!SYNCED_CYCLE_DAY_KEYS.has(dayKey)) {
    return false;
  }
  const labels = getProgram()
    .cycle
    .filter((slot) => slot.dayKey === dayKey)
    .map((slot) => getDayDisplayBase(slot).label);
  return labels.length > 1 && labels.every((label) => label === labels[0]);
}

function getCycleSlotNote(slot, day) {
  if (Object.prototype.hasOwnProperty.call(slot || {}, "note")) {
    return cleanText(slot?.note);
  }
  if (slot?.dayKey === "rest") {
    return "This slot is in the program rhythm. Use Next when you are ready for the next gym day.";
  }
  return cleanText(day?.note) || "";
}

function getSyncedCycleInfo(dayKey, index = state.currentCycleIndex) {
  if (!SYNCED_CYCLE_DAY_KEYS.has(dayKey)) {
    return { isSynced: false, occurrence: 1, total: 1 };
  }
  const matchingIndexes = getProgram()
    .cycle
    .map((slot, slotIndex) => (slot.dayKey === dayKey ? slotIndex : -1))
    .filter((slotIndex) => slotIndex >= 0);
  const occurrenceIndex = Math.max(0, matchingIndexes.indexOf(index));
  return {
    isSynced: matchingIndexes.length > 1,
    occurrence: occurrenceIndex + 1,
    total: matchingIndexes.length,
  };
}

function wrapIndex(index) {
  const length = getProgram().cycle.length;
  return (index + length) % length;
}

function getProgram() {
  if (!state.program) {
    state.program = cloneProgram(DEFAULT_PROGRAM);
  }
  return state.program;
}

function openProgramEditor() {
  editingExerciseIndex = null;
  renderProgramEditor();
  elements.programPanel.hidden = false;
}

function closeProgramEditor() {
  elements.programPanel.hidden = true;
  editingExerciseIndex = null;
}

function renderProgramEditor() {
  const active = getActiveCycleItem();
  const isRest = active.dayKey === "rest";
  const day = getProgram().days[active.dayKey];
  if (!isRest && !day) {
    closeProgramEditor();
    return;
  }

  const display = getDayDisplayBase(active);
  elements.programTitle.textContent = `Edit ${display.label}`;
  elements.programDayNameInput.value = display.label;
  elements.programDayDetailInput.value = display.detail;
  elements.programDayNoteInput.value = getCycleSlotNote(active, day);

  elements.programExerciseBlock.hidden = isRest;
  elements.addExistingForm.hidden = isRest;
  elements.customExerciseForm.hidden = isRest;
  elements.resetDayBlock.hidden = false;

  if (isRest) {
    elements.programExerciseCount.textContent = "Rest";
    elements.programExerciseList.replaceChildren();
    return;
  }

  elements.programExerciseCount.textContent = getProgramExerciseCountLabel(active.dayKey, day.exercises.length);
  renderProgramExerciseList(active.dayKey, day);
  renderExistingExerciseOptions();
}

function getProgramExerciseCountLabel(dayKey, count) {
  return `${count} exercise${count === 1 ? "" : "s"}`;
}

function renderProgramExerciseList(dayKey, day) {
  if (!day.exercises.length) {
    elements.programExerciseList.replaceChildren(createTextElement("p", "No exercises on this day.", "empty-state"));
    return;
  }

  const fragment = document.createDocumentFragment();
  day.exercises.forEach((exercise, index) => {
    fragment.append(renderProgramExerciseRow(dayKey, exercise, index, day.exercises.length));
  });
  elements.programExerciseList.replaceChildren(fragment);
}

function renderProgramExerciseRow(dayKey, exercise, index, total) {
  const item = createElement("div", "program-exercise-item");
  const summary = createElement("div", "program-exercise-summary");
  const text = createElement("div");
  text.append(createTextElement("strong", exercise.name));
  text.append(createTextElement("span", `${formatExerciseTargetCompact(exercise)} / ${exercise.focus}`));

  const controls = createElement("div", "program-exercise-controls");
  const upButton = createTextElement("button", "Up", "mini-button");
  upButton.type = "button";
  upButton.disabled = index === 0;
  upButton.addEventListener("click", () => moveProgramExercise(dayKey, index, -1));

  const downButton = createTextElement("button", "Down", "mini-button");
  downButton.type = "button";
  downButton.disabled = index === total - 1;
  downButton.addEventListener("click", () => moveProgramExercise(dayKey, index, 1));

  const editButton = createTextElement("button", editingExerciseIndex === index ? "Cancel" : "Edit", "mini-button");
  editButton.type = "button";
  editButton.addEventListener("click", () => {
    editingExerciseIndex = editingExerciseIndex === index ? null : index;
    renderProgramEditor();
  });

  const removeButton = createTextElement("button", "Remove", "mini-button");
  removeButton.type = "button";
  removeButton.addEventListener("click", () => removeProgramExercise(dayKey, index));

  controls.append(upButton, downButton, editButton, removeButton);
  summary.append(text, controls);
  item.append(summary);

  if (editingExerciseIndex === index) {
    item.append(renderExerciseEditForm(dayKey, exercise, index));
  }

  return item;
}

function renderExerciseEditForm(dayKey, exercise, index) {
  const form = createElement("form", "inline-edit-form");
  const grid = createElement("div", "editor-grid");

  const nameField = createEditorInput("Name", "text", exercise.name);
  nameField.label.classList.add("wide-field");
  const setsField = createEditorInput("Sets", "number", String(exercise.sets));
  setsField.input.min = "1";
  setsField.input.max = "10";
  setsField.input.step = "1";
  const repsField = createEditorInput("Reps", "text", exercise.reps);
  const focusField = createEditorInput("Focus", "text", exercise.focus);
  focusField.label.classList.add("wide-field");

  grid.append(nameField.label, setsField.label, repsField.label, focusField.label);

  const actions = createElement("div", "button-row");
  const saveButton = createTextElement("button", "Save", "primary-button");
  saveButton.type = "submit";
  const cancelButton = createTextElement("button", "Cancel", "ghost-button");
  cancelButton.type = "button";
  cancelButton.addEventListener("click", () => {
    editingExerciseIndex = null;
    renderProgramEditor();
  });
  actions.append(saveButton, cancelButton);

  form.append(grid, actions);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateProgramExercise(dayKey, index, {
      ...exercise,
      name: nameField.input.value,
      sets: setsField.input.value,
      reps: repsField.input.value,
      focus: focusField.input.value,
    });
  });

  return form;
}

function createEditorInput(labelText, type, value) {
  const label = createElement("label", "settings-field");
  label.append(createTextElement("span", labelText));
  const input = document.createElement("input");
  input.type = type;
  input.autocomplete = "off";
  input.value = value || "";
  input.required = labelText !== "Focus";
  label.append(input);
  return { label, input };
}

function moveProgramExercise(dayKey, index, direction) {
  const exercises = getProgram().days[dayKey].exercises;
  const target = index + direction;
  if (target < 0 || target >= exercises.length) {
    return;
  }
  const [exercise] = exercises.splice(index, 1);
  exercises.splice(target, 0, exercise);
  editingExerciseIndex = null;
  touchAndSave("Exercise moved");
  render();
}

function removeProgramExercise(dayKey, index) {
  const day = getProgram().days[dayKey];
  const exercise = day.exercises[index];
  if (!exercise) {
    return;
  }
  if (!window.confirm(`Remove ${exercise.name} from ${day.title}? Notes and history stay saved.`)) {
    return;
  }
  day.exercises.splice(index, 1);
  editingExerciseIndex = null;
  touchAndSave("Exercise removed");
  render();
}

function updateProgramExercise(dayKey, index, patch) {
  const day = getProgram().days[dayKey];
  const current = day.exercises[index];
  const updated = normalizeExercise({ ...current, ...patch }, current);
  if (!updated) {
    showToast("Exercise needs a name.");
    return;
  }
  day.exercises[index] = updated;
  editingExerciseIndex = null;
  touchAndSave("Exercise updated");
  render();
}

function updateProgramDayDetails(event) {
  event.preventDefault();
  const program = getProgram();
  const slot = program.cycle[state.currentCycleIndex];
  if (!slot) {
    return;
  }

  const fallback = getDayDisplayBase(slot);
  const nextLabel = cleanText(elements.programDayNameInput.value) || fallback.label;
  const nextDetail = cleanText(elements.programDayDetailInput.value);
  const nextNote = cleanText(elements.programDayNoteInput.value);
  program.cycle[state.currentCycleIndex] = normalizeCycleSlot({
    ...slot,
    label: nextLabel,
    detail: nextDetail,
    note: nextNote,
  });
  editingExerciseIndex = null;
  touchAndSave("Day details saved");
  render();
  showToast(`${nextLabel} saved.`);
}

function addExistingExerciseToDay(event) {
  event.preventDefault();
  const selectedId = elements.existingExerciseSelect.value;
  const exercise = getExerciseCatalog().find((item) => item.id === selectedId);
  if (!exercise) {
    return;
  }
  const clone = normalizeExercise({
    ...exercise,
    slotId: createSlotId(exercise.id),
  });
  getCurrentProgramDay().exercises.push(clone);
  touchAndSave("Exercise added");
  render();
  showToast(`${clone.name} added.`);
}

function addCustomExerciseToDay(event) {
  event.preventDefault();
  const name = elements.customExerciseNameInput.value.trim();
  const exercise = normalizeExercise({
    id: createUniqueExerciseId(name),
    slotId: createSlotId(slugify(name) || "custom"),
    name,
    sets: elements.customExerciseSetsInput.value,
    reps: elements.customExerciseRepsInput.value,
    focus: elements.customExerciseFocusInput.value || "Custom",
  });
  if (!exercise) {
    showToast("Exercise needs a name.");
    return;
  }

  getCurrentProgramDay().exercises.push(exercise);
  elements.customExerciseForm.reset();
  elements.customExerciseSetsInput.value = "3";
  elements.customExerciseRepsInput.value = "8-12";
  elements.customExerciseFocusInput.value = "Custom";
  touchAndSave("Exercise added");
  render();
  showToast(`${exercise.name} added.`);
}

function resetCurrentDayProgram() {
  const active = getActiveCycleItem();
  const day = getProgram().days[active.dayKey];
  const fallback = DEFAULT_PROGRAM.days[active.dayKey];
  const fallbackSlot = getFallbackCycleSlot(active.dayKey, state.currentCycleIndex);
  if (active.dayKey === "rest") {
    if (!window.confirm(`Reset ${getDayDisplayBase(active).label} details?`)) {
      return;
    }
    getProgram().cycle[state.currentCycleIndex] = normalizeCycleSlot({
      ...fallbackSlot,
      dayKey: "rest",
    });
    editingExerciseIndex = null;
    touchAndSave("Day reset");
    render();
    return;
  }
  if (!day || !fallback) {
    return;
  }
  if (!window.confirm(`Reset ${getDayDisplayBase(active).label} exercise order and day details to the original PLP day? Notes and history stay saved.`)) {
    return;
  }
  getProgram().days[active.dayKey] = cloneProgram({ days: { [active.dayKey]: fallback } }).days[active.dayKey];
  getProgram().cycle[state.currentCycleIndex] = normalizeCycleSlot({
    ...fallbackSlot,
    dayKey: active.dayKey,
  });
  editingExerciseIndex = null;
  touchAndSave("Day reset");
  render();
}

function getFallbackCycleSlot(dayKey, index) {
  const fallbackByIndex = DEFAULT_PROGRAM.cycle[index];
  if (fallbackByIndex?.dayKey === dayKey) {
    return fallbackByIndex;
  }
  return DEFAULT_PROGRAM.cycle.find((slot) => slot.dayKey === dayKey) || { dayKey, label: dayKey, detail: "" };
}

function getCurrentProgramDay() {
  const active = getActiveCycleItem();
  return getProgram().days[active.dayKey];
}

function renderExistingExerciseOptions() {
  const catalog = getExerciseCatalog();
  const fragment = document.createDocumentFragment();
  catalog.forEach((exercise) => {
    const option = document.createElement("option");
    option.value = exercise.id;
    option.textContent = `${exercise.name} (${formatExerciseTargetCompact(exercise)})`;
    fragment.append(option);
  });
  elements.existingExerciseSelect.replaceChildren(fragment);
}

function getExerciseCatalog() {
  const byId = new Map();
  [DEFAULT_PROGRAM, getProgram()].forEach((program) => {
    Object.values(program.days || {}).forEach((day) => {
      (day.exercises || []).forEach((exercise) => {
        const normalized = normalizeExercise(exercise);
        if (normalized && !byId.has(normalized.id)) {
          byId.set(normalized.id, normalized);
        }
      });
    });
  });
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
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

function formatExerciseTarget(exercise) {
  return `${getSetCountLabel(exercise)} sets x ${exercise.reps} reps`;
}

function formatExerciseTargetCompact(exercise) {
  return `${getSetCountLabel(exercise)} x ${exercise.reps}`;
}

function getSetCountLabel(exercise) {
  return cleanText(exercise.setsLabel) || String(exercise.sets);
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
    version: 5,
    updatedAt: new Date().toISOString(),
    currentCycleIndex: 0,
    programRevision: PROGRAM_TEMPLATE_VERSION,
    program: cloneProgram(DEFAULT_PROGRAM),
    notes: {},
    lastByExercise: {},
    logs: [],
    drafts: {},
    settings: { unit: "lb" },
    syncHistory: [],
    redoHistory: [],
  };
}

function normalizeState(candidate) {
  const base = createDefaultState();
  const source = candidate && typeof candidate === "object" ? candidate : {};
  const sourceProgramRevision = getProgramRevision(source);
  const shouldUseUpdatedTemplate = shouldApplyProgramTemplateUpdate(source, sourceProgramRevision);
  const merged = {
    ...base,
    ...source,
    version: Math.max(clampInteger(source.version, 1, PROGRAM_TEMPLATE_VERSION, 1), PROGRAM_TEMPLATE_VERSION),
    programRevision: PROGRAM_TEMPLATE_VERSION,
    notes: isObject(source.notes) ? source.notes : {},
    lastByExercise: isObject(source.lastByExercise) ? source.lastByExercise : {},
    drafts: isObject(source.drafts) ? source.drafts : {},
    logs: Array.isArray(source.logs) ? source.logs : [],
    program: shouldUseUpdatedTemplate ? cloneProgram(DEFAULT_PROGRAM) : normalizeProgram(source.program),
    settings: { ...base.settings, ...(isObject(source.settings) ? source.settings : {}) },
    syncHistory: normalizeSyncHistory(source.syncHistory),
    redoHistory: normalizeSyncHistory(source.redoHistory),
  };
  if (shouldUseUpdatedTemplate) {
    merged.currentCycleIndex = remapCycleIndex(source.currentCycleIndex, source.program?.cycle || LEGACY_CYCLE_V2, merged.program.cycle);
  }
  if (
    !Number.isInteger(merged.currentCycleIndex) ||
    merged.currentCycleIndex < 0 ||
    merged.currentCycleIndex >= merged.program.cycle.length
  ) {
    merged.currentCycleIndex = 0;
  }
  if (!["lb", "kg"].includes(merged.settings.unit)) {
    merged.settings.unit = "lb";
  }
  return merged;
}

function normalizeSyncHistory(candidate) {
  if (!Array.isArray(candidate)) {
    return [];
  }
  return candidate.map(normalizeSyncHistoryEntry).filter(Boolean).slice(0, SYNC_HISTORY_LIMIT);
}

function normalizeSyncHistoryEntry(entry) {
  if (!isObject(entry) || !isObject(entry.state)) {
    return null;
  }
  return {
    id: cleanText(entry.id) || createSnapshotId(),
    label: cleanText(entry.label) || "Previous sync",
    savedAt: getTimestamp(entry.savedAt) ? new Date(entry.savedAt).toISOString() : new Date().toISOString(),
    state: stripRestoreHistory(entry.state),
  };
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getProgramRevision(source) {
  const candidate = source?.programRevision ?? source?.programTemplateVersion;
  return Number.isInteger(candidate) ? candidate : 0;
}

function shouldApplyProgramTemplateUpdate(source, sourceProgramRevision) {
  if (sourceProgramRevision >= PROGRAM_TEMPLATE_VERSION) {
    return false;
  }
  if (!source?.program || sourceProgramRevision === 0) {
    return true;
  }
  if (sourceProgramRevision === 4) {
    return isProgramStillOnTemplate(source.program, LEGACY_PROGRAM_TEMPLATE_V4);
  }
  return false;
}

function isProgramStillOnTemplate(candidate, template) {
  return JSON.stringify(normalizeProgramForTemplateComparison(candidate)) === JSON.stringify(normalizeProgramForTemplateComparison(template));
}

function normalizeProgramForTemplateComparison(program) {
  if (!isObject(program)) {
    return null;
  }
  const normalized = cloneProgram(program);
  Object.values(normalized.days || {}).forEach((day) => {
    if (Array.isArray(day.exercises)) {
      day.exercises = day.exercises.map((exercise) => ({ ...exercise }));
    }
  });
  return normalized;
}

function remapCycleIndex(index, fromCycle, toCycle) {
  if (!Number.isInteger(index) || !Array.isArray(fromCycle) || !Array.isArray(toCycle)) {
    return 0;
  }
  const oldSlot = fromCycle[index];
  if (!oldSlot?.dayKey) {
    return 0;
  }
  const occurrence = fromCycle.slice(0, index + 1).filter((slot) => slot.dayKey === oldSlot.dayKey).length;
  let seen = 0;
  const newIndex = toCycle.findIndex((slot) => {
    if (slot.dayKey !== oldSlot.dayKey) {
      return false;
    }
    seen += 1;
    return seen === occurrence;
  });
  return newIndex >= 0 ? newIndex : 0;
}

function cloneProgram(program) {
  return JSON.parse(JSON.stringify(program));
}

function cloneState(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeProgram(candidate) {
  const fallback = cloneProgram(DEFAULT_PROGRAM);
  if (!isObject(candidate)) {
    return fallback;
  }

  const sourceDays = isObject(candidate.days) ? candidate.days : {};
  const days = {};
  Object.entries(fallback.days).forEach(([dayKey, fallbackDay]) => {
    days[dayKey] = normalizeProgramDay(sourceDays[dayKey], fallbackDay);
  });

  Object.entries(sourceDays).forEach(([dayKey, day]) => {
    if (!days[dayKey] && dayKey !== "rest") {
      days[dayKey] = normalizeProgramDay(day, {
        title: cleanText(day?.title) || dayKey,
        kicker: cleanText(day?.kicker) || "Custom",
        note: cleanText(day?.note) || "",
        exercises: [],
      });
    }
  });

  const cycle = Array.isArray(candidate.cycle) && candidate.cycle.length
    ? candidate.cycle
        .map(normalizeCycleSlot)
        .filter((slot) => slot.dayKey === "rest" || days[slot.dayKey])
    : fallback.cycle;

  return {
    cycle: cycle.length ? cycle : fallback.cycle,
    days,
  };
}

function normalizeCycleSlot(slot) {
  const dayKey = cleanText(slot?.dayKey) || "rest";
  const fallback = getFallbackCycleSlot(dayKey, 0);
  const label = cleanText(slot?.label) || cleanText(fallback.label) || (dayKey === "rest" ? "Rest" : "Training");
  const hasDetail = Object.prototype.hasOwnProperty.call(slot || {}, "detail");
  const detail = hasDetail ? cleanText(slot?.detail) : cleanText(fallback.detail);
  const hasNote = Object.prototype.hasOwnProperty.call(slot || {}, "note");
  const note = cleanText(slot?.note);
  return {
    dayKey,
    label,
    detail,
    ...(hasNote ? { note } : {}),
  };
}

function normalizeProgramDay(candidate, fallback) {
  const source = isObject(candidate) ? candidate : {};
  const fallbackExercises = Array.isArray(fallback.exercises) ? fallback.exercises : [];
  const exercisesSource = Array.isArray(source.exercises) ? source.exercises : fallbackExercises;
  const exercises = exercisesSource.map((exercise) => normalizeExercise(exercise)).filter(Boolean);

  return {
    title: fallback.title === "Abs & Legs" && cleanText(source.title) === "Legs" ? "Abs & Legs" : cleanText(source.title) || fallback.title,
    kicker: cleanText(source.kicker) || fallback.kicker,
    note: cleanText(source.note) || fallback.note || "",
    exercises,
  };
}

function normalizeExercise(candidate, fallback = {}) {
  const source = isObject(candidate) ? candidate : {};
  const name = cleanText(source.name) || cleanText(fallback.name);
  if (!name) {
    return null;
  }

  const id = cleanId(source.id) || cleanId(fallback.id) || slugify(name);
  const slotId = cleanId(source.slotId) || cleanId(fallback.slotId);
  const sets = clampInteger(source.sets ?? fallback.sets, 1, 10, 3);

  return {
    id,
    ...(slotId ? { slotId } : {}),
    name,
    sets,
    ...(cleanText(source.setsLabel) ? { setsLabel: cleanText(source.setsLabel) } : {}),
    reps: cleanText(source.reps) || cleanText(fallback.reps) || "8-12",
    focus: cleanText(source.focus) || cleanText(fallback.focus) || "Custom",
  };
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanId(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function clampInteger(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, number));
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createUniqueExerciseId(name) {
  const base = slugify(name) || "custom-exercise";
  const used = new Set([
    ...getExerciseCatalog().map((exercise) => exercise.id),
    ...Object.keys(state.notes || {}),
    ...Object.keys(state.lastByExercise || {}),
  ]);
  if (!used.has(base)) {
    return base;
  }
  let index = 2;
  while (used.has(`${base}-${index}`)) {
    index += 1;
  }
  return `${base}-${index}`;
}

function createSlotId(id) {
  const suffix = crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  return `${id}__${suffix}`;
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

async function syncNow(showSuccessToast, options = {}) {
  if (!currentUser || !supabase || previewMode) {
    return;
  }
  if (syncInFlight) {
    syncQueued = true;
    return;
  }
  syncInFlight = true;
  window.clearTimeout(saveTimer);
  setSyncStatus("Syncing");

  try {
    const { data: remoteRecord, error: fetchError } = await fetchRemoteStateRecord();
    if (fetchError) {
      cacheState(true);
      setSyncStatus("Will retry");
      if (showSuccessToast) {
        showToast(fetchError.message);
      }
      return;
    }

    let nextState = normalizeState(state);
    let didMerge = false;
    const remoteState = remoteRecord?.state ? normalizeState(remoteRecord.state) : null;
    const remoteUpdatedAt = remoteRecord?.updated_at || remoteState?.updatedAt || null;
    const remoteChangedSinceLoad =
      remoteState &&
      (!lastCloudUpdatedAt || getTimestamp(remoteUpdatedAt) > getTimestamp(lastCloudUpdatedAt) + REMOTE_CONFLICT_SKEW_MS);

    if (remoteChangedSinceLoad && !options.forceReplace) {
      saveStateSnapshot("local-before-merge", nextState);
      saveStateSnapshot("cloud-before-merge", remoteState);
      nextState = mergeStates(remoteState, nextState, lastLoadedState);
      didMerge = true;
      state = nextState;
      setSyncStatus("Merging");
      render();
    }

    if (remoteState && !options.skipHistory) {
      nextState = addSyncHistoryEntry(nextState, remoteState, options.historyLabel || "Before sync");
    }

    const { data: savedRecord, error: saveError } = await supabase
      .from("workout_state")
      .upsert({ user_id: currentUser.id, state: nextState }, { onConflict: "user_id" })
      .select("updated_at")
      .single();

    if (saveError) {
      cacheState(true);
      setSyncStatus("Will retry");
      if (showSuccessToast) {
        showToast(saveError.message);
      }
      return;
    }

    state = nextState;
    lastCloudUpdatedAt = savedRecord?.updated_at || new Date().toISOString();
    lastLoadedState = cloneState(state);
    cacheState(false);
    setSyncStatus("Synced");
    setDraftStatus("Synced");
    if (showSuccessToast) {
      showToast(didMerge ? "Merged and synced to cloud." : "Synced to cloud.");
    }
  } finally {
    syncInFlight = false;
    if (syncQueued) {
      syncQueued = false;
      scheduleSync();
    }
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
      cloudUpdatedAt: lastCloudUpdatedAt,
      baseState: pending && lastLoadedState ? lastLoadedState : null,
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

async function fetchRemoteStateRecord() {
  return supabase.from("workout_state").select("state, updated_at").eq("user_id", currentUser.id).maybeSingle();
}

async function refreshFromCloudIfSafe() {
  if (!currentUser || !supabase || previewMode || syncInFlight) {
    return;
  }
  const cached = getCachedRecord();
  if (cached?.pending) {
    return;
  }
  const { data, error } = await fetchRemoteStateRecord();
  if (error || !data) {
    return;
  }
  const remoteUpdatedAt = data.updated_at || data.state?.updatedAt || null;
  if (lastCloudUpdatedAt && getTimestamp(remoteUpdatedAt) <= getTimestamp(lastCloudUpdatedAt) + REMOTE_CONFLICT_SKEW_MS) {
    return;
  }
  state = normalizeState(data.state);
  lastCloudUpdatedAt = remoteUpdatedAt;
  lastLoadedState = cloneState(state);
  cacheState(false);
  setSyncStatus("Synced");
  render();
}

async function restoreSyncAtIndex(index) {
  await restoreFromHistoryStack({
    sourceKey: "syncHistory",
    targetKey: "redoHistory",
    sourceIndex: index,
    emptyMessage: "No previous sync saved yet.",
    confirmMessage: `Restore sync point ${index + 1}? Your current state moves to Redo.`,
    targetLabel: "Before restore",
    status: "Previous sync restored",
  });
}

async function redoRestoredSync() {
  await restoreFromHistoryStack({
    sourceKey: "redoHistory",
    targetKey: "syncHistory",
    sourceIndex: 0,
    emptyMessage: "No redo restore available.",
    confirmMessage: "Redo the restored state? Your current state moves back to restore history.",
    targetLabel: "Before redo",
    status: "Redo restored",
  });
}

async function restoreFromHistoryStack({ sourceKey, targetKey, sourceIndex = 0, emptyMessage, confirmMessage, targetLabel, status }) {
  const source = normalizeSyncHistory(state[sourceKey]);
  const entry = source[sourceIndex];
  if (!entry) {
    showToast(emptyMessage);
    renderRestoreControls();
    return;
  }
  if (!window.confirm(`${confirmMessage}\n\nRestore point: ${formatHistoryDate(entry.savedAt)}`)) {
    return;
  }

  const currentSnapshot = stripRestoreHistory(state);
  const restored = normalizeState(entry.state);
  restored[sourceKey] = source.filter((_, index) => index !== sourceIndex);
  restored[targetKey] = mergeSyncHistory(
    [
      {
        id: createSnapshotId(),
        label: targetLabel,
        savedAt: new Date().toISOString(),
        state: currentSnapshot,
      },
    ],
    state[targetKey],
  );
  restored.updatedAt = new Date().toISOString();

  state = restored;
  touchAndSave(status);
  render();
  await syncNow(true, { forceReplace: true, skipHistory: true });
  renderRestoreControls();
}

function mergeStates(remoteCandidate, localCandidate, baseCandidate) {
  const remote = normalizeState(remoteCandidate);
  const local = normalizeState(localCandidate);
  const base = baseCandidate ? normalizeState(baseCandidate) : null;
  const merged = {
    ...remote,
    version: Math.max(remote.version || 1, local.version || 1),
    updatedAt: new Date().toISOString(),
    currentCycleIndex: mergePrimitive(remote.currentCycleIndex, local.currentCycleIndex, base?.currentCycleIndex),
    programRevision: Math.max(remote.programRevision || 1, local.programRevision || 1, PROGRAM_TEMPLATE_VERSION),
    program: mergeProgram(remote.program, local.program, base?.program),
    notes: mergeNotes(remote.notes, local.notes, base?.notes),
    lastByExercise: mergeLastByExercise(remote.lastByExercise, local.lastByExercise),
    logs: mergeLogs(remote.logs, local.logs),
    drafts: mergeDrafts(remote.drafts, local.drafts, base?.drafts),
    settings: mergeSettings(remote.settings, local.settings, base?.settings),
    syncHistory: mergeSyncHistory(remote.syncHistory, local.syncHistory),
    redoHistory: mergeSyncHistory(remote.redoHistory, local.redoHistory),
  };
  return normalizeState(merged);
}

function mergeProgram(remoteProgram, localProgram, baseProgram) {
  if (!baseProgram) {
    return cloneProgram(remoteProgram || localProgram || DEFAULT_PROGRAM);
  }
  const localChanged = !sameJson(localProgram, baseProgram);
  const remoteChanged = !sameJson(remoteProgram, baseProgram);
  if (localChanged && !remoteChanged) {
    return cloneProgram(localProgram);
  }
  return cloneProgram(remoteProgram || localProgram || DEFAULT_PROGRAM);
}

function mergeSettings(remoteSettings = {}, localSettings = {}, baseSettings = {}) {
  const unit = mergePrimitive(remoteSettings.unit, localSettings.unit, baseSettings.unit);
  return { ...remoteSettings, ...localSettings, unit: ["lb", "kg"].includes(unit) ? unit : "lb" };
}

function addSyncHistoryEntry(currentCandidate, previousCandidate, label) {
  const next = normalizeState(currentCandidate);
  if (!isRestorableStateDifferent(previousCandidate, next)) {
    return next;
  }
  next.syncHistory = mergeSyncHistory(
    [
      {
        id: createSnapshotId(),
        label,
        savedAt: new Date().toISOString(),
        state: previousCandidate,
      },
    ],
    next.syncHistory,
  );
  next.redoHistory = [];
  return next;
}

function mergeSyncHistory(...historyLists) {
  const bySnapshot = new Map();
  historyLists.flat().forEach((entry) => {
    const normalized = normalizeSyncHistoryEntry(entry);
    if (!normalized) {
      return;
    }
    const signature = getRestorableStateSignature(normalized.state);
    const existing = bySnapshot.get(signature);
    if (!existing || getTimestamp(normalized.savedAt) > getTimestamp(existing.savedAt)) {
      bySnapshot.set(signature, normalized);
    }
  });
  return [...bySnapshot.values()].sort((a, b) => getTimestamp(b.savedAt) - getTimestamp(a.savedAt)).slice(0, SYNC_HISTORY_LIMIT);
}

function mergeNotes(remoteNotes = {}, localNotes = {}, baseNotes = {}) {
  const merged = {};
  const keys = new Set([...Object.keys(remoteNotes || {}), ...Object.keys(localNotes || {}), ...Object.keys(baseNotes || {})]);
  keys.forEach((key) => {
    const value = mergePrimitive(cleanText(remoteNotes?.[key]), cleanText(localNotes?.[key]), cleanText(baseNotes?.[key]));
    if (value) {
      merged[key] = value;
    }
  });
  return merged;
}

function mergeLastByExercise(remoteLast = {}, localLast = {}) {
  const merged = {};
  const keys = new Set([...Object.keys(remoteLast || {}), ...Object.keys(localLast || {})]);
  keys.forEach((key) => {
    const remoteEntry = remoteLast?.[key];
    const localEntry = localLast?.[key];
    if (!remoteEntry) {
      merged[key] = localEntry;
      return;
    }
    if (!localEntry) {
      merged[key] = remoteEntry;
      return;
    }
    merged[key] = getTimestamp(localEntry.date) >= getTimestamp(remoteEntry.date) ? localEntry : remoteEntry;
  });
  return merged;
}

function mergeLogs(remoteLogs = [], localLogs = []) {
  const byKey = new Map();
  [...remoteLogs, ...localLogs].forEach((log) => {
    if (!isObject(log)) {
      return;
    }
    const key = getLogMergeKey(log);
    const existing = byKey.get(key);
    if (!existing || getTimestamp(log.date) >= getTimestamp(existing.date)) {
      byKey.set(key, log);
    }
  });
  return [...byKey.values()].sort((a, b) => getTimestamp(b.date) - getTimestamp(a.date)).slice(0, 120);
}

function getLogMergeKey(log) {
  return cleanText(log.id) || `${cleanText(log.date)}:${cleanText(log.dayTitle)}:${JSON.stringify(log.entries || [])}`;
}

function mergeDrafts(remoteDrafts = {}, localDrafts = {}, baseDrafts = {}) {
  const merged = {};
  const dayKeys = new Set([...Object.keys(remoteDrafts || {}), ...Object.keys(localDrafts || {}), ...Object.keys(baseDrafts || {})]);
  dayKeys.forEach((dayKey) => {
    const remoteDay = isObject(remoteDrafts?.[dayKey]) ? remoteDrafts[dayKey] : {};
    const localDay = isObject(localDrafts?.[dayKey]) ? localDrafts[dayKey] : {};
    const baseDay = isObject(baseDrafts?.[dayKey]) ? baseDrafts[dayKey] : {};
    const exercises = mergeDraftExercises(remoteDay.exercises, localDay.exercises, baseDay.exercises);
    if (Object.keys(exercises).length) {
      merged[dayKey] = {
        updatedAt: newestIsoDate(remoteDay.updatedAt, localDay.updatedAt, baseDay.updatedAt),
        exercises,
      };
    }
  });
  return merged;
}

function mergeDraftExercises(remoteExercises = {}, localExercises = {}, baseExercises = {}) {
  const merged = {};
  const exerciseKeys = new Set([
    ...Object.keys(remoteExercises || {}),
    ...Object.keys(localExercises || {}),
    ...Object.keys(baseExercises || {}),
  ]);
  exerciseKeys.forEach((exerciseKey) => {
    const remoteSets = Array.isArray(remoteExercises?.[exerciseKey]) ? remoteExercises[exerciseKey] : [];
    const localSets = Array.isArray(localExercises?.[exerciseKey]) ? localExercises[exerciseKey] : [];
    const baseSets = Array.isArray(baseExercises?.[exerciseKey]) ? baseExercises[exerciseKey] : [];
    const length = Math.max(remoteSets.length, localSets.length, baseSets.length);
    const sets = [];
    for (let index = 0; index < length; index += 1) {
      sets.push(mergeDraftSet(remoteSets[index], localSets[index], baseSets[index]));
    }
    if (sets.some(hasSetValue)) {
      merged[exerciseKey] = sets;
    }
  });
  return merged;
}

function mergeDraftSet(remoteSet, localSet, baseSet) {
  const remote = normalizeSet(remoteSet);
  const local = normalizeSet(localSet);
  const base = normalizeSet(baseSet);
  return {
    weight: mergePrimitive(remote.weight, local.weight, base.weight),
    reps: mergePrimitive(remote.reps, local.reps, base.reps),
    done: mergePrimitive(remote.done, local.done, base.done),
  };
}

function hasSetValue(set) {
  return Boolean(cleanText(set.weight) || cleanText(set.reps) || set.done);
}

function mergePrimitive(remoteValue, localValue, baseValue) {
  const remoteChanged = !samePrimitive(remoteValue, baseValue);
  const localChanged = !samePrimitive(localValue, baseValue);
  if (localChanged && !remoteChanged) {
    return localValue;
  }
  if (remoteChanged && !localChanged) {
    return remoteValue;
  }
  if (localChanged && remoteChanged) {
    return hasUsefulValue(localValue) ? localValue : remoteValue;
  }
  return hasUsefulValue(localValue) ? localValue : remoteValue;
}

function samePrimitive(first, second) {
  return normalizePrimitive(first) === normalizePrimitive(second);
}

function normalizePrimitive(value) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (value == null) {
    return "";
  }
  return String(value).trim();
}

function hasUsefulValue(value) {
  return typeof value === "boolean" ? value : normalizePrimitive(value) !== "";
}

function sameJson(first, second) {
  return JSON.stringify(first || null) === JSON.stringify(second || null);
}

function stripRestoreHistory(candidate) {
  const snapshot = cloneState(candidate || {});
  delete snapshot.syncHistory;
  delete snapshot.redoHistory;
  return snapshot;
}

function isRestorableStateDifferent(first, second) {
  return getRestorableStateSignature(first) !== getRestorableStateSignature(second);
}

function getRestorableStateSignature(candidate) {
  const snapshot = stripRestoreHistory(candidate);
  delete snapshot.updatedAt;
  return JSON.stringify(snapshot);
}

function newestIsoDate(...values) {
  const newest = values.reduce((max, value) => Math.max(max, getTimestamp(value)), 0);
  return newest ? new Date(newest).toISOString() : null;
}

function formatHistoryDate(value) {
  const timestamp = getTimestamp(value);
  return timestamp ? fullDate.format(new Date(timestamp)) : "unknown time";
}

function formatRestorePointDate(value) {
  const timestamp = getTimestamp(value);
  if (!timestamp) {
    return { date: "Unknown", time: "--" };
  }
  const date = new Date(timestamp);
  return {
    date: restoreDate.format(date),
    time: restoreTime.format(date),
  };
}

function getTimestamp(value) {
  const timestamp = new Date(value || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function createSnapshotId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function saveStateSnapshot(label, snapshotState) {
  if (!currentUser) {
    return;
  }
  try {
    const key = getSnapshotKey();
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const snapshots = Array.isArray(existing) ? existing : [];
    snapshots.unshift({
      label,
      savedAt: new Date().toISOString(),
      state: cloneState(snapshotState),
    });
    localStorage.setItem(key, JSON.stringify(snapshots.slice(0, SNAPSHOT_LIMIT)));
  } catch {
    // Snapshots are best-effort safety copies.
  }
}

function getSnapshotKey() {
  return `${getCacheKey()}:snapshots`;
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
  renderRestoreControls();
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
    await syncNow(true, { forceReplace: true });
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
  await syncNow(true, { forceReplace: true, skipHistory: true });
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
