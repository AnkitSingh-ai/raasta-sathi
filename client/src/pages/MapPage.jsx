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
import { useReport } from '../contexts/ReportContext';
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
  const { 
    isUserLiked, 
    isUserViewed, 
    getLikeCount, 
    getViewCount, 
    handleLike, 
    handleViewIncrement, 
    initializeReports 
  } = useReport();
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 });
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
    // Initialize reports in ReportContext for like/view functionality
    if (data && data.length > 0) {
      initializeReports(data);
    }
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

// Synchronize reports with ReportContext when it changes
useEffect(() => {
  if (reports.length > 0) {
    initializeReports(reports);
  }
}, [reports, initializeReports]);
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
        <div className="mb-3 relative">
          {/* Ultra Compact Live Map Hero Section */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 shadow-lg border border-white/10">
            {/* Animated Background Elements */}
            <div className="absolute inset-0">
              {/* Main gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/90 to-indigo-900/90"></div>
              
              {/* Subtle grid pattern */}
              <div className="absolute inset-0 opacity-15">
                <div className="absolute top-0 left-0 w-full h-full" style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)',
                  backgroundSize: '16px 16px'
                }}></div>
              </div>
              
              {/* Floating geometric shapes */}
              <div className="absolute top-4 left-4 w-1.5 h-1.5 bg-blue-400/25 rounded-full animate-pulse"></div>
              <div className="absolute top-8 right-8 w-1 h-1 bg-cyan-400/30 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              <div className="absolute bottom-4 left-6 w-2 h-2 bg-indigo-400/25 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
              
              {/* Glowing orbs */}
              <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-blue-500/8 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-20 h-20 bg-indigo-500/8 rounded-full blur-xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10 p-3 lg:p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                {/* Left side - Main content */}
                <div className="flex-1">
                  {/* Icon and Title */}
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                        <Navigation className="h-4 w-4 text-white" />
                      </div>
                      {/* Animated ring */}
                      <div className="absolute inset-0 w-8 h-8 border border-blue-400/25 rounded-lg animate-ping"></div>
                    </div>
                    
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-black text-white mb-1 drop-shadow-lg bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
                        Live Traffic Map
                      </h1>
                      <p className="text-sm lg:text-base text-blue-200 font-medium max-w-md leading-relaxed">
                        Real-time traffic intelligence
                      </p>
                    </div>
                  </div>
                  
                  {/* Live Stats */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <div className="flex items-center space-x-1 bg-white/8 backdrop-blur-sm rounded-md px-1.5 py-1 border border-white/15">
                      <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-white text-xs font-medium">Live</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-white/8 backdrop-blur-sm rounded-md px-1.5 py-1 border border-white/15">
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                      <span className="text-white text-xs font-medium">Real-time</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-white/8 backdrop-blur-sm rounded-md px-1.5 py-1 border border-white/15">
                      <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                      <span className="text-white text-xs font-medium">Smart</span>
                    </div>
                  </div>
                </div>
                
                {/* Right side - Action buttons */}
                <div className="flex flex-col space-y-1.5 lg:space-y-0 lg:space-x-1.5 lg:flex-row">
                  {/* My Location Button */}
                  <button
                    onClick={handleLocationClick}
                    className="group flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-blue-500/20 border border-blue-400/30 hover:border-blue-300/50 transform hover:-translate-y-0.5"
                  >
                    <div className="p-1 bg-white/20 rounded-md group-hover:bg-white/30 transition-all duration-300">
                      <Crosshair className="h-3 w-3" />
                    </div>
                    <span className="font-semibold text-xs">Location</span>
                  </button>
                  
                  {/* Enhanced Filter Dropdown */}
                  <div className="relative group">
                    <button className="group flex items-center space-x-1.5 px-3 py-1.5 bg-white/8 backdrop-blur-sm text-white rounded-lg hover:bg-white/15 transition-all duration-300 shadow-md border border-white/15 hover:border-white/25 transform hover:-translate-y-0.5">
                      <div className="p-1 bg-white/20 rounded-md group-hover:bg-white/30 transition-all duration-300">
                        <Filter className="h-3 w-3" />
                      </div>
                      <span className="font-semibold text-xs">{filterOptions.find(opt => opt.value === activeFilter)?.label || 'All Reports'}</span>
                      <svg className="w-3 h-3 transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Enhanced Dropdown Menu */}
                    <div className="absolute top-full left-0 mt-1.5 w-52 bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform group-hover:translate-y-0 translate-y-1">
                      <div className="p-2.5">
                        <div className="text-sm font-semibold text-slate-600 mb-2 px-2">Filter Reports</div>
                        {filterOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <button
                              key={option.value}
                              onClick={() => setActiveFilter(option.value)}
                              className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                                activeFilter === option.value
                                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              <span>{option.label}</span>
                              {activeFilter === option.value && (
                                <div className="ml-auto w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Remove the old Filter Bar section */}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden relative"
            >
              {/* Enhanced Map Background Decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 rounded-3xl"></div>
              <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-tr from-green-100/20 to-blue-100/20 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
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

                {/* Enhanced Map Controls */}
                <div className="p-6 border-t border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                        <span className="text-sm font-semibold text-slate-700">Live Updates</span>
                      </div>
                      <div className="text-sm text-slate-600 bg-white/80 px-3 py-1.5 rounded-full border border-slate-200/60">
                        Last updated: 30 seconds ago
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 text-sm font-medium text-slate-700 hover:bg-white hover:shadow-md transition-all duration-200"
                      >
                        <Filter className="h-4 w-4" />
                        <span>Filters</span>
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Navigation className="h-4 w-4" />
                        <span>Navigate</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Enhanced Reports List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 relative overflow-hidden"
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full -translate-y-12 translate-x-12 blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Live Reports</h2>
                    <p className="text-sm text-slate-500 mt-1">Real-time traffic updates</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      {Array.isArray(filteredReports) ? filteredReports.length : 0} active
                    </span>
                    <motion.button
                      onClick={loadReports}
                      disabled={isRefreshing}
                      whileHover={{ scale: 1.1, rotate: 180 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh reports"
                    >
                      <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-3 h-96 lg:h-[600px] overflow-y-auto custom-scrollbar">
                  <AnimatePresence>
                    {filteredReports.map((report, index) => {
                      const Icon = getIconForType(report.type);
                      return (
                        <motion.div
                          key={report._id || report.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          onClick={() => {
                            // Increment view count when report is clicked
                            handleViewIncrement(report._id || report.id);
                            setSelectedReport(report);
                            setShowReportDetail(true);
                          }}
                          className="group relative bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 hover:from-slate-100 hover:to-white transition-all duration-300 cursor-pointer border border-slate-200/60 hover:border-slate-300/60 hover:shadow-lg hover:-translate-y-1"
                        >
                          {/* Compact Report Card Design */}
                          <div className="flex items-start space-x-3">
                            {/* Compact Icon Section */}
                            <div className="flex flex-col items-center space-y-2">
                              <div className={`p-2 rounded-lg ${getColorForSeverity(report.severity)} shadow-sm group-hover:shadow-md transition-all duration-300`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              
                              {/* Compact Location Button */}
                              <LocationButton 
                                location={report.location} 
                                variant="floating" 
                                size="tiny"
                                className="group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                            
                            {/* Compact Content Section */}
                            <div className="flex-1 min-w-0">
                              {/* Compact Header with Status */}
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold text-slate-900 capitalize bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                  {typeof report.type === 'string' ? report.type.replace('_', ' ') : 'Unknown'}
                                </h3>
                                <div className="flex items-center space-x-2">
                                  {/* Compact Status Badge */}
                                  {report.status === 'Fake Report' ? (
                                    <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-red-200 text-red-700 border border-red-200">
                                      <div className="w-1 h-1 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                                      Fake Report
                                    </div>
                                  ) : report.status === 'Resolved' || report.isExpired ? (
                                    <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200">
                                      <div className="w-1 h-1 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                                      Resolved
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border border-yellow-200">
                                      <div className="w-1 h-1 bg-yellow-500 rounded-full mr-1 animate-pulse"></div>
                                      Active
                                    </div>
                                  )}
                                  
                                  {/* Compact Expiry Time */}
                                  {report.expiresAt && (
                                    <div className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                      {getTimeUntilExpiry(report.expiresAt)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Compact Location */}
                              <p className="text-xs text-slate-700 mb-1.5 font-medium">
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
                              
                              {/* Compact Description */}
                              <div className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                                {typeof report.description === 'string' ? 
                                  report.description.split('\n').map((line, index) => {
                                    if (line.trim() && line.trim() === line.trim().toUpperCase() && line.trim().length > 3) {
                                      // This is a heading - make it bold
                                      return (
                                        <span key={index} className="font-bold text-slate-700">
                                          {line.trim()}
                                        </span>
                                      );
                                    } else if (line.trim()) {
                                      // This is content
                                      return (
                                        <span key={index}>
                                          {line.trim()}
                                        </span>
                                      );
                                    } else {
                                      // Empty line - add space
                                      return <span key={index}> </span>;
                                    }
                                  })
                                  : 'No description provided'
                                }
                              </div>
                              
                              {/* Compact Community Poll */}
                              <div className="mb-3">
                                <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center">
                                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-1.5"></div>
                                  Community Poll
                                </div>
                                <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-lg p-2 border border-blue-200/60 backdrop-blur-sm">
                                  <div className="grid grid-cols-3 gap-1 mb-2">
                                    <div className="text-center">
                                      <div className="text-sm mb-0.5">🚨</div>
                                      <div className="text-xs font-bold text-red-600">{report.poll?.stillThere || 0}</div>
                                      <div className="text-xs text-slate-600">Still There</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-sm mb-0.5">✅</div>
                                      <div className="text-xs font-bold text-green-600">{report.poll?.resolved || 0}</div>
                                      <div className="text-xs text-slate-600">Resolved</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-sm mb-0.5">❌</div>
                                      <div className="text-xs font-bold text-red-600">{report.poll?.fake || 0}</div>
                                      <div className="text-xs text-slate-600">Fake</div>
                                    </div>
                                  </div>
                                  
                                  {/* Compact Voting Buttons */}
                                  {user && report.status === 'Active' && !report.isExpired && (
                                    <div className="grid grid-cols-3 gap-1">
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePollVote(report._id || report.id, 'stillThere');
                                        }}
                                        disabled={votingReports.has(report._id || report.id)}
                                        className="px-2 py-1 text-xs bg-gradient-to-r from-red-100 to-red-200 text-red-700 rounded hover:from-red-200 hover:to-red-300 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300 font-medium shadow-sm"
                                      >
                                        {votingReports.has(report._id || report.id) ? 'Voting...' : '🚨 Still There'}
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePollVote(report._id || report.id, 'resolved');
                                        }}
                                        disabled={votingReports.has(report._id || report.id)}
                                        className="px-2 py-1 text-xs bg-gradient-to-r from-green-100 to-green-200 text-green-700 rounded hover:from-green-200 hover:to-green-300 disabled:opacity-50 transition-all duration-200 border border-green-200 hover:border-green-300 font-medium shadow-sm"
                                      >
                                        {votingReports.has(report._id || report.id) ? 'Voting...' : '✅ Resolved'}
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePollVote(report._id || report.id, 'fake');
                                        }}
                                        disabled={votingReports.has(report._id || report.id)}
                                        className="px-2 py-1 text-xs bg-gradient-to-r from-red-100 to-red-200 text-red-700 rounded hover:from-red-200 hover:to-red-300 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300 font-medium shadow-sm"
                                      >
                                        {votingReports.has(report._id || report.id) ? 'Voting...' : '❌ Fake'}
                                      </motion.button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Compact Footer */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                                <span className="text-xs text-slate-500 font-medium">
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
                                    className={`flex items-center space-x-1 text-xs font-medium ${
                                      isUserLiked(report._id || report.id) ? 'text-red-500' : 'text-slate-500'
                                    } hover:text-red-500 transition-all duration-200 hover:bg-red-50 px-1.5 py-0.5 rounded`}
                                  >
                                    <Heart className={`h-3 w-3 ${isUserLiked(report._id || report.id) ? 'fill-current' : ''}`} />
                                    <span>{getLikeCount(report._id || report.id)}</span>
                                  </motion.button>
                                  
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openComments(report);
                                    }}
                                    disabled={isAddingComment}
                                    className="flex items-center space-x-1 text-xs font-medium text-green-600 hover:text-green-700 transition-all duration-200 hover:bg-green-50 px-1.5 py-0.5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="View Comments"
                                  >
                                    <MessageCircle className="h-3 w-3" />
                                    <span>{Array.isArray(report.comments) ? report.comments.length : 0}</span>
                                  </motion.button>
                                  
                                  <div className="flex items-center space-x-1 text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    <Eye className="h-3 w-3" />
                                    <span>{getViewCount(report._id || report.id)}</span>
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
              </div>
            </motion.div>
          </div>
        </div>

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
                      {selectedReport.status === 'Fake Report' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          🔴 Fake Report
                        </span>
                      ) : selectedReport.status === 'Resolved' || selectedReport.isExpired ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          🟢 Resolved
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          🟡 Active
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
                    <div className="text-slate-700 bg-slate-50 rounded-lg p-4">
                      {typeof selectedReport.description === 'string' ? 
                        selectedReport.description.split('\n').map((line, index) => {
                          if (line.trim() && line.trim() === line.trim().toUpperCase() && line.trim().length > 3) {
                            // This is a heading - make it bold
                            return (
                              <div key={index} className="font-bold text-slate-800 mb-2 mt-3 first:mt-0">
                                {line.trim()}
                              </div>
                            );
                          } else if (line.trim()) {
                            // This is content - add proper spacing
                            return (
                              <div key={index} className="mb-2">
                                {line.trim()}
                              </div>
                            );
                          } else {
                            // Empty line - add spacing
                            return <div key={index} className="mb-3"></div>;
                          }
                        })
                        : 'No description provided'
                      }
                    </div>
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
                        <div className="text-lg font-bold text-red-600">{selectedReport.poll?.fake || 0}</div>
                        <div className="text-xs text-slate-600">Fake</div>
                      </div>
                    </div>
                    {/* Voting Buttons */}
                    {user && selectedReport.status === 'Active' && !selectedReport.isExpired && (
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
                          onClick={() => handlePollVote(selectedReport._id || selectedReport.id, 'fake')}
                          disabled={votingReports.has(selectedReport._id || selectedReport.id)}
                          className="px-3 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300"
                        >
                          {votingReports.has(selectedReport._id || selectedReport.id) ? 'Voting...' : '❌ Fake'}
                        </button>
                      </div>
                    )}
                    {/* Poll Statistics */}
                    <div className="text-center text-sm text-slate-600 mt-3 pt-3 border-t border-blue-200">
                      {(() => {
                        const totalVotes = (selectedReport.poll?.stillThere || 0) + (selectedReport.poll?.resolved || 0) + (selectedReport.poll?.fake || 0);
                        const resolvedPercentage = totalVotes > 0 ? Math.round(((selectedReport.poll?.resolved || 0) / totalVotes) * 100) : 0;
                        const fakePercentage = totalVotes > 0 ? Math.round(((selectedReport.poll?.fake || 0) / totalVotes) * 100) : 0;
                        return (
                          <>
                            Total Votes: <span className="font-medium text-blue-600">{totalVotes}</span>
                            {totalVotes > 0 && (
                              <>
                                <span className="ml-2">
                                  • Resolved: <span className="font-medium text-green-600">{resolvedPercentage}%</span>
                                </span>
                                {fakePercentage > 0 && (
                                  <span className="ml-2">
                                    • Fake: <span className="font-medium text-red-600">{fakePercentage}%</span>
                                  </span>
                                )}
                              </>
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