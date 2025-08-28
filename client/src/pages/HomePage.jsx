import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  X
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
          isExpired: report.isExpired
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
  const handleReportClick = (report) => {
    setSelectedReport(report);
    setShowReportDetail(true);
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
        setSelectedReport(prev => ({
          ...prev,
          comments: [...(prev.comments || []), response.data?.comment || response]
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
    { number: '24/7', label: 'Live Monitoring', icon: Clock }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-green-500/5 to-orange-500/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left order-2 lg:order-1"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                {t('hero.title')}
                <span className="block bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mt-2">
                  रास्ता साथी
                </span>
              </h1>
              <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {t('hero.subtitle')}
              </p>
              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                {user ? (
                  user.role === 'citizen' ? (
                    <Link
                      to="/report"
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
                    >
                      {t('hero.cta')}
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
                    >
                      Go to Dashboard
                    </Link>
                  )
                ) : (
                  <Link
                    to="/login"
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
                  >
                    Get Started
                  </Link>
                )}
                <Link
                  to="/map"
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-slate-700 border-2 border-slate-200 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 text-sm sm:text-base"
                >
                  View Live Map
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative order-1 lg:order-2"
            >
              <div className="relative bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 border border-slate-200">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-green-500/5 rounded-2xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center space-x-2">
                      <Navigation className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      <span className="font-semibold text-slate-900 text-sm sm:text-base">Live Traffic Map</span>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-slate-500">Live</span>
                    </div>
                  </div>
                  <div className="bg-slate-100 rounded-lg h-32 sm:h-40 md:h-48 flex items-center justify-center mb-3 sm:mb-4">
                    <MapPin className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="flex items-center space-x-2 p-2 sm:p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                      <span className="text-xs sm:text-sm text-red-700">3 Accidents</span>
                    </div>
                    <div className="flex items-center space-x-2 p-2 sm:p-3 bg-yellow-50 rounded-lg">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                      <span className="text-xs sm:text-sm text-yellow-700">5 Checkpoints</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl mb-3 sm:mb-4">
                  <stat.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">{stat.number}</div>
                <div className="text-sm sm:text-base text-slate-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Reports Section - Public View */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">Recent Traffic Reports</h2>
            <p className="text-lg sm:text-xl text-slate-600">Live updates from our community</p>
            <button
              onClick={fetchRecentReports}
              disabled={loadingReports}
              className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 inline-flex items-center space-x-2 text-sm sm:text-base"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {recentReports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative bg-white rounded-xl p-2 sm:p-3 shadow-lg border border-slate-200 cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105"
                  onClick={() => handleReportClick(report)}
                >
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
                    <p className="text-slate-600 text-xs mb-3 line-clamp-2">
                      {report.description}
                    </p>
                  )}
                  
                  {/* Poll Display */}
                  <div className="mb-4">
                    <div className="text-xs font-medium text-slate-700 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Community Poll
                    </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200 shadow-sm">
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600">{report.poll.stillThere}</div>
                            <div className="text-xs text-slate-600">Still There</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{report.poll.resolved}</div>
                            <div className="text-xs text-slate-600">Resolved</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600">{report.poll.notSure}</div>
                            <div className="text-xs text-slate-600">Fake Report</div>
                          </div>
                        </div>
                      
                      {/* Voting Buttons */}
                      {user && report.status === 'Pending' && !report.isExpired && (
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePollVote(report.id, 'stillThere');
                            }}
                            disabled={votingReports.has(report.id)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300"
                          >
                            {votingReports.has(report.id) ? 'Voting...' : 'Still There'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePollVote(report.id, 'resolved');
                            }}
                            disabled={votingReports.has(report.id)}
                            className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-all duration-200 border border-green-200 hover:border-green-300"
                          >
                            {votingReports.has(report.id) ? 'Voting...' : 'Resolved'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePollVote(report.id, 'notSure');
                            }}
                            disabled={votingReports.has(report.id)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300"
                          >
                            {votingReports.has(report.id) ? 'Voting...' : 'Fake Report'}
                          </button>
                        </div>
                      )}
                      
                      {/* Poll Statistics */}
                      <div className="text-center text-xs text-slate-600 mt-2 pt-2 border-t border-blue-200">
                        {(() => {
                          const totalVotes = (report.poll?.stillThere || 0) + (report.poll?.resolved || 0) + (report.poll?.notSure || 0);
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
                  
                  <p className="text-slate-600 text-xs mb-2 line-clamp-1">
                    {typeof report.location === 'string' 
                      ? report.location 
                      : report.location?.address || 'Location not specified'
                    }
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="capitalize">{report.type}</span>
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

          <div className="text-center">
            <Link
              to="/map"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Eye className="h-5 w-5" />
              <span>View All Reports on Map</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Location-Based Reports Section */}
      {userLocation && (
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">Reports Near You</h2>
              <p className="text-lg sm:text-xl text-slate-600">Traffic incidents in your area</p>
              <button
                onClick={fetchLocationBasedReports}
                disabled={loadingReports}
                className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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
                    className="relative bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-2 sm:p-3 shadow-lg border border-green-200 cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105"
                    onClick={() => handleReportClick(report)}
                  >
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
                      <p className="text-slate-600 text-xs mb-3 line-clamp-2">
                        {report.description}
                      </p>
                    )}
                    
                    {/* Poll Display */}
                    <div className="mb-4">
                      <div className="text-xs font-medium text-slate-700 mb-3 flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Community Poll
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200 shadow-sm">
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600">{report.poll.stillThere}</div>
                            <div className="text-xs text-slate-600">Still There</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{report.poll.resolved}</div>
                            <div className="text-xs text-slate-600">Resolved</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600">{report.poll.notSure}</div>
                            <div className="text-xs text-slate-600">Fake Report</div>
                          </div>
                        </div>
                        
                        {/* Voting Buttons */}
                        {user && report.status === 'Pending' && !report.isExpired && (
                          <div className="grid grid-cols-3 gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePollVote(report.id, 'stillThere');
                              }}
                              disabled={votingReports.has(report.id)}
                              className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300"
                            >
                              {votingReports.has(report.id) ? 'Voting...' : 'Still There'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePollVote(report.id, 'resolved');
                              }}
                              disabled={votingReports.has(report.id)}
                              className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-all duration-200 border border-green-200 hover:border-green-300"
                            >
                              {votingReports.has(report.id) ? 'Voting...' : 'Resolved'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePollVote(report.id, 'notSure');
                              }}
                              disabled={votingReports.has(report.id)}
                              className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300"
                            >
                              {votingReports.has(report.id) ? 'Voting...' : 'Fake Report'}
                            </button>
                          </div>
                        )}
                        
                        {/* Poll Statistics */}
                        <div className="text-center text-xs text-slate-600 mt-2 pt-2 border-t border-blue-200">
                          {(() => {
                            const totalVotes = (report.poll?.stillThere || 0) + (report.poll?.resolved || 0) + (report.poll?.notSure || 0);
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
                      <span className="capitalize">{report.type}</span>
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
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
              Powerful Features for Smart Traffic Management
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
              Comprehensive solution connecting citizens, authorities, and emergency services
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 border border-slate-100 group"
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 rounded-xl mb-6`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed mb-4">{feature.description}</p>
                  <Link
                    to={feature.link}
                    className={`inline-flex items-center space-x-2 text-${feature.color}-600 hover:text-${feature.color}-700 font-medium group-hover:translate-x-1 transition-all`}
                  >
                    <span>{feature.linkText}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
              Join the Movement for Safer Roads
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-10 leading-relaxed">
              Be part of a community-driven initiative to make traffic safer and more efficient for everyone
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
                  >
                    Sign Up Now
                  </Link>
                  <Link
                    to="/map"
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-transparent text-white border-2 border-white rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200 text-sm sm:text-base"
                  >
                    Explore Map
                  </Link>
                </>
              ) : (
                <>
                  {user.role === 'citizen' && (
                    <Link
                      to="/report"
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
                    >
                      Start Reporting Now
                    </Link>
                  )}
                  <Link
                    to="/leaderboard"
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-transparent text-white border-2 border-white rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200 text-sm sm:text-base"
                  >
                    View Leaderboard
                  </Link>
                </>
              )}
            </div>
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
                        ⏳ Pending
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
                  <p className="text-slate-700 bg-slate-50 rounded-lg p-4">
                    {selectedReport.description || 'No description provided'}
                  </p>
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
                      <div className="text-lg font-bold text-red-600">{selectedReport.poll?.notSure || 0}</div>
                      <div className="text-xs text-slate-600">Fake Report</div>
                    </div>
                  </div>
                  {/* Voting Buttons */}
                  {user && selectedReport.status === 'Pending' && !selectedReport.isExpired && (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handlePollVote(selectedReport.id, 'stillThere')}
                        disabled={votingReports.has(selectedReport.id)}
                        className="px-3 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300"
                      >
                        {votingReports.has(selectedReport.id) ? 'Voting...' : 'Still There'}
                      </button>
                      <button
                        onClick={() => handlePollVote(selectedReport.id, 'resolved')}
                        disabled={votingReports.has(selectedReport.id)}
                        className="px-3 py-2 text-sm bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-all duration-200 border border-green-200 hover:border-green-300"
                      >
                        {votingReports.has(selectedReport.id) ? 'Voting...' : 'Resolved'}
                      </button>
                      <button
                        onClick={() => handlePollVote(selectedReport.id, 'notSure')}
                        disabled={votingReports.has(selectedReport.id)}
                        className="px-3 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300"
                      >
                        {votingReports.has(selectedReport.id) ? 'Voting...' : 'Fake Report'}
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

                {/* Comments Section */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-600">Comments</h4>
                    <span className="text-xs text-slate-500">
                      {selectedReport.comments ? selectedReport.comments.length : 0} total
                    </span>
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
                  
                  {selectedReport.comments && selectedReport.comments.length > 0 ? (
                    <div className="space-y-3">
                      {selectedReport.comments.slice(-3).map((comment, index) => (
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
                      {selectedReport.comments.length > 3 && (
                        <p className="text-sm text-slate-500 text-center">
                          +{selectedReport.comments.length - 3} more comments
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No comments yet. Be the first to comment!
                    </p>
                  )}
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