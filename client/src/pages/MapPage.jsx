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
  Eye,
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { GoogleMapComponent } from '../components/GoogleMap';
import toast from 'react-hot-toast';
import PhotoGallery from '../components/PhotoGallery';
import { getAllPhotos, hasMultiplePhotos, getPhotoCount, getMainPhoto } from '../utils/photoUtils';
import CommentSection from '../components/CommentSection';
import LocationButton from '../components/LocationButton';

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
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedReportForComments, setSelectedReportForComments] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [votingReports, setVotingReports] = useState(new Set());
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [selectedReportPhotos, setSelectedReportPhotos] = useState([]);
  

 // adjust path if needed

const [reports, setReports] = useState([]);

// or use apiService.getReports

// move this OUTSIDE the useEffect
const loadReports = async () => {
  try {
    setIsRefreshing(true);
    const data = await getReports();
    console.log('📋 Loaded reports:', data);
    setReports(data);
  } catch (err) {
    console.error('Failed to load reports:', err);
    toast.error('Failed to load reports');
    setReports([]);
  } finally {
    setIsRefreshing(false);
  }
};

// Handle photo gallery opening
const handlePhotoGalleryOpen = (report) => {
  const photos = getAllPhotos(report);
  setSelectedReportPhotos(photos);
  setShowPhotoGallery(true);
};

// Handle poll voting
const handlePollVote = async (reportId, choice) => {
  if (!user) {
    toast.error('Please login to vote');
    return;
  }

  try {
    setVotingReports(prev => new Set(prev).add(reportId));
    
    const response = await apiService.voteOnPoll(reportId, choice);
    
    if (response.status === 'success') {
      // Update the report in state
      setReports(prev => 
        prev.map(report => 
          (report._id === reportId || report.id === reportId)
            ? { ...report, poll: response.data.pollResults }
            : report
        )
      );
      
      toast.success('Vote recorded successfully!');
    }
  } catch (error) {
    console.error('Failed to vote:', error);
    toast.error(error.message || 'Failed to record vote');
  } finally {
    setVotingReports(prev => {
      const newSet = new Set(prev);
      newSet.delete(reportId);
      return newSet;
    });
  }
};

// Get status badge
const getStatusBadge = (status, isExpired) => {
  if (status === 'Resolved' || isExpired) {
    return (
      <div className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
        🟢 Resolved
      </div>
    );
  }
  return (
    <div className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
      ⏳ Pending
    </div>
  );
};

