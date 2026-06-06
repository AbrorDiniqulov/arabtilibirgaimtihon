let mediaRecorder;
let chunks = [];
let index = 0;

let allQuestions = JSON.parse(localStorage.getItem("speakingQuestions")) || [];

let questions = allQuestions
  .filter(q => q.active)
  .map(q => ({
    question: q.question,
    difficulty: q.difficulty,
    timer: q.timer
  }));

const DB_NAME = "examDB";
const STORE_NAME = "speakingAudio";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = function (e) {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function clearOldAudio() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).clear();
}

async function start() {
  document.getElementById("startBtn").style.display = "none";
  await clearOldAudio();
  index = 0;

  // ESKI JAVOBLAR VA AUDIONI TOZALASH - FAQAT YANGI RECORDLAR
  let exam = JSON.parse(localStorage.getItem("examAnswers") || "{}");
  exam.speaking = [];
  localStorage.setItem("examAnswers", JSON.stringify(exam));

  // BARCHA eski audio kalitlarini tozalash (ZIP ichida eski record bo'lmasin)
  for (let i = 0; i < 100; i++) {
    localStorage.removeItem('speaking_audio_' + i);
  }

  // IndexedDB dan ham eski audio larni tozalash
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
  } catch (e) {
    console.log("IndexedDB clear error:", e);
  }

  nextQuestion();
}

function nextQuestion() {
  const questionEl = document.getElementById("question");
  const status = document.getElementById("status");

  if (index >= questions.length) {
    questionEl.innerText = "GAPIRISH TUGADI";
    status.innerText = "";
    document.getElementById("recording").style.display = "none";

    if (typeof showFinish === "function") {
      showFinish("screen", "Gapirish qismi tugadi");
    }
    return;
  }

  const q = questions[index];
  questionEl.style.display = "block";
  questionEl.innerText = q.question;

  let prep = q.timer.prep;
  status.innerText = `Tayyorlaning (${q.difficulty.toUpperCase()}): ${prep}`;

  let prepTimer = setInterval(() => {
    prep--;
    status.innerText = `Tayyorlaning (${q.difficulty.toUpperCase()}): ${prep}`;
    if (prep <= 0) {
      clearInterval(prepTimer);
      startRecording(q);
    }
  }, 1000);
}

function startRecording(q) {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      mediaRecorder = new MediaRecorder(stream);
      chunks = [];

      mediaRecorder.ondataavailable = e => {
        chunks.push(e.data);
      };

      mediaRecorder.start();
      document.getElementById("recording").style.display = "flex";

      let time = q.timer.answer;
      document.getElementById("status").innerText = `Gapiring! (${q.difficulty.toUpperCase()}) Qoldi: ${time}`;

      let recTimer = setInterval(() => {
        time--;
        document.getElementById("status").innerText = `Gapiring! (${q.difficulty.toUpperCase()}) Qoldi: ${time}`;
        if (time <= 0) {
          clearInterval(recTimer);
          mediaRecorder.stop();
        }
      }, 1000);

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });

        const answerObj = {
          question: q.question,
          difficulty: q.difficulty,
          audioIndex: index  // AUDIO INDEX QO'SHILDI
        };

        // IndexedDB ga saqlash
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put({
          id: "audio_" + index,
          ...answerObj,
          blob: blob
        });

        // Base64 ga aylantirish va saqlash
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function() {
          const base64Audio = reader.result;

          // ExamAnswers ga saqlash
          let exam = JSON.parse(localStorage.getItem("examAnswers") || "{}");
          if (!Array.isArray(exam.speaking)) {
            exam.speaking = [];
          }
          exam.speaking.push({
            ...answerObj,
            audio: base64Audio
          });
          localStorage.setItem("examAnswers", JSON.stringify(exam));

          // Alohida kalit bilan saqlash (ZIP uchun)
          localStorage.setItem('speaking_audio_' + index, base64Audio);
          console.log("Audio " + index + " saqlandi, uzunlik: " + base64Audio.length);
        };

        index++;
        document.getElementById("recording").style.display = "none";
        setTimeout(nextQuestion, 1000);
      };
    })
    .catch(() => {
      document.getElementById("status").innerText = "Mikrofon ishlamadi ❌";
      // Savolni yoki saqlash (audio bo'lmasa ham speaking.txt da ko'rinsin)
      let exam = JSON.parse(localStorage.getItem("examAnswers") || "{}");
      if (!Array.isArray(exam.speaking)) exam.speaking = [];
      exam.speaking.push({
        question: q.question,
        difficulty: q.difficulty,
        audioIndex: index,
        audio: null
      });
      localStorage.setItem("examAnswers", JSON.stringify(exam));
      index++;
      setTimeout(nextQuestion, 1000);
    });
}