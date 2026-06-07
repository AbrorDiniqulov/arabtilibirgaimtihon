// ============================================
// script.js — UMUMIY FUNKSYALAR
// ============================================

const ALLOWED_CARD_SUFFIX = "7461";
const MIN_PAYMENT_AMOUNT = 30000;

// Telegram bot sozlamalari
const TELEGRAM_BOT_TOKEN = "8979418141:AAFVnQu4u13Xb_p1pudAWKwBH3F8DbCCbgE";
const TELEGRAM_CHAT_ID = "444362245";

let examTimerInterval = null;
let examEndTime = null;

// ============================================
// AUTH
// ============================================

function getCurrentUser() {
  try {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  } catch (e) {
    return null;
  }
}

function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}

function isStudent() {
  const user = getCurrentUser();
  return user && user.role === 'student';
}

function logout() {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('examEndTime');
  localStorage.removeItem('paymentVerified');
  if (examTimerInterval) {
    clearInterval(examTimerInterval);
    examTimerInterval = null;
  }
  window.location.href = 'login.html';
}

// ============================================
// TIMER
// ============================================

function startSharedTimer() {
  startExamTimer();
}

function startExamTimer() {
  if (window.location.pathname.includes('admin')) {
    return;
  }

  const savedEndTime = localStorage.getItem('examEndTime');
  const savedDuration = localStorage.getItem('examDuration');

  const timerEl = document.getElementById('globalTimer');
  if (!timerEl) return;

  if (examTimerInterval) {
    clearInterval(examTimerInterval);
    examTimerInterval = null;
  }

  if (savedEndTime) {
    examEndTime = new Date(parseInt(savedEndTime));
  } else {
    examEndTime = null;
  }

  updateTimerDisplay();
  examTimerInterval = setInterval(updateTimerDisplay, 1000);
}

function updateTimerDisplay() {
  const timerEl = document.getElementById('globalTimer');
  if (!timerEl) return;

  const savedDuration = localStorage.getItem("examDuration");
  const savedEndTime = localStorage.getItem('examEndTime');
  const paymentVerified = localStorage.getItem('paymentVerified') === 'true';

  if (isAdmin()) {
    if (examEndTime) {
      showCountdown(timerEl);
    } else if (savedDuration) {
      showDuration(timerEl, savedDuration);
    } else {
      timerEl.textContent = '03:00:00';
      timerEl.style.color = '#00ffcc';
    }
    return;
  }

  if (!paymentVerified) {
    timerEl.textContent = '00:00:00';
    timerEl.style.color = '#ffd700';
    return;
  }

  if (!savedDuration && !savedEndTime) {
    timerEl.textContent = '03:00:00';
    timerEl.style.color = '#00ffcc';
    return;
  }

  if (!examEndTime) {
    if (savedEndTime) {
      examEndTime = new Date(parseInt(savedEndTime));
    } else {
      timerEl.textContent = '00:00:00';
      timerEl.style.color = '#ff7675';
      return;
    }
  }

  showCountdown(timerEl);
}

function showDuration(timerEl, durationMs) {
  const hours = Math.floor(parseInt(durationMs) / (60 * 60 * 1000));
  const minutes = Math.floor((parseInt(durationMs) % (60 * 60 * 1000)) / (60 * 1000));
  timerEl.textContent = String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':00';
  timerEl.style.color = '#00ffcc';
}

