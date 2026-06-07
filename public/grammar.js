let current = 0;
let questions = [];

/* ================= START ================= */
async function start() {
  current = 0;

  document.getElementById("startScreen").style.display = "none";

  // Admin paneldan savollarni yuklash
  let all = [];
  try {
    all = await QuestionsDB.getQuestions('grammar');
    console.log('Admin paneldan savollar yuklandi:', all.length);
  } catch (error) {
    console.error('Savollarni yuklashda xatolik:', error);
    // Fallback: eski localStorage
    all = JSON.parse(localStorage.getItem("grammarQuestions") || "[]");
  }

  // Savollarni formatlash (admin.js formatiga mos)
  const mcq = all.filter(q =>
    q && q.options && (q.options.A || q.options.B || q.options.C || q.options.D)
  );

  const text = all.filter(q =>
    q && (!q.options || (!q.options.A && !q.options.B))
  );

  questions = [...mcq, ...text].map(q => {
    // Admin panel format: {A, B, C, D} -> [A, B, C, D]
    let opts = [];
    if (q.options) {
      if (q.options.A) opts.push(q.options.A);
      if (q.options.B) opts.push(q.options.B);
      if (q.options.C) opts.push(q.options.C);
      if (q.options.D) opts.push(q.options.D);
    }
    
    // Eski format support: options array
    if (Array.isArray(q.options)) {
      opts = q.options;
    }

    return {
      question: q.text || q.question,
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
    // Matnli savol (ochiq javob)
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

  // MCQ savol (A, B, C, D)
  const letters = ['A', 'B', 'C', 'D'];
  let optionsHtml = '';
  q.options.forEach((opt, idx) => {
    if (opt) {
      optionsHtml += `<button onclick="answer(${idx})">${letters[idx]}) ${opt}</button>`;
    }
  });

  box.innerHTML = `
    <div class="grammar-screen">
      <div class="grammar-content">
        <div class="grammar-question">
          ${current + 1}. ${q.question}
        </div>
        <div class="grammar-options">
          ${optionsHtml}
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

/* ================= SAVE ================= */
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