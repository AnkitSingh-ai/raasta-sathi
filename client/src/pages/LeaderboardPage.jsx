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
  TrendingDown
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
  const [activeTab, setActiveTab] = useState('overall');
  const [timeframe, setTimeframe] = useState('overall');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  // Load leaderboard data
  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      console.log('=== LEADERBOARD DEBUG START ===');
      console.log('Loading leaderboard with timeframe:', timeframe);
      console.log('API Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:5002/api');
      console.log('User context:', user);
      
      const response = await apiService.getLeaderboard(timeframe, 100);
      console.log('=== RAW API RESPONSE ===');
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      console.log('Full response:', response);
      
      // The API interceptor returns response.data directly
      if (response && response.leaderboard) {
        console.log('✅ SUCCESS: Found response.leaderboard');
        console.log('Setting leaderboard data:', response.leaderboard);
        setLeaderboardData(response.leaderboard);
        setUserStats(response.userRank);
        setTotalUsers(response.totalUsers || response.leaderboard.length);
      } else if (response && Array.isArray(response)) {
        // Fallback if response structure is different
        console.log('⚠️ FALLBACK: response is array:', response);
        setLeaderboardData(response);
        setTotalUsers(response.length);
      } else {
        console.warn('❌ ERROR: Unexpected leaderboard response structure:', response);
        setLeaderboardData([]);
        setTotalUsers(0);
      }
      console.log('=== LEADERBOARD DEBUG END ===');
    } catch (error) {
      console.error('❌ FAILED to load leaderboard:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status
      });
      toast.error('Failed to load leaderboard data');
      setLeaderboardData([]);
      setTotalUsers(0);
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

  // Load data on mount and when timeframe changes
  useEffect(() => {
    console.log('=== USE EFFECT TRIGGERED ===');
    console.log('Timeframe:', timeframe);
    console.log('User:', user);
    loadLeaderboard();
    loadAchievements();
    loadUserStats();
  }, [timeframe, user]);

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
      'New Reporter': 'from-green-400 to-emerald-300'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 pt-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{t('leaderboard.title') || 'Leaderboard'}</h1>
          <p className="text-xl text-slate-600">Recognition for our most dedicated traffic reporters</p>
          <div className="mt-4 text-lg text-slate-700">
            <span className="font-semibold text-blue-600">{totalUsers}</span> active citizens contributing to safer roads
          </div>
        </motion.div>

        {/* Current User Rank Banner */}
        {user && currentUserRank && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl shadow-xl text-white p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 rounded-full p-3">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Your Current Rank</h2>
                  <p className="text-blue-100">Keep reporting to climb the leaderboard!</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">#{currentUserRank}</div>
                <div className="text-blue-100">out of {totalUsers} users</div>
                {userStats && (
                  <div className="text-sm text-blue-100 mt-2">
                    {userStats.points || 0} total points • {userStats.reportCount || 0} reports
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center space-x-2">
            {['overall', 'monthly', 'weekly'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {/* Test API Button */}
          <button
            onClick={async () => {
              try {
                console.log('🧪 Testing direct API call...');
                const response = await fetch('http://localhost:5002/api/leaderboard');
                const data = await response.json();
                console.log('✅ Direct API test successful:', data);
                alert('API test successful! Check console for details.');
              } catch (error) {
                console.error('❌ Direct API test failed:', error);
                alert('API test failed! Check console for details.');
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            🧪 Test API Connection
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Leaderboard */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top 3 Podium */}
            {leaderboardData.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Top Contributors</h2>
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
                    <h3 className="font-semibold text-slate-900">{leaderboardData[1]?.name || 'Anonymous'}</h3>
                    <p className="text-sm text-slate-600">{leaderboardData[1]?.points || 0} pts</p>
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
                    <h3 className="font-bold text-slate-900 text-lg">{leaderboardData[0]?.name || 'Anonymous'}</h3>
                    <p className="text-slate-600">{leaderboardData[0]?.points || 0} pts</p>
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
                    <h3 className="font-semibold text-slate-900">{leaderboardData[2]?.name || 'Anonymous'}</h3>
                    <p className="text-sm text-slate-600">{leaderboardData[2]?.points || 0} pts</p>
                    <div className="h-20 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-lg mt-4 flex items-end justify-center">
                      <span className="text-white font-bold mb-2">3</span>
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
              className="bg-white rounded-2xl shadow-lg border border-slate-200"
            >
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-xl font-semibold text-slate-900">Complete Rankings</h3>
                <p className="text-sm text-slate-600 mt-1">Showing top {leaderboardData.length} users</p>
              </div>
              <div className="divide-y divide-slate-200">
                {leaderboardData.length > 0 ? (
                  leaderboardData.map((member, index) => (
                    <motion.div
                      key={member._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`p-6 hover:bg-slate-50 transition-all ${
                        member._id === user?.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-12 h-12">
                            {getRankIcon(member.rank || index + 1)}
                          </div>
                          <div className="text-3xl">{member.avatar || '👤'}</div>
                          <div>
                            <h4 className="font-semibold text-slate-900 flex items-center space-x-2">
                              <span>{member.name || 'Anonymous User'}</span>
                              {member._id === user?.id && (
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">You</span>
                              )}
                            </h4>
                            <p className="text-sm text-slate-600">{member.location || 'Location not set'}</p>
                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getBadgeColor(member.badge)} text-white mt-1`}>
                              {member.badge || 'New Reporter'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-slate-900">{member.points?.toLocaleString() || 0}</div>
                          <div className="text-sm text-slate-600">points</div>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                            <span>{member.reportCount || 0} reports</span>
                            <span>•</span>
                            <span>{member.accuracy || 0}% accuracy</span>
                            <span>•</span>
                            <span>🔥 {member.streak || 0} day streak</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-500">
                    <p>No leaderboard data available</p>
                    <button
                      onClick={handleRefresh}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Current Rank</span>
                    <span className="font-bold text-blue-600">#{currentUserRank || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Total Points</span>
                    <span className="font-bold text-slate-900">{userStats?.points || user?.points || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Reports Submitted</span>
                    <span className="font-bold text-slate-900">{userStats?.reportCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Badge</span>
                    <span className="text-sm bg-gradient-to-r from-yellow-400 to-orange-300 text-white px-2 py-1 rounded-full">
                      {userStats?.badge || user?.badge || 'New Reporter'}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🎯</div>
                      <p className="text-sm text-slate-600">Next Badge: {getNextBadge(userStats?.points || user?.points || 0)}</p>
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                        <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full" style={{width: `${getProgressToNextBadge(userStats?.points || user?.points || 0)}%`}}></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{getPointsToNextBadge(userStats?.points || user?.points || 0)}</p>
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
              className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border border-green-200 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">How Points Work</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Submit Report</span>
                  <span className="font-semibold text-green-600">+10 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Verified Report</span>
                  <span className="font-semibold text-blue-600">+5 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Resolved Report</span>
                  <span className="font-semibold text-purple-600">+3 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">With Photos</span>
                  <span className="font-semibold text-orange-600">+2 pts</span>
                </div>
              </div>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Achievements</h3>
              <div className="grid grid-cols-2 gap-3">
                {achievements.length > 0 ? (
                  achievements.map((achievement, index) => {
                    const Icon = getAchievementIcon(achievement.icon);
                    const isUnlocked = user?.achievements?.some(a => a.name === achievement.name) || false;
                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          isUnlocked 
                            ? `border-green-200 bg-green-50` 
                            : 'border-slate-200 bg-slate-50 opacity-60'
                        }`}
                      >
                        <Icon className={`h-6 w-6 mx-auto mb-2 ${
                          isUnlocked ? `text-green-600` : 'text-slate-400'
                        }`} />
                        <h4 className="text-xs font-semibold text-slate-900 mb-1">{achievement.name}</h4>
                        <p className="text-xs text-slate-600">{achievement.description}</p>
                        <div className="text-xs text-slate-500 mt-1">+{achievement.points} pts</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-slate-500 col-span-2">
                    <p>Loading achievements...</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Weekly Challenge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white"
            >
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
    'calendar': Calendar
  };
  return iconMap[iconName] || Star;
};