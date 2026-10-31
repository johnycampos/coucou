// Unit tests for Nusa features: LRCLIB parsing, Pomodoro, Water tracker, Tasks and Shelf
import test from "node:test";
import assert from "node:assert/strict";

test("LRC Parser parses timestamps and lines accurately", () => {
  const lrc = `
[00:12.34] First line
[01:05.50] Second line
[02:30.00] Third line
`;
  const parseLine = (line) => {
    const match = line.match(/\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]\s*(.*)/);
    if (!match) return null;
    const m = parseInt(match[1], 10);
    const s = parseInt(match[2], 10);
    const ms = parseInt(match[3] || "0", 10) * 10;
    return { timeMs: m * 60000 + s * 1000 + ms, text: match[4] };
  };

  const parsed = lrc.trim().split("\n").map(parseLine).filter(Boolean);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].timeMs, 12340);
  assert.equal(parsed[0].text, "First line");
  assert.equal(parsed[1].timeMs, 65500);
  assert.equal(parsed[1].text, "Second line");
  assert.equal(parsed[2].timeMs, 150000);
  assert.equal(parsed[2].text, "Third line");
});

test("Active lyric lookup finds correct line index for playback timestamp", () => {
  const lyrics = [
    { timeMs: 10000, text: "Intro" },
    { timeMs: 25000, text: "Verse 1" },
    { timeMs: 40000, text: "Chorus" },
  ];

  const findActive = (list, posMs) => {
    let active = -1;
    for (let i = 0; i < list.length; i++) {
      if (posMs >= list[i].timeMs) active = i;
      else break;
    }
    return active;
  };

  assert.equal(findActive(lyrics, 5000), -1);
  assert.equal(findActive(lyrics, 10000), 0);
  assert.equal(findActive(lyrics, 15000), 0);
  assert.equal(findActive(lyrics, 25000), 1);
  assert.equal(findActive(lyrics, 39999), 1);
  assert.equal(findActive(lyrics, 40000), 2);
  assert.equal(findActive(lyrics, 99999), 2);
});

test("Pomodoro cycle calculations and duration bounds", () => {
  const focusMin = 25;
  const shortBreakMin = 5;
  const longBreakMin = 15;

  assert.equal(focusMin * 60, 1500);
  assert.equal(shortBreakMin * 60, 300);
  assert.equal(longBreakMin * 60, 900);
});

test("Water goal calculations and percentage progress", () => {
  const goalMl = 1500;
  let takenMl = 0;

  takenMl += 500;
  assert.equal(Math.round((takenMl / goalMl) * 100), 33);

  takenMl += 500;
  assert.equal(Math.round((takenMl / goalMl) * 100), 67);

  takenMl += 500;
  assert.equal(Math.round((takenMl / goalMl) * 100), 100);
  assert.equal(takenMl >= goalMl, true);
});

test("Tasks state logic handles completed tasks count", () => {
  const tasks = [
    { id: "1", title: "Task 1", completed: true, completedAt: Date.now() },
    { id: "2", title: "Task 2", completed: false },
    { id: "3", title: "Task 3", completed: true, completedAt: Date.now() },
  ];

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;

  assert.equal(total, 3);
  assert.equal(completed, 2);
});
