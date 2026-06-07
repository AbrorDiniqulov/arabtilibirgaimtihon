// ============================================
// login.js — LOGIN & REGISTER FUNKSIYALARI
// login.html da ulanadi
// ============================================

/* ================= SCREEN ================= */

function showRegister() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("registerBox").style.display = "block";
}

function showLogin() {
  document.getElementById("loginBox").style.display = "block";
  document.getElementById("registerBox").style.display = "none";
  closeCamera();
}


/* ================= PHOTO / CAMERA ================= */

let capturedPhoto = null;
let cameraStream = null;

function startCamera() {
  const video = document.getElementById("cameraVideo");
  const snapBtn = document.getElementById("snapBtn");
  const closeBtn = document.getElementById("closeCamBtn");
  const preview = document.getElementById("photoPreview");

  preview.classList.remove("show");
  preview.style.display = "none";
  capturedPhoto = null;

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      cameraStream = stream;
      video.srcObject = stream;
      video.style.display = "block";
      snapBtn.style.display = "inline-block";
      closeBtn.style.display = "inline-block";
    })
    .catch(err => {
      console.error("Kamera xatosi:", err);
      alert("Kameraga ruxsat bering yoki rasm yuklang!");
    });
}

function closeCamera() {
  const video = document.getElementById("cameraVideo");
  const snapBtn = document.getElementById("snapBtn");
  const closeBtn = document.getElementById("closeCamBtn");

  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  if (video) {
    video.srcObject = null;
    video.style.display = "none";
  }
  if (snapBtn) snapBtn.style.display = "none";
  if (closeBtn) closeBtn.style.display = "none";
}

function capturePhoto() {
  const video = document.getElementById("cameraVideo");
  const canvas = document.getElementById("cameraCanvas");
  const preview = document.getElementById("photoPreview");

  if (!video || !canvas || !preview) return;

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  capturedPhoto = canvas.toDataURL("image/jpeg", 0.9);

  preview.src = capturedPhoto;
  preview.classList.add("show");
  preview.style.display = "block";

  closeCamera();
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    capturedPhoto = e.target.result;
    const preview = document.getElementById("photoPreview");
    if (preview) {
      preview.src = capturedPhoto;
      preview.classList.add("show");
      preview.style.display = "block";
    }
  };
  reader.readAsDataURL(file);
}


/* ================= REGISTER ================= */

function doRegister() {

  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const pass = document.getElementById("regPassword").value.trim();
  const pass2 = document.getElementById("regPassword2").value.trim();

  if (!name || !email || !phone || !pass || !pass2) {
    alert("Barcha maydonlarni to'ldiring!");
    return;
  }

  // Telefon raqami validatsiyasi
  const phoneRegex = /^[+]?[0-9\s\-]{9,15}$/;
  if (!phoneRegex.test(phone)) {
    alert("Telefon raqami noto'g'ri formatda!");
    return;
  }

  if (pass !== pass2) {
    alert("Parollar mos emas!");
    return;
  }

  // RASM TEKSHIRUVI - majburiy
  if (!capturedPhoto) {
    alert("Iltimos, kameradan rasmga tushing yoki rasm yuklang!");
    return;
  }

  let users = JSON.parse(localStorage.getItem("registeredUsers")) || [];

  const exists = users.find(u => u.email === email);

  if (exists) {
    alert("Bu email allaqachon mavjud!");
    return;
  }

  users.push({
    name,
    email,
    phone,
    password: pass,
    role: "student",
    photo: capturedPhoto
  });

  localStorage.setItem("registeredUsers", JSON.stringify(users));

  // RASMNI EXAM_ANSWERS GA SAQLASH
  const examAnswers = JSON.parse(localStorage.getItem("examAnswers") || "{}");
  examAnswers.photo = capturedPhoto;
  localStorage.setItem("examAnswers", JSON.stringify(examAnswers));

  alert("Ro'yxatdan o'tildi!");

  // Tozalash
  capturedPhoto = null;
  const preview = document.getElementById("photoPreview");
  if (preview) {
    preview.classList.remove("show");
    preview.src = "";
    preview.style.display = "none";
  }

  showLogin();
}


/* ================= LOGIN (EMAIL bilan) ================= */