function showCountdown(timerEl) {
  const now = new Date();
  const diff = examEndTime - now;

  if (diff <= 0) {
    timerEl.textContent = '00:00:00';
    timerEl.style.color = '#ff7675';
    clearInterval(examTimerInterval);
    examTimerInterval = null;

    if (typeof finishOnTimeout === 'function') {
      finishOnTimeout();
    } else {
      alert('Imtihon vaqti tugadi!');
      submitAll();
    }
    return;
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  timerEl.textContent = 
    String(hours).padStart(2, '0') + ':' +
    String(minutes).padStart(2, '0') + ':' +
    String(seconds).padStart(2, '0');
  timerEl.style.color = '#00ffcc';
}

// ============================================
// PAYMENT
// ============================================

function previewPayment(input) {
  const preview = document.getElementById('paymentPreview');
  const status = document.getElementById('paymentStatus');

  if (!input.files || input.files.length === 0) {
    if (preview) {
      preview.style.display = 'none';
      preview.src = '';
    }
    return;
  }

  const file = input.files[0];

  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = function(e) {
      if (preview) {
        preview.src = e.target.result;
        preview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  } else {
    if (preview) {
      preview.style.display = 'none';
      preview.src = '';
    }
  }

  if (status) {
    status.className = 'payment-status info';
    status.textContent = 'Fayl tanlandi: ' + file.name;
    status.style.display = 'block';
  }
}

async function submitPayment() {
  console.log("=== submitPayment ===");

  const fileInput = document.getElementById('paymentFile');
  const btn = document.getElementById('paymentBtn');
  const status = document.getElementById('paymentStatus');

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    showPaymentStatus("Iltimos, to'lov chekini tanlang!", 'error');
    return;
  }

  const file = fileInput.files[0];
  if (btn) btn.disabled = true;

  showPaymentStatus('\u{1F50D} Tekshirilmoqda...', 'info');

  let ocrText = '';
  let checkResult = { valid: false, errors: [], cardValid: false, amountValid: false, dateValid: false, notUsedBefore: true };

  try {
    if (typeof Tesseract !== 'undefined' && file.type.startsWith('image/')) {
      const result = await Tesseract.recognize(file, 'eng', { logger: m => console.log(m) });
      ocrText = result.data.text;
      console.log("OCR natija:", ocrText);
    }
  } catch (ocrErr) {
    console.warn('OCR xatosi:', ocrErr.message);
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  if (!ocrText || ocrText.trim().length < 10) {
    console.log("OCR natija bo'sh yoki juda qisqa. Fallback tekshiruv...");
    const fileName = file.name.toLowerCase();
    if (fileName.includes('7461') || fileName.includes('openbank') || fileName.includes('chek') || fileName.includes('payment')) {
      console.log("Fayl nomida 7461 yoki to'lov alomatlari topildi");
      checkResult.cardValid = true;
    } else {
      console.log("OCR bo'sh, lekin rasm yuklandi - tasdiqlash");
      checkResult.cardValid = true;
    }
  } else {
    checkResult.cardValid = checkCardNumber(ocrText);
  }

  if (!checkResult.cardValid) {
    console.log("Karta 7461 OCR da topilmadi, qo'shimcha tekshiruv...");
  }

  const amountMatches = ocrText.match(/(\d{1,3}(?:\s?\d{3})*(?:[,\.]\d+)?)\s?(?:so\'m|sum|uzs)/gi) 
    || ocrText.match(/(\d{1,3}(?:\s?\d{3})*)\s?(?:000|ming)/gi)
    || ocrText.match(/(\d{4,6})\s?(?:so\'m|sum|uzs|\s)/gi);

  if (amountMatches) {
    for (const match of amountMatches) {
      const cleanNum = match.replace(/\s/g, '').replace(/[,\.].*/, '');
      const num = parseInt(cleanNum);
      console.log("Summa topildi:", match, "->", num);
      if (num >= MIN_PAYMENT_AMOUNT) { 
        checkResult.amountValid = true; 
        break; 
      }
    }
  }

  if (!checkResult.amountValid) {
    const fileName = file.name.toLowerCase();
    const fileAmountMatch = fileName.match(/(\d{2,6})/);
    if (fileAmountMatch) {
      const num = parseInt(fileAmountMatch[1]);
      if (num >= MIN_PAYMENT_AMOUNT) {
        checkResult.amountValid = true;
        console.log("Fayl nomidan summa topildi:", num);
      }
    }
  }

  checkResult.dateValid = true;

  const usedReceipts = JSON.parse(localStorage.getItem('usedPaymentReceipts') || '[]');
  const fileHash = await getFileHash(file);
  if (usedReceipts.includes(fileHash)) {
    checkResult.notUsedBefore = false;
    checkResult.errors.push("Bu chek avval ishlatilgan");
  }

  checkResult.valid = checkResult.cardValid && checkResult.amountValid && checkResult.dateValid && checkResult.notUsedBefore;

  if (!checkResult.valid) {
    if (!checkResult.cardValid) {
      checkResult.errors.push("Karta raqami oxirgi 4 raqami 7461 bo'lishi kerak");
    }
    showPaymentStatus('\u274C ' + checkResult.errors.join('\n'), 'error');
    if (btn) btn.disabled = false;
    return;
  }

  showPaymentStatus('\u2705 Tasdiqlandi!', 'success');

  usedReceipts.push(fileHash);
  localStorage.setItem('usedPaymentReceipts', JSON.stringify(usedReceipts));

  const allReceipts = JSON.parse(localStorage.getItem('allPaymentReceipts') || '[]');
  const base64Data = await fileToBase64(file);
  allReceipts.push({ hash: fileHash, fileName: file.name, fileData: base64Data, timestamp: Date.now(), user: getCurrentUser()?.email || 'unknown' });
  localStorage.setItem('allPaymentReceipts', JSON.stringify(allReceipts));

  const user = getCurrentUser();
  if (user && user.email) {
    localStorage.setItem('paymentReceipt_' + user.email, JSON.stringify({ fileName: file.name, fileData: base64Data, timestamp: Date.now() }));
  }

  localStorage.setItem('paymentVerified', 'true');

  localStorage.removeItem('examEndTime');
  const savedDuration = localStorage.getItem("examDuration");
  const examDuration = savedDuration ? parseInt(savedDuration) : (3 * 60 * 60 * 1000);
  const endTime = Date.now() + examDuration;
  localStorage.setItem('examEndTime', endTime);

  examEndTime = new Date(endTime);

  startExamTimer();

  setTimeout(function() {
    showMainScreen();
  }, 1000);
}

// ============================================
// KARTA RAQAMINI TEKSHIRISH
// ============================================
function checkCardNumber(ocrText) {
  if (!ocrText || typeof ocrText !== 'string') return false;

  const text = ocrText.toLowerCase();
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase().trim();

    if (line.includes('qabul') && !line.includes('yuboruvchi')) {
      if (line.includes('7461')) {
        const patterns = [
          /\d{2,4}[^\d\w\s]{0,20}7461/,
          /\d{2,4}\s+7461/,
          /9860.*?7461/,
          /\d{4}[^\d]{0,30}7461/,
          /\d{12}7461/,
          /\d{15}7461/,
        ];
        for (const pattern of patterns) {
          if (pattern.test(line)) {
            console.log("✅ Qabul qiluvchi qatorida (shu qatorda) 7461 topildi");
            return true;
          }
        }
      }

      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].toLowerCase().trim();
        if (!nextLine.includes('yuboruvchi')) {
          if (nextLine.includes('7461')) {
            const patterns = [
              /\d{2,4}[^\d\w\s]{0,20}7461/,
              /\d{2,4}\s+7461/,
              /9860.*?7461/,
              /\d{4}[^\d]{0,30}7461/,
              /\d{12}7461/,
              /\d{15}7461/,
            ];
            for (const pattern of patterns) {
              if (pattern.test(nextLine)) {
                console.log("✅ Qabul qiluvchi keyingi qatorda 7461 topildi:", nextLine);
                return true;
              }
            }
          }
        }
      }
    }
  }

  console.log("Qabul qiluvchi qatori aniqlanmadi, umumiy tekshiruv...");

  for (const line of lines) {
    const cleanLine = line.toLowerCase().trim();
    if (cleanLine.includes('yuboruvchi')) continue;

    if (cleanLine.includes('7461')) {
      const endPatterns = [
        /\d{2,4}[^\d\w\s]{0,20}7461/,
        /\d{2,4}\s+7461/,
        /\d{12}7461/,
        /\d{15}7461/,
        /[^\d]7461$/,
        /7461[^\d]/,
      ];

      for (const pattern of endPatterns) {
        if (pattern.test(cleanLine)) {
          console.log("✅ Fallback qatorda 7461 topildi:", cleanLine);
          return true;
        }
      }
    }
  }

  console.log("❌ Qabul qiluvchi kartasida 7461 topilmadi");
  return false;
}

async function getFileHash(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const buffer = e.target.result;
      let hash = 0;
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i++) {
        hash = ((hash << 5) - hash) + bytes[i];
        hash = hash & hash;
      }
      resolve(String(hash));
    };
    reader.readAsArrayBuffer(file);
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function showPaymentStatus(message, type) {
  const status = document.getElementById('paymentStatus');
  if (!status) return;
  status.className = 'payment-status ' + type;
  status.textContent = message;
  status.style.display = 'block';
}

function showMainScreen() {
  const paymentSection = document.getElementById('paymentSection');
  const mainScreen = document.getElementById('mainScreen');

  if (paymentSection) paymentSection.style.display = 'none';
  if (mainScreen) {
    mainScreen.style.display = 'block';
    startExamTimer();
  }

  const btn = document.getElementById('paymentBtn');
  if (btn) {
    btn.disabled = false;
    btn.textContent = "Chekni yuborish";
  }
}

// ============================================
// ISTISNO TEKSHIRUVI
// ============================================
async function checkExemptStatus(email) {
  if (!email) return false;
  
  try {
    const localExempts = JSON.parse(localStorage.getItem('exemptLogins') || '[]');
    const normalizedEmail = email.toLowerCase().trim();
    
    const isExempt = localExempts.some(e => {
      if (!e || !e.email) return false;
      return e.email.toLowerCase().trim() === normalizedEmail;
    });
    
    console.log('Istisno tekshiruvi:', email, '->', isExempt ? 'ISTISNO' : 'ISTISNO EMAS');
    return isExempt;
  } catch (e) {
    console.error('Istisno tekshiruvi xatosi:', e);
    return false;
  }
}

// ============================================
// TELEGRAM BOT ORQALI YUBORISH
// ============================================
async function sendToTelegram(zipBlob, fileName, caption) {
  const formData = new FormData();
  formData.append("chat_id", TELEGRAM_CHAT_ID);
  formData.append("document", zipBlob, fileName);
  formData.append("caption", caption);
  
  console.log("Telegramga yuborilmoqda...", fileName);
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
      method: "POST",
      body: formData
    });
    
    const data = await response.json();
    console.log("Telegram javob:", data);
    
    if (data.ok) {
      return { success: true, message: "\u2705 Javoblar muvaffaqiyatli yuborildi!" };
    } else {
      return { success: false, message: "\u274C Telegram xatosi: " + data.description };
    }
  } catch (error) {
    console.error("Telegram yuborishda xato:", error);
    return { success: false, message: "\u274C Internet xatosi: " + error.message };
  }
}

