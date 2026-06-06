let questions =
JSON.parse(localStorage.getItem("grammarQuestions")) || [];

renderQuestions();

function addQuestion(){

const question =
document.getElementById("question").value;

const a =
document.getElementById("a").value;

const b =
document.getElementById("b").value;

const c =
document.getElementById("c").value;

const d =
document.getElementById("d").value;

const newQuestion = {

question:question,

options:[a,b,c,d],

};

questions.push(newQuestion);

localStorage.setItem(
"grammarQuestions",
JSON.stringify(questions)
);

renderQuestions();

/* 🔥 SAVE SECTION (FAQAT SHU QO‘SHILDI) */
saveSection("grammar", questions);

}

function renderQuestions(){

const list =
document.getElementById("questionsList");

list.innerHTML = "";

questions.forEach((q,index)=>{

list.innerHTML += `

<div style="
border:1px solid white;
padding:15px;
margin-bottom:20px;
">

<h3>${q.question}</h3>

<p>A) ${q.options[0]}</p>
<p>B) ${q.options[1]}</p>
<p>C) ${q.options[2]}</p>
<p>D) ${q.options[3]}</p>

<p>
${q.active ? "✅ Aktiv" : "⛔ To'xtatilgan"}
</p>

<button onclick="toggleQuestion(${index})">

${q.active ? "To'xtatish" : "Faollashtirish"}

</button>

</div>

`;

});

}

function toggleQuestion(index){

questions[index].active =
!questions[index].active;

localStorage.setItem(
"grammarQuestions",
JSON.stringify(questions)
);

renderQuestions();

/* 🔥 SAVE SECTION UPDATE */
saveSection("grammar", questions);


/* 🔥 UNIVERSAL SAVE FUNCTION */
function saveSection(sectionName, questions) {

  let text = `${sectionName.toUpperCase()} ANSWERS\n\n`;

  questions.forEach((q, i) => {

    text += `${i + 1}. ${answers[i] || ""}\n`;

  });

  // TXT ko‘rinishda saqlaydi
  localStorage.setItem(
    `${sectionName}_txt`,
    text
  );

}