let essays = [];
let index = 0;
let timer = null;
let timeLeft = 0;
let tasks = [];

/* ================= ADMIN PANELDAN SAVOLLARNI YUKLASH ================= */
async function loadTasks() {
  try {
    // Admin paneldan yozish savollarini yuklash
    const allTasks = await QuestionsDB.getQuestions('writing');
    console.log('Admin paneldan yozish savollari yuklandi:', allTasks.length);
    
    // Savollarni formatlash (admin format -> yozish format)
    tasks = allTasks
      .filter(t => t && t.active !== false)
      .map(t => {
        // Topic va task ni aniqlash
        let topic = t.topic || t.text || t.question || '';
        let task = t.task || t.description || t.subText || '';
        
        // Agar faqat bitta matn bo'lsa, uni topic qilib, task bo'sh qoldirish
        if (!task && topic) {
          task = topic;
          topic = 'Writing Task';
        }

        // Level ni aniqlash
        let level = t.level || t.difficulty || 'medium';
        
        // Time ni aniqlash (daqiqa)
        let time = 20; // default 20 daqiqa
        if (t.time) {
          time = parseInt(t.time) || 20;
        } else if (t.timer) {
          if (typeof t.timer === 'number') {
            time = t.timer;
          } else if (typeof t.timer === 'string') {
            time = parseInt(t.timer) || 20;
          } else if (t.timer.answer) {
            time = parseInt(t.timer.answer) || 20;
          }
        }

        return {
          topic: topic,
          task: task,
          level: level,
          time: time,
          active: true
        };
      })
      .sort((a, b) => {
        const order = { easy: 1, medium: 2, hard: 3 };
        return (order[a.level] || 99) - (order[b.level] || 99);
      });

    // Agar admin panelda savol bo'lmasa, eski localStorage ga fallback
    if (tasks.length === 0) {
      console.log('Admin panelda savollar yoq, eski localStorage ga fallback');
      const raw = localStorage.getItem("writingTasks");
      try {
        const oldTasks = JSON.parse(raw) || [];
        tasks = oldTasks
          .filter(t => t && t.active)
          .sort((a, b) => {
            const order = { easy: 1, medium: 2, hard: 3 };
            return (order[a.level] || 99) - (order[b.level] || 99);
          });
      } catch {
        tasks = [];
      }
    }

    return tasks;

  } catch (error) {
    console.error('Yozish savollarini yuklashda xatolik:', error);
    // Fallback: eski localStorage
    const raw = localStorage.getItem("writingTasks");
    try {
      const oldTasks = JSON.parse(raw) || [];
      tasks = oldTasks
        .filter(t => t && t.active)
        .sort((a, b) => {
          const order = { easy: 1, medium: 2, hard: 3 };
          return (order[a.level] || 99) - (order[b.level] || 99);
        });
    } catch {
      tasks = [];
    }
    return tasks;
  }
}

/* ================= START ================= */
async function start() {
  // Admin paneldan yangilab olish
  await loadTasks();

  if (!tasks.length) {
    alert("Aktiv writing task yo'q!");
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

/* ================= INIT ================= */
// Sahifa yuklanganda savollarni yuklash
document.addEventListener('DOMContentLoaded', async () => {
  await loadTasks();
  console.log('Yozish vazifalari yuklandi:', tasks.length, 'ta');
});