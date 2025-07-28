import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  MapPin, 
  AlertTriangle,
  Calendar,
  Filter,
  Download,
  Eye,
  Users,
  Car,
  Construction
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function AnalyticsPage() {
  const { t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('incidents');

  // Mock data for charts
  const trafficTrends = [
    { month: 'Jan', accidents: 45, congestion: 120, construction: 15, reports: 180 },
    { month: 'Feb', accidents: 52, congestion: 135, construction: 18, reports: 205 },
    { month: 'Mar', accidents: 38, congestion: 110, construction: 22, reports: 170 },
    { month: 'Apr', accidents: 41, congestion: 125, construction: 19, reports: 185 },
    { month: 'May', accidents: 49, congestion: 140, construction: 25, reports: 214 },
    { month: 'Jun', accidents: 35, congestion: 98, construction: 12, reports: 145 }
  ];

  const incidentTypes = [
    { name: 'Traffic Congestion', value: 45, color: '#3B82F6' },
    { name: 'Accidents', value: 25, color: '#EF4444' },
    { name: 'Construction', value: 15, color: '#F59E0B' },
    { name: 'Police Checkpoints', value: 10, color: '#10B981' },
    { name: 'Weather Hazards', value: 5, color: '#8B5CF6' }
  ];

  const hourlyData = [
    { hour: '6AM', incidents: 12 },
    { hour: '7AM', incidents: 28 },
    { hour: '8AM', incidents: 45 },
    { hour: '9AM', incidents: 52 },
    { hour: '10AM', incidents: 35 },
    { hour: '11AM', incidents: 28 },
    { hour: '12PM', incidents: 40 },
    { hour: '1PM', incidents: 38 },
    { hour: '2PM', incidents: 42 },
    { hour: '3PM', incidents: 35 },
    { hour: '4PM', incidents: 30 },
    { hour: '5PM', incidents: 48 },
    { hour: '6PM', incidents: 55 },
    { hour: '7PM', incidents: 45 },
    { hour: '8PM', incidents: 32 },
    { hour: '9PM', incidents: 25 },
    { hour: '10PM', incidents: 18 },
    { hour: '11PM', incidents: 12 }
  ];

  const locationData = [
    { area: 'Connaught Place', incidents: 85, severity: 'high' },
    { area: 'India Gate', incidents: 72, severity: 'medium' },
    { area: 'Lajpat Nagar', incidents: 68, severity: 'medium' },
    { area: 'Karol Bagh', incidents: 54, severity: 'low' },
    { area: 'Janpath', incidents: 49, severity: 'low' }
  ];

  const stats = [
    { 
      label: 'Total Reports', 
      value: '12,456', 
      change: '+12.5%', 
      trend: 'up', 
      icon: BarChart3,
      color: 'blue' 
    },
    { 
      label: 'Active Users', 
      value: '8,924', 
      change: '+8.2%', 
      trend: 'up', 
      icon: Users,
      color: 'green' 
    },
    { 
      label: 'Response Time', 
      value: '3.2 min', 
      change: '-15.3%', 
      trend: 'down', 
      icon: Clock,
      color: 'purple' 
    },
    { 
      label: 'Accuracy Rate', 
      value: '94.8%', 
      change: '+2.1%', 
      trend: 'up', 
      icon: TrendingUp,
      color: 'orange' 
    }
  ];

  const getSeverityColor = (severity) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('analytics.title')}</h1>
              <p className="text-slate-600">Comprehensive insights into traffic patterns and trends</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {['week', 'month', 'quarter', 'year'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                      selectedPeriod === period
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                    <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                  <div className={`flex items-center space-x-1 text-sm ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendIcon className="h-4 w-4" />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-600 mt-1">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Charts */}
          <div className="lg:col-span-2 space-y-8">
            {/* Traffic Trends */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Traffic Trends</h2>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <select className="text-sm border border-slate-300 rounded-lg px-3 py-1">
                    <option>All Incidents</option>
                    <option>Accidents</option>
                    <option>Congestion</option>
                    <option>Construction</option>
                  </select>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficTrends}>
                    <defs>
                      <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '12px',
                        color: '#f8fafc'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="reports" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorReports)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Hourly Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Hourly Incident Distribution</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="hour" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '12px',
                        color: '#f8fafc'
                      }} 
                    />
                    <Bar dataKey="incidents" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Incident Types */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Incident Types</h3>
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incidentTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {incidentTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {incidentTypes.map((type, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: type.color }}
                      ></div>
                      <span className="text-slate-600">{type.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900">{type.value}%</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top Locations */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Hotspot Areas</h3>
              <div className="space-y-3">
                {locationData.map((location, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{location.area}</p>
                        <p className="text-xs text-slate-500">{location.incidents} incidents</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(location.severity)}`}>
                      {location.severity}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Insights */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white"
            >
              <h3 className="text-lg font-semibold mb-4">💡 Key Insights</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full mt-2"></div>
                  <p>Peak traffic incidents occur between 8-9 AM and 6-7 PM</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full mt-2"></div>
                  <p>Connaught Place reports 35% more incidents than average</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full mt-2"></div>
                  <p>Weather-related incidents increased 22% this month</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full mt-2"></div>
                  <p>Community verification rate improved to 94.8%</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}