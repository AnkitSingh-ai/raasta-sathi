import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  Bell, 
  Shield,
  Award,
  Calendar,
  Settings,
  BarChart3,
  Trophy,
  Star,
  CheckCircle,
  Crown,
  Medal,
  TrendingUp,
  Users,
  Target
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import apiService from '../utils/api';
import toast from 'react-hot-toast';

/**
 * @typedef {Object} LeaderboardUser
 * @property {string} id
 * @property {string} name
 * @property {number} points
 * @property {number} reports
 * @property {number} accuracy
 * @property {string} badge
 * @property {number} level
 * @property {string} avatar
 * @property {string} location
 * @property {string} joinDate
 * @property {number} streak
 */

export function ProfilePage() {
  const { user, updateProfile, updateProfilePhoto } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    contactNumber: user?.contactNumber || '',
    location: user?.location || '',
    avatar: user?.avatar || ''
  });
  const [notificationSettings, setNotificationSettings] = useState({
    nearbyReports: true,
    emergencyAlerts: true,
    serviceRequests: user?.role === 'service_provider',
    weeklyDigest: true,
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    paused: user?.notificationsPaused || false
  });

  // Real data states
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userReports, setUserReports] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Handle profile photo change
  const handleProfilePhotoChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      await updateProfilePhoto(file);
      // Clear the input
      event.target.value = '';
    } catch (error) {
      console.error('Failed to update profile photo:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Load real data based on active tab
  const loadTabData = async (tab) => {
    if (!user) return;
    
    setLoading(true);
    try {
      switch (tab) {
        case 'leaderboard':
          // Load leaderboard data using the existing endpoint
          const leaderboardResponse = await apiService.getLeaderboard('month', 50);
          if (leaderboardResponse.data?.data?.leaderboard) {
            const leaderboard = leaderboardResponse.data.data.leaderboard;
            // Add ranking and ensure we have all necessary fields
            const sortedUsers = leaderboard.map((user, index) => ({
              ...user,
              rank: index + 1,
              reportCount: user.reportCount || user.reports?.length || 0,
              accuracy: user.accuracy || 95,
              streak: user.streak || 0,
              points: user.points || 0,
              badge: user.badge || 'New Reporter',
              location: user.location || 'Location not set'
            }));
            setLeaderboardData(sortedUsers);
          }
          break;
        case 'achievements':
          // Load user's reports for stats calculation
          await loadUserReports();
          // Calculate user stats first, then generate achievements
          const stats = calculateUserStats();
          if (stats) {
            setUserStats(stats);
            // Generate achievements based on calculated stats
            generateUserAchievements();
          }
          break;
        case 'notifications':
          const notificationsResponse = await apiService.getNotifications();
          if (notificationsResponse.data?.data?.notifications) {
            setNotifications(notificationsResponse.data.data.notifications);
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to load ${tab} data:`, error);
      toast.error(`Failed to load ${tab} data`);
    } finally {
      setLoading(false);
    }
  };

  // Load user's reports for stats calculation
  const loadUserReports = async () => {
    if (!user) return;
    
    try {
      const response = await apiService.getMyReports();
      if (response.data?.data?.reports) {
        setUserReports(response.data.data.reports);
      }
    } catch (error) {
      console.error('Failed to load user reports:', error);
    }
  };

  // Calculate user stats based on real data
  const calculateUserStats = () => {
    if (!userReports.length) return null;
    
    const totalReports = userReports.length;
    const verifiedReports = userReports.filter(report => report.status === 'resolved').length;
    const accuracy = totalReports > 0 ? Math.round((verifiedReports / totalReports) * 100) : 0;
    
    // Calculate current streak based on continuous daily uploads
    const sortedReports = [...userReports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    let currentStreak = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < sortedReports.length; i++) {
      const reportDate = new Date(sortedReports[i].createdAt);
      const daysDiff = Math.floor((currentDate - reportDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === currentStreak) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return {
      totalReports,
      verifiedReports,
      totalPoints: user?.points || 0,
      currentStreak,
      accuracy,
      rank: 0 // Will be calculated from leaderboard
    };
  };

  // Generate user achievements based on stats
  const generateUserAchievements = () => {
    if (!userStats) return;
    
    const newAchievements = [
      {
        name: 'First Report',
        description: 'Submit your first traffic report',
        icon: 'BarChart3',
        points: 50,
        unlocked: userStats.totalReports >= 1
      },
      {
        name: 'Report Master',
        description: 'Submit 10 traffic reports',
        icon: 'Trophy',
        points: 200,
        unlocked: userStats.totalReports >= 10
      },
      {
        name: 'Super Reporter',
        description: 'Submit 50 traffic reports',
        icon: 'Crown',
        points: 500,
        unlocked: userStats.totalReports >= 50
      },
      {
        name: 'Point Collector',
        description: 'Earn 1000 points',
        icon: 'Star',
        points: 100,
        unlocked: userStats.totalPoints >= 1000
      },
      {
        name: 'Point Master',
        description: 'Earn 5000 points',
        icon: 'Award',
        points: 300,
        unlocked: userStats.totalPoints >= 5000
      },
      {
        name: 'Streak Master',
        description: 'Maintain a 7-day streak',
        icon: 'Calendar',
        points: 150,
        unlocked: userStats.currentStreak >= 7
      },
      {
        name: 'Accuracy Expert',
        description: 'Maintain 95% accuracy',
        icon: 'CheckCircle',
        points: 200,
        unlocked: userStats.accuracy >= 95
      },
      {
        name: 'Top 10',
        description: 'Reach top 10 in leaderboard',
        icon: 'TrendingUp',
        points: 400,
        unlocked: userStats.rank <= 10
      }
    ];
    
    setAchievements(newAchievements);
  };

  // Check for tab parameter in URL and load data
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['profile', 'notifications', 'achievements', 'leaderboard'].includes(tabParam)) {
      setActiveTab(tabParam);
      loadTabData(tabParam);
    }
  }, [location.search, user]);

  // Load user reports on mount for stats
  useEffect(() => {
    if (user) {
      loadUserReports();
    }
  }, [user]);

  // Helper functions for real data
  const getAchievementIcon = (iconName) => {
    const iconMap = {
      'Star': Star,
      'TrendingUp': TrendingUp,
      'Users': Users,
      'Target': Target,
      'MapPin': MapPin,
      'Calendar': Calendar,
      'Trophy': Trophy,
      'Medal': Medal,
      'Crown': Crown,
      'Award': Award,
      'BarChart3': BarChart3,
      'CheckCircle': CheckCircle
    };
    return iconMap[iconName] || Star;
  };

  const isAchievementUnlocked = (achievementName) => {
    return user?.achievements?.some(a => a.name === achievementName) || false;
  };

  const getBadgeColor = (badge) => {
    const colors = {
      'Diamond Reporter': 'from-blue-400 to-cyan-300',
      'Gold Guardian': 'from-yellow-400 to-orange-300',
      'Silver Scout': 'from-gray-300 to-slate-400',
      'Bronze Hero': 'from-amber-600 to-yellow-600',
      'Rising Star': 'from-purple-400 to-pink-400',
      'New Reporter': 'from-green-400 to-emerald-300'
    };
    return colors[badge] || 'from-slate-400 to-gray-400';
  };

  const handleSaveProfile = () => {
    updateProfile(formData);
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleNotificationToggle = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    toast.success('Notification settings updated!');
  };

  const citizenStats = calculateUserStats() || {
    totalReports: 0,
    verifiedReports: 0,
    totalPoints: user?.points || 0,
    currentStreak: 0,
    accuracy: 0,
    rank: 0
  };

  const getTabsForRole = () => {
    const baseTabs = [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'notifications', label: 'Notifications', icon: Bell }
    ];

    if (user?.role === 'citizen') {
      return [
        ...baseTabs,
        { id: 'achievements', label: 'My Achievements', icon: Award },
        { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
      ];
    }

    return baseTabs;
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-slate-600">#{rank}</span>;
  };



  const userRank = leaderboardData.findIndex(u => u._id === user?.id) + 1 || 0;

  return (
    <div className="min-h-screen bg-slate-50 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Profile Settings</h1>
          <p className="text-lg text-slate-600">Manage your account and preferences</p>
        </motion.div>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8"
        >
          <div className="flex items-center space-x-6">
            <div className="relative">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-3xl">
                  <User className="h-12 w-12 text-white" />
                </div>
              )}
              <label className={`absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer ${
                uploadingPhoto ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}>
                {uploadingPhoto ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </label>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900">{user?.name}</h2>
              <p className="text-slate-600">{user?.email}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium capitalize">
                  {user?.role?.replace('_', ' ')}
                </span>
                {user?.role === 'citizen' && (
                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                    {user.badge}
                  </span>
                )}
                <span className="text-sm text-slate-500">
                  Member since {new Date(user?.joinDate || '').toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-white rounded-lg p-1 shadow-sm border border-slate-200">
          {getTabsForRole().map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  loadTabData(tab.id);
                }}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-md transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900">Profile Information</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-6">Notification Preferences</h3>
              
              {/* Pause/Resume All */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Notification Status</h4>
                    <p className="text-sm text-slate-600">
                      {notificationSettings.paused ? 'All notifications are paused' : 'Notifications are active'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleNotificationToggle('paused')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      notificationSettings.paused
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {notificationSettings.paused ? 'Resume All' : 'Pause All'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(notificationSettings).map(([key, value]) => {
                  if (key === 'paused') return null;
                  
                  const labels = {
                    nearbyReports: 'Nearby Traffic Reports',
                    emergencyAlerts: 'Emergency Alerts',
                    serviceRequests: 'Service Requests',
                    weeklyDigest: 'Weekly Summary',
                    pushNotifications: 'Push Notifications',
                    emailNotifications: 'Email Notifications',
                    smsNotifications: 'SMS Notifications'
                  };

                  const descriptions = {
                    nearbyReports: 'Get notified about traffic incidents near your location',
                    emergencyAlerts: 'Receive critical emergency and safety alerts',
                    serviceRequests: 'New service requests from citizens (Service Providers only)',
                    weeklyDigest: 'Weekly summary of your activity and area reports',
                    pushNotifications: 'Push notifications on your device',
                    emailNotifications: 'Email notifications and updates',
                    smsNotifications: 'SMS alerts for urgent notifications'
                  };

                  return (
                    <div key={key} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-slate-900">
                          {labels[key]}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {descriptions[key]}
                        </p>
                      </div>
                      <button
                        onClick={() => handleNotificationToggle(key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          value ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'achievements' && user?.role === 'citizen' && (
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Reports', value: citizenStats.totalReports, icon: BarChart3, color: 'blue' },
                  { label: 'Points Earned', value: citizenStats.totalPoints, icon: Star, color: 'yellow' },
                  { label: 'Current Streak', value: `${citizenStats.currentStreak} days`, icon: Calendar, color: 'green' },
                  { label: 'Accuracy Rate', value: `${citizenStats.accuracy}%`, icon: CheckCircle, color: 'purple' }
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                          <Icon className={`h-5 w-5 text-${stat.color}-600`} />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">{stat.label}</p>
                          <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Achievements */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-6">My Achievements</h3>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-slate-600">Loading achievements...</span>
                  </div>
                ) : achievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement, index) => {
                      const Icon = getAchievementIcon(achievement.icon);
                      const isUnlocked = achievement.unlocked;
                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            isUnlocked
                              ? 'border-green-200 bg-green-50'
                              : 'border-slate-200 bg-slate-50 opacity-60'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className={`h-8 w-8 ${
                              isUnlocked ? 'text-green-600' : 'text-slate-400'
                            }`} />
                            <div>
                              <h4 className="font-semibold text-slate-900">{achievement.name}</h4>
                              <p className="text-sm text-slate-600">{achievement.description}</p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-slate-500">
                                  {isUnlocked ? '✅ Earned!' : 'Not earned yet'}
                                </p>
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                  +{achievement.points} pts
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Award className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>No achievements available</p>
                  </div>
                )}
              </div>

              {/* Weekly Challenge */}
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">🏆 Weekly Challenge</h3>
                <div className="space-y-3">
                  <p className="text-sm opacity-90">Report 25 traffic incidents</p>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full" style={{width: '60%'}}></div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>15/25 completed</span>
                    <span>+500 bonus points</span>
                  </div>
                  <p className="text-xs opacity-75">4 days remaining</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && user?.role === 'citizen' && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-lg text-slate-600">Loading leaderboard data...</span>
                </div>
              ) : (
                <>
                  {/* Your Position */}
                  <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Your Position</h3>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">#{userRank}</div>
                        <div className="text-sm opacity-90">Rank</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{user.points}</div>
                        <div className="text-sm opacity-90">Points</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{citizenStats.currentStreak}</div>
                        <div className="text-sm opacity-90">Day Streak</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-6xl">🏆</div>
                </div>
              </div>

              {/* Top 3 Podium */}
              {leaderboardData.length >= 3 ? (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                  <h3 className="text-xl font-semibold text-slate-900 mb-6 text-center">Top Contributors</h3>
                  <div className="flex items-end justify-center space-x-8">
                    {/* Second Place */}
                    <div className="text-center">
                      <div className="relative mb-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-slate-400 rounded-full flex items-center justify-center text-2xl">
                          {leaderboardData[1]?.avatar || '👤'}
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-silver rounded-full flex items-center justify-center">
                          <Medal className="h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                      <h4 className="font-semibold text-slate-900">{leaderboardData[1]?.name}</h4>
                      <p className="text-sm text-slate-600">{leaderboardData[1]?.points} pts</p>
                      <div className="h-24 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-lg mt-4 flex items-end justify-center">
                        <span className="text-white font-bold text-lg mb-2">2</span>
                      </div>
                    </div>

                    {/* First Place */}
                    <div className="text-center">
                      <div className="relative mb-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-300 rounded-full flex items-center justify-center text-3xl">
                          {leaderboardData[0]?.avatar || '👑'}
                        </div>
                        <div className="absolute -top-3 -right-3 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Crown className="h-6 w-6 text-yellow-700" />
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-900 text-lg">{leaderboardData[0]?.name}</h4>
                      <p className="text-slate-600">{leaderboardData[0]?.points} pts</p>
                      <div className="h-32 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-lg mt-4 flex items-end justify-center">
                        <span className="text-white font-bold text-xl mb-2">1</span>
                      </div>
                    </div>

                    {/* Third Place */}
                    <div className="text-center">
                      <div className="relative mb-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-full flex items-center justify-center text-2xl">
                          {leaderboardData[2]?.avatar || '🥉'}
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                          <Award className="h-5 w-5 text-amber-200" />
                        </div>
                      </div>
                      <h4 className="font-semibold text-slate-900">{leaderboardData[2]?.name}</h4>
                      <p className="text-sm text-slate-600">{leaderboardData[2]?.points} pts</p>
                      <div className="h-20 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-lg mt-4 flex items-end justify-center">
                        <span className="text-white font-bold mb-2">3</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">Loading leaderboard data...</p>
                </div>
              )}

              {/* Full Rankings */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-xl font-semibold text-slate-900">Complete Rankings</h3>
                </div>
                <div className="divide-y divide-slate-200">
                  {leaderboardData.length > 0 ? (
                    leaderboardData.map((member, index) => (
                      <div
                        key={member._id}
                        className={`p-6 hover:bg-slate-50 transition-all ${
                          member._id === user?.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-12 h-12">
                              {getRankIcon(index + 1)}
                            </div>
                            <div className="text-3xl">{member.avatar || '👤'}</div>
                            <div>
                              <h4 className="font-semibold text-slate-900 flex items-center space-x-2">
                                <span>{member.name}</span>
                                {member._id === user?.id && (
                                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">You</span>
                                )}
                              </h4>
                              <p className="text-sm text-slate-600">{member.location || 'Location not set'}</p>
                              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getBadgeColor(member.badge)} text-white mt-1`}>
                                {member.badge}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-slate-900">{member.points?.toLocaleString() || 0}</div>
                            <div className="text-sm text-slate-600">Points</div>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                              <span>{member.reportCount || 0} reports</span>
                              <span>•</span>
                              <span>{member.accuracy || 0}% accuracy</span>
                              <span>•</span>
                              <span>🔥 {member.streak || 0} day streak</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-500">
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p>No leaderboard data available</p>
                    </div>
                  )}
                </div>
              </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}