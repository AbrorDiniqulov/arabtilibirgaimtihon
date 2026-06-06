let listeningData = JSON.parse(localStorage.getItem("listening")) || [];

const audio = document.getElementById("audio");
const quiz = document.getElementById("quiz");
const startBtn = document.getElementById("startBtn");

let sections = ["easy", "medium", "hard"];
let sectionIndex = 0;

let currentItem = null;
let step = 0;
let currentQuestion = 0;

let userAnswers = JSON.parse(localStorage.getItem("listeningAnswers") || "[]");

function getCurrentItem() {
  return listeningData[sectionIndex];
}

startBtn.addEventListener("click", () => {
  if (!currentItem) {
    startListening();
    return;
  }
  if (step === 0) {
    startListening();
  } else {
    startBtn.style.display = "none";
    playSecond();
  }
});

function startListening() {
  currentItem = getCurrentItem();

  if (!currentItem || !currentItem.questions) {
    alert("Audio yoki savollar topilmadi!");
    return;
  }

  audio.style.display = "block";
  quiz.style.display = "none";
  audio.src = currentItem.audio;
  step = 0;
  currentQuestion = 0;
  playFirst();
}

function playFirst() {
  audio.pause();
  audio.currentTime = 0;
  audio.load();
  audio.play().catch(() => {});
}

function playSecond() {
  audio.pause();
  audio.currentTime = 0;
  audio.load();
  audio.play().catch(() => {});
}

audio.addEventListener("ended", () => {
  if (step === 0) {
    step = 1;
    startBtn.style.display = "block";
    startBtn.innerText = "Ikkinchi marta eshitish";
  } else {
    showQuiz();
  }
});

function showQuiz() {
  audio.style.display = "none";
  quiz.style.display = "block";
  currentQuestion = 0;
  renderQuestion();
}

function renderQuestion() {
  let q = currentItem.questions?.[currentQuestion];

  if (!q) {
    finishSection();
    return;
  }

  quiz.innerHTML = `
    <div class="question-box">
      <div class="q-title">${currentQuestion + 1}. ${q.question}</div>
      <div class="options">
        ${q.options.map((opt) => `
          <button class="option-btn" onclick="selectAnswer(this.dataset.value)" data-value="${opt}">${opt}</button>
        `).join("")}
      </div>
    </div>
  `;
}

function selectAnswer(val) {
  let q = currentItem.questions?.[currentQuestion];
  if (!q) return;

  const answerObj = {
    question: q.question,
    answer: val,
    section: currentItem.section
  };

  userAnswers.push(answerObj);
  localStorage.setItem("listeningAnswers", JSON.stringify(userAnswers));

  syncListeningToExam(answerObj);

  currentQuestion++;
  renderQuestion();
}

function syncListeningToExam(answerObj) {
  let exam = JSON.parse(localStorage.getItem("examAnswers") || "{}");
  if (!Array.isArray(exam.listening)) {
    exam.listening = [];
  }
  exam.listening.push(answerObj);
  localStorage.setItem("examAnswers", JSON.stringify(exam));
}

function finishSection() {
  nextAudio();
}

function finishAll() {
  quiz.style.display = "block";
  audio.style.display = "none";

  if (typeof showFinish === "function") {
    showFinish("quiz", "Eshitish qismi tugadi");
  }
}

function nextAudio() {
  sectionIndex++;
  currentItem = getCurrentItem();

  if (!currentItem) {
    finishAll();
    return;
  }

  audio.style.display = "block";
  quiz.style.display = "none";
  currentQuestion = 0;
  step = 0;
  audio.src = currentItem.audio;
  playFirst();
}


