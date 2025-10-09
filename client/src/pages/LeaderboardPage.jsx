import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Star, 
  Crown, 
  Users, 
  TrendingUp,
  Award,
  Target,
  Calendar,
  MapPin,
  RefreshCw,
  User,
  TrendingDown,
  Zap,
  Shield,
  Heart
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../utils/api';
import toast from 'react-hot-toast';

/**
 * @typedef {Object} LeaderboardUser
 * @property {string} _id
 * @property {string} name
 * @property {number} points
 * @property {number} reportCount
 * @property {number} accuracy
 * @property {string} badge
 * @property {number} level
 * @property {string} avatar
 * @property {string} location
 * @property {string} joinDate
 * @property {number} streak
 * @property {number} rank
 */

export function LeaderboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isFallbackData, setIsFallbackData] = useState(false);

  // Clean avatar URL - fix Cloudinary links and ensure proper display
  const cleanAvatarUrl = (avatar) => {
    if (!avatar) return '👤';
    
    // If it's a valid URL (starts with http), return it
    if (avatar.startsWith('http')) {
      // Ensure Cloudinary URLs are properly formatted
      if (avatar.includes('cloudinary.com')) {
        // Add transformation parameters for better display
        if (!avatar.includes('/upload/')) {
          return avatar;
        }
        // Add quality and format optimization
        return avatar.replace('/upload/', '/upload/q_auto,f_auto,w_100,h_100,c_fill,g_face/');
      }
      return avatar;
    }
    
    // If it's an emoji or text, return as is
    return avatar;
  };

  // Load leaderboard data - EXACTLY like ProfilePage
  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      console.log('=== LEADERBOARD DEBUG START ===');
      console.log('API Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:5002/api');
      console.log('User context:', user);
      
      // Use EXACTLY the same approach as ProfilePage
      const leaderboardResponse = await apiService.getLeaderboard('month', 50);
      console.log('Leaderboard response:', leaderboardResponse);
      
      if (leaderboardResponse?.data?.leaderboard && leaderboardResponse.data.leaderboard.length > 0) {
        const leaderboard = leaderboardResponse.data.leaderboard;
        // Add ranking and ensure we have all necessary fields - EXACTLY like ProfilePage
        const sortedUsers = leaderboard.map((user, index) => ({
          ...user,
          rank: index + 1,
          reportCount: user.reportCount || 0,
          accuracy: user.accuracy || 0,
          // Calculate streak based on reports if available, otherwise use stored streak
          streak: user.reports ? calculateUserStreak(user.reports) : (user.streak || 0),
          // Ensure points are consistent - use calculated points if available, otherwise stored points
          points: Math.max(user.calculatedPoints || 0, user.points || 0),
          badge: user.badge || 'New Reporter',
          location: user.location || 'Location not set',
          name: user.name || 'Anonymous User',
          // Clean up avatar using our new function
          avatar: cleanAvatarUrl(user.avatar)
        }));
        console.log('Processed leaderboard data:', sortedUsers);
        setLeaderboardData(sortedUsers);
        setUserStats(leaderboardResponse.data.userRank);
        setTotalUsers(leaderboardResponse.data.totalUsers || leaderboard.length);
        setIsFallbackData(false);
      } else {
        console.log('No leaderboard data found in response:', leaderboardResponse);
        // Load fallback data - EXACTLY like ProfilePage
        await loadFallbackLeaderboardData();
      }
      console.log('=== LEADERBOARD DEBUG END ===');
    } catch (error) {
      console.error('❌ FAILED to load leaderboard:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        stack: error.stack
      });
      // Load fallback data - EXACTLY like ProfilePage
      await loadFallbackLeaderboardData();
    } finally {
      setLoading(false);
    }
  };

  // Load achievements
  const loadAchievements = async () => {
    try {
      const response = await apiService.getAchievements();
      console.log('Achievements response:', response);
      
      // The API interceptor returns response.data directly
      if (response && response.achievements) {
        setAchievements(response.achievements);
      } else if (response && Array.isArray(response)) {
        // Fallback if response structure is different
        setAchievements(response);
      } else {
        console.warn('Unexpected achievements response structure:', response);
        setAchievements([]);
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
      setAchievements([]);
    }
  };

    // Load fallback leaderboard data when API fails - EXACTLY like ProfilePage
  const loadFallbackLeaderboardData = async () => {
    try {
      // Try to get some real user data as fallback - EXACTLY like ProfilePage
      const allUsersResponse = await apiService.getAllUsers();
      if (allUsersResponse?.data?.users) {
        const users = allUsersResponse.data.users.filter(u => u.role === 'citizen');
        const fallbackData = users.slice(0, 10).map((user, index) => ({
          _id: user._id,
          name: user.name || 'Anonymous User',
          avatar: cleanAvatarUrl(user.avatar), // Use our clean function
          points: (user.points || 0) + (index * 50), // Add some variation - EXACTLY like ProfilePage
          reportCount: Math.floor(Math.random() * 20) + 1, // EXACTLY like ProfilePage
          accuracy: Math.floor(Math.random() * 30) + 70, // EXACTLY like ProfilePage
          streak: Math.floor(Math.random() * 10) + 1, // EXACTLY like ProfilePage
          badge: getRandomBadge(), // EXACTLY like ProfilePage
          location: user.location || 'Location not set',
          rank: index + 1
        }));
        
        // Sort by points
        fallbackData.sort((a, b) => b.points - a.points);
        setLeaderboardData(fallbackData);
        setTotalUsers(fallbackData.length);
        setIsFallbackData(true);
        console.log('Loaded fallback leaderboard data:', fallbackData);
      } else {
        // Generate completely sample data - EXACTLY like ProfilePage
        const sampleData = generateSampleLeaderboardData();
        setLeaderboardData(sampleData);
        setTotalUsers(sampleData.length);
        setIsFallbackData(true);
        console.log('Generated sample leaderboard data:', sampleData);
      }
    } catch (error) {
      console.error('Failed to load fallback data:', error);
      // Generate completely sample data - EXACTLY like ProfilePage
      const sampleData = generateSampleLeaderboardData();
      setLeaderboardData(sampleData);
      setTotalUsers(sampleData.length);
      setIsFallbackData(true);
      console.log('Generated sample leaderboard data:', sampleData);
        }
  };

  // Calculate streak for a user based on their reports - EXACTLY like ProfilePage
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

  // Generate sample leaderboard data - EXACTLY like ProfilePage
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

  // Get random badge - EXACTLY like ProfilePage
  const getRandomBadge = () => {
    const badges = ['Traffic Guardian', 'Road Warrior', 'Safety Champion', 'Community Hero', 'Traffic Expert'];
    return badges[Math.floor(Math.random() * badges.length)];
  };

  // Load user stats if authenticated
  const loadUserStats = async () => {
    if (!user) return;
    
    try {
      const response = await apiService.getUserStats(user.id);
      console.log('User stats response:', response);
      
      // The API interceptor returns response.data directly
      if (response && response.user) {
        setUserStats(response.user);
      } else if (response && response.data) {
        setUserStats(response.data);
      } else {
        console.warn('Unexpected user stats response structure:', response);
        setUserStats(null);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
      setUserStats(null);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadLeaderboard(),
      loadAchievements(),
      loadUserStats()
    ]);
    setRefreshing(false);
    toast.success('Leaderboard refreshed!');
  };

  // Load data on mount and when user changes - EXACTLY like ProfilePage
  useEffect(() => {
    console.log('=== USE EFFECT TRIGGERED ===');
    console.log('User:', user);
    loadLeaderboard();
    loadAchievements();
    loadUserStats();
  }, [user]);

  // Debug state changes
  useEffect(() => {
    console.log('=== STATE DEBUG ===');
    console.log('leaderboardData:', leaderboardData);
    console.log('totalUsers:', totalUsers);
    console.log('userStats:', userStats);
    console.log('loading:', loading);
  }, [leaderboardData, totalUsers, userStats, loading]);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-slate-600">#{rank}</span>;
  };

  const getBadgeColor = (badge) => {
    const colors = {
      'Diamond Reporter': 'from-blue-400 to-cyan-300',
      'Gold Guardian': 'from-yellow-400 to-orange-300',
      'Silver Scout': 'from-gray-300 to-slate-400',
      'Bronze Hero': 'from-amber-600 to-yellow-600',
      'Rising Star': 'from-purple-400 to-pink-400',
      'New Reporter': 'from-green-400 to-emerald-300',
      'Traffic Guardian': 'from-emerald-400 to-green-500',
      'Road Warrior': 'from-orange-400 to-red-500',
      'Safety Champion': 'from-blue-500 to-indigo-600',
      'Community Hero': 'from-purple-500 to-pink-500',
      'Traffic Expert': 'from-teal-400 to-cyan-500'
    };
    return colors[badge] || 'from-slate-400 to-gray-400';
  };

  const getCurrentUserRank = () => {
    if (!user) return null;
    
    console.log('Debug getCurrentUserRank:', {
      user: user,
      userStats: userStats,
      leaderboardData: leaderboardData,
      userStatsRank: userStats?.rank
    });
    
    // If userStats has rank, use it
    if (userStats && userStats.rank) return userStats.rank;
    
    // Otherwise find user in leaderboard data
    if (leaderboardData && leaderboardData.length > 0) {
      const userPosition = leaderboardData.findIndex(u => u._id === user.id);
      console.log('User position in leaderboard:', userPosition);
      if (userPosition !== -1) {
        return userPosition + 1;
      }
    }
    
    return null;
  };

  const currentUserRank = getCurrentUserRank();
  
  // Get current user's data from leaderboard for consistent stats
  const getCurrentUserData = () => {
    if (!user || !leaderboardData.length) return null;
    const currentUserData = leaderboardData.find(u => u._id === user.id);
    console.log('Current user data from leaderboard:', currentUserData);
    console.log('User ID:', user.id);
    console.log('Leaderboard data:', leaderboardData);
    return currentUserData;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-8 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 opacity-30"></div>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-3">Loading Leaderboard</h2>
          <p className="text-slate-600 text-lg">Gathering community data...</p>
          <div className="mt-6 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-full mb-6 shadow-xl">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4 leading-tight">
            Community Leaders
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Recognition for our most dedicated traffic reporters who make our roads safer every day
          </p>
          <div className="inline-flex items-center space-x-3 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/30">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800">{totalUsers}</span>
            <span className="text-slate-600 text-base">active citizens</span>
          </div>
          {isFallbackData && (
            <div className="flex items-center justify-center mt-4 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
              Using fallback data from database - API connection issue
            </div>
          )}
        </motion.div>

        {/* Current User Rank Banner */}
        {user && currentUserRank && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl shadow-lg text-white p-4 mb-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
            <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 rounded-full -translate-y-6 translate-x-6"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm shadow-lg">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold mb-1">Your Current Rank</h2>
                  <p className="text-blue-100 text-xs">Keep reporting to climb the leaderboard!</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold mb-1">#{currentUserRank}</div>
                <div className="text-blue-100 text-xs mb-1">out of {totalUsers} users</div>
                <div className="text-xs text-blue-100 bg-white/15 px-2 py-1 rounded-lg backdrop-blur-sm border border-white/20">
                  {getCurrentUserData()?.points || userStats?.points || user?.points || 0} total points • {getCurrentUserData()?.reportCount || userStats?.reportCount || 0} reports
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 shadow-lg border-0 transition-all duration-300 hover:shadow-xl hover:scale-105 font-semibold text-base"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Leaderboard'}</span>
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Leaderboard */}
          <div className="lg:col-span-2 space-y-8">
            {/* Top 3 Podium */}
            {leaderboardData.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"></div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/30 rounded-full -translate-y-10 translate-x-10"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-indigo-100/30 rounded-full translate-y-8 -translate-x-8"></div>
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">🏆 Top Contributors</h2>
                  <div className="flex items-end justify-center space-x-12">
                    {/* Second Place */}
                    <div className="text-center">
                      <div className="relative mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-slate-400 rounded-full flex items-center justify-center text-2xl shadow-lg overflow-hidden">
                          {leaderboardData[1]?.avatar && leaderboardData[1].avatar !== '👤' ? (
                            <img 
                              src={leaderboardData[1].avatar} 
                              alt={leaderboardData[1].name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <span className={leaderboardData[1]?.avatar && leaderboardData[1].avatar !== '👤' ? 'hidden' : ''}>
                            {leaderboardData[1]?.avatar || '👤'}
                          </span>
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-gray-300 to-slate-400 rounded-full flex items-center justify-center shadow-lg">
                          <Medal className="h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mb-1">{leaderboardData[1]?.name || 'Anonymous'}</h3>
                      <p className="text-base font-semibold text-slate-700 mb-2">{leaderboardData[1]?.points || 0} pts</p>
                      <div className="h-20 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-xl flex items-end justify-center shadow-inner">
                        <span className="text-white font-bold text-lg mb-2">2</span>
                      </div>
                    </div>

                    {/* First Place */}
                    <div className="text-center">
                      <div className="relative mb-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-300 rounded-full flex items-center justify-center text-3xl shadow-xl overflow-hidden">
                          {leaderboardData[0]?.avatar && leaderboardData[0].avatar !== '👑' ? (
                            <img 
                              src={leaderboardData[0].avatar} 
                              alt={leaderboardData[0].name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <span className={leaderboardData[0]?.avatar && leaderboardData[0].avatar !== '👑' ? 'hidden' : ''}>
                            {leaderboardData[0]?.avatar || '👑'}
                          </span>
                        </div>
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-300 rounded-full flex items-center justify-center shadow-lg">
                          <Crown className="h-5 w-5 text-yellow-800" />
                        </div>
                      </div>
                      <h3 className="font-bold text-slate-900 text-lg mb-1">{leaderboardData[0]?.name || 'Anonymous'}</h3>
                      <p className="text-lg font-semibold text-slate-700 mb-2">{leaderboardData[0]?.points || 0} pts</p>
                      <div className="h-24 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-xl flex items-end justify-center shadow-inner">
                        <span className="text-white font-bold text-xl mb-2">1</span>
                      </div>
                    </div>

                    {/* Third Place */}
                    <div className="text-center">
                      <div className="relative mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-full flex items-center justify-center text-2xl shadow-lg overflow-hidden">
                          {leaderboardData[2]?.avatar && leaderboardData[2].avatar !== '🥉' ? (
                            <img 
                              src={leaderboardData[2].avatar} 
                              alt={leaderboardData[2].name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <span className={leaderboardData[2]?.avatar && leaderboardData[2].avatar !== '🥉' ? 'hidden' : ''}>
                            {leaderboardData[2]?.avatar || '🥉'}
                          </span>
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                          <Award className="h-4 w-4 text-amber-200" />
                        </div>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mb-1">{leaderboardData[2]?.name || 'Anonymous'}</h3>
                      <p className="text-base font-semibold text-slate-700 mb-2">{leaderboardData[2]?.points || 0} pts</p>
                      <div className="h-16 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-lg flex items-end justify-center shadow-inner">
                        <span className="text-white font-bold text-base mb-1">3</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Full Rankings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Complete Rankings</h3>
                <p className="text-slate-600 text-base">Showing top {leaderboardData.length} users</p>
              </div>
              <div className="divide-y divide-slate-100">
                {leaderboardData.length > 0 ? (
                  leaderboardData.map((member, index) => (
                    <motion.div
                      key={member._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`p-4 hover:bg-slate-50 transition-all duration-200 ${
                        member._id === user?.id ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center justify-center w-14 h-14">
                            {getRankIcon(member.rank || index + 1)}
                          </div>
                          <div className="text-4xl">
                            {member.avatar && member.avatar !== '👤' ? (
                              <img 
                                src={member.avatar} 
                                alt={member.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                            ) : null}
                            <span className={member.avatar && member.avatar !== '👤' ? 'hidden' : ''}>
                              {member.avatar || '👤'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-lg flex items-center space-x-3 mb-2">
                              <span>{member.name || 'Anonymous User'}</span>
                              {member._id === user?.id && (
                                <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-semibold">You</span>
                              )}
                            </h4>
                            <p className="text-slate-600 mb-3">{member.location || 'Location not set'}</p>
                            <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r ${getBadgeColor(member.badge)} text-white shadow-sm`}>
                              {member.badge || 'New Reporter'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-slate-900 mb-2">{member.points?.toLocaleString() || 0}</div>
                          <div className="text-slate-600 font-medium">points</div>
                          <div className="flex items-center space-x-6 mt-4 text-sm text-slate-500">
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{member.reportCount || 0} reports</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Target className="h-4 w-4" />
                              <span>{member.accuracy || 0}% accuracy</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Zap className="h-4 w-4" />
                              <span>{member.streak || 0} day streak</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-12 text-center text-slate-500">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-lg mb-4">No leaderboard data available</p>
                    <button
                      onClick={handleRefresh}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Stats */}
            {user && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Your Stats</h3>
                  </div>
                                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Current Rank</span>
                      <span className="font-bold text-xl text-blue-600">#{currentUserRank || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Total Points</span>
                      <span className="font-bold text-xl text-slate-900">
                        {getCurrentUserData()?.points || userStats?.points || user?.points || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Reports Submitted</span>
                      <span className="font-bold text-xl text-slate-900">
                        {getCurrentUserData()?.reportCount || userStats?.reportCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Badge</span>
                      <span className="text-sm bg-gradient-to-r from-yellow-400 to-orange-300 text-white px-2 py-1 rounded-full font-semibold">
                        {getCurrentUserData()?.badge || userStats?.badge || user?.badge || 'New Reporter'}
                      </span>
                    </div>
                  <div className="pt-4 border-t border-slate-200">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🎯</div>
                      <p className="text-xs text-slate-600 mb-2">Next Badge: {getNextBadge(getCurrentUserData()?.points || userStats?.points || user?.points || 0)}</p>
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                        <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500" style={{width: `${getProgressToNextBadge(getCurrentUserData()?.points || userStats?.points || user?.points || 0)}%`}}></div>
                      </div>
                      <p className="text-xs text-slate-500">{getPointsToNextBadge(getCurrentUserData()?.points || userStats?.points || user?.points || 0)}</p>
                    </div>
                  </div>
                </div>
                </div>
              </motion.div>
            )}

            {/* Points System Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-100/30 to-emerald-100/30"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">How Points Work</h3>
                </div>
                              <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                    <span className="text-slate-700 font-medium">Submit Report</span>
                    <span className="font-bold text-green-600">+10 pts</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                    <span className="text-slate-700 font-medium">Verified Report</span>
                    <span className="font-bold text-blue-600">+5 pts</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                    <span className="text-slate-700 font-medium">Resolved Report</span>
                    <span className="font-bold text-purple-600">+3 pts</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                    <span className="text-slate-700 font-medium">With Photos</span>
                    <span className="font-bold text-orange-600">+2 pts</span>
                  </div>
                </div>
                </div>
              </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Achievements</h3>
                </div>
              <div className="grid grid-cols-2 gap-4">
                {achievements.length > 0 ? (
                  achievements.map((achievement, index) => {
                    const Icon = getAchievementIcon(achievement.icon);
                    const isUnlocked = user?.achievements?.some(a => a.name === achievement.name) || false;
                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-2xl border-2 text-center transition-all duration-200 ${
                          isUnlocked 
                            ? `border-green-200 bg-green-50 hover:bg-green-100` 
                            : 'border-slate-200 bg-slate-50 opacity-60 hover:opacity-80'
                        }`}
                      >
                        <Icon className={`h-7 w-7 mx-auto mb-3 ${
                          isUnlocked ? `text-green-600` : 'text-slate-400'
                        }`} />
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">{achievement.name}</h4>
                        <p className="text-xs text-slate-600 mb-2">{achievement.description}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-slate-500 col-span-2 py-8">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Award className="h-6 w-6 text-slate-400" />
                    </div>
                    <p>Loading achievements...</p>
                  </div>
                )}
              </div>
              </div>
            </motion.div>

            {/* Weekly Challenge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 rounded-full translate-y-6 -translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">🏆 Weekly Challenge</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-white/90 text-lg">Report 25 traffic incidents</p>
                  <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm">
                    <div className="bg-white h-3 rounded-full transition-all duration-500" style={{width: '60%'}}></div>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>15/25 completed</span>
                    <span>+500 bonus points</span>
                  </div>
                  <p className="text-white/75 text-sm">4 days remaining</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
const getNextBadge = (points) => {
  if (points >= 5000) return 'Legendary Master';
  if (points >= 3000) return 'Diamond Reporter';
  if (points >= 1500) return 'Gold Guardian';
  if (points >= 500) return 'Silver Scout';
  if (points >= 100) return 'Bronze Hero';
  return 'Rising Star';
};

const getProgressToNextBadge = (points) => {
  if (points >= 5000) return 100;
  if (points >= 3000) return Math.min(((points - 3000) / 2000) * 100, 100);
  if (points >= 1500) return Math.min(((points - 1500) / 1500) * 100, 100);
  if (points >= 500) return Math.min(((points - 500) / 1000) * 100, 100);
  if (points >= 100) return Math.min(((points - 100) / 400) * 100, 100);
  return Math.min((points / 100) * 100, 100);
};

const getPointsToNextBadge = (points) => {
  if (points >= 5000) return 'Maximum level reached!';
  if (points >= 3000) return `${5000 - points} points to Diamond Reporter`;
  if (points >= 1500) return `${3000 - points} points to Gold Guardian`;
  if (points >= 500) return `${1500 - points} points to Silver Scout`;
  if (points >= 100) return `${500 - points} points to Bronze Hero`;
  return `${100 - points} points to Rising Star`;
};

const getAchievementIcon = (iconName) => {
  const iconMap = {
    'star': Star,
    'trending-up': TrendingUp,
    'users': Users,
    'target': Target,
    'map-pin': MapPin,
    'calendar': Calendar,
    'zap': Zap,
    'shield': Shield,
    'heart': Heart
  };
  return iconMap[iconName] || Star;
};