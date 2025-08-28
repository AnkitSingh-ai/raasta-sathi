import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

console.log('API Base URL:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('raasta_sathi_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (!error.response) {
      console.error('Network Error:', error.message);
      throw new Error('Network error - please check your connection');
    }

    const { status, data } = error.response;
    
    if (status === 429) {
      console.error('Rate limit exceeded:', data);
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    
    if (status === 401) {
      localStorage.removeItem('raasta_sathi_token');
      window.location.href = '/login';
      throw new Error('Session expired - please login again');
    }

    const errorMessage = data?.message || error.message || 'An error occurred';
    console.error('API Error:', errorMessage);
    throw new Error(errorMessage);
  }
);

class ApiService {
  setToken(token) {
    token ? localStorage.setItem('raasta_sathi_token', token) : localStorage.removeItem('raasta_sathi_token');
  }

  removeToken() {
    localStorage.removeItem('raasta_sathi_token');
  }

  getToken() {
    return localStorage.getItem('raasta_sathi_token');
  }

  getImageUrl(imagePath) {
    if (!imagePath) return null;
    
    // If it's already a full URL (Cloudinary or other), return as is
    if (imagePath.startsWith('http')) return imagePath;
    
    // If it's a local path (legacy), construct full URL
    if (imagePath.startsWith('/uploads/')) {
      const baseUrl = API_BASE_URL.replace('/api', '');
      return `${baseUrl}${imagePath}`;
    }
    
    // For Cloudinary paths, they should already be full URLs
    return imagePath;
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    if (response.token) this.setToken(response.token);
    return response;
  }

  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.token) this.setToken(response.token);
    return response;
  }

  async verifyEmail(email, otp, tempId) {
    return await apiClient.post('/auth/verify-email', { email, otp, tempId });
  }

  async resendVerification(email, tempId) {
    return await apiClient.post('/auth/resend-verification', { email, tempId });
  }

  async forgotPassword(email) {
    return await apiClient.post('/auth/forgot-password', { email });
  }

  async resetPassword(email, otp, newPassword) {
    return await apiClient.post('/auth/reset-password', { email, otp, newPassword });
  }

  async logout() {
    this.removeToken();
    return { status: 'success', message: 'Logged out successfully' };
  }

  async getCurrentUser() {
    return await apiClient.get('/auth/me');
  }

  async updateProfile(userData) {
    return await apiClient.put('/auth/updatedetails', userData);
  }

  async updatePassword(passwordData) {
    return await apiClient.put('/auth/updatepassword', passwordData);
  }

  async getReports(retries = 3) {
    try {
      const response = await apiClient.get('/reports');
      return response.data ? response.data.reports : response;
    } catch (error) {
      // If it's a database not ready error and we have retries left, wait and retry
      if (error.response?.status === 503 && error.response?.data?.code === 'DATABASE_NOT_READY' && retries > 0) {
        console.log(`Database not ready, retrying in 1 second... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.getReports(retries - 1);
      }
      throw error;
    }
  }

  async getAllUsers() {
    return await apiClient.get('/users');
  }

  async getAllReports(retries = 3) {
    try {
      const response = await apiClient.get('/reports', { params: { limit: 1000 } });
      return response.data ? response.data.reports : response;
    } catch (error) {
      // If it's a database not ready error and we have retries left, wait and retry
      if (error.response?.status === 503 && error.response?.data?.code === 'DATABASE_NOT_READY' && retries > 0) {
        console.log(`Database not ready, retrying in 1 second... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.getAllReports(retries - 1);
      }
      throw error;
    }
  }

  async getReport(id) {
    return await apiClient.get(`/reports/${id}`);
  }

  async getMyReports(params = {}) {
    try {
      return await apiClient.get('/reports/my-reports', { params });
    } catch (error) {
      console.error('Get my reports failed:', error.message);
      throw error;
    }
  }

  async createReport(reportData, retries = 2) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await apiClient.post('/reports', reportData, {
          timeout: 60000, // Increased timeout to 60 seconds for file uploads
          onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / e.total);
            console.log(`Upload attempt ${attempt}: ${percent}%`);
          },
        });
        return response;
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          // Last attempt failed, throw the error
          if (error.code === 'ECONNABORTED') {
            console.error('Request timeout:', error.message);
            throw new Error('Request timed out. Please check your connection and try again.');
          } else if (error.response) {
            console.error('Server error:', error.response.data);
            throw new Error(error.response.data?.message || 'Server error occurred');
          } else if (error.request) {
            console.error('No response:', error.request);
            throw new Error('Network error - please check your connection');
          } else {
            console.error('Request error:', error.message);
            throw new Error(error.message || 'An error occurred');
          }
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async updateReport(id, reportData) {
    return await apiClient.put(`/reports/${id}`, reportData);
  }

  async deleteReport(id) {
    return await apiClient.delete(`/reports/${id}`);
  }

  async likeReport(id) {
    return await apiClient.post(`/reports/${id}/like`);
  }

  async addComment(id, comment) {
    return await apiClient.post(`/reports/${id}/comments`, { text: comment });
  }

  async getComments(id) {
    return await apiClient.get(`/reports/${id}/comments`);
  }

  // Enhanced comment methods
  async likeComment(reportId, commentId) {
    return await apiClient.post(`/reports/${reportId}/comments/${commentId}/like`);
  }

  async dislikeComment(reportId, commentId) {
    return await apiClient.post(`/reports/${reportId}/comments/${commentId}/dislike`);
  }

  async removeCommentReaction(reportId, commentId) {
    return await apiClient.delete(`/reports/${reportId}/comments/${commentId}/reaction`);
  }

  async addReply(reportId, commentId, text) {
    return await apiClient.post(`/reports/${reportId}/comments/${commentId}/replies`, { text });
  }

  async likeReply(reportId, commentId, replyId) {
    return await apiClient.post(`/reports/${reportId}/comments/${commentId}/replies/${replyId}/like`);
  }

  async dislikeReply(reportId, commentId, replyId) {
    return await apiClient.post(`/reports/${reportId}/comments/${commentId}/replies/${replyId}/dislike`);
  }

  async removeReplyReaction(reportId, commentId, replyId) {
    return await apiClient.delete(`/reports/${reportId}/comments/${commentId}/replies/${replyId}/reaction`);
  }

  async editComment(reportId, commentId, text) {
    return await apiClient.put(`/reports/${reportId}/comments/${commentId}`, { text });
  }

  async deleteComment(reportId, commentId) {
    return await apiClient.delete(`/reports/${reportId}/comments/${commentId}`);
  }

  async deleteReply(reportId, commentId, replyId) {
    return await apiClient.delete(`/reports/${reportId}/comments/${commentId}/replies/${replyId}`);
  }

  async voteReport(id, voteType) {
    return await apiClient.post(`/reports/${id}/vote`, { voteType });
  }

  async voteOnPoll(id, choice) {
    return await apiClient.post(`/reports/${id}/vote`, { choice });
  }

  async updateReportStatus(id, status, reason) {
    return await apiClient.put(`/reports/${id}/status`, { status, reason });
  }

  async verifyReport(id) {
    return await apiClient.post(`/reports/${id}/verify`);
  }

  async getServiceRequests(params = {}) {
    return await apiClient.get('/services', { params });
  }

  async getMyServiceRequests() {
    return await apiClient.get('/services/my-requests');
  }

  async getProviderRequests(status = 'all') {
    return await apiClient.get('/services/provider-requests', { params: { status } });
  }

  async createServiceRequest(requestData) {
    return await apiClient.post('/services', requestData);
  }

  async acceptServiceRequest(id, estimatedArrival) {
    return await apiClient.post(`/services/${id}/accept`, { estimatedArrival });
  }

  async startService(id) {
    return await apiClient.post(`/services/${id}/start`);
  }

  async completeService(id, finalPrice) {
    return await apiClient.post(`/services/${id}/complete`, { finalPrice });
  }

  async cancelServiceRequest(id, reason) {
    return await apiClient.post(`/services/${id}/cancel`, { reason });
  }

  async addServiceMessage(id, message, messageType = 'text') {
    return await apiClient.post(`/services/${id}/messages`, { message, messageType });
  }

  async rateService(id, rating, feedback) {
    return await apiClient.post(`/services/${id}/rate`, { rating, feedback });
  }

  async getNearbyProviders(lat, lng, serviceType, radius = 15) {
    return await apiClient.get('/users/providers/nearby', {
      params: { lat, lng, serviceType, radius },
    });
  }

  async updateNotificationSettings(settings) {
    return await apiClient.put('/users/notifications', settings);
  }

  async updateAvailability(isAvailable) {
    return await apiClient.put('/users/availability', { isAvailable });
  }

  async getLeaderboard(timeframe = 'all', limit = 50) {
    return await apiClient.get('/leaderboard', { params: { timeframe, limit } });
  }

  async getUserStats(userId) {
    return await apiClient.get(`/leaderboard/stats/${userId}`);
  }

  async getAchievements() {
    return await apiClient.get('/leaderboard/achievements');
  }

  async getNotifications(page = 1, limit = 20, unreadOnly = false) {
    return await apiClient.get('/notifications', {
      params: { page, limit, unreadOnly },
    });
  }

  async markNotificationAsRead(id) {
    return await apiClient.put(`/notifications/${id}/read`);
  }

  async markAllNotificationsAsRead() {
    return await apiClient.put('/notifications/read-all');
  }

  async deleteNotification(id) {
    return await apiClient.delete(`/notifications/${id}`);
  }

  async healthCheck() {
    return await apiClient.get('/health');
  }

  async testConnection() {
    try {
      const response = await apiClient.get('/test', { timeout: 10000 });
      return response;
    } catch (error) {
      console.error('Connection test failed:', error);
      throw new Error('Cannot connect to server. Please check your internet connection.');
    }
  }

  async uploadFile(file, type = 'report') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return await apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async searchReports(query, filters = {}) {
    return await apiClient.get('/search/reports', { params: { q: query, ...filters } });
  }

  async searchUsers(query, role = null) {
    return await apiClient.get('/search/users', { params: { q: query, role } });
  }

  async getTrafficAnalytics(timeframe = 'month') {
    return await apiClient.get('/analytics/traffic', { params: { timeframe } });
  }

  async getUserAnalytics(userId, timeframe = 'month') {
    return await apiClient.get(`/analytics/users/${userId}`, { params: { timeframe } });
  }
}

const apiService = new ApiService();

export default apiService;
export { apiClient };

export const {
  register, login, logout, getCurrentUser, updateProfile, updatePassword,
  verifyEmail, resendVerification, forgotPassword, resetPassword,
  getReports, getAllReports, getReport, createReport, updateReport, deleteReport,
  likeReport, addComment, getComments, likeComment, dislikeComment, removeCommentReaction,
  addReply, likeReply, dislikeReply, removeReplyReaction, editComment, deleteComment, deleteReply,
  voteReport, verifyReport,
  getServiceRequests, getMyServiceRequests, getProviderRequests,
  createServiceRequest, acceptServiceRequest, startService, completeService,
  cancelServiceRequest, addServiceMessage, rateService,
  getNearbyProviders, updateNotificationSettings, updateAvailability,
  getLeaderboard, getUserStats, getAchievements,
  getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification,
  healthCheck, testConnection, uploadFile,
  searchReports, searchUsers,
  getTrafficAnalytics, getUserAnalytics,
  setToken, removeToken, getToken, isAuthenticated,
} = apiService;