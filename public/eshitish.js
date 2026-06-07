let listeningData = [];
const audio = document.getElementById("audio");
const quiz = document.getElementById("quiz");
const startBtn = document.getElementById("startBtn");

let sections = ["easy", "medium", "hard"];
let sectionIndex = 0;

let currentItem = null;
let step = 0;
let currentQuestion = 0;

let userAnswers = JSON.parse(localStorage.getItem("listeningAnswers") || "[]");

/* ================= ADMIN PANELDAN SAVOLLARNI YUKLASH ================= */
async function loadListeningData() {
  try {
    // Admin paneldan eshitish savollarini yuklash
    const questions = await QuestionsDB.getQuestions('listening');
    console.log('Admin paneldan eshitish savollari yuklandi:', questions.length);
    
    // Savollarni formatlash (admin format -> eshitish format)
    listeningData = questions.map(q => {
      // Audio URL ni topish (agar admin panelda saqlangan bo'lsa)
      let audioUrl = q.audio || q.audioUrl || '';
      
      // Options ni formatlash
      let opts = [];
      if (q.options) {
        if (q.options.A) opts.push(q.options.A);
        if (q.options.B) opts.push(q.options.B);
        if (q.options.C) opts.push(q.options.C);
        if (q.options.D) opts.push(q.options.D);
      }
      if (Array.isArray(q.options)) {
        opts = q.options;
      }

      return {
        audio: audioUrl,
        section: q.section || 'easy',
        questions: [{
          question: q.text || q.question,
          options: opts
        }]
      };
    });

    // Agar admin panelda savol bo'lmasa, eski localStorage ga fallback
    if (listeningData.length === 0) {
      console.log('Admin panelda savollar yoq, eski localStorage ga fallback');
      listeningData = JSON.parse(localStorage.getItem("listening") || "[]");
    }

  } catch (error) {
    console.error('Eshitish savollarini yuklashda xatolik:', error);
    // Fallback: eski localStorage
    listeningData = JSON.parse(localStorage.getItem("listening") || "[]");
  }
}

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
  
  // Audio URL ni tekshirish
  if (currentItem.audio) {
    audio.src = currentItem.audio;
  } else {
    console.warn('Audio URL topilmadi, faqat savollar ko\'rsatiladi');
    showQuiz(); // Audio bo'lmasa, to'g'ridan-to'g'ri savollarga o'tish
    return;
  }
  
  step = 0;
  currentQuestion = 0;
  playFirst();
}

function playFirst() {
  audio.pause();
  audio.currentTime = 0;
  audio.load();
  audio.play().catch((e) => {
    console.error('Audio play xatolik:', e);
    // Audio play xatolik bo'lsa, savollarga o'tish
    showQuiz();
  });
}

function playSecond() {
  audio.pause();
  audio.currentTime = 0;
  audio.load();
  audio.play().catch((e) => {
    console.error('Audio play xatolik:', e);
    showQuiz();
  });
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

  // Options ni tekshirish va formatlash
  let options = q.options || [];
  if (typeof options === 'string') {
    options = options.split(/[;,]/).map(v => v.trim()).filter(v => v);
  }

  quiz.innerHTML = `
    <div class="question-box">
      <div class="q-title">${currentQuestion + 1}. ${q.question || q.text}</div>
      <div class="options">
        ${options.map((opt) => `
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
    question: q.question || q.text,
    answer: val,
    section: currentItem.section || sections[sectionIndex] || 'unknown'
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
  
  if (currentItem.audio) {
    audio.src = currentItem.audio;
    playFirst();
  } else {
    // Audio bo'lmasa, to'g'ridan-to'g'ri savollarga o'tish
    showQuiz();
  }
}

/* ================= INIT ================= */
// Sahifa yuklanganda savollarni yuklash
document.addEventListener('DOMContentLoaded', async () => {
  await loadListeningData();
  console.log('Eshitish ma\'lumotlari yuklandi:', listeningData.length, 'ta');
});