// Get time until expiry
const getTimeUntilExpiry = (expiresAt) => {
  if (!expiresAt) return null;
  
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry - now;
  
  if (diffMs <= 0) return 'Expired';
  
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMins % 60}m left`;
  }
  return `${diffMins}m left`;
};

useEffect(() => {
  // Initial load
  loadReports();

  // Reload on visibility
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      loadReports();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Refresh every 5 mins
  const interval = setInterval(loadReports, 300000);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    clearInterval(interval);
  };
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
    ? (Array.isArray(reports) ? reports : [])
    : (Array.isArray(reports) ? reports.filter(report => report.type === activeFilter) : []);

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

  const handleLike = async (reportId) => {
    if (!user) {
      toast.error('Please login to like reports');
      return;
    }

    try {
      // Store original state for potential rollback
      const originalReports = [...reports];
      
      // Optimistically update UI
      setReports(prevReports => 
        prevReports.map(report => {
          if (report._id === reportId) {
            const isCurrentlyLiked = report.likes?.some(like => like._id === user._id);
            const newLiked = !isCurrentlyLiked;
            
            if (newLiked) {
              // Add like
              return {
                ...report,
                likes: [...(report.likes || []), { _id: user._id, likedAt: new Date(), id: user._id }]
              };
            } else {
              // Remove like
              return {
                ...report,
                likes: (report.likes || []).filter(like => like._id !== user._id)
              };
            }
          }
          return report;
        })
      );

      // Call backend API
      const response = await apiService.likeReport(reportId);
      
      // Update with actual data from backend - use the response data directly
      setReports(prevReports => 
        prevReports.map(report => {
          if (report._id === reportId) {
            // Use the backend response to update the likes array
            const isLiked = response.data.isLiked;
            
            if (isLiked) {
              // User liked the report - ensure only one like from this user
              const existingLike = report.likes?.find(like => like._id === user._id);
              if (!existingLike) {
                return {
                  ...report,
                  likes: [...(report.likes || []), { _id: user._id, likedAt: new Date(), id: user._id }]
                };
              }
            } else {
              // User unliked the report - remove their like
              return {
                ...report,
                likes: (report.likes || []).filter(like => like._id !== user._id)
              };
            }
          }
          return report;
        })
      );

      toast.success('Thank you for your feedback!');
    } catch (error) {
      // Revert to original state on error
      setReports(originalReports);
      
      toast.error('Failed to update like. Please try again.');
      console.error('Like error:', error);
    }
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

  const openComments = async (report) => {
    try {
      setIsAddingComment(true);
      // Fetch fresh comments data
      const response = await apiService.getComments(report._id);
      const updatedReport = {
        ...report,
        comments: response.data?.comments || response || []
      };
      
      setSelectedReportForComments(updatedReport);
      setShowCommentsModal(true);
      
      // Update the report in the main list with fresh comments
      setReports(prev => 
        prev.map(r => r._id === report._id ? updatedReport : r)
      );
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      toast.error('Failed to load comments');
      // Still open modal with existing comments
      setSelectedReportForComments(report);
      setShowCommentsModal(true);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      setIsAddingComment(true);
      const response = await apiService.addComment(selectedReportForComments._id, newComment.trim());
      
      // Update the report in local state with the new comment
      setReports(prev => 
        prev.map(report => {
          if (report._id === selectedReportForComments._id) {
            return {
              ...report,
              comments: [...(report.comments || []), response.data?.comment || response]
            };
          }
          return report;
        })
      );
      
      // Update the selected report for comments
      setSelectedReportForComments(prev => ({
        ...prev,
        comments: [...(prev.comments || []), response.data?.comment || response]
      }));
      
      // Update the selected report in detail modal if it's open
      if (selectedReport && selectedReport._id === selectedReportForComments._id) {
        setSelectedReport(prev => ({
          ...prev,
          comments: [...(prev.comments || []), response.data?.comment || response]
        }));
      }
      
      setNewComment('');
      toast.success('Comment added successfully!');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  // Listen for comment updates and refresh report data
  useEffect(() => {
    const handleCommentUpdate = (update) => {
      if (update && update.action) {
        // Refresh the specific report data
        if (selectedReport && selectedReport._id === update.reportId) {
          openComments(selectedReport);
        }
        
        // Refresh the main reports list
        loadReports();
      }
    };

    // Listen for updates on all reports
    reports.forEach(report => {
      // This hook is no longer imported, so this part of the code is removed.
      // If comment updates are still needed, they must be implemented differently.
    });
  }, [reports, selectedReport]);

  // Listen for comment updates on the selected report for comments
  useEffect(() => {
    const handleCommentUpdate = (update) => {
      if (update && update.action) {
        // Refresh the comment modal data
        if (selectedReportForComments) {
          openComments(selectedReportForComments);
        }
      }
    };

    // This hook is no longer imported, so this part of the code is removed.
    // If comment updates are still needed, they must be implemented differently.
  }, [selectedReportForComments]);

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
                  reports={filteredReports.map(report => {
                    // Use actual coordinates if available, otherwise use a default position
                    let position;
                    if (report.coordinates && report.coordinates.coordinates && 
                        report.coordinates.coordinates.length === 2) {
                      position = {
                        lat: report.coordinates.coordinates[1], // Latitude
                        lng: report.coordinates.coordinates[0]  // Longitude
                      };
                    } else {
                      // Fallback to a position near the map center
                      position = {
                        lat: mapCenter.lat + (Math.random() - 0.5) * 0.1,
                        lng: mapCenter.lng + (Math.random() - 0.5) * 0.1
                      };
                    }
                    
                    return {
                      id: report._id || report.id,
                      type: report.type,
                      position: position,
                      title: report.type.charAt(0).toUpperCase() + report.type.slice(1),
                      description: report.description,
                      severity: report.severity,
                      timestamp: new Date(report.createdAt).toLocaleString(),
                      verified: report.status === 'verified',
                      reportedBy: report.reportedBy?.name || 'Anonymous'
                    };
                  })}
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

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-6 text-white"
            >
              <h3 className="font-semibold mb-2">Quick Report</h3>
              <p className="text-sm text-blue-100 mb-4">See something? Report it instantly</p>
              {user ? (
                <button 
                  onClick={() => setShowQuickReport(true)}
                  className="w-full py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors"
                >
                  Report Issue
                </button>
              ) : (
                <button 
                  onClick={() => toast.error('Please login to report issues')}
                  className="w-full py-3 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-colors"
                >
                  Login to Report
                </button>
              )}
            </motion.div>

            {/* Reports List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Recent Reports</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-500">
                    {Array.isArray(filteredReports) ? filteredReports.length : 0} active
                  </span>
                  <button
                    onClick={loadReports}
                    disabled={isRefreshing}
                    className="p-1 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh reports"
                  >
                    <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                <AnimatePresence>
                  {filteredReports.map((report, index) => {
                    const Icon = getIconForType(report.type);
                    return (
                      <motion.div
                        key={report._id || report.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        onClick={() => {
                          setSelectedReport(report);
                          setShowReportDetail(true);
                          // Track view when report is clicked
                          if (user) {
                            // Update local state to increment view count
                            setReports(prevReports => 
                              prevReports.map(r => {
                                if (r._id === report._id || r.id === report.id) {
                                  return {
                                    ...r,
                                    views: (r.views || 0) + 1
                                  };
                                }
                                return r;
                              })
                            );
                          }
                        }}
                        className="relative bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-all cursor-pointer"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex flex-col items-center space-y-2">
                            <div className={`p-2 rounded-lg ${getColorForSeverity(report.severity)}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            
                            {/* Location Button - Below triangle with space */}
                            <LocationButton 
                              location={report.location} 
                              variant="floating" 
                              size="tiny"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <h3 className="text-sm font-semibold text-slate-900 capitalize">
                                {typeof report.type === 'string' ? report.type.replace('_', ' ') : 'Unknown'}
                              </h3>
                              <div className="flex items-center space-x-2">
                                {/* Status Badge */}
                                {report.status === 'Resolved' || report.isExpired ? (
                                  <div className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                                    🟢 Resolved
                                  </div>
                                ) : (
                                  <div className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-600">
                                    ⏳ Pending
                                  </div>
                                )}
                                
                                {/* Expiry Time */}
                                {report.expiresAt && (
                                  <div className="text-xs text-slate-400">
                                    {getTimeUntilExpiry(report.expiresAt)}
                                  </div>
                                )}
                              </div>
                            </div>
                                                        <p className="text-sm text-slate-600 mb-0.5">
                              {(() => {
                                if (typeof report.location === 'string') {
                                  return report.location;
                                } else if (report.location && typeof report.location === 'object') {
                                  return report.location.address || 'Location not specified';
                                } else {
                                  return 'Location not specified';
                                }
                              })()}
                            </p>
                            
                            <p className="text-xs text-slate-500 line-clamp-2 mb-1">
                              {typeof report.description === 'string' ? report.description : 'No description'}
                            </p>
                            
                            {/* Poll Display */}
                            <div className="mb-2">
                              <div className="text-xs font-medium text-slate-700 mb-2 flex items-center">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                                Community Poll
                              </div>
                              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2 border border-blue-200">
                                <div className="grid grid-cols-3 gap-1 mb-2">
                                  <div className="text-center">
                                    <div className="text-sm">🚨</div>
                                    <div className="text-xs font-medium text-red-600">{report.poll?.stillThere || 0}</div>
                                    <div className="text-xs text-slate-600">Still There</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-sm">✅</div>
                                    <div className="text-xs font-medium text-green-600">{report.poll?.resolved || 0}</div>
                                    <div className="text-xs text-slate-600">Resolved</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-sm">❌</div>
                                    <div className="text-xs font-medium text-red-600">{report.poll?.notSure || 0}</div>
                                    <div className="text-xs text-slate-600">Fake Report</div>
                                  </div>
                                </div>
                                
                                {/* Voting Buttons */}
                                {user && report.status === 'Pending' && !report.isExpired && (
                                  <div className="grid grid-cols-3 gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePollVote(report._id || report.id, 'stillThere');
                                      }}
                                      disabled={votingReports.has(report._id || report.id)}
                                      className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300"
                                    >
                                      {votingReports.has(report._id || report.id) ? 'Voting...' : '🚨 Still There'}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePollVote(report._id || report.id, 'resolved');
                                      }}
                                      disabled={votingReports.has(report._id || report.id)}
                                      className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 disabled:opacity-50 transition-all duration-200 border border-green-200 hover:border-green-300"
                                    >
                                      {votingReports.has(report._id || report.id) ? 'Voting...' : '✅ Resolved'}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePollVote(report._id || report.id, 'notSure');
                                      }}
                                      disabled={votingReports.has(report._id || report.id)}
                                      className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300"
                                    >
                                      {votingReports.has(report._id || report.id) ? 'Voting...' : '❌ Fake Report'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            

                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400">
                                by {typeof report.reportedBy === 'object' && report.reportedBy?.name ? report.reportedBy.name : 'Anonymous'}
                              </span>
                              <div className="flex items-center space-x-3">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLike(report._id || report.id);
                                  }}
                                  className={`flex items-center space-x-1 text-xs ${
                                    report.likes?.some(like => like.user === user?._id) ? 'text-red-500' : 'text-slate-500'
                                  } hover:text-red-500 transition-colors`}
                                >
                                  <Heart className={`h-3 w-3 ${report.likes?.some(like => like._id === user?._id) ? 'fill-current' : ''}`} />
                                  <span>{Array.isArray(report.likes) ? report.likes.length : (report.likes || 0)}</span>
                                </motion.button>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openComments(report);
                                  }}
                                  disabled={isAddingComment}
                                  className="flex items-center space-x-1 text-xs text-green-600 hover:text-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="View Comments"
                                >
                                  <MessageCircle className="h-3 w-3" />
                                  <span>{Array.isArray(report.comments) ? report.comments.length : 0}</span>
                                </button>
                                
                                <div className="flex items-center space-x-1 text-xs text-slate-500">
                                  <Eye className="h-3 w-3" />
                                  <span>{report.views || 0}</span>
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
            </motion.div>
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

        {/* Report Detail Modal */}
        <AnimatePresence>
          {showReportDetail && selectedReport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowReportDetail(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Report Details</h2>
                  <button
                    onClick={() => setShowReportDetail(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Report Header */}
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${getColorForSeverity(selectedReport.severity)}`}>
                      {(() => {
                        const Icon = getIconForType(selectedReport.type);
                        return <Icon className="h-6 w-6" />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-900 capitalize mb-2">
                        {typeof selectedReport.type === 'string' ? selectedReport.type.replace('_', ' ') : 'Unknown'} Report
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(selectedReport.createdAt || selectedReport.timestamp).toLocaleString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {(() => {
                              if (typeof selectedReport.location === 'string') {
                                return selectedReport.location;
                              } else if (selectedReport.location && typeof selectedReport.location === 'object') {
                                return selectedReport.location.address || 'Location not specified';
                              } else {
                                return 'Location not specified';
                              }
                            })()}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge and Expiry Time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-700">Status:</span>
                      {selectedReport.status === 'Resolved' || selectedReport.isExpired ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          🟢 Resolved
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⏳ Pending
                        </span>
                      )}
                    </div>
                    {selectedReport.expiresAt && (
                      <div className="text-sm text-slate-500">
                        Expires: {new Date(selectedReport.expiresAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">Description</h4>
                    <p className="text-slate-700 bg-slate-50 rounded-lg p-4">
                      {typeof selectedReport.description === 'string' ? selectedReport.description : 'No description provided'}
                    </p>
                  </div>

                  {/* Photos */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-slate-900">
                        {getAllPhotos(selectedReport).length > 1 ? 'Report Photos' : 'Report Photo'}
                      </h4>
                      {getAllPhotos(selectedReport).length > 1 && (
                        <button
                          onClick={() => handlePhotoGalleryOpen(selectedReport)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View All Photos
                        </button>
                      )}
                    </div>
                    
                    {getMainPhoto(selectedReport) ? (
                      <div className="space-y-3">
                        {/* Main photo */}
                        <div className="relative">
                          <img 
                            src={getMainPhoto(selectedReport)} 
                            alt="Report photo" 
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          {hasMultiplePhotos(selectedReport) && (
                            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full font-medium">
                              +{getPhotoCount(selectedReport) - 1} more
                            </div>
                          )}
                        </div>
                        
                        {/* Additional photos preview */}
                        {hasMultiplePhotos(selectedReport) && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-700">
                                All Photos ({getPhotoCount(selectedReport)})
                              </span>
                            </div>
                            
                            {/* Photo Grid */}
                            <div className="grid grid-cols-3 gap-2">
                              {getAllPhotos(selectedReport).slice(1, 4).map((photo, index) => (
                                <div key={index} className="relative">
                                  <img 
                                    src={photo} 
                                    alt={`Additional photo ${index + 2}`} 
                                    className="w-full h-20 object-cover rounded-lg"
                                  />
                                  {index === 2 && getPhotoCount(selectedReport) > 4 && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                      <span className="text-white text-sm font-medium">
                                        +{getPhotoCount(selectedReport) - 4}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-slate-100 rounded-lg flex items-center justify-center">
                        <div className="text-center text-slate-400">
                          <MapPin className="h-12 w-12 mx-auto mb-2" />
                          <p className="text-sm">No image available</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Poll Display */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 shadow-sm">
                    <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Community Poll
                    </h4>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="text-center">
                        <div className="text-2xl mb-1">🚨</div>
                        <div className="text-lg font-bold text-red-600">{selectedReport.poll?.stillThere || 0}</div>
                        <div className="text-xs text-slate-600">Still There</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl mb-1">✅</div>
                        <div className="text-lg font-bold text-green-600">{selectedReport.poll?.resolved || 0}</div>
                        <div className="text-xs text-slate-600">Resolved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl mb-1">❌</div>
                        <div className="text-lg font-bold text-red-600">{selectedReport.poll?.notSure || 0}</div>
                        <div className="text-xs text-slate-600">Fake Report</div>
                      </div>
                    </div>
                    {/* Voting Buttons */}
                    {user && selectedReport.status === 'Pending' && !selectedReport.isExpired && (
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handlePollVote(selectedReport._id || selectedReport.id, 'stillThere')}
                          disabled={votingReports.has(selectedReport._id || selectedReport.id)}
                          className="px-3 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300"
                        >
                          {votingReports.has(selectedReport._id || selectedReport.id) ? 'Voting...' : '🚨 Still There'}
                        </button>
                        <button
                          onClick={() => handlePollVote(selectedReport._id || selectedReport.id, 'resolved')}
                          disabled={votingReports.has(selectedReport._id || selectedReport.id)}
                          className="px-3 py-2 text-sm bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-all duration-200 border border-green-200 hover:border-green-300"
                        >
                          {votingReports.has(selectedReport._id || selectedReport.id) ? 'Voting...' : '✅ Resolved'}
                        </button>
                        <button
                          onClick={() => handlePollVote(selectedReport._id || selectedReport.id, 'notSure')}
                          disabled={votingReports.has(selectedReport._id || selectedReport.id)}
                          className="px-3 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300"
                        >
                          {votingReports.has(selectedReport._id || selectedReport.id) ? 'Voting...' : '❌ Fake Report'}
                        </button>
                      </div>
                    )}
                    {/* Poll Statistics */}
                    <div className="text-center text-sm text-slate-600 mt-3 pt-3 border-t border-blue-200">
                      {(() => {
                        const totalVotes = (selectedReport.poll?.stillThere || 0) + (selectedReport.poll?.resolved || 0) + (selectedReport.poll?.notSure || 0);
                        const resolvedPercentage = totalVotes > 0 ? Math.round(((selectedReport.poll?.resolved || 0) / totalVotes) * 100) : 0;
                        return (
                          <>
                            Total Votes: <span className="font-medium text-blue-600">{totalVotes}</span>
                            {totalVotes > 0 && (
                              <span className="ml-2">
                                • Resolved: <span className="font-medium text-green-600">{resolvedPercentage}%</span>
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Report Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-slate-600 mb-2">Severity</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedReport.severity === 'high' ? 'bg-red-100 text-red-800' :
                        selectedReport.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedReport.severity || 'medium'}
                      </span>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-slate-600 mb-2">Reported By</h4>
                      <span className="text-sm text-slate-900">
                        {typeof selectedReport.reportedBy === 'object' && selectedReport.reportedBy?.name ? 
                          selectedReport.reportedBy.name : 'Anonymous'}
                      </span>
                    </div>
                  </div>

                  {/* Latest Comments Preview */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-slate-600">Latest Comments</h4>
                      <span className="text-xs text-slate-500">
                        {Array.isArray(selectedReport.comments) ? selectedReport.comments.length : 0} total
                      </span>
                    </div>
                    
                    {/* Add Comment Form */}
                    {user && (
                      <div className="mb-4">
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          if (newComment.trim()) {
                            handleAddComment(selectedReport._id || selectedReport.id, newComment.trim());
                            setNewComment('');
                          }
                        }} className="flex space-x-2">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            maxLength={500}
                          />
                          <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Comment
                          </button>
                        </form>
                      </div>
                    )}
                    
                    {selectedReport.comments && selectedReport.comments.length > 0 ? (
                      <div className="space-y-3">
                        {selectedReport.comments.slice(-2).map((comment, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-slate-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-slate-900">
                                {comment.user?.name || 'Anonymous'}
                              </span>
                              <span className="text-xs text-slate-500">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700">{comment.text}</p>
                          </div>
                        ))}
                        {selectedReport.comments.length > 2 && (
                          <p className="text-sm text-slate-500 text-center">
                            +{selectedReport.comments.length - 2} more comments
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-4">
                        No comments yet. Be the first to comment!
                      </p>
                    )}
                  </div>

                  {/* Engagement Stats */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-slate-600 mb-3">Engagement</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-slate-900">
                          {selectedReport.likes?.length || 0}
                        </div>
                        <div className="text-xs text-slate-600">Likes</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-slate-900">
                          {Array.isArray(selectedReport.comments) ? selectedReport.comments.length : 0}
                        </div>
                        <div className="text-xs text-slate-600">Comments</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-slate-900">
                          {selectedReport.views || 0}
                        </div>
                        <div className="text-xs text-slate-600">Views</div>
                      </div>
                    </div>
                    
                    {/* Comments Button */}
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => {
                          setShowReportDetail(false);
                          openComments(selectedReport);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        View All Comments ({Array.isArray(selectedReport.comments) ? selectedReport.comments.length : 0})
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => setShowReportDetail(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comments Modal */}
        <AnimatePresence>
          {showCommentsModal && selectedReportForComments && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowCommentsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Comments</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openComments(selectedReportForComments)}
                      disabled={isAddingComment}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh Comments"
                    >
                      <svg className={`w-4 h-4 ${isAddingComment ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowCommentsModal(false)}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                <CommentSection 
                  reportId={selectedReportForComments._id} 
                  onCommentUpdate={() => {
                    // Refresh the report data after comment update
                    openComments(selectedReportForComments);
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo Gallery Modal */}
        <PhotoGallery
          photos={selectedReportPhotos}
          isOpen={showPhotoGallery}
          onClose={() => setShowPhotoGallery(false)}
        />

      </div>
    </div>
  );
}