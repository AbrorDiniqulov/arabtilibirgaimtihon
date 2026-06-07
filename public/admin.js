// ============================================
// admin.js — FAQAT ADMIN PANEL FUNKSIYALARI
// ============================================

const LocalDB = {
  getExemptLogins() {
    try {
      return JSON.parse(localStorage.getItem('exemptLogins') || '[]');
    } catch {
      return [];
    }
  },

  setExemptLogins(logins) {
    localStorage.setItem('exemptLogins', JSON.stringify(logins));
  },

  addExemptLogin(email) {
    const logins = this.getExemptLogins();
    if (!logins.find(l => l.email === email)) {
      logins.push({
        email: email,
        addedAt: new Date().toISOString(),
        addedBy: getCurrentUser() ? getCurrentUser().email : 'admin'
      });
      this.setExemptLogins(logins);
    }
  },

  removeExemptLogin(email) {
    let logins = this.getExemptLogins();
    logins = logins.filter(l => l.email !== email);
    this.setExemptLogins(logins);
  },

  getExamTime() {
    try {
      return JSON.parse(localStorage.getItem('examTimeSettings') || 'null');
    } catch {
      return null;
    }
  },

  setExamTime(hours, minutes) {
    const totalMs = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
    const endTime = new Date(Date.now() + totalMs);
    const settings = {
      hours: hours,
      minutes: minutes,
      endTime: endTime.toISOString(),
      setAt: new Date().toISOString(),
      setBy: getCurrentUser() ? getCurrentUser().email : 'admin'
    };
    localStorage.setItem('examTimeSettings', JSON.stringify(settings));
    localStorage.setItem('examEndTime', endTime.getTime().toString());
    localStorage.setItem('examDuration', totalMs.toString());
    return settings;
  },

  clearExamTime() {
    localStorage.removeItem('examTimeSettings');
    localStorage.removeItem('examEndTime');
    localStorage.removeItem('examDuration');
  }
};

