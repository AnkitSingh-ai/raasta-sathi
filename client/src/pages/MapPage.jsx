import React, { useState, useEffect } from 'react';
// filepath: /Users/ankitsingh/Desktop/Raasta Sathi/client/src/pages/MapPage.jsx
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '../utils/api';
import { getReports } from '../utils/api'; 
import { 
  MapPin, 
  AlertTriangle, 
  Shield, 
  Construction, 
  Car, 
  Cloud, 
  Crown,
  Filter,
  Layers,
  Navigation,
  Crosshair,
  Plus,
  Heart,
  MessageCircle,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { GoogleMapComponent } from '../components/GoogleMap';
import toast from 'react-hot-toast';

/**
 * @typedef {Object} TrafficReport
 * @property {string} id
 * @property {'accident'|'police'|'construction'|'congestion'|'weather'|'vip'|'pothole'|'closure'} type
 * @property {string} location
 * @property {string} description
 * @property {'low'|'medium'|'high'} severity
 * @property {string} timestamp
 * @property {boolean} verified
 * @property {number} votes
 * @property {number} likes
 * @property {boolean} userLiked
 * @property {string} estimatedFixTime
 * @property {string} reportedBy
 */

export function MapPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 });
  const [showQuickReport, setShowQuickReport] = useState(false);
  

 // adjust path if needed

const [reports, setReports] = useState([]);

// or use apiService.getReports

