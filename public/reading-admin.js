let reading = JSON.parse(localStorage.getItem("reading")) || [];

/* ================= INIT ================= */
renderQuestions();
render();

/* ================= SAVOLLAR CHIQARISH ================= */
function renderQuestions() {

  const box = document.getElementById("questions");
  box.innerHTML = "";

  for (let i = 1; i <= 5; i++) {

    box.innerHTML += `
      <div class="question">

        <h3>${i}-savol</h3>

        <input id="q${i}" placeholder="Savol">

        <input id="q${i}a" placeholder="A">
        <input id="q${i}b" placeholder="B">
        <input id="q${i}c" placeholder="C">
        <input id="q${i}d" placeholder="D">

      </div>
    `;
  }
}

/* ================= SAQLASH (FIXED) ================= */
function addReading() {

  const section = document.getElementById("section").value;
  const text = document.getElementById("text").value.trim();

  if (!text) {
    alert("Matn kiriting!");
    return;
  }

  let questions = [];

  for (let i = 1; i <= 5; i++) {

    const q = document.getElementById(`q${i}`).value.trim();
    const a = document.getElementById(`q${i}a`).value.trim();
    const b = document.getElementById(`q${i}b`).value.trim();
    const c = document.getElementById(`q${i}c`).value.trim();
    const d = document.getElementById(`q${i}d`).value.trim();

    // ❗ FIX: bo‘sh savol yoki option bo‘lmasin
    if (!q || !a || !b || !c || !d) {
      alert(`${i}-savolda bo‘sh maydon bor!`);
      return;
    }

    questions.push({
      question: q,
      options: [a, b, c, d]
    });
  }

  reading.push({
    section,
    text,
    questions,
    active: false
  });

  localStorage.setItem("reading", JSON.stringify(reading));

  clearInputs();
  render();

  if (typeof saveSection === "function") {
    saveSection("reading", reading);
  }
}

/* ================= CHIQARISH ================= */
function render() {

  const list = document.getElementById("list");
  list.innerHTML = "";

  reading.forEach((item, index) => {

    const textClass = isArabic(item.text) ? 'rtl-text' : '';

    list.innerHTML += `
      <div class="item">

        <h3>${item.section}</h3>

        <p class="${textClass}">${item.text}</p>

        ${item.questions.map((q, i) => `

          <div style="margin-top:10px; padding:10px; background:#2c5364; border-radius:8px;">

            <b>${i + 1}. ${q.question || "Savol yo‘q"}</b>

            <p>A) ${q.options?.[0] || ""}</p>
            <p>B) ${q.options?.[1] || ""}</p>
            <p>C) ${q.options?.[2] || ""}</p>
            <p>D) ${q.options?.[3] || ""}</p>

          </div>

        `).join("")}

        <p>${item.active ? "🟢 Aktiv" : "🔴 Nofaol"}</p>

        <button onclick="toggle(${index})">
          ${item.active ? "To‘xtatish" : "Aktiv qilish"}
        </button>

        <button onclick="removeItem(${index})">
          O‘chirish
        </button>

      </div>
    `;
  });
}

/* ================= TOGGLE ================= */
function toggle(index) {

  if (!Array.isArray(reading)) return;

  if (!reading[index]) return;

  reading[index].active = !reading[index].active;

  localStorage.setItem("reading", JSON.stringify(reading));

  if (typeof render === "function") {
    render();
  }
}
/* ================= DELETE ================= */
function removeItem(index) {

  reading.splice(index, 1);

  localStorage.setItem("reading", JSON.stringify(reading));

  render();
}

/* ================= CLEAR ================= */
function clearInputs() {

  document.getElementById("text").value = "";
  document.getElementById("text").setAttribute("dir", "ltr");

  for (let i = 1; i <= 5; i++) {

    document.getElementById(`q${i}`).value = "";
    document.getElementById(`q${i}a`).value = "";
    document.getElementById(`q${i}b`).value = "";
    document.getElementById(`q${i}c`).value = "";
    document.getElementById(`q${i}d`).value = "";
  }
}