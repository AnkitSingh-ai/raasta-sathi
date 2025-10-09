
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
  const [isFallbackData, setIsFallbackData] = useState(false);
  const [achievementGenerationInProgress, setAchievementGenerationInProgress] = useState(false);

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

  // Update achievements when new achievements are unlocked (no points awarded)
  const updateUserAchievements = async (newAchievements) => {
    try {
      // Update achievements in database (no points awarded)
      const achievementNames = newAchievements.map(ach => ach.name);
      await apiService.updateUserAchievements(achievementNames);
      
      // Show success message with achievement details (no points mentioned)
      const achievementList = newAchievements.map(ach => ach.name).join(', ');
      toast.success(`Achievement unlocked: ${achievementList}`);
    } catch (error) {
      console.error('Failed to update achievements:', error);
      toast.error('Failed to update achievements');
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
          try {
            const leaderboardResponse = await apiService.getLeaderboard('month', 50);
            console.log('Leaderboard response:', leaderboardResponse);
            console.log('Leaderboard response data:', leaderboardResponse?.data);
            console.log('Leaderboard array:', leaderboardResponse?.data?.leaderboard);
            console.log('Leaderboard length:', leaderboardResponse?.data?.leaderboard?.length);
            
            if (leaderboardResponse?.data?.leaderboard) {
              const leaderboard = leaderboardResponse.data.leaderboard;
              console.log('Raw leaderboard data:', leaderboard);
              
              if (leaderboard.length > 0) {
                // Add ranking and ensure we have all necessary fields
                const sortedUsers = leaderboard.map((user, index) => ({
                  ...user,
                  rank: index + 1,
                  reportCount: user.reportCount || user.totalReports || 0,
                  accuracy: user.accuracy || 0,
                  // Calculate streak based on reports if available, otherwise use stored streak
                  streak: user.reports ? calculateUserStreak(user.reports) : (user.streak || 0),
                  // Use stored points as primary source, fallback to calculated if stored is 0
                  points: user.points > 0 ? user.points : (user.calculatedPoints || 0),
                  badge: user.badge || 'New Reporter',
                  location: user.location || 'Location not set',
                  name: user.name || 'Anonymous User',
                  // Clean up avatar - only keep valid URLs or emojis
                  avatar: user.avatar && user.avatar.startsWith('http') ? user.avatar : (user.avatar || '👤')
                }));
                console.log('Processed leaderboard data:', sortedUsers);
                setLeaderboardData(sortedUsers);
                setIsFallbackData(false);
              } else {
                console.log('Leaderboard array is empty, loading fallback data');
                await loadFallbackLeaderboardData();
              }
            } else {
              console.log('No leaderboard data found in response:', leaderboardResponse);
              // Load fallback sample data
              await loadFallbackLeaderboardData();
            }
          } catch (error) {
            console.error('Failed to load leaderboard from API:', error);
            console.error('Error details:', error.message, error.response?.data);
            // Load fallback sample data
            await loadFallbackLeaderboardData();
          }
          break;
        case 'achievements':
          // Load user's reports for stats calculation
          const reports = await loadUserReports();
          console.log('Loaded reports for achievements:', reports);
          
          // Also ensure leaderboard data is loaded for accurate points
          if (leaderboardData.length === 0) {
            await loadTabData('leaderboard');
          }
          
          // Calculate user stats with the loaded reports
          const stats = calculateUserStatsWithReports(reports);
          console.log('Calculated stats for achievements:', stats);
          if (stats) {
            setUserStats(stats);
            // Generate achievements based on calculated stats
            await generateUserAchievementsWithStats(stats);
          } else {
            // If no stats, still generate achievements with default values
            console.log('No stats available, generating default achievements');
            await generateUserAchievementsWithStats(null);
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
    if (!user) return [];
    
    try {
      console.log('Loading user reports for user:', user.id, user.name);
      const response = await apiService.getMyReports();
      console.log('API response for getMyReports:', response);
      if (response.data?.data?.reports) {
        const reports = response.data.data.reports;
        console.log('Found reports:', reports);
        console.log('Report count:', reports.length);
        console.log('Report statuses:', reports.map(r => ({ id: r._id, status: r.status, type: r.type })));
        setUserReports(reports);
        return reports;
      }
      console.log('No reports found in response');
      return [];
    } catch (error) {
      console.error('Failed to load user reports:', error);
      return [];
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
    let maxStreak = 0;
    let tempStreak = 0;
    
    // Group reports by date
    const reportsByDate = {};
    sortedReports.forEach(report => {
      const date = new Date(report.createdAt).toDateString();
      if (!reportsByDate[date]) {
        reportsByDate[date] = [];
      }
      reportsByDate[date].push(report);
    });
    
    // Sort dates
    const sortedDates = Object.keys(reportsByDate).sort((a, b) => new Date(b) - new Date(a));
    
    // Calculate current streak (consecutive days from today)
    let currentDate = new Date();
    let checkDate = new Date();
    
    while (true) {
      const dateString = checkDate.toDateString();
      if (reportsByDate[dateString]) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Calculate max streak (longest consecutive period)
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const currentDate = new Date(sortedDates[i]);
      const nextDate = new Date(sortedDates[i + 1]);
      const daysDiff = Math.floor((currentDate - nextDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    return {
      totalReports,
      verifiedReports,
      totalPoints: user?.points || 0,
      currentStreak,
      maxStreak: maxStreak + 1, // +1 because we count the days, not the gaps
      accuracy,
      rank: 0 // Will be calculated from leaderboard
    };
  };

  // Calculate user stats with provided reports (for achievements)
  const calculateUserStatsWithReports = (reports) => {
    // Use database values as primary source
    const totalReports = reports ? reports.length : 0;
    const verifiedReports = reports ? reports.filter(report => report.status === 'resolved' || report.status === 'Resolved').length : 0;
    const accuracy = totalReports > 0 ? Math.round((verifiedReports / totalReports) * 100) : 0;
    
    // Get points from leaderboard data if available, otherwise use user points
    const currentUserInLeaderboard = leaderboardData.find(u => u._id === user?.id);
    const totalPoints = currentUserInLeaderboard?.points || user?.points || 0;
    const level = user?.level || 1;
    const currentStreak = user?.streak || 0;
    const badge = user?.badge || 'New Reporter';
    
    // Calculate rank from leaderboard
    const rank = leaderboardData.findIndex(u => u._id === user?.id) + 1 || 0;
    
    // Calculate additional stats from reports if available
    let maxStreak = 0;
    if (reports && reports.length > 0) {
      const sortedReports = [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      let tempStreak = 0;
      
      // Group reports by date
      const reportsByDate = {};
      sortedReports.forEach(report => {
        const date = new Date(report.createdAt).toDateString();
        if (!reportsByDate[date]) {
          reportsByDate[date] = [];
        }
        reportsByDate[date].push(report);
      });
      
      // Sort dates
      const sortedDates = Object.keys(reportsByDate).sort((a, b) => new Date(b) - new Date(a));
      
      // Calculate max streak (longest consecutive period)
      for (let i = 0; i < sortedDates.length - 1; i++) {
        const currentDate = new Date(sortedDates[i]);
        const nextDate = new Date(sortedDates[i + 1]);
        const daysDiff = Math.floor((currentDate - nextDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          tempStreak++;
          maxStreak = Math.max(maxStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }
      maxStreak = maxStreak + 1; // +1 because we count the days, not the gaps
    }
    
    return {
      totalReports,
      verifiedReports,
      totalPoints,
      level,
      currentStreak,
      maxStreak,
      accuracy,
      badge,
      rank
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

  // Generate user achievements with provided stats
  const generateUserAchievementsWithStats = async (stats) => {
    // Prevent multiple simultaneous executions
    if (loading || achievementGenerationInProgress) {
      console.log('Achievement generation already in progress, skipping...');
      return;
    }
    
    setAchievementGenerationInProgress(true);
    
    try {
    
    // Get comprehensive data from leaderboard (most accurate source)
    const currentUserInLeaderboard = leaderboardData.find(u => u._id === user?.id);
    const leaderboardPoints = currentUserInLeaderboard?.points || 0;
    const leaderboardReports = currentUserInLeaderboard?.totalReports || 0;
    const leaderboardLevel = currentUserInLeaderboard?.level || 1;
    const leaderboardStreak = currentUserInLeaderboard?.streak || 0;
    const leaderboardBadge = currentUserInLeaderboard?.badge || 'New Reporter';
    const leaderboardAccuracy = currentUserInLeaderboard?.accuracy || 0;
    const rank = leaderboardData.findIndex(u => u._id === user?.id) + 1 || 0;
    
    // Get user's already earned achievements from database
    const earnedAchievementNames = user?.achievements?.map(ach => ach.name) || [];
    
    // Calculate accuracy from actual user reports
    const calculateAchievementAccuracy = () => {
      if (userReports.length === 0) return 0;
      
      const resolvedReports = userReports.filter(report => 
        report.status === 'Resolved' || report.status === 'resolved'
      ).length;
      
      // Accuracy = (resolved reports / total reports) * 100
      return Math.round((resolvedReports / userReports.length) * 100);
    };
    
    const statsToUse = stats || {
      totalReports: leaderboardReports || userReports.length,
      totalPoints: leaderboardPoints,
      level: leaderboardLevel,
      currentStreak: leaderboardStreak,
      accuracy: calculateAchievementAccuracy(),
      badge: leaderboardBadge,
      rank: rank
    };
    console.log('Generating achievements with leaderboard stats:', statsToUse);
    console.log('Report data for calculations:', {
      totalUserReports: userReports.length,
      resolvedReports: userReports.filter(r => r.status === 'Resolved' || r.status === 'resolved').length,
      fakeReports: userReports.filter(r => r.status === 'Fake Report' || r.status === 'fake').length,
      activeReports: userReports.filter(r => r.status === 'Active' || r.status === 'active').length,
      calculatedAccuracy: calculateAchievementAccuracy(),
      reportStatuses: userReports.map(r => ({ id: r._id, status: r.status }))
    });
    console.log('Leaderboard data:', {
      leaderboardPoints,
      leaderboardReports,
      leaderboardLevel,
      leaderboardStreak,
      leaderboardBadge,
      leaderboardAccuracy,
      rank,
      currentUserInLeaderboard
    });
    
    // Use genuine reports for achievement calculations
    const genuineReports = userReports.filter(r => r.status !== 'Fake Report');
    const reportsWithPhotos = genuineReports.filter(r => r.photo || (r.photos && r.photos.length > 0));
    
    const newAchievements = [
      {
        id: 'first_report',
        name: 'First Steps',
        description: 'Submit your first genuine traffic report',
        icon: 'BarChart3',
        unlocked: genuineReports.length >= 1,
        progress: Math.min((genuineReports.length / 1) * 100, 100),
        category: 'reports',
        rarity: 'common'
      },
      {
        id: 'reporter_novice',
        name: 'Reporter Novice',
        description: 'Submit 3 genuine traffic reports',
        icon: 'Target',
        unlocked: genuineReports.length >= 3,
        progress: Math.min((genuineReports.length / 3) * 100, 100),
        category: 'reports',
        rarity: 'common'
      },
      {
        id: 'report_master',
        name: 'Report Master',
        description: 'Submit 10 genuine traffic reports',
        icon: 'Trophy',
        unlocked: genuineReports.length >= 10,
        progress: Math.min((genuineReports.length / 10) * 100, 100),
        category: 'reports',
        rarity: 'rare'
      },
      {
        id: 'super_reporter',
        name: 'Super Reporter',
        description: 'Submit 25 genuine traffic reports',
        icon: 'Crown',
        unlocked: genuineReports.length >= 25,
        progress: Math.min((genuineReports.length / 25) * 100, 100),
        category: 'reports',
        rarity: 'epic'
      },
      {
        id: 'point_collector',
        name: 'Point Collector',
        description: 'Earn 100 points',
        icon: 'Star',
        unlocked: statsToUse.totalPoints >= 100,
        progress: Math.min((statsToUse.totalPoints / 100) * 100, 100),
        category: 'points',
        rarity: 'common'
      },
      {
        id: 'point_master',
        name: 'Point Master',
        description: 'Earn 500 points',
        icon: 'Award',
        unlocked: statsToUse.totalPoints >= 500,
        progress: Math.min((statsToUse.totalPoints / 500) * 100, 100),
        category: 'points',
        rarity: 'rare'
      },
      {
        id: 'level_up',
        name: 'Level Up',
        description: 'Reach level 5',
        icon: 'TrendingUp',
        unlocked: statsToUse.level >= 5,
        progress: Math.min((statsToUse.level / 5) * 100, 100),
        category: 'level',
        rarity: 'rare'
      },
      {
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Maintain a 3-day streak',
        icon: 'Calendar',
        unlocked: statsToUse.currentStreak >= 3,
        progress: Math.min((statsToUse.currentStreak / 3) * 100, 100),
        category: 'streak',
        rarity: 'rare'
      },
      {
        id: 'accuracy_expert',
        name: 'Accuracy Expert',
        description: 'Maintain 80% accuracy',
        icon: 'CheckCircle',
        unlocked: statsToUse.accuracy >= 80,
        progress: Math.min((statsToUse.accuracy / 80) * 100, 100),
        category: 'accuracy',
        rarity: 'epic'
      },
      {
        id: 'badge_collector',
        name: 'Badge Collector',
        description: 'Earn a Rising Star badge',
        icon: 'Shield',
        unlocked: ['Rising Star', 'Bronze Hero', 'Silver Scout', 'Gold Guardian', 'Diamond Reporter'].includes(statsToUse.badge),
        progress: ['New Reporter'].includes(statsToUse.badge) ? 0 : 
                 ['Rising Star'].includes(statsToUse.badge) ? 25 :
                 ['Bronze Hero'].includes(statsToUse.badge) ? 50 :
                 ['Silver Scout'].includes(statsToUse.badge) ? 75 :
                 ['Gold Guardian', 'Diamond Reporter'].includes(statsToUse.badge) ? 100 : 0,
        category: 'badge',
        rarity: 'epic'
      },
      {
        id: 'top_10',
        name: 'Top 10',
        description: 'Reach top 10 in leaderboard',
        icon: 'TrendingUp',
        unlocked: statsToUse.rank <= 10 && statsToUse.rank > 0,
        progress: statsToUse.rank > 0 ? Math.min((10 / statsToUse.rank) * 100, 100) : 0,
        category: 'leaderboard',
        rarity: 'legendary'
      }
    ];
    
    console.log('Setting achievements:', newAchievements);
    console.log('User earned achievements from database:', earnedAchievementNames);
    
    // Check for newly unlocked achievements (no points awarded)
    // Only update achievements that are unlocked AND not already earned (not in database)
    const newlyUnlocked = newAchievements.filter(newAch => {
      return newAch.unlocked && !earnedAchievementNames.includes(newAch.name);
    });
    
    // Update achievements in database (no points awarded)
    if (newlyUnlocked.length > 0) {
      console.log('Newly unlocked achievements:', newlyUnlocked);
      
      // Update achievements in database (no points awarded)
      await updateUserAchievements(newlyUnlocked);
    }
    
    setAchievements(newAchievements);
    } catch (error) {
      console.error('Error generating achievements:', error);
    } finally {
      setAchievementGenerationInProgress(false);
    }
  };

  // Load fallback leaderboard data when API fails
  const loadFallbackLeaderboardData = async () => {
    try {
      // Try to get some real user data as fallback
      const allUsersResponse = await apiService.getAllUsers();
      if (allUsersResponse?.data?.users) {
        const users = allUsersResponse.data.users.filter(u => u.role === 'citizen');
        const fallbackData = users.slice(0, 10).map((user, index) => ({
          _id: user._id,
          name: user.name || 'Anonymous User',
          avatar: user.avatar && user.avatar.startsWith('http') ? user.avatar : '👤',
          points: (user.points || 0) + (index * 50), // Add some variation
          reportCount: Math.floor(Math.random() * 20) + 1,
          accuracy: Math.floor(Math.random() * 30) + 70,
          streak: Math.floor(Math.random() * 10) + 1,
          badge: getRandomBadge(),
          location: user.location || 'Location not set',
          rank: index + 1
        }));
        
        // Sort by points
        fallbackData.sort((a, b) => b.points - a.points);
        setLeaderboardData(fallbackData);
        setIsFallbackData(true);
        console.log('Loaded fallback leaderboard data:', fallbackData);
      } else {
        // Generate completely sample data
        const sampleData = generateSampleLeaderboardData();
        setLeaderboardData(sampleData);
        setIsFallbackData(true);
        console.log('Generated sample leaderboard data:', sampleData);
      }
    } catch (error) {
      console.error('Failed to load fallback data:', error);
      // Generate completely sample data
      const sampleData = generateSampleLeaderboardData();
      setLeaderboardData(sampleData);
      setIsFallbackData(true);
      console.log('Generated sample leaderboard data:', sampleData);
    }
  };

  // Generate sample leaderboard data
  const generateSampleLeaderboardData = () => {
    const sampleNames = [
      'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Neha Singh', 'Raj Malhotra',
      'Anjali Verma', 'Vikram Singh', 'Pooja Gupta', 'Arun Kumar', 'Meera Reddy'
    ];
    
    const sampleBadges = ['Traffic Guardian', 'Road Warrior', 'Safety Champion', 'Community Hero', 'Traffic Expert'];
    
    return sampleNames.map((name, index) => ({
      _id: `sample_${index}`,
      name: name,
      avatar: '👤', // Always use emoji for sample data
      points: 1000 - (index * 80) + Math.floor(Math.random() * 50),
      reportCount: Math.floor(Math.random() * 25) + 5,
      accuracy: Math.floor(Math.random() * 25) + 75,
      streak: Math.floor(Math.random() * 15) + 1,
      badge: sampleBadges[Math.floor(Math.random() * sampleBadges.length)],
      location: 'Mumbai, India',
      rank: index + 1
    }));
  };

  // Get random badge
  const getRandomBadge = () => {
    const badges = ['Traffic Guardian', 'Road Warrior', 'Safety Champion', 'Community Hero', 'Traffic Expert'];
    return badges[Math.floor(Math.random() * badges.length)];
  };

  // Calculate streak for a user based on their reports
  const calculateUserStreak = (reports) => {
    if (!reports || reports.length === 0) return 0;
    
    // Group reports by date
    const reportsByDate = {};
    reports.forEach(report => {
      const date = new Date(report.createdAt).toDateString();
      if (!reportsByDate[date]) {
        reportsByDate[date] = [];
      }
      reportsByDate[date].push(report);
    });
    
    // Sort dates
    const sortedDates = Object.keys(reportsByDate).sort((a, b) => new Date(b) - new Date(a));
    
    // Calculate current streak (consecutive days from most recent)
    let currentStreak = 0;
    let checkDate = new Date(sortedDates[0]);
    
    while (true) {
      const dateString = checkDate.toDateString();
      if (reportsByDate[dateString]) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return currentStreak;
  };

  // Render avatar properly - handle both URLs and emojis
  const renderAvatar = (avatar, fallback = '👤', size = 'text-3xl') => {
    if (!avatar) return <div className={size}>{fallback}</div>;
    
    // If it's a URL (starts with http), render as image
    if (avatar.startsWith('http')) {
      const sizeMap = {
        'text-5xl': 'w-56 h-56',
        'text-4xl': 'w-48 h-48',
        'text-3xl': 'w-12 h-12',
        'text-2xl': 'w-10 h-10', 
        'text-xl': 'w-8 h-8'
      };
      
      return (
        <div className="relative">
          <img 
            src={avatar} 
            alt="User avatar" 
            className={`${sizeMap[size] || 'w-12 h-12'} rounded-full object-cover`}
            onError={(e) => {
              e.target.style.display = 'none';
              // Show fallback emoji if image fails to load
              const fallbackDiv = e.target.nextElementSibling;
              if (fallbackDiv) fallbackDiv.style.display = 'block';
            }}
          />
          {/* Fallback emoji (hidden by default) */}
          <div className={`${size} hidden`} style={{ display: 'none' }}>
            {fallback}
          </div>
        </div>
      );
    }
    
    // If it's an emoji or text, render as is
    return <div className={size}>{avatar}</div>;
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
    const initializeUser = async () => {
      if (user) {
        loadUserReports();
        // Also load leaderboard data if user is a citizen
        if (user.role === 'citizen') {
          loadTabData('leaderboard');
          // Don't automatically generate achievements to prevent infinite loops
        }
      }
    };
    initializeUser();
  }, [user]);

  // Removed automatic achievement generation to prevent infinite loops
  // Achievements are now only generated when explicitly requested via loadTabData('achievements')

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
      'CheckCircle': CheckCircle,
      'Shield': Shield
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

  // Get current user data from leaderboard (most accurate source)
  const currentUserInLeaderboard = leaderboardData.find(u => u._id === user?.id);
  
  // Calculate accuracy based on resolved reports / total reports
  const calculateAccuracy = () => {
    if (userReports.length === 0) return 0;
    
    const resolvedReports = userReports.filter(report => 
      report.status === 'Resolved' || report.status === 'resolved'
    ).length;
    
    // Accuracy = (resolved reports / total reports) * 100
    return Math.round((resolvedReports / userReports.length) * 100);
  };

  // Calculate badge based on points (matching backend logic)
  const calculateBadge = (points) => {
    if (points >= 5000) return 'Diamond Reporter';
    if (points >= 3000) return 'Gold Guardian';
    if (points >= 1500) return 'Silver Scout';
    if (points >= 500) return 'Bronze Hero';
    if (points >= 100) return 'Rising Star';
    return 'New Reporter';
  };
  
  const totalPoints = currentUserInLeaderboard?.points || user?.points || 0;
  const calculatedBadge = calculateBadge(totalPoints);
  
  const citizenStats = {
    totalReports: currentUserInLeaderboard?.genuineReports || userReports.filter(r => r.status !== 'Fake Report').length || 0,
    resolvedReports: userReports.filter(report => report.status === 'Resolved').length || 0,
    fakeReports: userReports.filter(report => report.status === 'Fake Report').length || 0,
    totalPoints: totalPoints,
    level: currentUserInLeaderboard?.level || user?.level || 1,
    currentStreak: currentUserInLeaderboard?.streak || user?.streak || 0,
    accuracy: calculateAccuracy(),
    badge: calculatedBadge, // Use calculated badge instead of stored badge
    rank: leaderboardData.findIndex(u => u._id === user?.id) + 1 || 0
  };
  
  // Debug logging for stats calculation
  console.log('Citizen Stats Calculation:', {
    userReportsCount: userReports.length,
    leaderboardGenuineReports: currentUserInLeaderboard?.genuineReports,
    finalTotalReports: citizenStats.totalReports,
    resolvedCount: userReports.filter(r => r.status === 'Resolved').length,
    fakeCount: userReports.filter(r => r.status === 'Fake Report').length,
    calculatedAccuracy: citizenStats.accuracy,
    allReportStatuses: userReports.map(r => r.status),
    totalPoints: totalPoints,
    calculatedBadge: calculatedBadge,
    storedBadge: currentUserInLeaderboard?.badge || user?.badge,
    leaderboardData: currentUserInLeaderboard
  });

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
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { label: 'Level', value: citizenStats.level, icon: TrendingUp, color: 'purple', suffix: '' },
                  { label: 'Total Reports', value: citizenStats.totalReports, icon: BarChart3, color: 'blue', suffix: '' },
                  { label: 'Points Earned', value: citizenStats.totalPoints, icon: Star, color: 'yellow', suffix: '' },
                  { label: 'Current Streak', value: citizenStats.currentStreak, icon: Calendar, color: 'green', suffix: ' days' },
                  { label: 'Accuracy Rate', value: citizenStats.accuracy, icon: CheckCircle, color: 'indigo', suffix: '%' }
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300">
                      <div className="text-center">
                        {/* Icon */}
                        <div className={`inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-${stat.color}-100 to-${stat.color}-200 mb-1.5`}>
                          <Icon className={`h-3.5 w-3.5 text-${stat.color}-600`} />
                        </div>
                        
                        {/* Label */}
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{stat.label}</p>
                        
                        {/* Value */}
                        <p className="text-sm font-bold text-slate-900">{stat.value}{stat.suffix}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Achievements */}
              <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-2xl shadow-xl border border-slate-200 p-8 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">🏆 My Achievements</h3>
                      <p className="text-slate-600">Track your progress and unlock new milestones</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => loadTabData('achievements')}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        <div className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>
                          {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          ) : (
                            <div className="w-4 h-4 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <span>{loading ? 'Updating...' : 'Refresh'}</span>
                      </button>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {achievements.filter(a => a.unlocked).length}/{achievements.length}
                        </div>
                        <div className="text-sm text-slate-500">Completed</div>
                      </div>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin"></div>
                        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                      <span className="ml-4 text-slate-600 font-medium">Loading achievements...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {achievements.map((achievement, index) => {
                        const Icon = getAchievementIcon(achievement.icon);
                        const isUnlocked = achievement.unlocked;
                        const progress = achievement.progress || 0;
                        
                        // Rarity colors with more vibrant gradients
                        const rarityColors = {
                          common: 'from-emerald-400 to-teal-500',
                          rare: 'from-blue-400 to-indigo-500',
                          epic: 'from-purple-400 to-pink-500',
                          legendary: 'from-yellow-400 to-orange-500'
                        };
                        
                        const rarityBgColors = {
                          common: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200',
                          rare: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200',
                          epic: 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200',
                          legendary: 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                        };
                        
                        const rarityIconColors = {
                          common: 'text-emerald-600',
                          rare: 'text-blue-600',
                          epic: 'text-purple-600',
                          legendary: 'text-yellow-600'
                        };

                        return (
                          <div
                            key={achievement.id}
                            className={`group relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                              isUnlocked
                                ? `${rarityBgColors[achievement.rarity]} shadow-md`
                                : 'bg-slate-50 border-slate-200 opacity-75'
                            }`}
                          >
                            {/* Rarity indicator */}
                            <div className={`absolute top-3 right-3 w-3 h-3 rounded-full bg-gradient-to-r ${rarityColors[achievement.rarity]} shadow-sm`}></div>
                            
                            {/* Achievement icon */}
                            <div className={`flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl shadow-lg border-2 ${
                              isUnlocked 
                                ? `bg-gradient-to-br from-white to-${achievement.rarity === 'common' ? 'emerald' : achievement.rarity === 'rare' ? 'blue' : achievement.rarity === 'epic' ? 'purple' : 'yellow'}-100 border-${achievement.rarity === 'common' ? 'emerald' : achievement.rarity === 'rare' ? 'blue' : achievement.rarity === 'epic' ? 'purple' : 'yellow'}-200` 
                                : 'bg-gradient-to-br from-white to-slate-100 border-slate-200'
                            }`}>
                              <Icon className={`h-6 w-6 ${
                                isUnlocked 
                                  ? rarityIconColors[achievement.rarity]
                                  : 'text-slate-400'
                              }`} />
                            </div>
                            
                            {/* Achievement content */}
                            <div className="text-center">
                              <h4 className="font-bold text-slate-900 text-base mb-1.5">{achievement.name}</h4>
                              <p className="text-xs text-slate-600 mb-3 leading-relaxed">{achievement.description}</p>
                              
                              {/* Progress bar */}
                              <div className="mb-3">
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Progress</span>
                                  <span className="text-xs font-bold text-slate-700">{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className={`h-1.5 rounded-full bg-gradient-to-r ${rarityColors[achievement.rarity]} transition-all duration-500 ease-out`}
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>
                              
                              {/* Status */}
                              <div className="flex items-center justify-center">
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  isUnlocked 
                                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 shadow-sm' 
                                    : 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {isUnlocked ? '✨ Unlocked' : '🔒 Locked'}
                                </div>
                              </div>
                            </div>
                            
                            {/* Hover effect overlay */}
                            {isUnlocked && (
                              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Current Badge Display */}
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">🎖️ Current Badge</h3>
                      <p className="text-indigo-100">Your current status in the community</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{citizenStats.badge}</div>
                      <div className="text-sm text-indigo-200">Level {citizenStats.level}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-sm text-indigo-200 mb-1">Next Badge</div>
                      <div className="text-lg font-semibold">
                        {(() => {
                          const points = citizenStats.totalPoints;
                          if (points >= 5000) return 'Max Level';
                          if (points >= 3000) return 'Diamond Reporter';
                          if (points >= 1500) return 'Gold Guardian';
                          if (points >= 500) return 'Silver Scout';
                          if (points >= 100) return 'Bronze Hero';
                          return 'Rising Star';
                        })()}
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-sm text-indigo-200 mb-1">Points to Next</div>
                      <div className="text-lg font-semibold">
                        {(() => {
                          const points = citizenStats.totalPoints;
                          if (points >= 5000) return 'Max Level';
                          if (points >= 3000) return `${5000 - points} pts`;
                          if (points >= 1500) return `${3000 - points} pts`;
                          if (points >= 500) return `${1500 - points} pts`;
                          if (points >= 100) return `${500 - points} pts`;
                          return `${100 - points} pts`;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && user?.role === 'citizen' && (
            <div className="space-y-6">
              {/* Header with refresh button */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Community Leaderboard</h2>
                  {isFallbackData && (
                    <div className="flex items-center mt-2 text-sm text-amber-600">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                      Showing sample data - API connection issue
                    </div>
                  )}
                </div>
                <button
                  onClick={() => loadTabData('leaderboard')}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <div className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <div className="w-4 h-4 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <span>{loading ? 'Loading...' : 'Refresh'}</span>
                </button>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                  <div className="mt-6 text-center">
                    <div className="text-xl font-semibold text-slate-700 mb-2">Loading Leaderboard</div>
                    <div className="text-slate-500">Fetching the latest community rankings...</div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Enhanced Your Position */}
                  <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-4 text-white relative overflow-hidden">
                    {/* Background Elements */}
                    <div className="absolute inset-0">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                      <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/10 rounded-full blur-lg"></div>
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold mb-1">Your Position</h3>
                          <p className="text-blue-100 text-xs">Track your progress and achievements</p>
                        </div>
                        <div className="text-4xl">🏆</div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center bg-white/10 rounded-xl p-2 backdrop-blur-sm">
                          <div className="text-xl font-bold mb-1">#{userRank || 'N/A'}</div>
                          <div className="text-xs text-blue-100">Global Rank</div>
                          <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                            <div 
                              className="bg-gradient-to-r from-yellow-400 to-orange-400 h-1 rounded-full transition-all duration-500" 
                              style={{width: `${Math.min((userRank || 100) / 100 * 100, 100)}%`}}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="text-center bg-white/10 rounded-xl p-2 backdrop-blur-sm">
                          <div className="text-xl font-bold mb-1">
                            {(() => {
                              // Find current user in leaderboard data to get consistent points
                              const currentUserInLeaderboard = leaderboardData.find(u => u._id === user?.id);
                              return currentUserInLeaderboard?.points || user?.points || 0;
                            })()}
                          </div>
                          <div className="text-xs text-blue-100">Total Points</div>
                          <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-blue-400 h-1 rounded-full transition-all duration-500" 
                              style={{width: `${Math.min(((() => {
                                const currentUserInLeaderboard = leaderboardData.find(u => u._id === user?.id);
                                return currentUserInLeaderboard?.points || user?.points || 0;
                              })()) / 1000 * 100, 100)}%`}}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="text-center bg-white/10 rounded-xl p-2 backdrop-blur-sm">
                          <div className="text-xl font-bold mb-1">{citizenStats?.currentStreak || 0}</div>
                          <div className="text-xs text-blue-100">Day Streak</div>
                          <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                            <div 
                              className="bg-gradient-to-r from-red-400 to-pink-400 h-1 rounded-full transition-all duration-500" 
                              style={{width: `${Math.min((citizenStats?.currentStreak || 0) / 30 * 100, 100)}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

              {/* Enhanced Top 3 Podium */}
              {leaderboardData.length >= 3 ? (
                <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-2xl shadow-xl border border-slate-200 p-5 relative overflow-hidden">
                  {/* Background Elements */}
                  <div className="absolute inset-0">
                    <div className="absolute top-5 right-5 w-16 h-16 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-5 left-5 w-12 h-12 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-full blur-xl"></div>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="text-center mb-5">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">🏆 Top Contributors</h3>
                      <p className="text-slate-600 text-sm">Celebrating our community champions</p>
                    </div>
                    
                    <div className="flex items-end justify-center space-x-6">
                      {/* Second Place */}
                      <div className="text-center transform hover:scale-105 transition-all duration-300">
                        <div className="relative mb-3">
                          <div className="w-24 h-24 bg-gradient-to-br from-slate-300 to-gray-400 rounded-full flex items-center justify-center text-2xl overflow-hidden shadow-lg border-2 border-slate-200">
                            {renderAvatar(leaderboardData[1]?.avatar, '👤', 'text-2xl')}
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-slate-400 to-gray-500 rounded-full flex items-center justify-center shadow-md">
                            <Medal className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1">{leaderboardData[1]?.name}</h4>
                        <div className="bg-gradient-to-r from-slate-100 to-gray-100 rounded-xl p-2 mb-2">
                          <div className="text-lg font-bold text-slate-700">{leaderboardData[1]?.points || 0}</div>
                          <div className="text-xs text-slate-600">Points</div>
                        </div>
                        <div className="h-14 bg-gradient-to-t from-slate-300 to-gray-200 rounded-t-xl flex items-end justify-center shadow-md">
                          <span className="text-white font-bold text-sm mb-2">🥈</span>
                        </div>
                      </div>

                      {/* First Place */}
                      <div className="text-center transform hover:scale-110 transition-all duration-300">
                        <div className="relative mb-3">
                          <div className="w-28 h-28 bg-gradient-to-br from-yellow-400 via-orange-300 to-amber-300 rounded-full flex items-center justify-center text-3xl overflow-hidden shadow-xl border-2 border-yellow-200">
                            {renderAvatar(leaderboardData[0]?.avatar, '👑', 'text-3xl')}
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                            <Crown className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base mb-1">{leaderboardData[0]?.name}</h4>
                        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-2 mb-2">
                          <div className="text-xl font-bold text-slate-700">{leaderboardData[0]?.points || 0}</div>
                          <div className="text-xs text-slate-600">Points</div>
                        </div>
                        <div className="h-18 bg-gradient-to-t from-yellow-400 to-orange-300 rounded-t-xl flex items-end justify-center shadow-lg">
                          <span className="text-white font-bold text-lg mb-2">🥇</span>
                        </div>
                      </div>

                      {/* Third Place */}
                      <div className="text-center transform hover:scale-105 transition-all duration-300">
                        <div className="relative mb-3">
                          <div className="w-24 h-24 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-full flex items-center justify-center text-2xl overflow-hidden shadow-lg border-2 border-amber-200">
                            {renderAvatar(leaderboardData[2]?.avatar, '🥉', 'text-2xl')}
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-full flex items-center justify-center shadow-md">
                            <Award className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1">{leaderboardData[2]?.name}</h4>
                        <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-xl p-2 mb-2">
                          <div className="text-lg font-bold text-slate-700">{leaderboardData[2]?.points || 0}</div>
                          <div className="text-xs text-slate-600">Points</div>
                        </div>
                        <div className="h-12 bg-gradient-to-t from-amber-600 to-yellow-500 rounded-t-xl flex items-end justify-center shadow-md">
                          <span className="text-white font-bold text-sm mb-2">🥉</span>
                        </div>
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

              {/* Enhanced Complete Rankings */}
              <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-2xl shadow-xl border border-slate-200 relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-2xl"></div>
                </div>
                
                <div className="relative z-10">
                  <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                    <div className="flex items-center justify-between">
                                              <div>
                          <h3 className="text-lg font-bold text-slate-900">Complete Rankings</h3>
                          <p className="text-slate-600 mt-1 text-sm">See where you stand among all contributors</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">
                            {leaderboardData.length > 0 ? `${leaderboardData.length} users ranked` : 'No users found'}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">Updated in real-time</div>
                        </div>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-slate-100">
                    {leaderboardData.length > 0 ? (
                      leaderboardData.map((member, index) => (
                        <div
                          key={member._id}
                          className={`p-3 hover:bg-white/80 transition-all duration-300 group ${
                            member._id === user?.id ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8">
                                <div className="text-lg">
                                  {getRankIcon(index + 1)}
                                </div>
                              </div>
                              <div className="text-2xl overflow-hidden">
                                {renderAvatar(member.avatar, '👤', 'text-2xl')}
                              </div>
                                                              <div>
                                  <h4 className="font-bold text-slate-900 text-base flex items-center space-x-3 mb-1">
                                    <span>{member.name}</span>
                                    {member._id === user?.id && (
                                      <span className="text-xs bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2 py-0.5 rounded-full font-medium shadow-md">You</span>
                                    )}
                                  </h4>
                                  <p className="text-slate-600 mb-1 text-sm">{member.location || 'Location not set'}</p>
                                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getBadgeColor(member.badge)} text-white shadow-sm`}>
                                    {member.badge}
                                  </div>
                                </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-slate-900 mb-1">{member.points?.toLocaleString() || 0}</div>
                              <div className="text-xs text-slate-600 mb-2">Total Points</div>
                              
                              {/* Enhanced Stats Display */}
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-white rounded-lg p-2 shadow-sm">
                                  <div className="text-sm font-bold text-slate-700">{member.reportCount || 0}</div>
                                  <div className="text-xs text-slate-500">Reports</div>
                                </div>
                                <div className="bg-white rounded-lg p-2 shadow-sm">
                                  <div className="text-sm font-bold text-slate-700">{member.accuracy || 0}%</div>
                                  <div className="text-xs text-slate-500">Accuracy</div>
                                </div>
                                <div className="bg-white rounded-lg p-2 shadow-sm">
                                  <div className="text-sm font-bold text-slate-700">🔥 {member.streak || 0}</div>
                                  <div className="text-xs text-slate-500">Streak</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-16 text-center">
                        <div className="relative mb-6">
                          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto">
                            <Trophy className="h-12 w-12 text-slate-400" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                            <div className="w-4 h-4 bg-white rounded-full"></div>
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">No Leaderboard Data</h3>
                        <p className="text-slate-500 mb-6">Be the first to submit reports and climb the rankings!</p>
                        <button
                          onClick={() => loadTabData('leaderboard')}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          Refresh Data
                        </button>
                      </div>
                    )}
                  </div>
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