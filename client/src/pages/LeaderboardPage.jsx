import React, { useState } from 'react';
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
  MapPin
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

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

export function LeaderboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overall');
  const [timeframe, setTimeframe] = useState('month');

  const mockUsers = [
    {
      id: '1',
      name: 'Rajesh Kumar',
      points: 2850,
      reports: 145,
      accuracy: 96,
      badge: 'Diamond Reporter',
      level: 12,
      avatar: '👨‍💼',
      location: 'New Delhi',
      joinDate: '2024-01-15',
      streak: 23
    },
    {
      id: '2',
      name: 'Priya Sharma',
      points: 2640,
      reports: 132,
      accuracy: 94,
      badge: 'Gold Guardian',
      level: 11,
      avatar: '👩‍💻',
      location: 'Mumbai',
      joinDate: '2024-02-01',
      streak: 18
    },
    {
      id: '3',
      name: 'Amit Singh',
      points: 2420,
      reports: 118,
      accuracy: 92,
      badge: 'Silver Scout',
      level: 10,
      avatar: '👨‍🚀',
      location: 'Bangalore',
      joinDate: '2024-01-28',
      streak: 15
    },
    {
      id: '4',
      name: 'Neha Gupta',
      points: 2180,
      reports: 102,
      accuracy: 90,
      badge: 'Bronze Hero',
      level: 9,
      avatar: '👩‍🎓',
      location: 'Chennai',
      joinDate: '2024-03-10',
      streak: 12
    },
    {
      id: '5',
      name: 'Vikram Patel',
      points: 1950,
      reports: 89,
      accuracy: 88,
      badge: 'Rising Star',
      level: 8,
      avatar: '👨‍🔬',
      location: 'Pune',
      joinDate: '2024-02-20',
      streak: 9
    }
  ];

  const achievements = [
    { name: 'First Report', description: 'Submit your first traffic report', icon: Star, color: 'yellow' },
    { name: 'Speed Demon', description: 'Report 10 incidents in one day', icon: TrendingUp, color: 'red' },
    { name: 'Community Helper', description: 'Help 100 fellow commuters', icon: Users, color: 'blue' },
    { name: 'Perfect Week', description: '7 days of accurate reporting', icon: Target, color: 'green' },
    { name: 'Local Guardian', description: 'Most reports in your area', icon: MapPin, color: 'purple' },
    { name: 'Streak Master', description: '30-day reporting streak', icon: Calendar, color: 'orange' }
  ];

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
      'Rising Star': 'from-purple-400 to-pink-400'
    };
    return colors[badge] || 'from-slate-400 to-gray-400';
  };

  const userRank = mockUsers.findIndex(u => u.id === user?.id) + 1 || 6;

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
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{t('leaderboard.title')}</h1>
          <p className="text-xl text-slate-600">Recognition for our most dedicated traffic reporters</p>
        </motion.div>

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
          <div className="flex items-center space-x-2">
            {['week', 'month', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all capitalize ${
                  timeframe === period
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Leaderboard */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top 3 Podium */}
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
                      {mockUsers[1]?.avatar}
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-silver rounded-full flex items-center justify-center">
                      <Medal className="h-5 w-5 text-gray-500" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900">{mockUsers[1]?.name}</h3>
                  <p className="text-sm text-slate-600">{mockUsers[1]?.points} pts</p>
                  <div className="h-24 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-lg mt-4 flex items-end justify-center">
                    <span className="text-white font-bold text-lg mb-2">2</span>
                  </div>
                </div>

                {/* First Place */}
                <div className="text-center">
                  <div className="relative mb-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-300 rounded-full flex items-center justify-center text-3xl">
                      {mockUsers[0]?.avatar}
                    </div>
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Crown className="h-6 w-6 text-yellow-700" />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">{mockUsers[0]?.name}</h3>
                  <p className="text-slate-600">{mockUsers[0]?.points} pts</p>
                  <div className="h-32 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-lg mt-4 flex items-end justify-center">
                    <span className="text-white font-bold text-xl mb-2">1</span>
                  </div>
                </div>

                {/* Third Place */}
                <div className="text-center">
                  <div className="relative mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-full flex items-center justify-center text-2xl">
                      {mockUsers[2]?.avatar}
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                      <Award className="h-5 w-5 text-amber-200" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900">{mockUsers[2]?.name}</h3>
                  <p className="text-sm text-slate-600">{mockUsers[2]?.points} pts</p>
                  <div className="h-20 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-lg mt-4 flex items-end justify-center">
                    <span className="text-white font-bold mb-2">3</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Full Rankings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200"
            >
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-xl font-semibold text-slate-900">Complete Rankings</h3>
              </div>
              <div className="divide-y divide-slate-200">
                {mockUsers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`p-6 hover:bg-slate-50 transition-all ${
                      member.id === user?.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12">
                          {getRankIcon(index + 1)}
                        </div>
                        <div className="text-3xl">{member.avatar}</div>
                        <div>
                          <h4 className="font-semibold text-slate-900 flex items-center space-x-2">
                            <span>{member.name}</span>
                            {member.id === user?.id && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">You</span>
                            )}
                          </h4>
                          <p className="text-sm text-slate-600">{member.location}</p>
                          <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getBadgeColor(member.badge)} text-white mt-1`}>
                            {member.badge}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900">{member.points.toLocaleString()}</div>
                        <div className="text-sm text-slate-600">{t('leaderboard.points')}</div>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                          <span>{member.reports} {t('leaderboard.reports')}</span>
                          <span>•</span>
                          <span>{member.accuracy}% accuracy</span>
                          <span>•</span>
                          <span>🔥 {member.streak} day streak</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
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
                    <span className="font-bold text-blue-600">#{userRank}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Total Points</span>
                    <span className="font-bold text-slate-900">{user.points}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Badge</span>
                    <span className="text-sm bg-gradient-to-r from-yellow-400 to-orange-300 text-white px-2 py-1 rounded-full">
                      {user.badge}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🎯</div>
                      <p className="text-sm text-slate-600">Next Badge: Diamond Reporter</p>
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                        <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full" style={{width: '75%'}}></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">750/1000 points needed</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Achievements</h3>
              <div className="grid grid-cols-2 gap-3">
                {achievements.map((achievement, index) => {
                  const Icon = achievement.icon;
                  const isUnlocked = index < 3; // Mock some as unlocked
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        isUnlocked 
                          ? `border-${achievement.color}-200 bg-${achievement.color}-50` 
                          : 'border-slate-200 bg-slate-50 opacity-60'
                      }`}
                    >
                      <Icon className={`h-6 w-6 mx-auto mb-2 ${
                        isUnlocked ? `text-${achievement.color}-600` : 'text-slate-400'
                      }`} />
                      <h4 className="text-xs font-semibold text-slate-900 mb-1">{achievement.name}</h4>
                      <p className="text-xs text-slate-600">{achievement.description}</p>
                    </div>
                  );
                })}
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