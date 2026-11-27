export const STORAGE_KEY = "daily-quest-progress-v1";
export const TIME_ZONE = "Asia/Manila";

export const QUESTS = [
  {
    day: "Sunday", title: "Full rest & recovery", reward: 10,
    description: "Let your body recover. Today is a full rest day; movement is optional and should feel easy.",
    exercises: [{ name: "Rest", detail: "Take the day off from training. Gentle breathing or an easy stretch is optional." }],
    rest: "No workout needed. Prioritize sleep, hydration, and a comfortable pace."
  },
  {
    day: "Monday", title: "Upper body foundations", reward: 30,
    description: "A calm, controlled introduction to upper-body strength using your bodyweight and a light dumbbell.",
    exercises: [
      { name: "Incline push-ups", detail: "2 sets × 6–10 reps · Hands on a stable bench" },
      { name: "Seated dumbbell shoulder press", detail: "2 sets × 8 reps · 10 lb or lighter, each rep controlled" },
      { name: "One-arm dumbbell row", detail: "2 sets × 8 reps each side · Support yourself on the bench" }
    ],
    rest: "Rest 60–90 seconds between sets. Stop each set with a few comfortable reps left."
  },
  {
    day: "Tuesday", title: "Core control", reward: 30,
    description: "Practice steady breathing and gentle trunk strength. Keep each movement smooth, not strained.",
    exercises: [
      { name: "Dead bug", detail: "2 sets × 6 reps each side · Move only as far as comfortable" },
      { name: "Bird dog", detail: "2 sets × 6 reps each side · Pause briefly, keep your balance" },
      { name: "Knee plank", detail: "2 holds × 15–20 seconds · Optional; stop before your form slips" }
    ],
    rest: "Rest 45–60 seconds between sets. Breathe naturally; don't hold your breath."
  },
  {
    day: "Wednesday", title: "Walk & mobility", reward: 15,
    description: "A light recovery day to loosen up. Keep the walk conversational and the mobility gentle.",
    exercises: [
      { name: "Easy walk", detail: "10–20 minutes · Indoors or outdoors, at a relaxed pace" },
      { name: "Shoulder circles", detail: "1 minute · Small, comfortable circles in each direction" },
      { name: "Standing hip hinges", detail: "1 set × 8 reps · Slow and pain-free range only" }
    ],
    rest: "Take breaks or shorten the walk whenever you like. This should leave you feeling refreshed."
  },
  {
    day: "Thursday", title: "Upper body foundations", reward: 30,
    description: "Repeat a familiar strength session. Use a wall or higher incline for easier push-ups if needed.",
    exercises: [
      { name: "Incline push-ups", detail: "2 sets × 6–10 reps · Hands on a stable bench or wall" },
      { name: "Seated dumbbell shoulder press", detail: "2 sets × 8 reps · Use a lighter load or skip if uncomfortable" },
      { name: "One-arm dumbbell row", detail: "2 sets × 8 reps each side · Support yourself on the bench" }
    ],
    rest: "Rest 60–90 seconds between sets. Comfortable, controlled reps are the goal."
  },
  {
    day: "Friday", title: "Core & easy cardio", reward: 25,
    description: "A low-pressure core session with a little easy movement. Scale or skip anything you don't enjoy.",
    exercises: [
      { name: "Dead bug", detail: "2 sets × 6 reps each side · Slow and steady" },
      { name: "Glute bridge", detail: "2 sets × 8 reps · Pause gently at the top" },
      { name: "Easy march in place", detail: "5–10 minutes · Comfortable pace; take breaks as needed" }
    ],
    rest: "Rest 45–60 seconds between sets, and pause the march whenever you need to."
  },
  {
    day: "Saturday", title: "Choose gentle movement", reward: 15,
    description: "Mild activity of your choice. Keep it enjoyable and easy enough to talk comfortably.",
    exercises: [
      { name: "Pick one easy activity", detail: "10–20 minutes · A relaxed walk, gentle stretching, or light movement" },
      { name: "Optional mobility", detail: "Up to 5 minutes · Choose comfortable movements only" }
    ],
    rest: "No sets to push through. Pause, shorten, or skip this session if you need extra rest."
  }
];

export function getManilaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function getManilaDay(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, weekday: "long" }).format(date);
}

export function getQuestForDate(date = new Date()) {
  return QUESTS.find((quest) => quest.day === getManilaDay(date));
}

export function getLevel(totalExp) {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalExp));
  let requirement = 100;
  while (remaining >= requirement) {
    remaining -= requirement;
    level += 1;
    requirement += 50;
  }
  return { level, currentExp: remaining, requiredExp: requirement, remainingExp: requirement - remaining };
}

export function createProgress() {
  return { version: 1, totalExp: 0, history: [] };
}

export function validateProgress(value) {
  if (!value || value.version !== 1 || !Number.isSafeInteger(value.totalExp) ||
      value.totalExp < 0 || !Array.isArray(value.history)) return false;
  const dates = new Set();
  for (const entry of value.history) {
    const date = typeof entry?.date === "string" ? new Date(`${entry.date}T00:00:00Z`) : null;
    if (!entry || typeof entry.date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || dates.has(entry.date) ||
        Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== entry.date ||
        typeof entry.title !== "string" || !Number.isSafeInteger(entry.reward) ||
        entry.reward < 0 || !QUESTS.some((quest) => quest.title === entry.title && quest.reward === entry.reward)) {
      return false;
    }
    dates.add(entry.date);
  }
  return value.history.reduce((sum, entry) => sum + entry.reward, 0) === value.totalExp;
}

export function completeQuest(progress, date, quest) {
  if (progress.history.some((entry) => entry.date === date)) {
    return { progress, completed: false };
  }
  const next = {
    version: 1,
    totalExp: progress.totalExp + quest.reward,
    history: [{ date, title: quest.title, reward: quest.reward }, ...progress.history]
  };
  return { progress: next, completed: true };
}

export function getCurrentStreak(history, today = getManilaDate()) {
  const cleared = new Set(history.map((entry) => entry.date));
  const cursor = new Date(`${today}T12:00:00Z`);
  if (!cleared.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (cleared.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
