let tasks = JSON.parse(localStorage.getItem("writingTasks")) || [];

render();

/* ================= ADD ================= */
function addTask() {

  const levelEl = document.getElementById("level");
  const topicEl = document.getElementById("topic");
  const taskEl = document.getElementById("task");

  if (!levelEl || !topicEl || !taskEl) {
    alert("Inputlar topilmadi (ID xato)");
    return;
  }

  const level = levelEl.value;
  const topic = topicEl.value.trim();
  const task = taskEl.value.trim();

  if (!topic || !task) {
    alert("Mavzu va task bo‘sh bo‘lmasin!");
    return;
  }

  let time = getTime(level);

  const newTask = {
    level,
    topic,
    task,
    time,
    active: true
  };

  tasks.push(newTask);

  save();
  render();
  clearInputs();

  if (typeof saveSection === "function") {
    saveSection("writing", tasks);
  }
}

/* ================= TIMER ================= */
function getTime(level) {
  if (level === "easy") return 20;
  if (level === "medium") return 40;
  return 60;
}

/* ================= SAVE ================= */
function save() {
  localStorage.setItem("writingTasks", JSON.stringify(tasks));
}

/* ================= CLEAR ================= */
function clearInputs() {
  const topic = document.getElementById("topic");
  const task = document.getElementById("task");

  if (topic) topic.value = "";
  if (task) task.value = "";
}

/* ================= SORT ================= */
function sortTasks() {
  const order = { easy: 1, medium: 2, hard: 3 };
  tasks.sort((a, b) => order[a.level] - order[b.level]);
}

/* ================= RENDER ================= */
function render() {

  const list = document.getElementById("list");
  if (!list) return;

  list.innerHTML = "";

  sortTasks();

  tasks.forEach((t, i) => {

    list.innerHTML += `
      <div class="box">

        <h3>${t.topic}</h3>
        <p>${t.task}</p>

        <p>Level: <b>${t.level.toUpperCase()}</b></p>
        <p>⏱ Time: ${t.time} min</p>

        <p class="status">
          ${t.active ? "✅ Aktiv" : "⛔ To'xtatilgan"}
        </p>

        <button onclick="toggle(${i})">
          ${t.active ? "To'xtatish" : "Faollashtirish"}
        </button>

        <button onclick="removeTask(${i})">
          O‘chirish
        </button>

      </div>
    `;
  });
}

/* ================= TOGGLE ================= */
function toggle(i) {

  tasks[i].active = !tasks[i].active;

  save();
  render();

}


/* 🔥 UNIVERSAL SAVE FUNCTION */
function saveSection(sectionName, questions) {

  let text = `${sectionName.toUpperCase()} ANSWERS\n\n`;

  questions.forEach((q, i) => {

    text += `${i + 1}. ${answers[i] || ""}\n`;

  });

  // TXT ko‘rinishda saqlaydi
  localStorage.setItem(
    `${sectionName}_txt`,
    text
  );

}

/* ================= DELETE ================= */
function removeTask(i) {
  tasks.splice(i, 1);
  save();
  render();

  if (typeof saveSection === "function") {
    saveSection("writing", tasks);
  }
}