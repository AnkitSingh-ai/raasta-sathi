import axios from 'axios';

// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('raasta_sathi_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      throw new Error('Network error - please check your connection');
    }

    // Handle HTTP errors
    const { status, data } = error.response;
    
    // Handle authentication errors
    if (status === 401) {
      localStorage.removeItem('raasta_sathi_token');
      window.location.href = '/login';
      throw new Error('Session expired - please login again');
    }

    // Handle other errors
    const errorMessage = data?.message || error.message || 'An error occurred';
    console.error('API Error:', errorMessage);
    throw new Error(errorMessage);
  }
);

// API service class
class ApiService {
  // Set auth token
  setToken(token) {
    if (token) {
      localStorage.setItem('raasta_sathi_token', token);
    } else {
      localStorage.removeItem('raasta_sathi_token');
    }
  }

  // Remove auth token
  removeToken() {
    localStorage.removeItem('raasta_sathi_token');
  }

  // Get current token
  getToken() {
    return localStorage.getItem('raasta_sathi_token');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  }

  // ==================== AUTH ENDPOINTS ====================

  // Register new user
  async register(userData) {
    try {
      const response = await apiClient.post('/auth/register', userData);
      if (response.token) {
        this.setToken(response.token);
      }
      return response;
    } catch (error) {
      console.error('Registration failed:', error.message);
      throw error;
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      if (response.token) {
        this.setToken(response.token);
      }
      return response;
    } catch (error) {
      console.error('Login failed:', error.message);
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      this.removeToken();
      return { status: 'success', message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout failed:', error.message);
      throw error;
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      return await apiClient.get('/auth/me');
    } catch (error) {
      console.error('Get current user failed:', error.message);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(userData) {
    try {
      return await apiClient.put('/auth/updatedetails', userData);
    } catch (error) {
      console.error('Update profile failed:', error.message);
      throw error;
    }
  }

  // Update password
  async updatePassword(passwordData) {
    try {
      return await apiClient.put('/auth/updatepassword', passwordData);
    } catch (error) {
      console.error('Update password failed:', error.message);
      throw error;
    }
  }

  // ==================== REPORTS ENDPOINTS ====================

// Get all reports with optional filters
async getReports() {
  try {
    const response = await apiClient.get('/reports');
    return response.data ? response.data.reports : response;
  } catch (error) {
    console.error('Get reports failed:', error.message);
    throw error;
  }
}

  // Get single report by ID
  async getReport(id) {
    try {
      return await apiClient.get(`/reports/${id}`);
    } catch (error) {
      console.error('Get report failed:', error.message);
      throw error;
    }
  }

  // Create new report
  async createReport(reportData) {
    try {
      return await apiClient.post('/reports', reportData);
    } catch (error) {
      console.error('Create report failed:', error.message);
      throw error;
    }
  }

  // Update existing report
  async updateReport(id, reportData) {
    try {
      return await apiClient.put(`/reports/${id}`, reportData);
    } catch (error) {
      console.error('Update report failed:', error.message);
      throw error;
    }
  }

  // Delete report
  async deleteReport(id) {
    try {
      return await apiClient.delete(`/reports/${id}`);
    } catch (error) {
      console.error('Delete report failed:', error.message);
      throw error;
    }
  }

  // Like/unlike report
  async likeReport(id) {
    try {
      return await apiClient.post(`/reports/${id}/like`);
    } catch (error) {
      console.error('Like report failed:', error.message);
      throw error;
    }
  }

  // Add comment to report
  async addComment(id, comment) {
    try {
      return await apiClient.post(`/reports/${id}/comments`, { text: comment });
    } catch (error) {
      console.error('Add comment failed:', error.message);
      throw error;
    }
  }

  // Vote on report (up/down)
  async voteReport(id, voteType) {
    try {
      return await apiClient.post(`/reports/${id}/vote`, { voteType });
    } catch (error) {
      console.error('Vote report failed:', error.message);
      throw error;
    }
  }

  // Verify report (authority only)
  async verifyReport(id) {
    try {
      return await apiClient.post(`/reports/${id}/verify`);
    } catch (error) {
      console.error('Verify report failed:', error.message);
      throw error;
    }
  }

  // ==================== SERVICE REQUESTS ENDPOINTS ====================

  // Get service requests
  async getServiceRequests(params = {}) {
    try {
      return await apiClient.get('/services', { params });
    } catch (error) {
      console.error('Get service requests failed:', error.message);
      throw error;
    }
  }

  // Get user's service requests
  async getMyServiceRequests() {
    try {
      return await apiClient.get('/services/my-requests');
    } catch (error) {
      console.error('Get my service requests failed:', error.message);
      throw error;
    }
  }

  // Get provider's service requests
  async getProviderRequests(status = 'all') {
    try {
      return await apiClient.get('/services/provider-requests', { 
        params: { status } 
      });
    } catch (error) {
      console.error('Get provider requests failed:', error.message);
      throw error;
    }
  }

  // Create new service request
  async createServiceRequest(requestData) {
    try {
      return await apiClient.post('/services', requestData);
    } catch (error) {
      console.error('Create service request failed:', error.message);
      throw error;
    }
  }

  // Accept service request
  async acceptServiceRequest(id, estimatedArrival) {
    try {
      return await apiClient.post(`/services/${id}/accept`, { estimatedArrival });
    } catch (error) {
      console.error('Accept service request failed:', error.message);
      throw error;
    }
  }

  // Start service
  async startService(id) {
    try {
      return await apiClient.post(`/services/${id}/start`);
    } catch (error) {
      console.error('Start service failed:', error.message);
      throw error;
    }
  }

  // Complete service
  async completeService(id, finalPrice) {
    try {
      return await apiClient.post(`/services/${id}/complete`, { finalPrice });
    } catch (error) {
      console.error('Complete service failed:', error.message);
      throw error;
    }
  }

  // Cancel service request
  async cancelServiceRequest(id, reason) {
    try {
      return await apiClient.post(`/services/${id}/cancel`, { reason });
    } catch (error) {
      console.error('Cancel service request failed:', error.message);
      throw error;
    }
  }

  // Add message to service request
  async addServiceMessage(id, message, messageType = 'text') {
    try {
      return await apiClient.post(`/services/${id}/messages`, { 
        message, 
        messageType 
      });
    } catch (error) {
      console.error('Add service message failed:', error.message);
      throw error;
    }
  }

  // Rate service
  async rateService(id, rating, feedback) {
    try {
      return await apiClient.post(`/services/${id}/rate`, { rating, feedback });
    } catch (error) {
      console.error('Rate service failed:', error.message);
      throw error;
    }
  }

  // ==================== USERS ENDPOINTS ====================

  // Get nearby service providers
  async getNearbyProviders(lat, lng, serviceType, radius = 15) {
    try {
      return await apiClient.get('/users/providers/nearby', {
        params: { lat, lng, serviceType, radius }
      });
    } catch (error) {
      console.error('Get nearby providers failed:', error.message);
      throw error;
    }
  }

  // Update notification settings
  async updateNotificationSettings(settings) {
    try {
      return await apiClient.put('/users/notifications', settings);
    } catch (error) {
      console.error('Update notification settings failed:', error.message);
      throw error;
    }
  }

  // Update service provider availability
  async updateAvailability(isAvailable) {
    try {
      return await apiClient.put('/users/availability', { isAvailable });
    } catch (error) {
      console.error('Update availability failed:', error.message);
      throw error;
    }
  }

  // ==================== LEADERBOARD ENDPOINTS ====================

  // Get leaderboard
  async getLeaderboard(timeframe = 'all', limit = 50) {
    try {
      return await apiClient.get('/leaderboard', {
        params: { timeframe, limit }
      });
    } catch (error) {
      console.error('Get leaderboard failed:', error.message);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats(userId) {
    try {
      return await apiClient.get(`/leaderboard/stats/${userId}`);
    } catch (error) {
      console.error('Get user stats failed:', error.message);
      throw error;
    }
  }

  // Get available achievements
  async getAchievements() {
    try {
      return await apiClient.get('/leaderboard/achievements');
    } catch (error) {
      console.error('Get achievements failed:', error.message);
      throw error;
    }
  }

  // ==================== NOTIFICATIONS ENDPOINTS ====================

  // Get user notifications
  async getNotifications(page = 1, limit = 20, unreadOnly = false) {
    try {
      return await apiClient.get('/notifications', {
        params: { page, limit, unreadOnly }
      });
    } catch (error) {
      console.error('Get notifications failed:', error.message);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(id) {
    try {
      return await apiClient.put(`/notifications/${id}/read`);
    } catch (error) {
      console.error('Mark notification as read failed:', error.message);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead() {
    try {
      return await apiClient.put('/notifications/read-all');
    } catch (error) {
      console.error('Mark all notifications as read failed:', error.message);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(id) {
    try {
      return await apiClient.delete(`/notifications/${id}`);
    } catch (error) {
      console.error('Delete notification failed:', error.message);
      throw error;
    }
  }

  // ==================== UTILITY ENDPOINTS ====================

  // Health check
  async healthCheck() {
    try {
      return await apiClient.get('/health');
    } catch (error) {
      console.error('Health check failed:', error.message);
      throw error;
    }
  }

  // Test API connectivity
  async testConnection() {
    try {
      return await apiClient.get('/test');
    } catch (error) {
      console.error('Test connection failed:', error.message);
      throw error;
    }
  }

  // ==================== FILE UPLOAD ENDPOINTS ====================

  // Upload file (for reports, profile pictures, etc.)
  async uploadFile(file, type = 'report') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      return await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error('File upload failed:', error.message);
      throw error;
    }
  }

  // ==================== SEARCH ENDPOINTS ====================

  // Search reports and incidents
  async searchReports(query, filters = {}) {
    try {
      return await apiClient.get('/search/reports', {
        params: { q: query, ...filters }
      });
    } catch (error) {
      console.error('Search reports failed:', error.message);
      throw error;
    }
  }

  // Search users
  async searchUsers(query, role = null) {
    try {
      return await apiClient.get('/search/users', {
        params: { q: query, role }
      });
    } catch (error) {
      console.error('Search users failed:', error.message);
      throw error;
    }
  }

  // ==================== ANALYTICS ENDPOINTS ====================

  // Get traffic analytics
  async getTrafficAnalytics(timeframe = 'month') {
    try {
      return await apiClient.get('/analytics/traffic', {
        params: { timeframe }
      });
    } catch (error) {
      console.error('Get traffic analytics failed:', error.message);
      throw error;
    }
  }

  // Get user analytics
  async getUserAnalytics(userId, timeframe = 'month') {
    try {
      return await apiClient.get(`/analytics/users/${userId}`, {
        params: { timeframe }
      });
    } catch (error) {
      console.error('Get user analytics failed:', error.message);
      throw error;
    }
  }
}

// Create and export singleton instance
const apiService = new ApiService();

// Export both the service instance and the axios client
export default apiService;
export { apiClient };

// Export individual methods for convenience
export const {
  // Auth
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  updatePassword,
  
  // Reports
  getReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  likeReport,
  addComment,
  voteReport,
  verifyReport,
  
  // Services
  getServiceRequests,
  getMyServiceRequests,
  getProviderRequests,
  createServiceRequest,
  acceptServiceRequest,
  startService,
  completeService,
  cancelServiceRequest,
  addServiceMessage,
  rateService,
  
  // Users
  getNearbyProviders,
  updateNotificationSettings,
  updateAvailability,
  
  // Leaderboard
  getLeaderboard,
  getUserStats,
  getAchievements,
  
  // Notifications
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  
  // Utility
  healthCheck,
  testConnection,
  uploadFile,
  
  // Search
  searchReports,
  searchUsers,
  
  // Analytics
  getTrafficAnalytics,
  getUserAnalytics,
  
  // Token management
  setToken,
  removeToken,
  getToken,
  isAuthenticated
} = apiService;