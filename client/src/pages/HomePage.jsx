import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MapPin, 
  Shield, 
  Trophy, 
  AlertTriangle, 
  Navigation,
  Clock,
  Award,
  BarChart3,
  Smartphone,
  Bell,
  Eye,
  ArrowRight,
  CheckCircle,
  X,
  MessageCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Footer } from '../components/Footer';
import PhotoGallery from '../components/PhotoGallery';
import { getAllPhotos, hasMultiplePhotos, getPhotoCount, getMainPhoto } from '../utils/photoUtils';
import apiService from '../utils/api';
import toast from 'react-hot-toast';
import LocationButton from '../components/LocationButton';

export function HomePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentReports, setRecentReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationBasedReports, setLocationBasedReports] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [votingReports, setVotingReports] = useState(new Set());
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [selectedReportPhotos, setSelectedReportPhotos] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [reportsStats, setReportsStats] = useState({
    totalActive: 0,
    totalAccidents: 0
  });


  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          console.log('User location:', { lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error getting location:', error);
          setUserLocation(null);
        }
      );
    }
  };

  // Fetch reports statistics for live map card
  useEffect(() => {
    const fetchReportsStats = async () => {
      try {
        const response = await apiService.getAllReports();
        let reports = [];
        
        if (response && Array.isArray(response)) {
          reports = response;
        } else if (response && response.reports && Array.isArray(response.reports)) {
          reports = response.reports;
        }

        // Calculate statistics
        const totalActive = reports.filter(report => report.isActive).length;
        const totalAccidents = reports.filter(report => 
          report.isActive && report.type === 'accident'
        ).length;

        setReportsStats({
          totalActive,
          totalAccidents
        });
      } catch (error) {
        console.error('Failed to fetch reports stats:', error);
        // Don't show error toast as this is not critical
      }
    };

    fetchReportsStats();
  }, []);

  // Fetch recent reports
  const fetchRecentReports = async () => {
    try {
      setLoadingReports(true);
      const response = await apiService.getAllReports();
      if (response && Array.isArray(response)) {
        // Take the most recent 6 reports
        const recent = response.slice(0, 6).map(report => ({
          id: report._id,
          type: report.type,
          location: report.location || 'Location not specified',
          coordinates: report.coordinates,
          time: getTimeAgo(report.reportedAt || report.createdAt),
          severity: report.severity || 'medium',
          title: report.title,
          status: report.status,
          photo: report.photo,
          photos: report.photos || [],
          description: report.description,
          poll: report.poll || { stillThere: 0, resolved: 0, notSure: 0 },
          expiresAt: report.expiresAt,
          isExpired: report.isExpired,
          comments: report.comments || []
        }));
        setRecentReports(recent);
      }
    } catch (error) {
      console.error('Failed to fetch recent reports:', error);
      // Fallback to empty array if API fails
      setRecentReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  // Fetch reports near user's location
  const fetchLocationBasedReports = async () => {
    if (!userLocation) return;
    
    try {
      setLoadingReports(true);
      const response = await apiService.getAllReports();
      if (response && Array.isArray(response)) {
        // Filter reports that have coordinates and are within reasonable distance
        const nearbyReports = response.filter(report => {
          if (!report.coordinates || !report.coordinates.coordinates) return false;
          
          const [reportLng, reportLat] = report.coordinates.coordinates;
          const distance = calculateDistance(
            userLocation.lat, 
            userLocation.lng, 
            reportLat, 
            reportLng
          );
          
          // Show reports within 50km radius
          return distance <= 50;
        });
        
        const locationBased = nearbyReports.slice(0, 3).map(report => ({
          id: report._id,
          type: report.type,
          location: report.location || 'Location not specified',
          coordinates: report.coordinates,
          time: getTimeAgo(report.reportedAt || report.createdAt),
          severity: report.severity || 'medium',
          title: report.title,
          status: report.status,
          photo: report.photo,
          photos: report.photos || [],
          description: report.description,
          poll: report.poll || { stillThere: 0, resolved: 0, notSure: 0 },
          expiresAt: report.expiresAt,
          isExpired: report.isExpired,
          comments: report.comments || [],
          distance: calculateDistance(
            userLocation.lat, 
            userLocation.lng, 
            report.coordinates.coordinates[1], 
            report.coordinates.coordinates[0]
          )
        }));
        
        setLocationBasedReports(locationBased);
        setError(null); // Clear any previous errors
      }
    } catch (error) {
      console.error('Failed to fetch location-based reports:', error);
      
      // Show user-friendly error message
      if (error.response?.status === 503 && error.response?.data?.code === 'DATABASE_NOT_READY') {
        setError('Service is starting up. Please try again in a moment.');
      } else if (error.response?.status === 500) {
        setError('Unable to load reports at the moment. Please try again later.');
      } else {
        setError('Failed to load nearby reports. Please check your connection and try again.');
      }
    } finally {
      setLoadingReports(false);
    }
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Handle image click to show modal
  const handleImageClick = (imageUrl, reportTitle) => {
    setSelectedImage({ url: imageUrl, title: reportTitle });
    setShowImageModal(true);
  };

  // Handle report click to show details
  const handleReportClick = async (report) => {
    setSelectedReport(report);
    setShowReportDetail(true);
    setLoadingComments(true);
    
    // Fetch comments for the selected report
    try {
      const commentsResponse = await apiService.getComments(report.id);
      if (commentsResponse && commentsResponse.data && Array.isArray(commentsResponse.data.comments)) {
        setSelectedReport(prev => ({
          ...prev,
          comments: commentsResponse.data.comments
        }));
      } else if (commentsResponse && Array.isArray(commentsResponse)) {
        // Fallback for direct array response
        setSelectedReport(prev => ({
          ...prev,
          comments: commentsResponse
        }));
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      // Don't show error toast as comments are not critical for viewing the report
    } finally {
      setLoadingComments(false);
    }
  };

  // Handle photo gallery open
  const handlePhotoGalleryOpen = (report) => {
    const photos = getAllPhotos(report);
    setSelectedReportPhotos(photos);
    setShowPhotoGallery(true);
  };



  // Close image modal
  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showImageModal) {
        closeImageModal();
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal]);

  // Get the main image for a report
  const getMainImage = (report) => {
    if (report.photo) return report.photo;
    if (report.photos && report.photos.length > 0) {
      // If photos array has objects with url property, use that
      if (typeof report.photos[0] === 'object' && report.photos[0].url) {
        return report.photos[0].url;
      }
      // If photos array has direct URLs
      return report.photos[0];
    }
    return null;
  };

  // Get all photos for a report
  const getAllPhotos = (report) => {
    const photos = [];
    
    // Add main photo if exists
    if (report.photo) {
      photos.push(report.photo);
    }
    
    // Add photos from photos array
    if (report.photos && report.photos.length > 0) {
      report.photos.forEach(photo => {
        if (typeof photo === 'object' && photo.url) {
          photos.push(photo.url);
        } else if (typeof photo === 'string') {
          photos.push(photo);
        }
      });
    }
    
    // Remove duplicates and return unique photos
    return [...new Set(photos)];
  };

  // Build full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return apiService.getImageUrl(imagePath);
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
        setRecentReports(prev => 
          prev.map(report => 
            report.id === reportId 
              ? { ...report, poll: response.data.pollResults }
              : report
          )
        );
        
        setLocationBasedReports(prev => 
          prev.map(report => 
            report.id === reportId 
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

  // Handle adding comments
  const handleAddComment = async (reportId, commentText) => {
    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    try {
      const response = await apiService.addComment(reportId, commentText);
      
      // Update the selected report with new comment
      if (selectedReport && selectedReport.id === reportId) {
        const newComment = response.data?.comment || response;
        setSelectedReport(prev => ({
          ...prev,
          comments: [...(prev.comments || []), newComment]
        }));
      }
      
      // Update recent reports
      setRecentReports(prev => 
        prev.map(report => 
          report.id === reportId 
            ? { ...report, comments: [...(report.comments || []), response.data?.comment || response] }
            : report
        )
      );
      
      // Update location-based reports
      setLocationBasedReports(prev => 
        prev.map(report => 
          report.id === reportId 
            ? { ...report, comments: [...(report.comments || []), response.data?.comment || response] }
            : report
        )
      );
      
      toast.success('Comment added successfully!');
      
      // Refresh comments to get the latest data
      if (selectedReport && selectedReport.id === reportId) {
        try {
          const refreshResponse = await apiService.getComments(reportId);
          if (refreshResponse && refreshResponse.data && Array.isArray(refreshResponse.data.comments)) {
            setSelectedReport(prev => ({
              ...prev,
              comments: refreshResponse.data.comments
            }));
          }
        } catch (refreshError) {
          console.error('Failed to refresh comments:', refreshError);
        }
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
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
        🟡 Active
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

  // Handle image load error
  const handleImageError = (event) => {
    event.target.style.display = 'none';
    const parent = event.target.parentElement;
    if (parent) {
      const fallback = parent.querySelector('.image-fallback');
      if (fallback) {
        fallback.style.display = 'flex';
      }
    }
  };

  // Helper function to calculate time ago
  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown time';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins} mins ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  // Fetch reports on component mount
  useEffect(() => {
    fetchRecentReports();
    getUserLocation();
  }, []);

  // Fetch location-based reports when user location changes
  useEffect(() => {
    if (userLocation) {
      fetchLocationBasedReports();
    }
  }, [userLocation]);

  const features = [
    {
      icon: Users,
      title: t('features.citizen'),
      description: 'Citizens can report traffic incidents, road conditions, and safety concerns in real-time',
      link: '/report',
      linkText: 'Start Reporting',
      color: 'blue'
    },
    {
      icon: Clock,
      title: t('features.realtime'),
      description: 'Live updates on traffic conditions, incidents, and alternative routes for better navigation',
      link: '/map',
      linkText: 'View Live Map',
      color: 'green'
    },
    {
      icon: Shield,
      title: t('features.authority'),
      description: 'Dedicated dashboard for traffic police and municipal authorities to manage reports',
      link: '/dashboard',
      linkText: 'Authority Login',
      color: 'purple'
    },
    {
      icon: Trophy,
      title: t('features.gamification'),
      description: 'Earn points, badges, and recognition for contributing valuable traffic information',
      link: '/leaderboard',
      linkText: 'View Leaderboard',
      color: 'orange'
    }
  ];

  const stats = [
    { number: '50K+', label: 'Active Users', icon: Users },
    { number: '25K+', label: 'Reports Monthly', icon: AlertTriangle },
    { number: '95%', label: 'Accuracy Rate', icon: Award },
    { number: '24/7', label: 'Live Monitoring', icon: Clock },
    { number: '100K+', label: 'Comments', icon: MessageCircle }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center lg:text-left space-y-8"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full shadow-lg"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm font-medium text-slate-700">Live Traffic Monitoring</span>
              </motion.div>
              
              {/* Main Heading */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {t('hero.title')}
                  </span>
                  <span className="block text-xl sm:text-2xl md:text-3xl text-slate-600 mt-3 font-normal">
                    रास्ता साथी
                  </span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  {t('hero.subtitle')}
                </p>
              </div>
              
              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
              >
                {user ? (
                  user.role === 'citizen' ? (
                    <Link
                      to="/report"
                      className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-base shadow-xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
                    >
                      <span className="relative z-10">{t('hero.cta')}</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-base shadow-xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
                    >
                      <span className="relative z-10">Go to Dashboard</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                  )
                ) : (
                  <Link
                    to="/login"
                    className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-base shadow-xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
                  >
                    <span className="relative z-10">Get Started</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                )}
                <Link
                  to="/map"
                  className="group px-6 py-3 bg-white/80 backdrop-blur-sm text-slate-700 border-2 border-slate-200 rounded-xl font-semibold text-base hover:bg-white hover:border-slate-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
                >
                  <span className="flex items-center space-x-2">
                    <Navigation className="h-4 w-4" />
                    <span>View Live Map</span>
                  </span>
                </Link>
              </motion.div>
              
              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex items-center justify-center lg:justify-start space-x-4 text-xs text-slate-500"
              >
                <div className="flex items-center space-x-2">
                  <Shield className="h-3 w-3 text-green-500" />
                  <span>Trusted by 50K+ users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3 text-blue-500" />
                  <span>24/7 monitoring</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - Interactive Map Preview */}
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="relative"
            >
              <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-white/20 overflow-hidden group cursor-pointer hover:shadow-blue-500/25 transition-all duration-500 hover:-translate-y-3"
                   onClick={() => navigate('/map')}>
                
                {/* Live Status Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Navigation className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          Live Updates
                        </span>
                      </div>
                      <h3 className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold text-xl">Live Traffic Map</h3>
                      <p className="text-sm text-slate-600">Real-time updates</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700">Live</span>
                  </div>
                </div>
                
                {/* Interactive Map Preview */}
                <div 
                  className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl h-64 mb-6 overflow-hidden group-hover:shadow-xl transition-all duration-500 cursor-pointer border border-blue-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/map');
                  }}
                >
                  <img 
                    src="/google-maps-759.jpg.avif" 
                    alt="Live Traffic Map" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  
                  {/* Interactive Elements Overlay */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-lg">
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      <span className="text-xs font-semibold text-slate-700">{reportsStats.totalActive} Active</span>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-lg">
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span className="text-xs font-semibold text-slate-700">{reportsStats.totalAccidents} Accidents</span>
                    </div>
                  </div>
                  
                  {/* Click Indicator */}
                  <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors duration-500 rounded-2xl"></div>
                  <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-2 rounded-xl text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Click to explore →
                  </div>
                </div>
                
                {/* Live Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 border border-red-200">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-red-200 rounded-md">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-700">{reportsStats.totalAccidents}</div>
                        <div className="text-xs text-red-600 font-medium">Accidents</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-blue-200 rounded-md">
                        <Shield className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-700">{reportsStats.totalActive}</div>
                        <div className="text-xs text-blue-600 font-medium">Active Reports</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-50/30"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              Trusted by Thousands of Users
            </h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              Join a growing community of citizens, authorities, and emergency services working together for safer roads
            </p>
          </motion.div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center">
                  {/* Icon Container */}
                  <div className="relative mb-3">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-110">
                      <stat.icon className="h-7 w-7 text-white" />
                    </div>
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
                  </div>
                  
                  {/* Stats Content */}
                  <div className="space-y-2">
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-300">
                      {stat.number}
                    </div>
                    <div className="text-sm font-medium text-slate-600 group-hover:text-slate-700 transition-colors duration-300">
                      {stat.label}
                    </div>
                  </div>
                  
                  {/* Hover Border Effect */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-200 transition-all duration-300"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Reports Section - Public View */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center px-3 py-1 bg-blue-100 border border-blue-200 rounded-full mb-3">
              <span className="text-xs font-medium text-blue-700">Live Updates</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 mb-2">
              Recent Traffic Reports
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">Stay informed with real-time traffic updates from our community</p>
            <button
              onClick={fetchRecentReports}
              disabled={loadingReports}
              className="mt-3 sm:mt-4 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 inline-flex items-center space-x-2 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Clock className="h-4 w-4" />
              <span>Refresh Reports</span>
            </button>
          </div>

          {loadingReports ? (
            <div className="text-center py-8 sm:py-10">
              <p>Loading recent reports...</p>
            </div>
          ) : recentReports.length === 0 ? (
            <div className="text-center py-8 sm:py-10">
              <p>No recent reports available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {recentReports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative bg-white rounded-xl p-2 sm:p-3 shadow-lg border border-slate-200 cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 flex flex-col overflow-hidden"
                  onClick={() => handleReportClick(report)}
                >
                  <div className="absolute inset-0 bg-blue-50/50 opacity-0 pointer-events-none transition-opacity duration-300"></div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        report.severity === 'high' ? 'bg-red-100 text-red-600' :
                        report.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      
                      {/* Location Button - Right to alert triangle */}
                      <LocationButton 
                        location={report.location} 
                        variant="floating" 
                        size="small"
                      />
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500">{report.time}</span>
                      {getStatusBadge(report.status, report.isExpired)}
                      {report.expiresAt && (
                        <div className="text-xs text-slate-400 mt-1">
                          {getTimeUntilExpiry(report.expiresAt)}
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900 capitalize mb-2 text-sm line-clamp-2">{report.title || report.type}</h3>
                  
                  {/* Report Image - Recent Reports Section */}
                  {getMainImage(report) ? (
                    <div className="mb-3 relative">
                      <img
                        src={getImageUrl(getMainImage(report))}
                        alt={`${report.type} report`}
                        className="w-full h-20 object-cover rounded-lg"
                        onError={handleImageError}
                      />
                      
                      {/* Photo count indicator */}
                      {getAllPhotos(report).length > 1 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-full">
                          +{getAllPhotos(report).length - 1}
                        </div>
                      )}
                      
                      <div className="image-fallback hidden absolute inset-0 bg-slate-100 rounded-lg flex items-center justify-center">
                        <div className="text-center text-slate-400">
                          <AlertTriangle className="h-6 w-6 mx-auto mb-1" />
                          <p className="text-xs">Image failed to load</p>
                        </div>
                      </div>
                      
                      {/* View All Photos Button */}
                      {getAllPhotos(report).length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePhotoGalleryOpen(report);
                          }}
                          className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-full hover:bg-opacity-90 transition-all"
                        >
                          View All Photos
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mb-3 bg-slate-100 rounded-lg h-20 flex items-center justify-center">
                      <div className="text-center text-slate-400">
                        <AlertTriangle className="h-5 w-5 mx-auto mb-1" />
                        <p className="text-xs">No image</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Report Description */}
                  {report.description && (
                    <div className="text-slate-600 text-xs mb-3 line-clamp-2">
                      {report.description.split('\n').map((line, index) => {
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
                      })}
                    </div>
                  )}
                  
                  {/* Poll Display */}
                  <div className="mb-4">
                    <div className="text-xs font-medium text-slate-700 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Community Poll
                    </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200 shadow-sm">
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div className="text-center flex flex-col items-center justify-center">
                            <div className="text-lg font-bold text-red-600">{report.poll?.stillThere || 0}</div>
                            <div className="text-xs text-slate-600 mt-1">Still There</div>
                          </div>
                          <div className="text-center flex flex-col items-center justify-center">
                            <div className="text-lg font-bold text-green-600">{report.poll?.resolved || 0}</div>
                            <div className="text-xs text-slate-600 mt-1">Resolved</div>
                          </div>
                          <div className="text-center flex flex-col items-center justify-center">
                            <div className="text-lg font-bold text-red-600">{report.poll?.fake || 0}</div>
                            <div className="text-xs text-slate-600 mt-1">Fake Report</div>
                          </div>
                        </div>
                      
                      {/* Voting Buttons - Show for Active reports or if not Resolved/Fake */}
                      {report.status !== 'Resolved' && report.status !== 'Fake Report' && !report.isExpired && (
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!user) {
                                toast.error('Please login to vote');
                                return;
                              }
                              handlePollVote(report.id, 'stillThere');
                            }}
                            disabled={votingReports.has(report.id) || !user}
                            className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300"
                            title={!user ? 'Login to vote' : 'Still There'}
                          >
                            {votingReports.has(report.id) ? 'Voting...' : 'Still There'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!user) {
                                toast.error('Please login to vote');
                                return;
                              }
                              handlePollVote(report.id, 'resolved');
                            }}
                            disabled={votingReports.has(report.id) || !user}
                            className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-all duration-200 border border-green-200 hover:border-green-300"
                            title={!user ? 'Login to vote' : 'Resolved'}
                          >
                            {votingReports.has(report.id) ? 'Voting...' : 'Resolved'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!user) {
                                toast.error('Please login to vote');
                                return;
                              }
                              handlePollVote(report.id, 'fake');
                            }}
                            disabled={votingReports.has(report.id) || !user}
                            className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300"
                            title={!user ? 'Login to vote' : 'Fake Report'}
                          >
                            {votingReports.has(report.id) ? 'Voting...' : 'Fake Report'}
                          </button>
                        </div>
                      )}
                      
                      {/* Poll Statistics */}
                      <div className="text-center text-xs text-slate-600 mt-2 pt-2 border-t border-blue-200">
                        {(() => {
                          const totalVotes = (report.poll?.stillThere || 0) + (report.poll?.resolved || 0) + (report.poll?.fake || 0);
                          const resolvedPercentage = totalVotes > 0 ? Math.round(((report.poll?.resolved || 0) / totalVotes) * 100) : 0;
                          return (
                            <>
                              Total: <span className="font-medium text-blue-600">{totalVotes}</span>
                              {totalVotes > 0 && (
                                <span className="ml-1">
                                  • Resolved: <span className="font-medium text-green-600">{resolvedPercentage}%</span>
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  
                                    <div className="mt-auto">
                    <p className="text-slate-600 text-xs mb-2 line-clamp-1">
                      {typeof report.location === 'string' 
                        ? report.location 
                        : report.location?.address || 'Location not specified'
                      }
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center space-x-2">
                        <span className="flex items-center space-x-1 text-blue-600">
                          <MessageCircle className="h-3 w-3" />
                          <span>{report.comments && Array.isArray(report.comments) ? report.comments.length : 0}</span>
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full ${
                        report.severity === 'high' ? 'bg-red-200 text-red-700' :
                        report.severity === 'medium' ? 'bg-yellow-200 text-yellow-700' :
                        'bg-green-200 text-green-700'
                      }`}>
                        {report.severity} priority
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              to="/map"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Eye className="h-5 w-5" />
              <span>View All Reports on Map</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Location-Based Reports Section */}
      {userLocation && (
        <section className="py-12 sm:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center px-3 py-1 bg-green-100 border border-green-200 rounded-full mb-3">
                <span className="text-xs font-medium text-green-700">Location Based</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-green-700 to-blue-700 mb-2">
                Reports Near You
              </h2>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">Traffic incidents in your area with real-time distance tracking</p>
              <button
                onClick={fetchLocationBasedReports}
                disabled={loadingReports}
                className="mt-3 sm:mt-4 px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center space-x-2"
              >
                <MapPin className="h-4 w-4" />
                <span>{loadingReports ? 'Loading...' : 'Refresh Nearby Reports'}</span>
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={() => setError(null)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loadingReports && locationBasedReports.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-green-600 transition ease-in-out duration-150">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading nearby reports...
                </div>
              </div>
            )}

            {/* Reports Grid */}
            {!loadingReports && locationBasedReports.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {locationBasedReports.map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group relative bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-2 sm:p-3 shadow-lg border border-green-200 cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden"
                    onClick={() => handleReportClick(report)}
                  >
                    <div className="absolute inset-0 bg-green-50/50 opacity-0 pointer-events-none transition-opacity duration-300"></div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          report.severity === 'high' ? 'bg-red-100 text-red-600' :
                          report.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          <MapPin className="h-4 w-4" />
                        </div>
                        
                        {/* Location Button - Right to MapPin icon */}
                        <LocationButton 
                          location={report.location} 
                          variant="floating" 
                          size="small"
                        />
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500">{report.time}</span>
                        {getStatusBadge(report.status, report.isExpired)}
                        <div className="text-xs text-green-600 font-medium">
                          {report.distance.toFixed(1)} km away
                        </div>
                        {report.expiresAt && (
                          <div className="text-xs text-slate-400 mt-1">
                            {getTimeUntilExpiry(report.expiresAt)}
                          </div>
                        )}
                      </div>
                    </div>
                    <h3 className="font-semibold text-slate-900 capitalize mb-2 text-sm line-clamp-2">{report.title || report.type}</h3>
                    
                    {/* Report Image - Location-Based Reports Section */}
                    {getMainImage(report) ? (
                      <div className="mb-3 relative">
                        <img
                          src={getImageUrl(getMainImage(report))}
                          alt={`${report.type} report`}
                          className="w-full h-20 object-cover rounded-lg"
                          onError={handleImageError}
                        />
                        
                        {/* Photo count indicator */}
                        {getAllPhotos(report).length > 1 && (
                          <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-full">
                            +{getAllPhotos(report).length - 1}
                          </div>
                        )}
                        
                        <div className="image-fallback hidden absolute inset-0 bg-slate-100 rounded-lg flex items-center justify-center">
                          <div className="text-center text-slate-400">
                            <MapPin className="h-6 w-6 mx-auto mb-1" />
                            <p className="text-xs">Image failed to load</p>
                          </div>
                        </div>
                        
                        {/* View All Photos Button */}
                        {getAllPhotos(report).length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePhotoGalleryOpen(report);
                            }}
                            className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-full hover:bg-opacity-90 transition-all"
                          >
                            View All Photos
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mb-3 bg-slate-100 rounded-lg h-20 flex items-center justify-center">
                        <div className="text-center text-slate-400">
                          <MapPin className="h-5 w-5 mx-auto mb-1" />
                          <p className="text-xs">No image</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Report Description */}
                    {report.description && (
                      <div className="text-slate-600 text-xs mb-3 line-clamp-2">
                        {report.description.split('\n').map((line, index) => {
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
                        })}
                      </div>
                    )}
                    
                    {/* Poll Display */}
                    <div className="mb-4">
                      <div className="text-xs font-medium text-slate-700 mb-3 flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Community Poll
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200 shadow-sm">
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div className="text-center flex flex-col items-center justify-center">
                            <div className="text-lg font-bold text-red-600">{report.poll?.stillThere || 0}</div>
                            <div className="text-xs text-slate-600 mt-1">Still There</div>
                          </div>
                          <div className="text-center flex flex-col items-center justify-center">
                            <div className="text-lg font-bold text-green-600">{report.poll?.resolved || 0}</div>
                            <div className="text-xs text-slate-600 mt-1">Resolved</div>
                          </div>
                          <div className="text-center flex flex-col items-center justify-center">
                            <div className="text-lg font-bold text-red-600">{report.poll?.fake || 0}</div>
                            <div className="text-xs text-slate-600 mt-1">Fake Report</div>
                          </div>
                        </div>
                        
                        {/* Voting Buttons - Show for Active reports or if not Resolved/Fake */}
                        {report.status !== 'Resolved' && report.status !== 'Fake Report' && !report.isExpired && (
                          <div className="grid grid-cols-3 gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!user) {
                                  toast.error('Please login to vote');
                                  return;
                                }
                                handlePollVote(report.id, 'stillThere');
                              }}
                              disabled={votingReports.has(report.id) || !user}
                              className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300"
                              title={!user ? 'Login to vote' : 'Still There'}
                            >
                              {votingReports.has(report.id) ? 'Voting...' : 'Still There'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!user) {
                                  toast.error('Please login to vote');
                                  return;
                                }
                                handlePollVote(report.id, 'resolved');
                              }}
                              disabled={votingReports.has(report.id) || !user}
                              className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-all duration-200 border border-green-200 hover:border-green-300"
                              title={!user ? 'Login to vote' : 'Resolved'}
                            >
                              {votingReports.has(report.id) ? 'Voting...' : 'Resolved'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!user) {
                                  toast.error('Please login to vote');
                                  return;
                                }
                                handlePollVote(report.id, 'fake');
                              }}
                              disabled={votingReports.has(report.id) || !user}
                              className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300"
                              title={!user ? 'Login to vote' : 'Fake Report'}
                            >
                              {votingReports.has(report.id) ? 'Voting...' : 'Fake Report'}
                            </button>
                          </div>
                        )}
                        
                        {/* Poll Statistics */}
                        <div className="text-center text-xs text-slate-600 mt-2 pt-2 border-t border-blue-200">
                          {(() => {
                            const totalVotes = (report.poll?.stillThere || 0) + (report.poll?.resolved || 0) + (report.poll?.fake || 0);
                            const resolvedPercentage = totalVotes > 0 ? Math.round(((report.poll?.resolved || 0) / totalVotes) * 100) : 0;
                            return (
                              <>
                                                              Total: <span className="font-medium text-blue-600">{totalVotes}</span>
                              {totalVotes > 0 && (
                                <span className="ml-1">
                                  • Resolved: <span className="font-medium text-green-600">{resolvedPercentage}%</span>
                                </span>
                              )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Location and Type Info */}
                                      <p className="text-slate-600 text-xs mb-2 line-clamp-1">
                                        {typeof report.location === 'string' 
                                          ? report.location 
                                          : report.location?.address || 'Location not specified'
                                        }
                                      </p>
                  
                  <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center space-x-2">
                        <span className="flex items-center space-x-1 text-blue-600">
                          <MessageCircle className="h-3 w-3" />
                          <span>{report.comments && Array.isArray(report.comments) ? report.comments.length : 0}</span>
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full ${
                        report.severity === 'high' ? 'bg-red-200 text-red-700' :
                        report.severity === 'medium' ? 'bg-yellow-200 text-yellow-700' :
                        'bg-green-200 text-green-700'
                      }`}>
                        {report.severity} priority
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50/30 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 border border-blue-200 rounded-full mb-4">
              <span className="text-sm font-medium text-blue-700">Platform Features</span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need for
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Smart Traffic Management
              </span>
            </h2>
            <p className="text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
              A comprehensive platform that connects citizens, authorities, and emergency services 
              through real-time communication and intelligent reporting systems
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colorMap = {
                blue: 'from-blue-500 to-blue-600',
                green: 'from-green-500 to-green-600',
                purple: 'from-purple-500 to-purple-600',
                orange: 'from-orange-500 to-orange-600'
              };
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative z-10">
                      {/* Icon Container */}
                      <div className="relative mb-4">
                        <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${colorMap[feature.color]} rounded-3xl shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110`}>
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        {/* Glow Effect */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${colorMap[feature.color]} rounded-3xl blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500`}></div>
                      </div>
                      
                      {/* Content */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-slate-800 transition-colors duration-300">
                          {feature.title}
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                          {feature.description}
                        </p>
                        
                        {/* CTA Link */}
                        <Link
                          to={feature.link}
                          className={`inline-flex items-center space-x-2 text-${feature.color}-600 hover:text-${feature.color}-700 font-semibold group-hover:translate-x-2 transition-all duration-300`}
                        >
                          <span>{feature.linkText}</span>
                          <ArrowRight className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                        </Link>
                      </div>
                    </div>
                    
                    {/* Hover Border Effect */}
                    <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-blue-200 transition-all duration-500"></div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-16"
          >
            <div className="inline-flex items-center space-x-3 px-8 py-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700">
                Ready to get started? Choose your path above
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-50/20"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center px-4 py-2 bg-green-100 border border-green-200 rounded-full mb-4">
              <span className="text-sm font-medium text-green-700">User Stories</span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Loved by Citizens & Authorities
            </h2>
            <p className="text-base text-slate-600 max-w-3xl mx-auto">
              See how our platform is making a real difference in traffic safety and community engagement
            </p>
          </motion.div>
          
          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="group relative h-full"
            >
              <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 h-full flex flex-col">
                {/* Quote Icon */}
                <div className="absolute top-4 right-4 text-blue-200 group-hover:text-blue-300 transition-colors duration-300">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                  </svg>
                </div>
                
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-base">R</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">Rajesh Kumar</h4>
                      <p className="text-xs text-slate-600">Citizen, Delhi</p>
                    </div>
                  </div>
                  
                  <p className="text-slate-700 leading-relaxed text-sm flex-1">
                    "This app has completely changed how I navigate through the city. Real-time updates about accidents and road conditions help me plan my route better. Great initiative!"
                  </p>
                  
                  <div className="flex items-center space-x-1 mt-auto">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Testimonial 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group relative h-full"
            >
              <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 h-full flex flex-col">
                {/* Quote Icon */}
                <div className="absolute top-4 right-4 text-green-200 group-hover:text-green-300 transition-colors duration-300">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                  </svg>
                </div>
                
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-base">P</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">Priya Sharma</h4>
                      <p className="text-xs text-slate-600">Traffic Police, Mumbai</p>
                    </div>
                  </div>
                  
                  <p className="text-slate-700 leading-relaxed text-sm flex-1">
                    "As a traffic officer, this platform has revolutionized our response time. We get instant notifications about incidents and can coordinate much more effectively."
                  </p>
                  
                  <div className="flex items-center space-x-1 mt-auto">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Testimonial 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="group relative h-full"
            >
              <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 h-full flex flex-col">
                {/* Quote Icon */}
                <div className="absolute top-4 right-4 text-purple-200 group-hover:text-purple-300 transition-colors duration-300">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                  </svg>
                </div>
                
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-base">A</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">Amit Patel</h4>
                      <p className="text-xs text-slate-600">Driver, Bangalore</p>
                    </div>
                  </div>
                  
                  <p className="text-slate-700 leading-relaxed text-sm flex-1">
                    "The community voting system is brilliant! It helps filter out fake reports and gives us confidence in the information. This app is a lifesaver!"
                  </p>
                  
                  <div className="flex items-center space-x-1 mt-auto">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Bottom Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex items-center space-x-8 px-8 py-6 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">4.9/5</div>
                <div className="text-sm text-slate-600">User Rating</div>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">98%</div>
                <div className="text-sm text-slate-600">Satisfaction</div>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">10K+</div>
                <div className="text-sm text-slate-600">Reports Resolved</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-48 -translate-x-48 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-4 h-4 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-40 right-32 w-3 h-3 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-32 left-32 w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-20 right-20 w-3 h-3 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></div>
              <span className="text-sm font-medium text-white/90">Join the Community</span>
            </motion.div>
            
            {/* Main Content */}
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Ready to Make Roads
                <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  Safer for Everyone?
                </span>
              </h2>
              <p className="text-lg md:text-xl text-blue-100 leading-relaxed max-w-3xl mx-auto">
                Be part of a community-driven initiative that's transforming traffic safety through 
                real-time reporting, intelligent monitoring, and collaborative problem-solving
              </p>
            </div>
            
            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="group relative px-10 py-5 bg-white text-blue-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-white/25 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105"
                  >
                    <span className="relative z-10">Get Started Today</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                  <Link
                    to="/map"
                    className="group px-10 py-5 bg-transparent text-white border-2 border-white/50 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 backdrop-blur-sm"
                  >
                    <span className="flex items-center space-x-2">
                      <Navigation className="h-6 w-6" />
                      <span>Explore Live Map</span>
                    </span>
                  </Link>
                </>
              ) : (
                <>
                  {user.role === 'citizen' && (
                    <Link
                      to="/report"
                      className="group relative px-10 py-5 bg-white text-blue-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-white/25 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105"
                    >
                      <span className="relative z-10">Start Reporting Now</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                  )}
                  <Link
                    to="/leaderboard"
                    className="group px-10 py-5 bg-transparent text-white border-2 border-white/50 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 backdrop-blur-sm"
                  >
                    <span className="flex items-center space-x-2">
                      <Trophy className="h-6 w-6" />
                      <span>View Leaderboard</span>
                    </span>
                  </Link>
                </>
              )}
            </motion.div>
            
            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex items-center justify-center space-x-8 text-sm text-white/80"
            >
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span>Government Approved</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-400" />
                <span>50K+ Active Users</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-400" />
                <span>24/7 Support</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

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
              className="bg-white rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4"
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
                  <div className={`p-3 rounded-lg ${
                    selectedReport.severity === 'high' ? 'bg-red-100 text-red-600' :
                    selectedReport.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 capitalize mb-2">
                      {selectedReport.title || selectedReport.type} Report
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{selectedReport.time}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {typeof selectedReport.location === 'string' 
                            ? selectedReport.location 
                            : selectedReport.location?.address || 'Location not specified'
                          }
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location Button */}
                <div className="flex justify-center">
                  <LocationButton 
                    location={selectedReport.location} 
                    variant="default" 
                    size="default"
                  />
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
                        🟡 Active
                      </span>
                    )}
                  </div>
                  {selectedReport.expiresAt && (
                    <div className="text-sm text-slate-500">
                      Expires: {getTimeUntilExpiry(selectedReport.expiresAt)}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">Description</h4>
                  <div className="text-slate-700 bg-slate-50 rounded-lg p-4">
                    {selectedReport.description ? 
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
                      {getAllPhotos(selectedReport).length > 1 ? 'Photos' : 'Photo'}
                    </h4>
                    {getAllPhotos(selectedReport).length > 1 && (
                      <button
                        onClick={() => handlePhotoGalleryOpen(selectedReport)}
                        className="text-sm text-blue-600 hover:text-blue-700 underline"
                      >
                        View All ({getAllPhotos(selectedReport).length})
                      </button>
                    )}
                  </div>
                  
                  {getMainImage(selectedReport) ? (
                    <div className="space-y-3">
                      {/* Main photo */}
                      <img 
                        src={getImageUrl(getMainImage(selectedReport))} 
                        alt="Report photo" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      
                      {/* Additional photos preview */}
                      {getAllPhotos(selectedReport).length > 1 && (
                        <div className="grid grid-cols-3 gap-2">
                          {getAllPhotos(selectedReport).slice(1, 4).map((photo, index) => (
                            <div key={index} className="relative">
                              <img 
                                src={getImageUrl(photo)} 
                                alt={`Additional photo ${index + 2}`} 
                                className="w-full h-20 object-cover rounded-lg"
                              />
                              {index === 2 && getAllPhotos(selectedReport).length > 4 && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">
                                    +{getAllPhotos(selectedReport).length - 4}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-slate-100 rounded-lg flex items-center justify-center">
                      <div className="text-center text-slate-400">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
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
                      <div className="text-lg font-bold text-red-600">{selectedReport.poll?.stillThere || 0}</div>
                      <div className="text-xs text-slate-600">Still There</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{selectedReport.poll?.resolved || 0}</div>
                      <div className="text-xs text-slate-600">Resolved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{selectedReport.poll?.fake || 0}</div>
                      <div className="text-xs text-slate-600">Fake Report</div>
                    </div>
                  </div>
                  {/* Voting Buttons - Show for Active reports or if not Resolved/Fake */}
                  {selectedReport.status !== 'Resolved' && selectedReport.status !== 'Fake Report' && !selectedReport.isExpired && (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          if (!user) {
                            toast.error('Please login to vote');
                            return;
                          }
                          handlePollVote(selectedReport.id, 'stillThere');
                        }}
                        disabled={votingReports.has(selectedReport.id) || !user}
                        className="px-3 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300"
                        title={!user ? 'Login to vote' : 'Still There'}
                      >
                        {votingReports.has(selectedReport.id) ? 'Voting...' : 'Still There'}
                      </button>
                      <button
                        onClick={() => {
                          if (!user) {
                            toast.error('Please login to vote');
                            return;
                          }
                          handlePollVote(selectedReport.id, 'resolved');
                        }}
                        disabled={votingReports.has(selectedReport.id) || !user}
                        className="px-3 py-2 text-sm bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-all duration-200 border border-green-200 hover:border-green-300"
                        title={!user ? 'Login to vote' : 'Resolved'}
                      >
                        {votingReports.has(selectedReport.id) ? 'Voting...' : 'Resolved'}
                      </button>
                      <button
                        onClick={() => {
                          if (!user) {
                            toast.error('Please login to vote');
                            return;
                          }
                          handlePollVote(selectedReport.id, 'fake');
                        }}
                        disabled={votingReports.has(selectedReport.id) || !user}
                        className="px-3 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300"
                        title={!user ? 'Login to vote' : 'Fake Report'}
                      >
                        {votingReports.has(selectedReport.id) ? 'Voting...' : 'Fake Report'}
                      </button>
                    </div>
                  )}
                  {/* Poll Statistics */}
                  <div className="text-center text-sm text-slate-600 mt-3 pt-3 border-t border-blue-200">
                    {(() => {
                      const totalVotes = (selectedReport.poll?.stillThere || 0) + (selectedReport.poll?.resolved || 0) + (selectedReport.poll?.fake || 0);
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

                {/* Comments Section */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-600">Comments</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">
                        {selectedReport.comments && Array.isArray(selectedReport.comments) ? selectedReport.comments.length : 0} total
                      </span>
                      {selectedReport.comments && Array.isArray(selectedReport.comments) && selectedReport.comments.length > 3 && (
                        <button
                          onClick={() => {
                            // Show all comments (could be expanded in future)
                            toast.success('Showing all comments');
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 underline"
                        >
                          View All
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Add Comment Form */}
                  {user && (
                    <div className="mb-4">
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (newComment.trim()) {
                          handleAddComment(selectedReport.id, newComment.trim());
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
                  
                  {/* Comments Loading State */}
                  {loadingComments && (
                    <div className="text-center py-6">
                      <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-blue-600 transition ease-in-out duration-150">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading comments...
                      </div>
                    </div>
                  )}
                  
                  {/* Comments Display */}
                  {!loadingComments && selectedReport.comments && Array.isArray(selectedReport.comments) && selectedReport.comments.length > 0 ? (
                    <div className="space-y-3">
                      {selectedReport.comments.slice(-3).map((comment, index) => (
                        <div key={comment._id || index} className="bg-white rounded-lg p-3 border border-slate-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-slate-900">
                              {comment.user?.name || 'Anonymous'}
                            </span>
                            <span className="text-xs text-slate-500">
                              {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Unknown date'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700">{comment.text}</p>
                        </div>
                      ))}
                      {selectedReport.comments.length > 3 && (
                        <p className="text-sm text-slate-500 text-center">
                          +{selectedReport.comments.length - 3} more comments
                        </p>
                      )}
                    </div>
                  ) : !loadingComments ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : null}
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
                    <h4 className="text-sm font-medium text-slate-600 mb-2">Type</h4>
                    <span className="text-sm text-slate-900 capitalize">
                      {selectedReport.type}
                    </span>
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



      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <div 
            className="relative max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeImageModal}
              className="absolute -top-12 right-0 text-white text-2xl hover:text-gray-300 transition-colors z-10"
            >
              ✕
            </button>
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{selectedImage.title}</h3>
              </div>
              <div className="p-4">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  className="w-full h-auto max-h-96 object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery Component */}
      <PhotoGallery
        photos={selectedReportPhotos}
        isOpen={showPhotoGallery}
        onClose={() => setShowPhotoGallery(false)}
      />

      <Footer />
    </div>
  );
}