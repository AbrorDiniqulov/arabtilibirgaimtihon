// ============================================
// api.js — FRONTEND API CLIENT
// Barcha HTML fayllarga ulang
// ============================================

const API_BASE_URL = localStorage.getItem('apiUrl') || 'https://your-render-app.onrender.com';

class ExamAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  // Auth
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(method, endpoint, data = null, isFormData = false) {
    const url = `${this.baseURL}${endpoint}`;
    const options = {
      method,
      headers: isFormData ? { 'Authorization': `Bearer ${this.token}` } : this.getHeaders()
    };
    if (data && !isFormData) {
      options.body = JSON.stringify(data);
    } else if (data) {
      options.body = data;
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }
      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // AUTH
  async register(userData) {
    const result = await this.request('POST', '/api/auth/register', userData);
    if (result.token) this.setToken(result.token);
    return result;
  }

  async login(email, password) {
    const result = await this.request('POST', '/api/auth/login', { email, password });
    if (result.token) this.setToken(result.token);
    return result;
  }

  async getMe() {
    return await this.request('GET', '/api/auth/me');
  }

  // EXAM SETTINGS
  async getExamSettings() {
    return await this.request('GET', '/api/exam/settings');
  }

  async setExamTime(hours, minutes) {
    return await this.request('POST', '/api/exam/settings', { hours, minutes });
  }

  async getExamTime(startTime) {
    const query = startTime ? `?startTime=${startTime}` : '';
    return await this.request('GET', `/api/exam/time${query}`);
  }

  // GRAMMAR
  async getGrammarQuestions() {
    return await this.request('GET', '/api/grammar/active');
  }

  async getAllGrammar() {
    return await this.request('GET', '/api/grammar');
  }

  async addGrammarQuestion(data) {
    return await this.request('POST', '/api/grammar', data);
  }

  async updateGrammarQuestion(id, data) {
    return await this.request('PATCH', `/api/grammar/${id}`, data);
  }

  async deleteGrammarQuestion(id) {
    return await this.request('DELETE', `/api/grammar/${id}`);
  }

  async toggleGrammar(id) {
    return await this.request('PATCH', `/api/grammar/${id}/toggle`);
  }

  // LISTENING
  async getListeningItems() {
    return await this.request('GET', '/api/listening/active');
  }

  async getAllListening() {
    return await this.request('GET', '/api/listening');
  }

  async addListening(data) {
    return await this.request('POST', '/api/listening', data);
  }

  // READING
  async getReadingItems() {
    return await this.request('GET', '/api/reading/active');
  }

  async getAllReading() {
    return await this.request('GET', '/api/reading');
  }

  async addReading(data) {
    return await this.request('POST', '/api/reading', data);
  }

  // SPEAKING
  async getSpeakingItems() {
    return await this.request('GET', '/api/speaking/active');
  }

  async getAllSpeaking() {
    return await this.request('GET', '/api/speaking');
  }

  async addSpeaking(data) {
    return await this.request('POST', '/api/speaking', data);
  }

  // WRITING
  async getWritingItems() {
    return await this.request('GET', '/api/writing/active');
  }

  async getAllWriting() {
    return await this.request('GET', '/api/writing');
  }

  async addWriting(data) {
    return await this.request('POST', '/api/writing', data);
  }

  // FILE UPLOAD
  async uploadFile(file, type = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return await this.request('POST', '/api/upload/photo', formData, true);
  }

  async uploadPayment(file) {
    const formData = new FormData();
    formData.append('file', file);
    return await this.request('POST', '/api/upload/payment', formData, true);
  }

  async uploadAudio(file) {
    const formData = new FormData();
    formData.append('file', file);
    return await this.request('POST', '/api/upload/audio', formData, true);
  }

  // RESULTS
  async submitResult(data) {
    return await this.request('POST', '/api/results', data);
  }

  async getResults() {
    return await this.request('GET', '/api/results');
  }

  async getMyResults() {
    return await this.request('GET', '/api/results/my');
  }

  // PAYMENT
  async getPaymentStatus() {
    return await this.request('GET', '/api/payment/status');
  }

  // STATS
  async getStats() {
    return await this.request('GET', '/api/stats');
  }

  // ADMIN
  async getAllUsers() {
    return await this.request('GET', '/api/admin/users');
  }

  async setExempt(userId, isExempt) {
    return await this.request('PATCH', `/api/admin/users/${userId}/exempt`, { isExempt });
  }
}

// Global instance
const api = new ExamAPI();

// Helper: Check if token exists
function isLoggedIn() {
  return !!localStorage.getItem('token');
}

// Helper: Logout
function logoutAPI() {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  api.token = null;
  window.location.href = 'login.html';
}
