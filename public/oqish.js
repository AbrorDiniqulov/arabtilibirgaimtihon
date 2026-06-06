let index = 0;
let qIndex = 0;

let examAnswers = JSON.parse(localStorage.getItem("examAnswers")) || {};
let readings = [];

function getReadings() {
  const data = JSON.parse(localStorage.getItem("reading")) || [];
  return data.filter(item => item && item.active === true && Array.isArray(item.questions));
}

window.addEventListener("load", () => {
  readings = getReadings();
});

function startReading() {
  readings = getReadings();
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
    showFinish("split", "O\'qish qismi tugadi");
  } else {
    const box = document.getElementById("split");
    if (box) {
      box.innerHTML = `
        <div class="finish-screen">
          <div class="finish-title">O\'qish qismi tugadi</div>
          <div class="finish-sub">Barcha savollar yakunlandi</div>
        </div>
      `;
    }
  }
}
