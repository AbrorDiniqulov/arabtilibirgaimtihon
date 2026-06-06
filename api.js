// API helper for exam platform
const API_BASE = window.location.origin.includes('localhost')
  ? 'http://localhost:3000/api'
  : 'https://arabtilibirgaimtihon.onrender.com/api';

async function submitExamToServer(zipBlob, studentName, studentEmail, section = 'all') {
  const formData = new FormData();
  formData.append('zipFile', zipBlob, 'exam_results.zip');
  formData.append('studentName', studentName);
  formData.append('studentEmail', studentEmail);
  formData.append('section', section);

  try {
    const res = await fetch(`${API_BASE}/submit-exam`, { method: 'POST', body: formData });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function saveAnswers(studentName, answers, section) {
  try {
    const res = await fetch(`${API_BASE}/save-answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName, answers, section })
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function loginUser(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) localStorage.setItem('token', data.token);
    return data;
  } catch (e) {
    return { success: false, error: e.message };
  }
}