function doLogin() {

  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPassword").value.trim();

  let users = JSON.parse(localStorage.getItem("registeredUsers")) || [];

  // Admin avtomatik yaratish
  const adminExists = users.find(u => u.role === "admin");

  if (!adminExists) {
    users.push({
      name: "Admin",
      email: "abroradmin@gmail.com",
      phone: "+998941957364",
      password: "abroradmin123",
      role: "admin"
    });
    localStorage.setItem("registeredUsers", JSON.stringify(users));
  }

  const user = users.find(
    u => u.email === email && u.password === pass
  );

  if (!user) {
    alert("Email yoki parol noto'g'ri!");
    return;
  }

  // ============================================
  // ESKI JAVOBLARNI TOZALASH - YANGI SESSIYA UCHUN
  // ============================================
  clearOldExamData();

  // USER SAQLASH
  localStorage.setItem("currentUser", JSON.stringify(user));

  // Agar foydalanuvchida rasm bo'lsa, examAnswers ga ham saqlaymiz
  if (user.photo) {
    const examAnswers = JSON.parse(localStorage.getItem("examAnswers") || "{}");
    examAnswers.photo = user.photo;
    localStorage.setItem("examAnswers", JSON.stringify(examAnswers));
  }

  // HAR SAFAR LOGIN QILGANDA YANGIDAN VAQT BOSHLANSIN
  // Eski vaqt to'liq tozalanadi
  localStorage.removeItem('examEndTime');
  localStorage.removeItem('paymentVerified');

  // TIMER FAQAT STUDENT UCHUN
  if (user.role !== "admin") {
    // Admin o'rnatgan vaqtni olish (millisekundlarda)
    const savedDuration = localStorage.getItem("examDuration");
    console.log("Admin o'rnatgan vaqt (ms):", savedDuration);

    const examDuration = savedDuration ? parseInt(savedDuration) : (3 * 60 * 60 * 1000);
    console.log("Foydalaniladigan vaqt (ms):", examDuration, "=", examDuration / (60*60*1000), "soat");

    // Vaqt HALI BOSHLANMAGAN - faqat payment tasdiqlangandan keyin
    // examEndTime hali saqlanmaydi, faqat examDuration saqlanadi
    console.log("Vaqt to'lov tasdiqlangandan keyin boshlanadi");
  }

  // ROLE-BO'YICHA YO'NALTIRISH
  if (user.role === "admin") {
    window.location.href = "admin.html";
  } else {
    // Istisno foydalanuvchilar uchun to'lov tasdiqlangan deb belgilash
    const exemptLogins = JSON.parse(localStorage.getItem('exemptLogins') || '[]');
    const isExempt = exemptLogins.find(e => e.email === user.email) !== undefined;
    if (isExempt) {
      localStorage.setItem('paymentVerified', 'true');
      // Vaqt o'rnatish
      localStorage.removeItem('examEndTime');
      const savedDuration = localStorage.getItem("examDuration");
      const examDuration = savedDuration ? parseInt(savedDuration) : (3 * 60 * 60 * 1000);
      const endTime = Date.now() + examDuration;
      localStorage.setItem('examEndTime', endTime);
    }
    window.location.href = "index.html";
  }
}


/* ================= ESKI JAVOBLARNI TOZALASH ================= */

function clearOldExamData() {
  // Barcha eski javoblarni tozalash
  localStorage.removeItem("examAnswers");
  localStorage.removeItem("listeningAnswers");

  // Eski speaking audio larni tozalash
  for (let i = 0; i < 100; i++) {
    localStorage.removeItem('speaking_audio_' + i);
  }

  // IndexedDB dan speaking audio larni tozalash
  clearSpeakingAudioIndexedDB();

  // Eski vaqt va to'lov ma'lumotlarini tozalash
  localStorage.removeItem('examEndTime');
  localStorage.removeItem('paymentVerified');

  console.log("Eski javoblar tozalandi - yangi sessiya boshlandi");
}

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


/* ================= SAHIFA YUKLANGANDA TEKSHIRUV ================= */
document.addEventListener("DOMContentLoaded", function() {
  const currentUser = localStorage.getItem("currentUser");
  if (currentUser) {
    const user = JSON.parse(currentUser);
    if (user.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "index.html";
    }
  }
});