// ============================================
// SUBMIT ALL - TELEGRAMGA YUBORISH
// ============================================

async function submitAll() {
  console.log("=== submitAll ===");

  const btn = document.getElementById('submitBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Yuborilmoqda...';
  }

  try {
    let examAnswers = JSON.parse(localStorage.getItem("examAnswers") || "{}");
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

    if (!currentUser) {
      alert("Foydalanuvchi topilmadi!");
      if (btn) { btn.disabled = false; btn.textContent = 'Javoblarni yuborish'; }
      return;
    }

    const speakingAudioFromDB = await getAllSpeakingAudioFromIndexedDB();
    const zip = new JSZip();

    // USER INFO
    let userInfoTxt = "FOYDALANUVCHI\n====================\n";
    userInfoTxt += `Ism: ${currentUser.name || "\u2014"}\n`;
    userInfoTxt += `Email: ${currentUser.email || "\u2014"}\n`;
    userInfoTxt += `Telefon: ${currentUser.phone || "\u2014"}\n`;
    userInfoTxt += `Vaqt: ${new Date().toLocaleString()}\n\n`;
    zip.file("user_info.txt", userInfoTxt);

    // GRAMMAR
    const grammar = safeArray(examAnswers.grammar);
    let grammarTxt = "GRAMMAR\n====================\n";
    grammar.forEach((q, i) => {
      grammarTxt += `${i + 1}. ${q.question || "\u2014"}\n   Javob: ${q.answer || "\u2014"}\n\n`;
    });
    zip.file("grammar.txt", grammarTxt);

    // LISTENING
    const listening = safeArray(examAnswers.listening);
    let listeningTxt = "LISTENING\n====================\n";
    listening.forEach((q, i) => {
      listeningTxt += `${i + 1}. ${q.question || "\u2014"}\n   Javob: ${q.answer || "\u2014"}\n\n`;
    });
    zip.file("listening.txt", listeningTxt);

    // WRITING
    const writing = safeArray(examAnswers.writing);
    let writingTxt = "WRITING\n====================\n";
    writing.forEach((q, i) => {
      writingTxt += `${i + 1}. ${q.question || q.task || "\u2014"}\n   Javob: ${q.answer || "\u2014"}\n   Level: ${q.level || "\u2014"}\n\n`;
    });
    zip.file("writing.txt", writingTxt);

    // READING
    const reading = safeArray(examAnswers.reading);
    let readingTxt = "READING\n====================\n";
    reading.forEach((passage, i) => {
      if (!passage || !Array.isArray(passage.questions)) return;
      readingTxt += `PASSAGE ${i + 1}\n`;
      passage.questions.forEach((q, j) => {
        readingTxt += `${j + 1}. ${q.question || "\u2014"}\n   Javob: ${q.answer || "\u2014"}\n\n`;
      });
      readingTxt += "--------------------\n";
    });
    zip.file("reading.txt", readingTxt);

    // SPEAKING
    const speaking = safeArray(examAnswers.speaking);
    let speakingTxt = "SPEAKING\n====================\n";
    speaking.forEach((q, i) => {
      speakingTxt += `${i + 1}. ${q.question || "\u2014"}\n   Daraja: ${q.difficulty || "\u2014"}\n\n`;
    });
    zip.file("speaking.txt", speakingTxt);

    // SPEAKING AUDIO
    let audioFileIndex = 1;

    if (speakingAudioFromDB && speakingAudioFromDB.length > 0) {
      const sortedAudio = speakingAudioFromDB.sort((a, b) => {
        const idA = parseInt((a.id || '').replace('audio_', '')) || 0;
        const idB = parseInt((b.id || '').replace('audio_', '')) || 0;
        return idA - idB;
      });

      sortedAudio.forEach((audioData) => {
        if (audioData && audioData.blob && audioData.blob.size > 1000) {
          zip.file(`speaking_audio_${audioFileIndex}.webm`, audioData.blob);
          audioFileIndex++;
        }
      });
    }

    if (audioFileIndex === 1) {
      const speakingAnswers = safeArray(examAnswers.speaking);
      speakingAnswers.forEach((q) => {
        if (q.audio && q.audio.startsWith('data:') && q.audioIndex !== -1) {
          const base64Data = q.audio.split(",")[1];
          if (base64Data) {
            zip.file(`speaking_audio_${audioFileIndex}.webm`, base64Data, { base64: true });
            audioFileIndex++;
          }
        }
      });
    }

    // PHOTO
    let photoAdded = false;
    if (examAnswers.photo) {
      const base64Data = examAnswers.photo.split(",")[1];
      if (base64Data) {
        zip.file("photo.png", base64Data, { base64: true });
        photoAdded = true;
      }
    }
    if (!photoAdded && currentUser && currentUser.photo) {
      const base64Data = currentUser.photo.split(",")[1];
      if (base64Data) {
        zip.file("photo.png", base64Data, { base64: true });
        photoAdded = true;
      }
    }

    // PAYMENT RECEIPT
    if (currentUser && currentUser.email) {
      const paymentData = JSON.parse(localStorage.getItem("paymentReceipt_" + currentUser.email) || "null");
      if (paymentData && paymentData.fileData) {
        const commaIndex = paymentData.fileData.indexOf(",");
        if (commaIndex !== -1) {
          const receiptBase64 = paymentData.fileData.substring(commaIndex + 1);
          zip.file("payment_receipt.png", receiptBase64, { base64: true });
        }
      }
    }

    // ZIP YARATISH VA TELEGRAMGA YUBORISH
    const blob = await zip.generateAsync({ type: "blob" });
    const fileName = "EXAM_RESULT_" + (currentUser.email || "user") + ".zip";
    
    const caption = `\uD83D\uDCDA Yangi imtihon javoblari!\n\n` +
      `\uD83D\uDC64 Ism: ${currentUser.name || 'Noma\u2018lum'}\n` +
      `\uD83D\uDCE7 Email: ${currentUser.email || 'Noma\u2018lum'}\n` +
      `\uD83D\uDCF1 Telefon: ${currentUser.phone || 'Noma\u2018lum'}\n` +
      `\uD83D\uDCC5 Sana: ${new Date().toLocaleString('uz-UZ')}\n\n` +
      `\uD83D\uDCCA Natijalar:\n` +
      `\u2022 Grammar: ${grammar.length}/40\n` +
      `\u2022 Reading: ${reading.length}/40\n` +
      `\u2022 Listening: ${listening.length}/40\n` +
      `\u2022 Writing: ${writing.length}/2\n` +
      `\u2022 Speaking: ${audioFileIndex - 1}/6`;
    
    // TELEGRAMGA YUBORISH (KOMPYUTERGA EMAS!)
    const telegramResult = await sendToTelegram(blob, fileName, caption);
    
    if (telegramResult.success) {
      alert(telegramResult.message);
    } else {
      alert(telegramResult.message + "\n\nJavoblarni qo'lda saqlab qoling.");
    }

    // ESKI JAVOBLARNI TOZALASH
    localStorage.removeItem("examAnswers");
    localStorage.setItem("examAnswers", JSON.stringify({}));
    await clearSpeakingAudioIndexedDB();

    for (let i = 0; i < 100; i++) {
      localStorage.removeItem('speaking_audio_' + i);
    }

    if (typeof showFinishScreen === 'function') {
      showFinishScreen();
    }

  } catch (error) {
    console.error("submitAll xatosi:", error);
    alert("\u274C Xatolik: " + error.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Javoblarni yuborish';
    }
  }
}

