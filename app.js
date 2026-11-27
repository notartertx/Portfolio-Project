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
  const streakCount = $("#streak-count");
  const daysLabel = document.createElement("small");
  daysLabel.textContent = "DAYS";
  streakCount.replaceChildren(document.createTextNode(`${getCurrentStreak(progress.history)} `), daysLabel);
  const now = new Date();
  $("#today-label").textContent = formatDate(getManilaDate(now), { month: "short", day: "2-digit" }).toUpperCase();
  renderActivity($("#recent-activity"), progress.history.slice(0, 3));
}

function renderActivity(container, entries) {
  container.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No quests cleared yet. Your record starts when you complete your first quest.";
    container.append(empty);
    return;
  }
  for (const entry of entries) {
    const row = document.createElement("div");
    row.className = "activity-row";
    const marker = document.createElement("span");
    marker.className = "activity-marker";
    marker.setAttribute("aria-hidden", "true");
    const detail = document.createElement("div");
    detail.className = "activity-detail";
    const title = document.createElement("strong");
    title.textContent = entry.title;
    const date = document.createElement("span");
    date.textContent = formatDate(entry.date).toUpperCase();
    detail.append(title, date);
    const reward = document.createElement("span");
    reward.className = "activity-reward";
    reward.textContent = `+${entry.reward} EXP`;
    row.append(marker, detail, reward);
    container.append(row);
  }
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
  const exerciseList = $("#exercise-list");
  exerciseList.replaceChildren();
  for (const exercise of quest.exercises) {
    const item = document.createElement("li");
    const name = document.createElement("strong");
    name.textContent = exercise.name;
    const detail = document.createElement("span");
    detail.textContent = exercise.detail;
    item.append(name, detail);
    exerciseList.append(item);
  }
  const completed = progress.history.some((entry) => entry.date === date);
  const button = $("#complete-quest");
  button.disabled = completed;
  button.querySelector("span:first-child").textContent = completed ? "QUEST COMPLETE" : "MARK QUEST COMPLETE";
  $("#quest-status").textContent = completed ? "DAILY REWARD ALREADY CLAIMED" : "";
}

function renderHistory() {
  const container = $("#history-list");
  container.replaceChildren();
  if (!progress.history.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Your cleared quests will appear here. There are no previous workouts in this record.";
    container.append(empty);
    return;
  }
  for (const entry of progress.history) {
    const date = formatDate(entry.date, { month: "short", day: "numeric" }).split(" ");
    const row = document.createElement("article");
    row.className = "history-row";
    const day = document.createElement("div");
    day.className = "history-date";
    day.append(document.createTextNode(date[1]));
    const month = document.createElement("span");
    month.textContent = date[0].toUpperCase();
    day.append(month);
    const detail = document.createElement("div");
    detail.className = "history-detail";
    const title = document.createElement("strong");
    title.textContent = entry.title;
    const status = document.createElement("span");
    status.textContent = "QUEST CLEARED";
    detail.append(title, status);
    const reward = document.createElement("span");
    reward.className = "activity-reward";
    reward.textContent = `+${entry.reward} EXP`;
    row.append(day, detail, reward);
    container.append(row);
  }
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
