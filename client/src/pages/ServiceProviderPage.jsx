import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  MapPin, 
  Phone, 
  Clock, 
  User, 
  CheckCircle, 
  X,
  Navigation,
  Star,
  Filter,
  Search
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * @typedef {Object} ServiceRequest
 * @property {string} id
 * @property {string} citizenName
 * @property {string} citizenPhone
 * @property {string} serviceType
 * @property {string} location
 * @property {string} description
 * @property {'low'|'medium'|'high'} urgency
 * @property {string} timestamp
 * @property {'pending'|'accepted'|'completed'|'cancelled'} status
 * @property {string} distance
 */

export function ServiceProviderPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([
    {
      id: '1',
      citizenName: 'Rajesh Kumar',
      citizenPhone: '+91-98765-12345',
      serviceType: 'ambulance',
      location: 'Connaught Place, New Delhi',
      description: 'Medical emergency - chest pain',
      urgency: 'high',
      timestamp: '2 mins ago',
      status: 'pending',
      distance: '2.3 km'
    },
    {
      id: '2',
      citizenName: 'Priya Sharma',
      citizenPhone: '+91-98765-12346',
      serviceType: 'mechanic',
      location: 'India Gate, New Delhi',
      description: 'Car breakdown - engine not starting',
      urgency: 'medium',
      timestamp: '15 mins ago',
      status: 'pending',
      distance: '4.1 km'
    },
    {
      id: '3',
      citizenName: 'Amit Singh',
      citizenPhone: '+91-98765-12347',
      serviceType: 'petrol',
      location: 'Lajpat Nagar, Delhi',
      description: 'Out of fuel',
      urgency: 'low',
      timestamp: '30 mins ago',
      status: 'accepted',
      distance: '1.8 km'
    }
  ]);

  const stats = [
    { label: 'Pending Requests', value: requests.filter(r => r.status === 'pending').length, color: 'yellow' },
    { label: 'Accepted Today', value: requests.filter(r => r.status === 'accepted').length, color: 'blue' },
    { label: 'Completed Today', value: requests.filter(r => r.status === 'completed').length, color: 'green' },
    { label: 'Average Rating', value: '4.8', color: 'purple' }
  ];

  const handleAcceptRequest = (requestId) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'accepted' }
          : req
      )
    );
    toast.success('Request accepted! Citizen has been notified.');
  };

  const handleCompleteRequest = (requestId) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'completed' }
          : req
      )
    );
    toast.success('Service completed successfully!');
  };

  const handleRejectRequest = (requestId) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'cancelled' }
          : req
      )
    );
    toast.error('Request declined.');
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[urgency ] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredRequests = requests.filter(req => 
    req.citizenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h1 className="text-3xl font-bold text-slate-900">Service Provider Dashboard</h1>
              <p className="text-slate-600 mt-1">Manage service requests and help citizens in need</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.serviceType || 'Multi-Service'} Provider</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                🔧
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
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
                  <Bell className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-900">Service Requests</h2>
              
              {/* Search */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search requests..."
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
              {['requests', 'accepted', 'completed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all capitalize ${
                    activeTab === tab
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Requests List */}
          <div className="divide-y divide-slate-200">
            {filteredRequests
              .filter(req => {
                if (activeTab === 'requests') return req.status === 'pending';
                if (activeTab === 'accepted') return req.status === 'accepted';
                if (activeTab === 'completed') return req.status === 'completed';
                return true;
              })
              .map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{request.citizenName}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(request.urgency)}`}>
                            {request.urgency} priority
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 mb-3">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{request.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{request.citizenPhone}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{request.timestamp}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Navigation className="h-4 w-4" />
                            <span>{request.distance} away</span>
                          </div>
                        </div>
                        
                        <p className="text-slate-700 mb-3">{request.description}</p>
                        
                        <div className="text-sm text-slate-500 capitalize">
                          Service: {request.serviceType.replace('_', ' ')}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
                      {request.status === 'accepted' && (
                        <>
                          <button
                            onClick={() => handleCompleteRequest(request.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Mark Complete
                          </button>
                          <a
                            href={`tel:${request.citizenPhone}`}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Call
                          </a>
                        </>
                      )}

                      {request.status === 'completed' && (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Completed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>

          {/* Empty State */}
          {filteredRequests.filter(req => {
            if (activeTab === 'requests') return req.status === 'pending';
            if (activeTab === 'accepted') return req.status === 'accepted';
            if (activeTab === 'completed') return req.status === 'completed';
            return true;
          }).length === 0 && (
            <div className="p-12 text-center">
              <Bell className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No requests found</h3>
              <p className="text-slate-600">
                {activeTab === 'requests' && 'No pending requests at the moment.'}
                {activeTab === 'accepted' && 'No accepted requests to show.'}
                {activeTab === 'completed' && 'No completed requests today.'}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}