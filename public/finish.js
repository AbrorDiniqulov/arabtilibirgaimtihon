// ============================================
// finish.js — TEST YAKUNLASH EKRANI
// ============================================

function showFinish(targetId, message) {
  let box = document.getElementById(targetId);

  if (!box) {
    const possibleIds = ['quiz', 'screen', 'content', 'main', 'writingScreen', 'split'];
    for (const id of possibleIds) {
      box = document.getElementById(id);
      if (box) break;
    }
  }

  if (!box) {
    console.error('showFinish: Element topilmadi!');
    const newDiv = document.createElement('div');
    newDiv.id = 'finishFallback';
    newDiv.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:linear-gradient(135deg,#0f2027,#203a43,#2c5364); z-index:9999; display:flex; flex-direction:column; justify-content:center; align-items:center; color:white;';
    document.body.appendChild(newDiv);
    box = newDiv;
  }

  box.innerHTML = `
    <div class="finish-screen" style="text-align: center; padding: 40px 20px; color: white;">
      <div class="finish-title" style="font-size: 28px; font-weight: bold; color: #00ffcc; margin-bottom: 15px;">${message}</div>
      <div class="finish-sub" style="font-size: 18px; opacity: 0.85; margin-bottom: 25px;">Test yakunlandi</div>
      <div class="finish-actions" style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
        <button onclick="goToMenu()" style="padding: 14px 28px; background: #00bcd4; color: white; border: none; border-radius: 12px; font-size: 16px; cursor: pointer;">🏠 Asosiy menyu</button>
        <button onclick="goToNextSection()" style="padding: 14px 28px; background: #00b894; color: white; border: none; border-radius: 12px; font-size: 16px; cursor: pointer;">➡ Keyingi bo'lim</button>
      </div>
    </div>
  `;

  autoSaveAnswers(targetId);
}

function goToMenu() {
  window.location.href = 'index.html';
}

function goToNextSection() {
  const sections = [
    'grammar.html',
    'eshitish.html', 
    'oqish.html',
    'gapirish.html',
    'yozish.html'
  ];

  const currentPage = window.location.pathname.split('/').pop();
  const currentIndex = sections.indexOf(currentPage);

  if (currentIndex >= 0 && currentIndex < sections.length - 1) {
    window.location.href = sections[currentIndex + 1];
  } else {
    window.location.href = 'index.html';
  }
}

function autoSaveAnswers(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const inputs = section.querySelectorAll('input, textarea, select');
  inputs.forEach((input, index) => {
    const key = 'answer_' + sectionId + '_' + index;
    if (input.type === 'checkbox' || input.type === 'radio') {
      localStorage.setItem(key, input.checked ? input.value : '');
    } else {
      localStorage.setItem(key, input.value);
    }
  });
}

function finishOnTimeout() {
  const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
  const sectionMap = {
    'grammar': 'Grammatika',
    'eshitish': 'Eshitish',
    'oqish': 'O'qish',
    'gapirish': 'Gapirish',
    'yozish': 'Yozish'
  };

  const sectionName = sectionMap[currentPage] || 'Test';

  const mainContent = document.querySelector('.content, .test-content, #content, main, #quiz, #screen, #split');
  if (mainContent) {
    const targetId = mainContent.id || 'content';
    showFinish(targetId, sectionName + ' - vaqt tugadi!');
  } else {
    alert(sectionName + ' testi vaqt tugadi!');
    goToMenu();
  }
}
