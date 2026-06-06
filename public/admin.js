// ============================================
// admin.js — FAQAT ADMIN PANEL FUNKSIYALARI
// admin.html da script.js DAN KEYIN ulanadi
// ============================================

// ============================================
// LOCALSTORAGE ONLY (Firestore muammolari uchun)
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

// ============================================
// ISTISNO LOGINLAR BOSHQARUVI
// ============================================

function addExemptLogin() {
  console.log("addExemptLogin() chaqirildi");

  const input = document.getElementById('exemptEmail');
  const btn = document.getElementById('btnAddExempt');

  if (!input) {
    showAdminStatus('Xatolik: input elementi topilmadi!', 'error');
    return;
  }

  const email = input.value.trim().toLowerCase();

  if (!email || !email.includes('@')) {
    showAdminStatus('Iltimos, to\'g\'ri email kiriting!', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saqlanmoqda...';
  }

  try {
    LocalDB.addExemptLogin(email);
    input.value = '';
    showAdminStatus('✅ Istisno login qo\'shildi!', 'success');
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
  console.log("removeExemptLogin() chaqirildi:", email);

  if (!confirm(email + ' ni istisno ro\'yxatidan o\'chirmoqchimisiz?')) {
    return;
  }

  try {
    LocalDB.removeExemptLogin(email);
    showAdminStatus('✅ Istisno login o\'chirildi!', 'success');
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
      list.innerHTML = '<li class="exempt-empty">Hozircha istisno loginlar yo\'q</li>';
      return;
    }

    list.innerHTML = '';
    logins.forEach(login => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${escapeHtml(login.email)}</span>
        <button onclick="removeExemptLogin('${escapeHtml(login.email)}')">O\'chirish</button>
      `;
      list.appendChild(li);
    });

  } catch (error) {
    console.error('Xatolik:', error);
    list.innerHTML = '<li class="exempt-empty">❌ Xatolik yuz berdi</li>';
  }
}

function clearAllExemptLogins() {
  if (!confirm('BARCHA istisno loginlarni o\'chirmoqchimisiz?')) {
    return;
  }

  localStorage.removeItem('exemptLogins');
  showAdminStatus('✅ Barcha istisno loginlar tozalandi!', 'success');
  loadExemptList();
}

// ============================================
// VAQT BOSHQARUVI
// ============================================

function setExamTime() {
  console.log("=== setExamTime() BOSHLANDI ===");

  const hoursInput = document.getElementById('examHours');
  const minutesInput = document.getElementById('examMinutes');
  const display = document.getElementById('timeControlDisplay');
  const btn = document.getElementById('btnSetTime');

  console.log("hoursInput:", hoursInput ? "topildi" : "YO'Q");
  console.log("minutesInput:", minutesInput ? "topildi" : "YO'Q");
  console.log("display:", display ? "topildi" : "YO'Q");
  console.log("btn:", btn ? "topildi" : "YO'Q");

  if (!hoursInput || !minutesInput) {
    console.error("INPUTLAR TOPILMADI!");
    showAdminStatus('Xatolik: input elementlari topilmadi!', 'error');
    return;
  }

  const hours = parseInt(hoursInput.value) || 0;
  const minutes = parseInt(minutesInput.value) || 0;

  console.log("Kiritilgan vaqt:", hours, "soat", minutes, "daqiqa");

  if (hours === 0 && minutes === 0) {
    showAdminStatus('Iltimos, to\'g\'ri vaqt kiriting!', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saqlanmoqda...';
  }

  try {
    console.log("LocalDB.setExamTime chaqirilmoqda...");
    const settings = LocalDB.setExamTime(hours, minutes);
    console.log("LocalDB.setExamTime natija:", settings);

    // TEKSHIRISH
    const savedDuration = localStorage.getItem('examDuration');
    console.log("SAQLANGAN examDuration:", savedDuration);

    const savedSettings = localStorage.getItem('examTimeSettings');
    console.log("SAQLANGAN examTimeSettings:", savedSettings);

    if (typeof examEndTime !== 'undefined') {
      examEndTime = new Date(settings.endTime);
    }

    if (display) {
      display.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    }

    showAdminStatus('✅ Imtihon vaqti o\'rnatildi! (LocalStorage)', 'success');

    if (typeof startExamTimer === 'function') {
      startExamTimer();
    }
  } catch (error) {
    console.error('XATOLIK:', error);
    showAdminStatus('❌ Xatolik: ' + error.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '✅ Vaqt o\'rnatish';
    }
  }
  console.log("=== setExamTime() TUGADI ===");
}

function resetExamTime() {
  console.log("resetExamTime() chaqirildi");

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
    // Debug: localStorage dan qiymatlarni ko'rsatish
    const rawDuration = localStorage.getItem('examDuration');
    const rawEndTime = localStorage.getItem('examEndTime');
    console.log('loadExamTime - examDuration:', rawDuration, 'ms =', rawDuration ? (parseInt(rawDuration)/(60*60*1000)).toFixed(2) : 'null', 'soat');
    console.log('loadExamTime - examEndTime:', rawEndTime ? new Date(parseInt(rawEndTime)).toLocaleString() : 'null');

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

// ============================================
// YORDAMCHI FUNKSIYALAR
// ============================================

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

// ============================================
// ADMIN PANEL INIT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('admin.js yuklandi');
  loadExemptList();
  loadExamTime();
});