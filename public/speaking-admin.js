let questions =
JSON.parse(localStorage.getItem("speakingQuestions")) || [];

renderQuestions();

/* ================= ADD QUESTION ================= */
function addQuestion() {

  const question =
    document.getElementById("question").value;

  const difficulty =
    document.getElementById("difficulty").value;

  if (!question.trim()) return;

  let timer =
    getTimerByDifficulty(difficulty);

  const newQuestion = {
    question,
    difficulty,
    timer,
    active: true
  };

  questions.push(newQuestion);

  saveAndRender();

  clearInputs();
}


/* ================= TIMER LOGIC ================= */
function getTimerByDifficulty(level) {

  if (level === "medium") {
    return {
      prep: 10,
      answer: 45
    };
  }

  if (level === "hard") {
    return {
      prep: 15,
      answer: 60
    };
  }

  return {
    prep: 10,
    answer: 30
  };
}


/* ================= SAVE ================= */
function saveQuestions() {

  localStorage.setItem(
    "speakingQuestions",
    JSON.stringify(questions)
  );

}

function saveAndRender() {

  saveQuestions();
  renderQuestions();

}


/* ================= CLEAR INPUT ================= */
function clearInputs() {

  document.getElementById("question").value = "";

}


/* ================= SORT ================= */
function sortQuestions() {

  const order = {
    easy: 1,
    medium: 2,
    hard: 3
  };

  questions.sort((a, b) => {
    return order[a.difficulty] - order[b.difficulty];
  });

}


/* ================= RENDER ================= */
function renderQuestions() {

  const list =
    document.getElementById("questionsList");

  list.innerHTML = "";

  sortQuestions();

  questions.forEach((q, index) => {

    list.innerHTML += `
      <div class="question-box">

        <h3>${q.question}</h3>

        <p>Level: <b>${q.difficulty.toUpperCase()}</b></p>

        <p>⏱ Prep: ${q.timer.prep}s | 🗣 Answer: ${q.timer.answer}s</p>

        <p class="status">
          ${q.active ? "✅ Aktiv" : "⛔ To'xtatilgan"}
        </p>

        <button onclick="toggleQuestion(${index})">
          ${q.active ? "To'xtatish" : "Faollashtirish"}
        </button>

        <button onclick="deleteQuestion(${index})">
          O‘chirish
        </button>

      </div>
    `;

  });

}


/* ================= TOGGLE ================= */
function toggleQuestion(index) {

  questions[index].active =
    !questions[index].active;

  saveAndRender();

}


/* ================= DELETE ================= */
function deleteQuestion(index) {

  questions.splice(index, 1);

  saveAndRender();

}