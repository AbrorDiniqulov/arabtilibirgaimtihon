let listening = JSON.parse(localStorage.getItem("listening")) || [];

renderQuestions();
render();

/* 🔥 SAVOLLARNI HTMLGA CHIQARADI */
function renderQuestions(){

const box = document.getElementById("questions");

box.innerHTML = "";

for(let i=1;i<=5;i++){

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

/* 💾 SAQLASH */
function addListening(){

const section = document.getElementById("section").value;
const audio = document.getElementById("audio").value;

if(audio === ""){
alert("Audio kiriting");
return;
}

let questions = [];

for(let i=1;i<=5;i++){

questions.push({

question: document.getElementById(`q${i}`).value,

options: [
document.getElementById(`q${i}a`).value,
document.getElementById(`q${i}b`).value,
document.getElementById(`q${i}c`).value,
document.getElementById(`q${i}d`).value
]

});

}

listening.push({
section,
audio,
questions,
active:false
});

localStorage.setItem("listening", JSON.stringify(listening));

clearInputs();
render();

/* 🔥 SAVE SECTION (FAQAT SHU QO‘SHILDI) */
saveSection("listening", listening);
}

/* 📄 CHIQARISH */
function render(){

const list = document.getElementById("list");
list.innerHTML = "";

listening.forEach((item,index)=>{

list.innerHTML += `

<div class="item">

<h3>${item.section}</h3>

<audio controls src="${item.audio}" style="width:100%"></audio>

${item.questions.map((q,i)=>`

<div style="margin-top:10px;">
<b>${i+1}. ${q.question}</b>

<p>A) ${q.options[0]}</p>
<p>B) ${q.options[1]}</p>
<p>C) ${q.options[2]}</p>
<p>D) ${q.options[3]}</p>
</div>

`).join("")}

<p>
${item.active ? "🟢 Aktiv" : "🔴 Nofaol"}
</p>

<button onclick="toggle(${index})">
Faollashtirish
</button>

<button onclick="removeItem(${index})">
O‘chirish
</button>

</div>

`;

});

}

/* 🔄 TOGGLE */
function toggle(index){

listening[index].active = !listening[index].active;

localStorage.setItem("listening", JSON.stringify(listening));

render();

/* 🔥 SAVE SECTION UPDATE */
saveSection("listening", listening);
}

/* ❌ DELETE */
function removeItem(index){

listening.splice(index,1);

localStorage.setItem("listening", JSON.stringify(listening));

render();

/* 🔥 SAVE SECTION UPDATE */
saveSection("listening", listening);
}


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

/* 🧹 CLEAR */
function clearInputs(){

document.getElementById("audio").value="";

for(let i=1;i<=5;i++){

document.getElementById(`q${i}`).value="";
document.getElementById(`q${i}a`).value="";
document.getElementById(`q${i}b`).value="";
document.getElementById(`q${i}c`).value="";
document.getElementById(`q${i}d`).value="";

}

}