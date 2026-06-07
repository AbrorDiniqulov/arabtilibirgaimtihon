let index = 0;
let qIndex = 0;

let examAnswers = JSON.parse(localStorage.getItem("examAnswers")) || {};
let readings = [];

/* ================= ADMIN PANELDAN SAVOLLARNI YUKLASH ================= */
async function loadReadings() {
  try {
    // Admin paneldan o'qish savollarini yuklash
    const questions = await QuestionsDB.getQuestions('reading');
    console.log('Admin paneldan o\'qish savollari yuklandi:', questions.length);
    
    // Savollarni formatlash (admin format -> o'qish format)
    // Admin panelda har bir reading alohida saqlanishi kerak:
    // { text: "matn...", questions: [{text, options: {A,B,C,D}, correct}] }
    readings = questions.map(q => {
      // Matnni olish
      const passageText = q.text || q.passage || q.question || '';
      
      // Savollarni formatlash
      let passageQuestions = [];
      if (q.questions && Array.isArray(q.questions)) {
        passageQuestions = q.questions.map(sq => {
          let opts = [];
          if (sq.options) {
            if (sq.options.A) opts.push(sq.options.A);
            if (sq.options.B) opts.push(sq.options.B);
            if (sq.options.C) opts.push(sq.options.C);
            if (sq.options.D) opts.push(sq.options.D);
          }
          if (Array.isArray(sq.options)) {
            opts = sq.options;
          }
          return {
            question: sq.text || sq.question,
            options: opts
          };
        });
      } else {
        // Agar faqat bitta savol bo'lsa
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
        if (opts.length > 0 || q.text || q.question) {
          passageQuestions = [{
            question: q.text || q.question,
            options: opts
          }];
        }
      }

      return {
        text: passageText,
        questions: passageQuestions,
        active: q.active !== false
      };
    }).filter(r => r.text && r.questions.length > 0);

    // Agar admin panelda savol bo'lmasa, eski localStorage ga fallback
    if (readings.length === 0) {
      console.log('Admin panelda savollar yoq, eski localStorage ga fallback');
      const oldData = JSON.parse(localStorage.getItem("reading")) || [];
      readings = oldData.filter(item => item && item.active === true && Array.isArray(item.questions));
    }

  } catch (error) {
    console.error('O\'qish savollarini yuklashda xatolik:', error);
    // Fallback: eski localStorage
    const oldData = JSON.parse(localStorage.getItem("reading")) || [];
    readings = oldData.filter(item => item && item.active === true && Array.isArray(item.questions));
  }
}

function getReadings() {
  return readings;
}

window.addEventListener("load", async () => {
  await loadReadings();
  console.log('O\'qish ma\'lumotlari yuklandi:', readings.length, 'ta');
});

function startReading() {
  if (!readings.length) {
    alert("Faol reading topilmadi!");
    return;
  }
  index = 0;
  qIndex = 0;
  document.getElementById("startSection").style.display = "none";
  document.getElementById("fullText").style.display = "block";
  document.getElementById("split").style.display = "none";
  document.getElementById("onlyText").innerText = readings[index].text || "";
}

function showSplit() {
  document.getElementById("fullText").style.display = "none";
  document.getElementById("split").style.display = "flex";
  document.getElementById("sideText").innerText = readings[index]?.text || "";
  qIndex = 0;
  showQuestion();
}

function showQuestion() {
  const box = document.getElementById("questionBox");
  const passage = readings[index];

  if (!passage) {
    finishReading();
    return;
  }

  const q = passage.questions[qIndex];

  if (!q) {
    nextPassage();
    return;
  }

  const options = Array.isArray(q.options) ? q.options : [];

  let optionsHtml = "";
  options.forEach((opt, i) => {
    const safeOpt = opt.replace(/'/g, "\'").replace(/"/g, '\"');
    optionsHtml += `<button class="option-btn" onclick="selectAnswer('${safeOpt}')">${String.fromCharCode(65 + i)}. ${opt}</button>`;
  });

  box.innerHTML = `
    <div class="q-container">
      <p class="question-text">${q.question || "No question"}</p>
      ${optionsHtml}
    </div>
  `;
}

function selectAnswer(val) {
  const passage = readings[index];
  const q = passage?.questions?.[qIndex];
  if (!q) return;

  if (!examAnswers.reading) examAnswers.reading = [];
  if (!examAnswers.reading[index]) {
    examAnswers.reading[index] = {
      passage: passage.text,
      questions: []
    };
  }

  examAnswers.reading[index].questions.push({
    question: q.question,
    answer: val
  });

  localStorage.setItem("examAnswers", JSON.stringify(examAnswers));

  qIndex++;
  showQuestion();
}

function nextPassage() {
  index++;
  qIndex = 0;

  if (index >= readings.length) {
    finishReading();
    return;
  }

  document.getElementById("split").style.display = "none";
  document.getElementById("fullText").style.display = "block";
  document.getElementById("onlyText").innerText = readings[index].text || "";
}

function finishReading() {
  if (typeof showFinish === "function") {
    showFinish("split", "O'qish qismi tugadi");
  } else {
    const box = document.getElementById("split");
    if (box) {
      box.innerHTML = `
        <div class="finish-screen">
          <div class="finish-title">O'qish qismi tugadi</div>
          <div class="finish-sub">Barcha savollar yakunlandi</div>
        </div>
      `;
    }
  }
}