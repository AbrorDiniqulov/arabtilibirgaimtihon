let essays = [];
let index = 0;
let timer = null;
let timeLeft = 0;

/* ================= LOAD TASKS ================= */
function loadTasks() {
  const raw = localStorage.getItem("writingTasks");

  try {
    const allTasks = JSON.parse(raw) || [];

    return allTasks
      .filter(t => t && t.active)
      .sort((a, b) => {
        const order = { easy: 1, medium: 2, hard: 3 };
        return (order[a.level] || 99) - (order[b.level] || 99);
      });

  } catch {
    return [];
  }
}

let tasks = loadTasks();

/* ================= START ================= */
function start() {

  tasks = loadTasks();

  if (!tasks.length) {
    alert("Aktiv writing task yo‘q!");
    return;
  }

  document.getElementById("startScreen").style.display = "none";
  document.getElementById("writingScreen").style.display = "flex";

  essays = [];
  index = 0;

  /* 🔥 examAnswers writing reset */
  let exam = JSON.parse(localStorage.getItem("examAnswers") || "{}");
  exam.writing = [];
  localStorage.setItem("examAnswers", JSON.stringify(exam));

  showTask();
}

/* ================= SHOW TASK ================= */
function showTask() {

  if (!tasks[index]) {
    finish();
    return;
  }

  const t = tasks[index];

  document.getElementById("topic").innerHTML = `
    <div class="topic-main">${clean(t.topic)}</div>
    <div class="topic-task">${clean(t.task)}</div>
    <div class="topic-level">
      Level: <b>${clean(String(t.level).toUpperCase())}</b>
    </div>
  `;

  document.getElementById("essay").value = "";

  startTimer(t);
}

/* ================= TIMER ================= */
function startTimer(task) {

  clearInterval(timer);

  timeLeft = (Number(task.time) || 1) * 60;

  updateTimerUI();

  timer = setInterval(() => {

    timeLeft--;
    updateTimerUI();

    if (timeLeft <= 0) {
      clearInterval(timer);
      nextEssay();
    }

  }, 1000);
}

/* ================= TIMER UI ================= */
function updateTimerUI() {

  const el = document.getElementById("status");
  if (!el) return;

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;

  el.innerText = `Qolgan vaqt: ${pad(m)}:${pad(s)}`;
}

/* ================= NEXT ESSAY ================= */
function nextEssay() {

  if (!tasks[index]) {
    finish();
    return;
  }

  const answer = document.getElementById("essay").value;

  const essayObj = {
    question: clean(tasks[index].topic),
    task: clean(tasks[index].task),
    level: clean(tasks[index].level),
    answer: clean(answer)
  };

  /* local array */
  essays.push(essayObj);

  /* 🔥 GLOBAL STORAGE (DOWNLOAD.JS UCHUN) */
  let exam = JSON.parse(localStorage.getItem("examAnswers") || "{}");

  if (!Array.isArray(exam.writing)) {
    exam.writing = [];
  }

  exam.writing = essays;

  localStorage.setItem("examAnswers", JSON.stringify(exam));

  index++;

  if (index >= tasks.length) {
    finish();
    return;
  }

  showTask();
}

/* ================= FINISH ================= */
function finish() {

  clearInterval(timer);

  if (typeof showFinish === "function") {
    showFinish("writingScreen", "Yozish qismi tugadi");
  }
}

/* ================= HELPERS ================= */
function clean(v) {
  if (v === undefined || v === null || v === "") return "—";
  return v;
}

function pad(n) {
  return String(n).padStart(2, "0");
}