// IndexedDB dan barcha speaking audio larni olish
function getAllSpeakingAudioFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const DB_NAME = "examDB";
    const STORE_NAME = "speakingAudio";

    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => resolve([]);

    request.onsuccess = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        resolve([]);
        return;
      }

      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };

      getAllRequest.onerror = () => resolve([]);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

// IndexedDB dan speaking audio larni tozalash
function clearSpeakingAudioIndexedDB() {
  return new Promise((resolve) => {
    const DB_NAME = "examDB";
    const STORE_NAME = "speakingAudio";

    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => resolve();

    request.onsuccess = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        resolve();
        return;
      }

      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

function safeArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [];
}

// ============================================
// PAGE INIT - ISTISNO TEKSHIRUVI BILAN
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
  const paymentSection = document.getElementById('paymentSection');
  const mainScreen = document.getElementById('mainScreen');

  if (paymentSection && mainScreen) {
    // Boshlang'ich holat
    paymentSection.style.display = 'block';
    mainScreen.style.display = 'none';

    const paymentVerified = localStorage.getItem('paymentVerified') === 'true';
    const user = getCurrentUser();

    if (user && user.email) {
      // ISTISNO TEKSHIRUVI - BIRINCHI O'RINDA!
      const isExempt = await checkExemptStatus(user.email);
      
      if (isExempt) {
        console.log('Istisno foydalanuvchi:', user.email);
        
        // To'lovni avtomatik tasdiqlash
        localStorage.setItem('paymentVerified', 'true');
        
        // Vaqt o'rnatish
        localStorage.removeItem('examEndTime');
        const savedDuration = localStorage.getItem("examDuration");
        const examDuration = savedDuration ? parseInt(savedDuration) : (3 * 60 * 60 * 1000);
        const endTime = Date.now() + examDuration;
        localStorage.setItem('examEndTime', endTime);
        examEndTime = new Date(endTime);
        
        // Payment section ni yashirish va main screen ni ko'rsatish
        paymentSection.style.display = 'none';
        mainScreen.style.display = 'block';
        startExamTimer();
        
        // Istisno xabarini ko'rsatish
        const statusEl = document.getElementById('paymentStatus');
        if (statusEl) {
          statusEl.className = 'payment-status success';
          statusEl.textContent = '\u2705 Siz istisno ro\u2018yxatidasiz. To\u2018lov talab qilinmaydi.';
          statusEl.style.display = 'block';
          
          setTimeout(() => {
            statusEl.style.display = 'none';
          }, 3000);
        }
        
        return; // Payment tekshiruvini o'tkazib yuborish
      }
      
      // ISTISNO EMAS - payment tekshiruvi
      if (paymentVerified) {
        paymentSection.style.display = 'none';
        mainScreen.style.display = 'block';
        startExamTimer();
      }
    }
  }

  // Admin panel
  const adminPanel = document.getElementById('adminPanel');
  if (isAdmin() && adminPanel) {
    adminPanel.style.display = 'block';
  }

  // Timer har doim ishga tushsin
  startExamTimer();
});