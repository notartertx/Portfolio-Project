import {
  STORAGE_KEY, getManilaDate, getManilaDay, getQuestForDate,
  getLevel, createProgress, validateProgress, completeQuest, getCurrentStreak
} from "./progression.mjs";

const $ = (selector) => document.querySelector(selector);
const views = ["status", "quest", "history", "settings"];
let progress = loadProgress();
let toastTimer;

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (validateProgress(saved)) return saved;
  } catch { /* Start clean if saved data is malformed or unavailable. */ }
  return createProgress();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    showToast("Couldn't save. Check available device storage.");
    return false;
  }
}

function formatDate(dateString, options = { month: "short", day: "numeric", year: "numeric" }) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function escapeText(value) {
  const element = document.createElement("span");
  element.textContent = value;
  return element.innerHTML;
}

function renderStatus() {
  const level = getLevel(progress.totalExp);
  $("#level-number").textContent = String(level.level).padStart(2, "0");
  $("#current-level-small").textContent = level.level;
  $("#total-exp").textContent = progress.totalExp;
  $("#exp-current").textContent = level.currentExp;
  $("#exp-required").textContent = level.requiredExp;
  $("#exp-remaining").textContent = level.remainingExp;
  $("#exp-fill").style.width = `${(level.currentExp / level.requiredExp) * 100}%`;
  $(".progress-track").setAttribute("aria-valuenow", Math.round((level.currentExp / level.requiredExp) * 100));
  $("#quests-count").textContent = progress.history.length;
  $("#streak-count").innerHTML = `${getCurrentStreak(progress.history)} <small>DAYS</small>`;
  const now = new Date();
  $("#today-label").textContent = formatDate(getManilaDate(now), { month: "short", day: "2-digit" }).toUpperCase();
  renderActivity($("#recent-activity"), progress.history.slice(0, 3));
}

function renderActivity(container, entries) {
  if (!entries.length) {
    container.innerHTML = '<p class="empty-state">No quests cleared yet. Your record starts when you complete your first quest.</p>';
    return;
  }
  container.innerHTML = entries.map((entry) => `
    <div class="activity-row">
      <span class="activity-marker" aria-hidden="true"></span>
      <div class="activity-detail"><strong>${escapeText(entry.title)}</strong><span>${formatDate(entry.date).toUpperCase()}</span></div>
      <span class="activity-reward">+${entry.reward} EXP</span>
    </div>`).join("");
}

function renderQuest() {
  const now = new Date();
  const quest = getQuestForDate(now);
  const date = getManilaDate(now);
  $("#quest-date").textContent = formatDate(date, { month: "short", day: "2-digit" }).toUpperCase();
  $("#day-tag").textContent = `${getManilaDay(now).toUpperCase()} / DAILY QUEST`;
  $("#quest-reward").textContent = quest.reward;
  $("#quest-name").textContent = quest.title;
  $("#quest-description").textContent = quest.description;
  $("#rest-guidance").textContent = quest.rest;
  $("#plan-count").textContent = `${String(quest.exercises.length).padStart(2, "0")} ITEMS`;
  $("#exercise-list").innerHTML = quest.exercises.map((exercise) => `
    <li><strong>${escapeText(exercise.name)}</strong><span>${escapeText(exercise.detail)}</span></li>`).join("");
  const completed = progress.history.some((entry) => entry.date === date);
  const button = $("#complete-quest");
  button.disabled = completed;
  button.querySelector("span:first-child").textContent = completed ? "QUEST COMPLETE" : "MARK QUEST COMPLETE";
  $("#quest-status").textContent = completed ? "DAILY REWARD ALREADY CLAIMED" : "";
}

function renderHistory() {
  const container = $("#history-list");
  if (!progress.history.length) {
    container.innerHTML = '<p class="empty-state">Your cleared quests will appear here. There are no previous workouts in this record.</p>';
    return;
  }
  container.innerHTML = progress.history.map((entry) => {
    const date = formatDate(entry.date, { month: "short", day: "numeric" }).split(" ");
    return `<article class="history-row">
      <div class="history-date">${date[1]}<span>${date[0].toUpperCase()}</span></div>
      <div class="history-detail"><strong>${escapeText(entry.title)}</strong><span>QUEST CLEARED</span></div>
      <span class="activity-reward">+${entry.reward} EXP</span>
    </article>`;
  }).join("");
}

function renderAll() {
  renderStatus();
  renderQuest();
  renderHistory();
}

function showView(name) {
  if (!views.includes(name)) return;
  for (const view of views) {
    const active = view === name;
    const section = $(`#${view}-view`);
    section.hidden = !active;
    section.classList.toggle("active", active);
    const nav = $(`.nav-item[data-view="${view}"]`);
    nav.classList.toggle("active", active);
    if (active) nav.setAttribute("aria-current", "page");
    else nav.removeAttribute("aria-current");
  }
  document.title = `DAILY QUEST — ${name === "status" ? "System Status" : name[0].toUpperCase() + name.slice(1)}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

$("#complete-quest").addEventListener("click", () => {
  const previous = progress;
  const result = completeQuest(progress, getManilaDate(), getQuestForDate());
  if (!result.completed) {
    renderQuest();
    showToast("Today's reward has already been claimed.");
    return;
  }
  progress = result.progress;
  if (persist()) {
    renderAll();
    showToast(`Quest cleared. +${getQuestForDate().reward} EXP`);
  } else {
    progress = previous;
    renderAll();
  }
});

$("#export-data").addEventListener("click", () => {
  const backup = new Blob([`${JSON.stringify(progress, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(backup);
  const link = document.createElement("a");
  link.href = url;
  link.download = `daily-quest-${getManilaDate()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Progress backup downloaded.");
});

$("#import-data").addEventListener("change", async (event) => {
  const [file] = event.target.files;
  event.target.value = "";
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!validateProgress(imported)) throw new Error("invalid");
    if (!window.confirm("Import this backup and replace the progress saved on this device?")) return;
    const previous = progress;
    progress = imported;
    if (!persist()) {
      progress = previous;
      return;
    }
    renderAll();
    showToast("Progress restored.");
  } catch {
    showToast("That file isn't a valid Daily Quest backup.");
  }
});

$("#reset-data").addEventListener("click", () => {
  if (!window.confirm("Reset all Daily Quest progress on this device? This cannot be undone. Export a backup first if you want to keep it.")) return;
  const previous = progress;
  progress = createProgress();
  if (!persist()) {
    progress = previous;
    return;
  }
  renderAll();
  showView("status");
  showToast("Player data reset.");
});

renderAll();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => showToast("Offline support couldn't start."));
  });
}