const QuestionsDB = {
  async addQuestion(section, questionData) {
    try {
      if (typeof db !== 'undefined' && db.collection) {
        await db.collection('questions').add({
          section: section,
          ...questionData,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdBy: getCurrentUser() ? getCurrentUser().email : 'admin'
        });
      } else {
        const questions = JSON.parse(localStorage.getItem('questions_' + section) || '[]');
        questions.push({
          ...questionData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          createdBy: getCurrentUser() ? getCurrentUser().email : 'admin'
        });
        localStorage.setItem('questions_' + section, JSON.stringify(questions));
      }
      return true;
    } catch (error) {
      console.error('Savol saqlashda xatolik:', error);
      throw error;
    }
  },

  async getQuestions(section) {
    try {
      if (typeof db !== 'undefined' && db.collection) {
        const snapshot = await db.collection('questions')
          .where('section', '==', section)
          .orderBy('createdAt', 'desc')
          .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else {
        return JSON.parse(localStorage.getItem('questions_' + section) || '[]');
      }
    } catch (error) {
      console.error('Savollarni o'qishda xatolik:', error);
      return JSON.parse(localStorage.getItem('questions_' + section) || '[]');
    }
  },

  async deleteQuestion(section, questionId) {
    try {
      if (typeof db !== 'undefined' && db.collection) {
        await db.collection('questions').doc(questionId).delete();
      } else {
        let questions = JSON.parse(localStorage.getItem('questions_' + section) || '[]');
        questions = questions.filter(q => q.id !== questionId);
        localStorage.setItem('questions_' + section, JSON.stringify(questions));
      }
      return true;
    } catch (error) {
      console.error('Savol o'chirishda xatolik:', error);
      throw error;
    }
  },

  clearAllQuestions(section) {
    if (typeof db !== 'undefined' && db.collection) {
      db.collection('questions').where('section', '==', section).get()
        .then(snapshot => {
          snapshot.docs.forEach(doc => doc.ref.delete());
        });
    }
    localStorage.removeItem('questions_' + section);
  }
};

function addExemptLogin() {
  const input = document.getElementById('exemptEmail');
  const btn = document.getElementById('btnAddExempt');

  if (!input) {
    showAdminStatus('Xatolik: input elementi topilmadi!', 'error');
    return;
  }

  const email = input.value.trim().toLowerCase();

  if (!email || !email.includes('@')) {
    showAdminStatus('Iltimos, to'g'ri email kiriting!', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saqlanmoqda...';
  }

  try {
    LocalDB.addExemptLogin(email);
    input.value = '';
    showAdminStatus('✅ Istisno login qo'shildi!', 'success');
    loadExemptList();
  } catch (error) {
    console.error('Xatolik:', error);
    showAdminStatus('❌ Xatolik: ' + error.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Qo'shish";
    }
  }
}

function removeExemptLogin(email) {
  if (!confirm(email + ' ni istisno ro'yxatidan o'chirmoqchimisiz?')) {
    return;
  }

  try {
    LocalDB.removeExemptLogin(email);
    showAdminStatus('✅ Istisno login o'chirildi!', 'success');
    loadExemptList();
  } catch (error) {
    console.error('Xatolik:', error);
    showAdminStatus('❌ Xatolik: ' + error.message, 'error');
  }
}

function loadExemptList() {
  const list = document.getElementById('exemptList');
  if (!list) return;

  try {
    const logins = LocalDB.getExemptLogins();

    if (logins.length === 0) {
      list.innerHTML = '<li class="exempt-empty">Hozircha istisno loginlar yo'q</li>';
      return;
    }

    list.innerHTML = '';
    logins.forEach(login => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${escapeHtml(login.email)}</span>
        <button onclick="removeExemptLogin('${escapeHtml(login.email)}')">O'chirish</button>
      `;
      list.appendChild(li);
    });

  } catch (error) {
    console.error('Xatolik:', error);
    list.innerHTML = '<li class="exempt-empty">❌ Xatolik yuz berdi</li>';
  }
}

function clearAllExemptLogins() {
  if (!confirm('BARCHA istisno loginlarni o'chirmoqchimisiz?')) {
    return;
  }

  localStorage.removeItem('exemptLogins');
  showAdminStatus('✅ Barcha istisno loginlar tozalandi!', 'success');
  loadExemptList();
}

async function addQuestion() {
  console.log("addQuestion() chaqirildi");

  const section = document.getElementById('questionSection')?.value;
  const btn = document.getElementById('btnAddQuestion');

  if (!section) {
    showAdminStatus('Iltimos, bo'lim tanlang!', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saqlanmoqda...';
  }

  try {
    let questionData = {};
    const text = document.getElementById('questionText')?.value.trim();

    if (!text) {
      showAdminStatus('Iltimos, savol matnini kiriting!', 'error');
      return;
    }

    switch(section) {
      case 'grammar':
        questionData = buildGrammarQuestion(text);
        break;
      case 'reading':
        questionData = buildReadingQuestion(text);
        break;
      case 'listening':
        questionData = buildListeningQuestion(text);
        break;
      case 'writing':
        questionData = buildWritingQuestion(text);
        break;
      case 'speaking':
        questionData = buildSpeakingQuestion(text);
        break;
      default:
        questionData = buildGrammarQuestion(text);
    }

    if (!questionData) {
      showAdminStatus('Iltimos, barcha kerakli maydonlarni to'ldiring!', 'error');
      return;
    }

    await QuestionsDB.addQuestion(section, questionData);

    clearQuestionForm(section);

    showAdminStatus('✅ Savol muvaffaqiyatli qo'shildi!', 'success');
    loadQuestionsList(section);
  } catch (error) {
    console.error('Xatolik:', error);
    showAdminStatus('❌ Xatolik: ' + error.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Savol qo'shish";
    }
  }
}

function buildGrammarQuestion(text) {
  const optionA = document.getElementById('optionA')?.value.trim();
  const optionB = document.getElementById('optionB')?.value.trim();
  const optionC = document.getElementById('optionC')?.value.trim();
  const optionD = document.getElementById('optionD')?.value.trim();
  const correct = document.getElementById('correctAnswer')?.value;

  if (!optionA || !optionB || !optionC || !optionD || !correct) {
    return null;
  }

  return {
    text: text,
    options: { A: optionA, B: optionB, C: optionC, D: optionD },
    correct: correct,
    active: true
  };
}

function buildReadingQuestion(text) {
  const passage = document.getElementById('readingPassage')?.value.trim();
  const optionA = document.getElementById('optionA')?.value.trim();
  const optionB = document.getElementById('optionB')?.value.trim();
  const optionC = document.getElementById('optionC')?.value.trim();
  const optionD = document.getElementById('optionD')?.value.trim();
  const correct = document.getElementById('correctAnswer')?.value;

  if (!passage) {
    return null;
  }

  let questionData = {
    text: passage,
    questions: [{
      text: text,
      options: {},
      active: true
    }],
    active: true
  };

  if (optionA && optionB && optionC && optionD) {
    questionData.questions[0].options = { A: optionA, B: optionB, C: optionC, D: optionD };
    questionData.questions[0].correct = correct;
  }

  return questionData;
}

function buildListeningQuestion(text) {
  const audioUrl = document.getElementById('listeningAudio')?.value.trim();
  const optionA = document.getElementById('optionA')?.value.trim();
  const optionB = document.getElementById('optionB')?.value.trim();
  const optionC = document.getElementById('optionC')?.value.trim();
  const optionD = document.getElementById('optionD')?.value.trim();
  const correct = document.getElementById('correctAnswer')?.value;

  if (!audioUrl) {
    return null;
  }

  let questionData = {
    text: text,
    audio: audioUrl,
    questions: [{
      text: text,
      options: {},
      active: true
    }],
    active: true
  };

  if (optionA && optionB && optionC && optionD) {
    questionData.questions[0].options = { A: optionA, B: optionB, C: optionC, D: optionD };
    questionData.questions[0].correct = correct;
  }

  return questionData;
}

function buildWritingQuestion(text) {
  const topic = document.getElementById('writingTopic')?.value.trim();
  const task = document.getElementById('writingTask')?.value.trim();
  const level = document.getElementById('writingLevel')?.value;
  const time = parseInt(document.getElementById('writingTime')?.value) || 20;

  if (!topic || !task) {
    return null;
  }

  return {
    text: topic,
    task: task,
    level: level,
    time: time,
    active: true
  };
}

function buildSpeakingQuestion(text) {
  const difficulty = document.getElementById('speakingDifficulty')?.value;
  const prep = parseInt(document.getElementById('speakingPrep')?.value) || 30;
  const answer = parseInt(document.getElementById('speakingAnswer')?.value) || 60;

  return {
    text: text,
    difficulty: difficulty,
    timer: { prep: prep, answer: answer },
    active: true
  };
}

function clearQuestionForm(section) {
  document.getElementById('questionText').value = '';

  switch(section) {
    case 'grammar':
    case 'reading':
    case 'listening':
      document.getElementById('optionA').value = '';
      document.getElementById('optionB').value = '';
      document.getElementById('optionC').value = '';
      document.getElementById('optionD').value = '';
      break;
    case 'reading':
      document.getElementById('readingPassage').value = '';
      break;
    case 'listening':
      document.getElementById('listeningAudio').value = '';
      break;
    case 'writing':
      document.getElementById('writingTopic').value = '';
      document.getElementById('writingTask').value = '';
      document.getElementById('writingTime').value = '20';
      break;
    case 'speaking':
      document.getElementById('speakingPrep').value = '30';
      document.getElementById('speakingAnswer').value = '60';
      break;
  }
}

async function loadQuestionsList(section) {
  const list = document.getElementById('questionsList');
  if (!list) return;

  try {
    const questions = await QuestionsDB.getQuestions(section);

    if (questions.length === 0) {
      list.innerHTML = '<li class="exempt-empty">Hozircha savollar yo'q</li>';
      return;
    }

    list.innerHTML = '';
    questions.forEach((q, index) => {
      const li = document.createElement('li');
      li.innerHTML = renderQuestionItem(q, index, section);
      list.appendChild(li);
    });
  } catch (error) {
    console.error('Xatolik:', error);
    list.innerHTML = '<li class="exempt-empty">❌ Xatolik yuz berdi</li>';
  }
}

function renderQuestionItem(q, index, section) {
  let extraInfo = '';

  switch(section) {
    case 'reading':
      if (q.text) extraInfo += `<div style="opacity:0.7;font-size:12px;">Passage: ${escapeHtml(q.text.substring(0, 50))}...</div>`;
      break;
    case 'listening':
      if (q.audio) extraInfo += `<div style="opacity:0.7;font-size:12px;">Audio: ${escapeHtml(q.audio)}</div>`;
      break;
    case 'writing':
      extraInfo += `<div style="opacity:0.7;font-size:12px;">Level: ${escapeHtml(q.level)} | Time: ${q.time}min</div>`;
      break;
    case 'speaking':
      extraInfo += `<div style="opacity:0.7;font-size:12px;">Difficulty: ${escapeHtml(q.difficulty)} | Prep: ${q.timer?.prep}s | Answer: ${q.timer?.answer}s</div>`;
      break;
  }

  return `
    <div class="question-item">
      <strong>${index + 1}. ${escapeHtml(q.text || q.question)}</strong>
      ${extraInfo}
      <div class="options">
        A) ${escapeHtml(q.options?.A || q.optionA || '')} 
        B) ${escapeHtml(q.options?.B || q.optionB || '')} 
        C) ${escapeHtml(q.options?.C || q.optionC || '')} 
        D) ${escapeHtml(q.options?.D || q.optionD || '')}
      </div>
      ${q.correct ? `<div class="correct">To'g'ri javob: ${escapeHtml(q.correct)}</div>` : ''}
      <button onclick="deleteQuestion('${section}', '${q.id}')">O'chirish</button>
    </div>
  `;
}

async function deleteQuestion(section, questionId) {
  if (!confirm('Bu savolni o'chirmoqchimisiz?')) {
    return;
  }

  try {
    await QuestionsDB.deleteQuestion(section, questionId);
    showAdminStatus('✅ Savol o'chirildi!', 'success');
    loadQuestionsList(section);
  } catch (error) {
    console.error('Xatolik:', error);
    showAdminStatus('❌ Xatolik: ' + error.message, 'error');
  }
}

function clearAllQuestions() {
  const section = document.getElementById('questionSection')?.value;
  if (!section) {
    showAdminStatus('Iltimos, bo'lim tanlang!', 'error');
    return;
  }

  if (!confirm(`BARCHA ${section.toUpperCase()} savollarini o'chirmoqchimisiz?`)) {
    return;
  }

  QuestionsDB.clearAllQuestions(section);
  showAdminStatus('✅ Barcha savollar tozalandi!', 'success');
  loadQuestionsList(section);
}

function setExamTime() {
  const hoursInput = document.getElementById('examHours');
  const minutesInput = document.getElementById('examMinutes');
  const display = document.getElementById('timeControlDisplay');
  const btn = document.getElementById('btnSetTime');

  if (!hoursInput || !minutesInput) {
    showAdminStatus('Xatolik: input elementlari topilmadi!', 'error');
    return;
  }

  const hours = parseInt(hoursInput.value) || 0;
  const minutes = parseInt(minutesInput.value) || 0;

  if (hours === 0 && minutes === 0) {
    showAdminStatus('Iltimos, to'g'ri vaqt kiriting!', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saqlanmoqda...';
  }

  try {
    const settings = LocalDB.setExamTime(hours, minutes);

    if (typeof examEndTime !== 'undefined') {
      examEndTime = new Date(settings.endTime);
    }

    if (display) {
      display.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    }

    showAdminStatus('✅ Imtihon vaqti o'rnatildi! (LocalStorage)', 'success');

    if (typeof startExamTimer === 'function') {
      startExamTimer();
    }
  } catch (error) {
    console.error('XATOLIK:', error);
    showAdminStatus('❌ Xatolik: ' + error.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '✅ Vaqt o'rnatish';
    }
  }
}

function resetExamTime() {
  const display = document.getElementById('timeControlDisplay');
  const btn = document.getElementById('btnResetTime');

  if (!confirm('Imtihon vaqtini tozalamoqchimisiz?')) {
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Tozalanmoqda...';
  }

  try {
    LocalDB.clearExamTime();

    if (typeof examEndTime !== 'undefined') {
      examEndTime = null;
    }

    if (typeof examTimerInterval !== 'undefined' && examTimerInterval) {
      clearInterval(examTimerInterval);
      examTimerInterval = null;
    }

    if (display) {
      display.textContent = 'Vaqtni belgilash kerak';
    }

    const timerEl = document.getElementById('globalTimer');
    if (timerEl) timerEl.textContent = '00:00:00';

    showAdminStatus('✅ Imtihon vaqti tozalandi!', 'success');
  } catch (error) {
    console.error('Xatolik:', error);
    showAdminStatus('❌ Xatolik: ' + error.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🗑️ Vaqt tozalash';
    }
  }
}

function loadExamTime() {
  const display = document.getElementById('timeControlDisplay');
  const hoursInput = document.getElementById('examHours');
  const minutesInput = document.getElementById('examMinutes');

  if (!display) return;

  try {
    const settings = LocalDB.getExamTime();

    if (settings) {
      const hours = settings.hours || 0;
      const minutes = settings.minutes || 0;

      display.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      if (hoursInput) hoursInput.value = hours;
      if (minutesInput) minutesInput.value = minutes;

      if (typeof examEndTime !== 'undefined') {
        examEndTime = new Date(settings.endTime);
      }
    } else {
      display.textContent = 'Vaqtni belgilash kerak';
    }
  } catch (error) {
    console.error('Xatolik:', error);
    display.textContent = '❌ Yuklashda xatolik';
  }
}

function showAdminStatus(message, type) {
  const status = document.getElementById('timeControlStatus');
  if (!status) {
    if (type === 'error') alert(message);
    return;
  }
  status.className = 'payment-status ' + type;
  status.textContent = message;
  status.style.display = 'block';

  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('admin.js yuklandi');
  loadExemptList();
  loadExamTime();

  const questionSection = document.getElementById('questionSection');
  if (questionSection) {
    loadQuestionsList(questionSection.value);
    questionSection.addEventListener('change', (e) => {
      loadQuestionsList(e.target.value);
    });
  }
});
