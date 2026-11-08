import { test } from "node:test";
import assert from "node:assert/strict";
import { gradeDiagnostic, gradeQuiz, gradeGame, publicContent, scrambleHierarchy, quizList, thaiTimestamp } from "./grading.js";

test("diagnostic scores per unit and ignores junk answers", () => {
  const qs = [
    { id: "D1", unitId: 1, answer: 2, explanation: "x" },
    { id: "D2", unitId: 2, answer: 0, explanation: "y" },
    { id: "D3", unitId: 2, answer: 1, explanation: "z" }
  ];
  const r = gradeDiagnostic(qs, { D1: 2, D2: 0, D3: "1", evil: 3 });
  assert.equal(r.diagnostic.totalScore, 2);
  assert.deepEqual(r.diagnostic.unitScores, { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0 });
  assert.deepEqual(r.diagnostic.answers, { D1: 2, D2: 0 });
});

test("posttest uses the reversed list", () => {
  const quizzes = { 1: [{ ans: 0 }, { ans: 1 }, { ans: 2 }] };
  const list = quizList(quizzes, 1, "posttest");
  assert.equal(gradeQuiz(list, [2, 1, 0]).score, 3);
  assert.equal(gradeQuiz(quizList(quizzes, 1, "pretest"), [2, 1, 0]).score, 1);
});

test("unit-1 game: scramble matches original [2,1,4,3,6,5] and full marks when solved", () => {
  const items = [1, 2, 3, 4, 5, 6].map((rank) => ({ rank, name: "n" + rank }));
  assert.deepEqual(scrambleHierarchy(items).map((i) => i.rank), [2, 1, 4, 3, 6, 5]);
  const mg = { hierarchyItems: items, historyScenarios: [{ answer: "a" }, { answer: "b" }] };
  assert.equal(gradeGame(mg, { order: items.map((i) => i.name), hist: { 0: "a", 1: "b" } }).gameScore, 100);
  assert.equal(gradeGame(mg, { order: [], hist: { 0: "a" } }).gameScore, 13);
});

test("case game percent", () => {
  const mg = { cases: [{ correct: 1 }, { correct: 0 }, { correct: 2 }, { correct: 3 }] };
  assert.equal(gradeGame(mg, { answers: { 0: 1, 1: 0, 2: 0 } }).gameScore, 50);
});

test("student content has no answers", () => {
  const c = {
    units: [], bibliography: [],
    diagnostic: [{ id: "D1", answer: 1, explanation: "e", question: "q" }],
    quizzes: { 1: [{ q: "q", ans: 1, exp: "e" }] },
    minigames: { 1: { hierarchyItems: [{ rank: 1, name: "a" }], historyScenarios: [{ prompt: "p", answer: "x" }] }, 2: { cases: [{ correct: 1, reason: "r" }] } }
  };
  const s = JSON.stringify(publicContent(c, false));
  for (const k of ['"answer"', '"ans"', '"exp"', '"explanation"', '"correct"', '"reason"', '"rank"']) assert.ok(!s.includes(k), k);
  assert.ok(JSON.stringify(publicContent(c, true)).includes('"rank"'));
});

test("thai timestamp format", () => {
  assert.match(thaiTimestamp(new Date("2026-11-07T08:30:00Z")), /^2569-11-07 15:30$/);
});