useEffect(() => {
  getReports()
    .then(setReports)
    .catch(err => {
      toast.error('Failed to load reports');
      setReports([]);
    });
}, []);
  const getIconForType = (type) => {
    const icons = {
      accident: AlertTriangle,
      police: Shield,
      construction: Construction,
      congestion: Car,
      weather: Cloud,
      vip: Crown,
      pothole: AlertTriangle,
      closure: AlertTriangle
    };
    return icons[type] || MapPin;
  };

  const getColorForSeverity = (severity) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-red-600 bg-red-100'
    };
    return colors[severity] || 'text-gray-600 bg-gray-100';
  };

  const filterOptions = [
    { value: 'all', label: 'All Reports', icon: Layers },
    { value: 'accident', label: t('report.accident'), icon: AlertTriangle },
    { value: 'police', label: t('report.police'), icon: Shield },
    { value: 'construction', label: t('report.construction'), icon: Construction },
    { value: 'congestion', label: t('report.congestion'), icon: Car }
  ];

  const filteredReports = activeFilter === 'all' 
    ? reports 
    : reports.filter(report => report.type === activeFilter);

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast.success('Location updated!');
        },
        (error) => {
          toast.error('Unable to get your location');
        }
      );
    }
  };

  const handleLike = (reportId) => {
    if (!user) {
      toast.error('Please login to like reports');
      return;
    }

    setReports(prevReports => 
      prevReports.map(report => {
        if (report.id === reportId) {
          const newLiked = !report.userLiked;
          return {
            ...report,
            userLiked: newLiked,
            likes: newLiked ? report.likes + 1 : report.likes - 1
          };
        }
        return report;
      })
    );

    toast.success('Thank you for your feedback!');
  };

  const handleQuickReport = async (type) => {
  if (!user) {
    toast.error('Please login to report issues');
    return;
  }

  const newReport = {
    type,
    title: `Quick report: ${type}`,
    description: `Quick report: ${type}`,
    severity: 'medium',
    location: {
      address: 'Current Location',
      coordinates: [mapCenter.lng, mapCenter.lat], // GeoJSON [lng, lat]
      city: '', // fill as needed
      state: '',
      country: 'India'
    },
    reportedBy: user._id // or user.id, depending on your auth
  };

  try {
    const res = await apiService.post('/reports', newReport);
    setReports(prev => [res.data, ...prev]);
    setShowQuickReport(false);
    toast.success('Report submitted! +10 points earned');
  } catch (err) {
    toast.error('Failed to submit report');
  }
};

  return (
    <div className="min-h-screen bg-slate-50 pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Live Traffic Map</h1>
              <p className="text-slate-600">Real-time traffic conditions and incident reports</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleLocationClick}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Crosshair className="h-4 w-4" />
                <span>My Location</span>
              </button>
              {user && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowQuickReport(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
                >
                  <Plus className="h-4 w-4" />
                  <span>Quick Report</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 flex flex-wrap gap-2">
          {filterOptions.map((option) => {
            const Icon = option.icon;
            return (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFilter(option.value)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === option.value
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{option.label}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
            >
              <div className="h-96 lg:h-[600px]">
                <GoogleMapComponent
                  center={mapCenter}
                  zoom={12}
                  height="100%"
                  reports={filteredReports.map(report => ({
                    id: report.id,
                    type: report.type,
                    position: { 
                      lat: 28.6139 + (Math.random() - 0.5) * 0.1, 
                      lng: 77.2090 + (Math.random() - 0.5) * 0.1 
                    },
                    title: report.type.charAt(0).toUpperCase() + report.type.slice(1),
                    description: report.description,
                    severity: report.severity,
                    timestamp: report.timestamp,
                    verified: report.verified
                  }))}
                />
              </div>

              {/* Map Controls */}
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-slate-600">Live Updates</span>
                    </div>
                    <div className="text-sm text-slate-500">
                      Last updated: 30 seconds ago
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="flex items-center space-x-2 px-3 py-1 bg-white rounded-lg border border-slate-200 text-sm hover:bg-slate-50">
                      <Filter className="h-4 w-4" />
                      <span>Filters</span>
                    </button>
                    <button className="flex items-center space-x-2 px-3 py-1 bg-white rounded-lg border border-slate-200 text-sm hover:bg-slate-50">
                      <Navigation className="h-4 w-4" />
                      <span>Navigate</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Recent Reports</h2>
              <span className="text-sm text-slate-500">{filteredReports.length} active</span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              <AnimatePresence>
                {filteredReports.map((report, index) => {
                  const Icon = getIconForType(report.type);
                  return (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      onClick={() => setSelectedReport(report)}
                      className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${getColorForSeverity(report.severity)}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-semibold text-slate-900 capitalize">
                              {report.type.replace('_', ' ')}
                            </h3>
                            {report.verified && (
                              <div className="flex items-center space-x-1 text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                <span className="text-xs">Verified</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{report.location}</p>
                          <p className="text-xs text-slate-500 line-clamp-2 mb-2">{report.description}</p>
                          
                          {/* Time estimate */}
                          <div className="flex items-center space-x-1 mb-2">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-500">Est. fix: {report.estimatedFixTime}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">{report.timestamp}</span>
                            <div className="flex items-center space-x-3">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLike(report.id);
                                }}
                                className={`flex items-center space-x-1 text-xs ${
                                  report.userLiked ? 'text-red-500' : 'text-slate-500'
                                } hover:text-red-500 transition-colors`}
                              >
                                <Heart className={`h-3 w-3 ${report.userLiked ? 'fill-current' : ''}`} />
                                <span>{report.likes}</span>
                              </motion.button>
                              <div className="flex items-center space-x-1 text-xs text-slate-500">
                                <MessageCircle className="h-3 w-3" />
                                <span>{report.votes}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-xl p-4 text-white">
              <h3 className="font-semibold mb-2">Quick Report</h3>
              <p className="text-sm text-blue-100 mb-3">See something? Report it instantly</p>
              {user ? (
                <button 
                  onClick={() => setShowQuickReport(true)}
                  className="w-full py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Report Issue
                </button>
              ) : (
                <button 
                  onClick={() => toast.error('Please login to report issues')}
                  className="w-full py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors"
                >
                  Login to Report
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Report Modal */}
        <AnimatePresence>
          {showQuickReport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowQuickReport(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-md w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Quick Report</h3>
                  <button
                    onClick={() => setShowQuickReport(false)}
                    className="p-1 hover:bg-slate-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <p className="text-sm text-slate-600 mb-4">What type of issue are you reporting?</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: 'accident', label: 'Accident', icon: AlertTriangle, color: 'red' },
                    { type: 'police', label: 'Police', icon: Shield, color: 'blue' },
                    { type: 'construction', label: 'Construction', icon: Construction, color: 'yellow' },
                    { type: 'congestion', label: 'Traffic Jam', icon: Car, color: 'purple' }
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <motion.button
                        key={option.type}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleQuickReport(option.type)}
                        className={`p-4 rounded-xl border-2 border-${option.color}-200 hover:border-${option.color}-300 text-${option.color}-600 hover:bg-${option.color}-50 transition-all text-center`}
                      >
                        <Icon className="h-6 w-6 mx-auto mb-2" />
                        <span className="text-sm font-medium">{option.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
                
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowQuickReport(false)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Need detailed report? Go to Report Page →
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}