import test from "node:test";
import assert from "node:assert/strict";
import {
  createProgress, getLevel, getManilaDate, getManilaDay, getQuestForDate,
  completeQuest, validateProgress, getCurrentStreak, QUESTS
} from "./progression.mjs";

test("level thresholds increase by 50 EXP each level", () => {
  assert.deepEqual(getLevel(0), { level: 1, currentExp: 0, requiredExp: 100, remainingExp: 100 });
  assert.equal(getLevel(99).level, 1);
  assert.deepEqual(getLevel(100), { level: 2, currentExp: 0, requiredExp: 150, remainingExp: 150 });
  assert.deepEqual(getLevel(249), { level: 2, currentExp: 149, requiredExp: 150, remainingExp: 1 });
  assert.deepEqual(getLevel(250), { level: 3, currentExp: 0, requiredExp: 200, remainingExp: 200 });
  assert.equal(getLevel(450).level, 4);
});

test("quest schedule uses the Asia/Manila calendar day", () => {
  const beforeMidnightManila = new Date("2026-01-04T15:59:00Z");
  const afterMidnightManila = new Date("2026-01-04T16:01:00Z");
  assert.equal(getManilaDate(beforeMidnightManila), "2026-01-04");
  assert.equal(getManilaDate(afterMidnightManila), "2026-01-05");
  assert.equal(getManilaDay(beforeMidnightManila), "Sunday");
  assert.equal(getManilaDay(afterMidnightManila), "Monday");
  assert.equal(getQuestForDate(afterMidnightManila).day, "Monday");
});

test("a daily quest can award EXP only once per Manila date", () => {
  const quest = QUESTS.find((item) => item.day === "Monday");
  const first = completeQuest(createProgress(), "2026-01-05", quest);
  const second = completeQuest(first.progress, "2026-01-05", quest);
  assert.equal(first.completed, true);
  assert.equal(first.progress.totalExp, 30);
  assert.equal(second.completed, false);
  assert.equal(second.progress.totalExp, 30);
  assert.equal(second.progress.history.length, 1);
});

test("progress survives JSON serialization and rejects inconsistent imports", () => {
  const quest = QUESTS.find((item) => item.day === "Wednesday");
  const saved = completeQuest(createProgress(), "2026-01-07", quest).progress;
  const restored = JSON.parse(JSON.stringify(saved));
  assert.equal(validateProgress(restored), true);
  assert.deepEqual(restored, saved);
  assert.equal(validateProgress({ ...restored, totalExp: restored.totalExp + 1 }), false);
  assert.equal(validateProgress({ ...restored, history: [...restored.history, ...restored.history] }), false);
  assert.equal(validateProgress({ ...restored, history: [{ ...restored.history[0], date: "2026-02-31" }] }), false);
});

test("recovery quests give less EXP than regular strength quests", () => {
  assert.ok(QUESTS.find((quest) => quest.day === "Sunday").reward <
    QUESTS.find((quest) => quest.day === "Monday").reward);
});

test("streak only counts consecutive completed calendar days", () => {
  const history = [
    { date: "2026-01-05" }, { date: "2026-01-04" }, { date: "2026-01-02" }
  ];
  assert.equal(getCurrentStreak(history, "2026-01-05"), 2);
  assert.equal(getCurrentStreak(history, "2026-01-06"), 2);
  assert.equal(getCurrentStreak([], "2026-01-05"), 0);
});
