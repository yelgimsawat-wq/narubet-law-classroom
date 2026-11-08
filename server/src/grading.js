// Scoring rules ported from the original app.js; answers never leave the server for students.
export const CLASSES = Array.from({ length: 16 }, (_, i) => `ม.6/${i + 1}`);
export const UNIT_IDS = [1, 2, 3, 4, 5];

export function emptyProgress() {
  return {
    diagnostic: {
      completed: false,
      timestamp: "ยังไม่ได้ทำแบบประเมิน",
      totalScore: 0,
      unitScores: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      answers: {}
    },
    unitProgress: Object.fromEntries(UNIT_IDS.map((u) => [u, { preScore: null, postScore: null, gameScore: null }]))
  };
}

// "2569-11-07 15:04" (Buddhist year, Bangkok time) like the original
export function thaiTimestamp(date = new Date()) {
  const s = date.toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).slice(0, 16);
  return `${Number(s.slice(0, 4)) + 543}${s.slice(4)}`;
}

// Original start order for the unit-1 ranking game was ranks [2,1,4,3,6,5]: swap each adjacent pair.
export function scrambleHierarchy(items) {
  const sorted = [...items].sort((a, b) => a.rank - b.rank);
  const out = [];
  for (let i = 0; i < sorted.length; i += 2) out.push(...[sorted[i + 1], sorted[i]].filter(Boolean));
  return out;
}

export function quizList(quizzes, unitId, mode) {
  const raw = quizzes[unitId] || [];
  return mode === "posttest" ? raw.slice().reverse() : raw;
}

// Content as served to the client: hierarchy pre-scrambled, answers removed unless teacher.
export function publicContent(c, isTeacher) {
  const minigames = Object.fromEntries(
    Object.entries(c.minigames || {}).map(([k, m]) => {
      const out = { ...m };
      if (m.hierarchyItems) out.hierarchyItems = scrambleHierarchy(m.hierarchyItems).map(({ rank, ...x }) => (isTeacher ? { rank, ...x } : x));
      if (!isTeacher) {
        if (m.cases) out.cases = m.cases.map(({ correct, reason, ...x }) => x);
        if (m.historyScenarios) out.historyScenarios = m.historyScenarios.map(({ answer, ...x }) => x);
      }
      return [k, out];
    })
  );
  if (isTeacher) return { ...c, minigames };
  return {
    units: c.units,
    bibliography: c.bibliography,
    diagnostic: (c.diagnostic || []).map(({ answer, explanation, ...q }) => q),
    quizzes: Object.fromEntries(Object.entries(c.quizzes || {}).map(([k, l]) => [k, l.map(({ ans, exp, ...q }) => q)])),
    minigames
  };
}

const pick = (v) => (Number.isInteger(v) && v >= 0 && v <= 9 ? v : null);

export function gradeDiagnostic(questions, answers = {}) {
  const unitScores = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const clean = {};
  let totalScore = 0;
  for (const q of questions) {
    const a = pick(answers[q.id]);
    if (a !== null) clean[q.id] = a;
    if (a === q.answer) {
      totalScore++;
      unitScores[q.unitId] = (unitScores[q.unitId] || 0) + 1;
    }
  }
  return {
    diagnostic: { completed: true, timestamp: thaiTimestamp(), totalScore, unitScores, answers: clean },
    key: Object.fromEntries(questions.map((q) => [q.id, { answer: q.answer, explanation: q.explanation }]))
  };
}

export function gradeQuiz(list, answers = []) {
  let score = 0;
  list.forEach((q, i) => {
    if (pick(answers[i]) === q.ans) score++;
  });
  return { score, key: list.map((q) => ({ answer: q.ans, explanation: q.exp })) };
}

export function gradeGame(mg, body = {}) {
  if (mg.hierarchyItems) {
    const sorted = [...mg.hierarchyItems].sort((a, b) => a.rank - b.rank);
    const order = Array.isArray(body.order) ? body.order : [];
    const hist = body.hist || {};
    let correct = 0;
    sorted.forEach((item, i) => {
      if (order[i] === item.name) correct++;
    });
    mg.historyScenarios.forEach((sc, i) => {
      if (hist[i] === sc.answer) correct++;
    });
    const total = sorted.length + mg.historyScenarios.length;
    return {
      gameScore: Math.round((correct / Math.max(1, total)) * 100),
      key: { order: sorted.map((h) => h.name), hist: mg.historyScenarios.map((s) => s.answer) }
    };
  }
  const cases = mg.cases || [];
  const answers = body.answers || {};
  const right = cases.filter((c, i) => pick(answers[i]) === c.correct).length;
  return {
    gameScore: Math.round((right / Math.max(1, cases.length)) * 100),
    key: cases.map((c) => ({ answer: c.correct, explanation: c.reason }))
  };
}
