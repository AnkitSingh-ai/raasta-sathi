import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  MapPin,
  Filter,
  Search,
  Eye,
  Check,
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export function DashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = [
    { label: 'Total Reports', value: '1,234', icon: AlertTriangle, color: 'blue' },
    { label: 'Verified Today', value: '89', icon: CheckCircle, color: 'green' },
    { label: 'Pending Review', value: '56', icon: Clock, color: 'yellow' },
    { label: 'Active Officers', value: '24', icon: Users, color: 'purple' }
  ];

  const mockReports = [
    {
      id: '1',
      type: 'accident',
      location: 'Connaught Place, New Delhi',
      description: 'Minor collision between two vehicles, traffic moving slowly',
      severity: 'medium',
      timestamp: '5 mins ago',
      reporter: 'Citizen User',
      status: 'pending',
      votes: 12,
      priority: 'high'
    },
    {
      id: '2',
      type: 'pothole',
      location: 'Lajpat Nagar, Delhi',
      description: 'Large pothole causing vehicle damage',
      severity: 'high',
      timestamp: '15 mins ago',
      reporter: 'Anonymous',
      status: 'pending',
      votes: 8,
      priority: 'medium'
    },
    {
      id: '3',
      type: 'construction',
      location: 'Ring Road, Delhi',
      description: 'Road repair work in progress, one lane closed',
      severity: 'high',
      timestamp: '1 hour ago',
      reporter: 'Municipal Dept',
      status: 'verified',
      votes: 25,
      priority: 'high'
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{t('dashboard.welcome')}</h1>
              <p className="text-slate-600 mt-1">Traffic Management Control Center</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role} Officer</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                    <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Reports Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-900">Report Management</h2>
              
              {/* Search and Filter */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="flex items-center space-x-2 px-3 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mt-4 bg-slate-100 rounded-lg p-1">
              {['pending', 'verified', 'all'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all capitalize ${
                    activeTab === tab
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab} {tab === 'pending' && '(56)'}
                </button>
              ))}
            </div>
          </div>

          {/* Reports List */}
          <div className="divide-y divide-slate-200">
            {mockReports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900 capitalize">
                          {report.type.replace('_', ' ')}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                          {report.priority} priority
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-slate-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{report.location}</span>
                        </div>
                        <span>•</span>
                        <span>{report.timestamp}</span>
                        <span>•</span>
                        <span>By {report.reporter}</span>
                      </div>
                      
                      <p className="text-slate-700 mb-3">{report.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span>👍 {report.votes} votes</span>
                        <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700">
                          <Eye className="h-4 w-4" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {report.status === 'pending' && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
                        <Check className="h-4 w-4" />
                      </button>
                      <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          <div className="p-6 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Showing 1-10 of 156 reports</p>
              <div className="flex space-x-2">
                <button className="px-3 py-1 border border-slate-300 rounded text-sm hover:bg-slate-50">
                  Previous
                </button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                  Next
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}