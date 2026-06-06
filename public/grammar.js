let current = 0;
let questions = [];

/* ================= START ================= */
function start() {

  current = 0;

  document.getElementById("startScreen").style.display = "none";

  const all =
    JSON.parse(localStorage.getItem("grammarQuestions") || "[]");

  const mcq = all.filter(q =>
    q && q.active && Array.isArray(q.options) && q.options.length
  );

  const text = all.filter(q =>
    q && q.active && (!q.options || q.options.length === 0)
  );

  questions = [...mcq, ...text].map(q => {

    let opts = q.options;

    if (typeof opts === "string") {
      opts = opts.split(/[;,]/).map(v => v.trim());
    }

    if (!Array.isArray(opts)) opts = [];

    return {
      question: q.question,
      options: opts,
      correct: q.correct || 0
    };
  });

  /* 🔥 RESET GLOBAL EXAM STORAGE */
  let exam = JSON.parse(localStorage.getItem("examAnswers") || "{}");
  exam.grammar = [];
  localStorage.setItem("examAnswers", JSON.stringify(exam));

  showQuestion();
}

/* ================= SHOW ================= */
function showQuestion() {

  const box = document.getElementById("quiz");

  if (current >= questions.length) {
    finishGrammar();
    return;
  }

  const q = questions[current];

  if (!q.options.length) {

    box.innerHTML = `
      <div class="grammar-screen">

        <div class="grammar-content">

          <div class="grammar-question">
            ${current + 1}. ${q.question}
          </div>

          <textarea id="textAnswer"></textarea>

        </div>

        <div class="grammar-footer">
          <button onclick="saveText()">Keyingi</button>
        </div>

      </div>
    `;

    return;
  }

  box.innerHTML = `
    <div class="grammar-screen">

      <div class="grammar-content">

        <div class="grammar-question">
          ${current + 1}. ${q.question}
        </div>

        <div class="grammar-options">

          <button onclick="answer(0)">A) ${q.options[0] || "-"}</button>
          <button onclick="answer(1)">B) ${q.options[1] || "-"}</button>
          <button onclick="answer(2)">C) ${q.options[2] || "-"}</button>
          <button onclick="answer(3)">D) ${q.options[3] || "-"}</button>

        </div>

      </div>

    </div>
  `;
}

/* ================= ANSWER ================= */
function answer(i) {
  saveAnswer(questions[current].options[i]);
}

/* ================= TEXT ================= */
function saveText() {
  const val = document.getElementById("textAnswer").value;
  saveAnswer(val);
}

/* ================= SAVE (SYNC FIX FOR DOWNLOAD.JS) ================= */
function saveAnswer(val) {

  const q = questions[current];

  const answerObj = {
    question: q.question,
    answer: val || ""
  };

  /* 1. LOCAL SAVE */
  let exam = JSON.parse(localStorage.getItem("examAnswers") || "{}");

  if (!Array.isArray(exam.grammar)) {
    exam.grammar = [];
  }

  exam.grammar.push(answerObj);

  localStorage.setItem("examAnswers", JSON.stringify(exam));

  current++;
  showQuestion();
}

/* ================= FINISH ================= */
function finishGrammar() {

  if (typeof showFinish === "function") {
    showFinish("quiz", "Grammar qismi tugadi");
  } else {
    document.getElementById("quiz").innerHTML = `
      <div class="finish-screen">
        <div class="finish-title">Grammar tugadi</div>
      </div>
    `;
  }
}

