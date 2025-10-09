import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navigation, MapPin, Globe2, User, Menu, X, LogOut, Bell, Settings, Search, Route, HelpCircle, Award, Trophy, BarChart3, Shield, RefreshCw, Eye, MessageCircle, AlertTriangle, AlertCircle, Wrench, Clock, Info, CheckCircle, Lightbulb, Plus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../utils/api';
import toast from 'react-hot-toast';
import PhotoGallery from './PhotoGallery';
import { getAllPhotos, hasMultiplePhotos, getPhotoCount, getMainPhoto } from '../utils/photoUtils';
import { 
  getUserLocation, 
  getLocationWithFallback, 
  getLocationCoordinates, 
  DEFAULT_LOCATION,
  calculateDistance 
} from '../utils/geolocationUtils.js';

export function Header() {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentReports, setRecentReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [selectedReportPhotos, setSelectedReportPhotos] = useState([]);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Define navigation items based on user role
  const getNavItems = () => {
    const baseItems = [
      { path: '/', label: t('nav.home'), public: true },
      { path: '/map', label: t('nav.map'), public: true },
      { path: '/search', label: 'Search', public: true, icon: Search }
    ];

    if (!user) return baseItems;

    // Citizen-specific items
    if (user.role === 'citizen') {
      return [
        ...baseItems,
        { path: '/report', label: t('nav.report'), protected: true },
        { path: '/my-reports', label: 'My Reports', protected: true, icon: BarChart3 },
        { path: '/helper', label: 'Helper', protected: true, icon: HelpCircle }
      ];
    }

    // Service provider items
    if (user.role === 'service_provider') {
      return [
        ...baseItems,
        { path: '/service-provider', label: 'Service Requests', authority: true },
        { path: '/report', label: t('nav.report'), protected: true }
      ];
    }

    // Police users - only basic navigation + report
    if (user.role === 'police') {
      return [
        ...baseItems,
        { path: '/report', label: t('nav.report'), protected: true }
      ];
    }

    // Municipal authority users get full access
    if (user.role === 'municipal') {
      return [
        ...baseItems,
        { path: '/report', label: t('nav.report'), protected: true },
        { path: '/dashboard', label: t('nav.dashboard'), authority: true },
        { path: '/analytics', label: t('nav.analytics'), authority: true }
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  // Check if user can access a route
  const canAccessRoute = (item) => {
    if (item.public) return true;
    if (!user) return false;
    if (item.protected) return true;
    if (item.authority && ['municipal', 'service_provider'].includes(user.role)) return true;
    return false;
  };

  // Get user's current location with better error handling
  const getUserLocation = async () => {
    setLoadingReports(true);
    
    try {
      const location = await getLocationWithFallback();
      setUserLocation(location);
      loadRecentReports(location.lat, location.lng);
      console.log('📍 Location obtained successfully:', location);
    } catch (error) {
      console.error('Geolocation failed:', error);
      
      // Handle specific geolocation errors with user-friendly messages
      switch (error.type) {
        case 'permission_denied':
          toast.error('Location access denied. Please enable location permissions in your browser settings.');
          break;
        case 'position_unavailable':
          toast.error('Location information unavailable. This might be due to poor GPS signal or network issues.');
          break;
        case 'timeout':
          toast.error('Location request timed out. Please try again.');
          break;
        default:
          toast.error(error.message || 'Failed to get your location. Please try again.');
      }
      
      // Fallback to default location
      fallbackToDefaultLocation();
    } finally {
      setLoadingReports(false);
    }
  };

  // Fallback to default location when geolocation fails
  const fallbackToDefaultLocation = () => {
    console.log('🔄 Using fallback location:', DEFAULT_LOCATION.name);
    setUserLocation(DEFAULT_LOCATION);
    loadRecentReports(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
  };

  // Handle manual location input
  const handleManualLocationSubmit = async (e) => {
    e.preventDefault();
    if (!manualLocation.trim()) return;

    setLoadingReports(true);
    try {
      // Use a geocoding service or predefined coordinates for common locations
      const locationCoordinates = getLocationCoordinates(manualLocation);
      if (locationCoordinates) {
        setUserLocation(locationCoordinates);
        loadRecentReports(locationCoordinates.lat, locationCoordinates.lng);
        setShowLocationInput(false);
        setManualLocation('');
        toast.success(`Location set to ${manualLocation}`);
      } else {
        toast.error('Location not found. Please try a different location.');
      }
    } catch (error) {
      console.error('Error setting manual location:', error);
      toast.error('Failed to set location. Please try again.');
    } finally {
      setLoadingReports(false);
    }
  };

  // Get coordinates for common locations - now using the utility function
  const getLocationCoordinates = (location);

  // Load recent reports based on user location
  const loadRecentReports = async (lat, lng) => {
    if (!lat || !lng) return;
    
    try {
      const response = await apiService.getAllReports();
      console.log('API Response:', response);
      
      // Handle different response structures
      let reports = [];
      if (response.data && response.data.reports) {
        reports = response.data.reports;
      } else if (response.reports) {
        reports = response.reports;
      } else if (Array.isArray(response)) {
        reports = response;
      }
      
      if (reports && reports.length > 0) {
        console.log('Processing reports:', reports.length);
        
        // Calculate distance and filter nearby reports (within 5km)
        const nearby = reports
          .filter(report => {
            // Check if report has coordinates
            const hasCoords = report.coordinates && Array.isArray(report.coordinates) && report.coordinates.length === 2;
            if (!hasCoords) {
              console.log('Report missing coordinates:', report._id, report.coordinates);
            }
            return hasCoords;
          })
          .map(report => {
            const distance = calculateDistance(lat, lng, report.coordinates[1], report.coordinates[0]);
            return { ...report, distance };
          })
          .filter(report => report.distance <= 5) // Within 5km
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5); // Top 5 nearest
        
        console.log('Nearby reports found:', nearby.length);
        setRecentReports(nearby);
      } else {
        console.log('No reports found in response');
        setRecentReports([]);
      }
    } catch (error) {
      console.error('Failed to load recent reports:', error);
      setRecentReports([]);
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

  // Get distance text
  const getDistanceText = (distance) => {
    if (distance < 1) return `${(distance * 1000).toFixed(0)}m`;
    return `${distance.toFixed(1)}km`;
  };

  // Get color for severity
  const getColorForSeverity = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-600';
      case 'medium':
        return 'bg-yellow-100 text-yellow-600';
      case 'low':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  // Get icon for report type
  const getReportIcon = (type) => {
    const icons = {
      accident: '🚗',
      construction: '🚧',
      police: '👮',
      congestion: '🚦',
      default: '⚠️'
    };
    return icons[type] || icons.default;
  };

  // Handle photo gallery opening
  const handlePhotoGalleryOpen = (report) => {
    const photos = getAllPhotos(report);
    setSelectedReportPhotos(photos);
    setShowPhotoGallery(true);
  };

  // Handle opening report detail modal
  const handleOpenReportDetail = (report) => {
    setSelectedReport(report);
    setShowReportDetail(true);
    setShowNotifications(false); // Close notifications dropdown
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setShowNotifications(false);
  };



  // Load location and reports when user is authenticated
  useEffect(() => {
    if (user && user.role === 'citizen') {
      // Try to get location, but don't show error immediately
      // This helps with macOS CoreLocation issues
      setTimeout(() => {
        getUserLocation();
      }, 1000); // Wait 1 second before trying
    }
  }, [user]);

  // Auto-refresh reports every 2 minutes when user location is available
  useEffect(() => {
    if (!user || user.role !== 'citizen' || !userLocation) return;

    const interval = setInterval(() => {
      if (userLocation.lat && userLocation.lng) {
        loadRecentReports(userLocation.lat, userLocation.lng);
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [user, userLocation]);

  // Enhanced notifications based on user role and actual reports
  const getNotifications = () => {
    if (!user) return [];

    if (user.role === 'citizen') {
      // For citizens, we'll show actual reports in the notification dropdown
      // The getNotifications function is now only used for non-citizen users
      // Citizens will see actual reports from recentReports state
      return [];


    }

    if (user.role === 'service_provider') {
      return [
        {
          id: 1,
          type: 'request',
          message: 'New ambulance service request in your area',
          time: '1 min ago',
          severity: 'high'
        },
        {
          id: 2,
          type: 'completed',
          message: 'Service completed - payment received',
          time: '30 mins ago',
          severity: 'low'
        }
      ];
    }

    // Authority notifications (police, municipal)
    return [
      {
        id: 1,
        type: 'urgent',
        message: 'High priority accident report requires verification',
        time: '1 min ago',
        severity: 'high'
      },
      {
        id: 2,
        type: 'report',
        message: '15 new reports pending verification',
        time: '10 mins ago',
        severity: 'medium'
      }
    ];
  };

  const userNotifications = getNotifications();





  const getUserRoleDisplay = () => {
    if (!user) return '';
    switch (user.role) {
      case 'citizen': return 'Citizen Reporter';
      case 'police': return 'Traffic Police';
      case 'municipal': return 'Municipal Authority';
      case 'service_provider': return 'Service Provider';
      default: return 'User';
    }
  };

  return (
    <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 header-nav shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18">
          {/* Enhanced Logo */}
          <Link to="/" className="flex items-center space-x-3 focus:outline-none focus:ring-0 group">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
                <Navigation className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <MapPin className="h-2 w-2 sm:h-3 sm:w-3 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Raasta Sathi
              </span>
              <span className="text-xs text-slate-500 font-medium -mt-1">Smart Traffic Solutions</span>
            </div>
          </Link>

          {/* Enhanced Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-0.5 lg:space-x-1 header-nav">
            {navItems.map((item) => {
              if (!canAccessRoute(item)) return null;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-0 ${
                    location.pathname === item.path
                      ? 'text-blue-600 font-bold'
                      : 'text-slate-700 hover:text-blue-600'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {item.icon && (
                      <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                        location.pathname === item.path 
                          ? 'bg-blue-100' 
                          : 'bg-slate-100 group-hover:bg-blue-100'
                      }`}>
                        <item.icon className={`h-4 w-4 ${
                          location.pathname === item.path ? 'text-blue-600' : 'text-slate-600 group-hover:text-blue-600'
                        }`} />
                      </div>
                    )}
                    <span className="font-semibold">{item.label}</span>
                  </div>
                  {location.pathname === item.path && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Enhanced Right side controls */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Enhanced Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="group flex items-center space-x-2 px-3 py-2 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md border border-slate-200/60"
            >
              <div className="p-1.5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300">
                <Globe2 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-700">{language.toUpperCase()}</span>
            </button>

            {/* Enhanced Notifications */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="group relative p-2.5 sm:p-3 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md border border-slate-200/60"
                >
                  <div className="p-1.5 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg group-hover:from-red-200 group-hover:to-pink-200 transition-all duration-300">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  {user.role === 'citizen' ? (
                    recentReports.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse flex items-center justify-center shadow-lg">
                        <span className="text-xs text-white font-bold">{recentReports.length}</span>
                      </span>
                    )
                  ) : (
                    userNotifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse shadow-lg"></span>
                    )
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                    <div className="px-3 sm:px-4 py-3 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                            {user.role === 'citizen' ? 'Reports Near You' : 'Notifications'}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {user.role === 'citizen' ? 
                              (userLocation ? 
                                'Traffic incidents in your area with real-time distance tracking' : 
                                'Enable location to see nearby reports'
                              ) : 
                             user.role === 'service_provider' ? 'Service requests' : 'System notifications'
                            }
                          </p>
                        </div>
                        {user.role === 'citizen' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={getUserLocation}
                              disabled={loadingReports}
                              className="p-1.5 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50 rounded-md hover:bg-slate-100"
                              title="Refresh location and reports"
                            >
                              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loadingReports ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              onClick={() => setShowLocationInput(!showLocationInput)}
                              className="p-1.5 text-slate-500 hover:text-slate-700 transition-colors rounded-md hover:bg-slate-100"
                              title="Enter location manually"
                            >
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Manual Location Input */}
                    {user.role === 'citizen' && showLocationInput && (
                      <div className="px-3 sm:px-4 py-3 border-b border-slate-200">
                        <form onSubmit={handleManualLocationSubmit} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={manualLocation}
                              onChange={(e) => setManualLocation(e.target.value)}
                              placeholder="Enter city name (e.g., Delhi, Noida)"
                              className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              type="submit"
                              disabled={loadingReports || !manualLocation.trim()}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Set
                            </button>
                          </div>
                          <p className="text-xs text-slate-500">
                            Supported cities: Delhi, Noida, Gurgaon, Mumbai, Bangalore, etc.
                          </p>
                        </form>
                      </div>
                    )}
                    
                    <div className="max-h-64 overflow-y-auto">
                      {user.role === 'citizen' ? (
                        // Show actual reports for citizens with concise 2-line description
                        recentReports.length > 0 ? (
                          recentReports.map((report, index) => (
                            <div key={report._id || report.id} className="px-4 py-3 hover:bg-slate-50/80 border-b border-slate-100/60 last:border-b-0 transition-all duration-200 cursor-pointer group"
                                 onClick={() => {
                                   setShowNotifications(false);
                                   // Open report detail modal or navigate
                                   handleOpenReportDetail(report);
                                 }}>
                              <div className="flex items-start space-x-3">
                                {/* Status Indicator */}
                                <div className={`w-2 h-2 rounded-full mt-2.5 ${
                                  report.status === 'resolved' ? 'bg-green-500' :
                                  report.status === 'in_progress' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></div>
                                
                                {/* Report Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-slate-900 capitalize truncate">
                                      {report.type ? report.type.replace('_', ' ') : 'Traffic Report'}
                                    </h4>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                      report.severity === 'high' ? 'bg-red-100 text-red-700' :
                                      report.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {report.severity || 'normal'}
                                    </span>
                                  </div>
                                  
                                  {/* Concise 2-line Description */}
                                  {report.description && (
                                    <p className="text-xs text-slate-600 mb-2 line-clamp-2 leading-relaxed">
                                      {report.description}
                                    </p>
                                  )}
                                  
                                  {/* Location and Distance */}
                                  <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span className="flex items-center space-x-1">
                                      <MapPin className="h-3 w-3" />
                                      <span className="truncate max-w-32">
                                        {report.location ? (typeof report.location === 'string' ? report.location : report.location.address) : 'Location N/A'}
                                      </span>
                                    </span>
                                    {report.distance && (
                                      <span className="text-green-600 font-medium">
                                        {typeof report.distance === 'number' ? `${report.distance.toFixed(1)} km` : report.distance}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Report Photo Preview */}
                                {getMainPhoto(report) && (
                                  <div className="ml-2 relative">
                                    <img 
                                      src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${getMainPhoto(report)}`}
                                      alt="Report photo"
                                      className="w-12 h-12 object-cover rounded-lg border border-slate-200 group-hover:scale-105 transition-transform duration-200"
                                    />
                                    {hasMultiplePhotos(report) && (
                                      <div className="absolute -top-1 -right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded-full font-medium">
                                        +{getPhotoCount(report) - 1}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-3 sm:px-4 py-4 sm:py-6 text-center text-slate-500">
                            {loadingReports ? (
                              <div className="flex items-center justify-center space-x-2">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Loading reports...</span>
                              </div>
                            ) : (
                              <div>
                                <MapPin className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-slate-300" />
                                <p className="text-sm">No reports nearby</p>
                                <p className="text-xs">
                                  {userLocation ? 
                                    'Great! No traffic incidents in your area' : 
                                    'Unable to get your location. Try manual location or refresh.'
                                  }
                                </p>
                                {!userLocation && (
                                  <button
                                    onClick={getUserLocation}
                                    className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                  >
                                    Try Again
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      ) : (
                        // Show notifications for other user types
                        userNotifications.map((notification) => (
                          <div key={notification.id} className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0">
                            <div className="flex items-start space-x-2 sm:space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                notification.severity === 'high' ? 'bg-red-500' :
                                notification.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                              }`}></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">{notification.message}</p>
                                <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      
                      {/* View All Reports Button for Citizens */}
                      {user.role === 'citizen' && (
                        <div className="px-3 sm:px-4 py-3 border-t border-slate-200">
                          <Link
                            to="/search"
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105"
                            onClick={() => setShowNotifications(false)}
                          >
                            <Search className="h-4 w-4" />
                            <span>View All Reports Near You</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="group flex items-center space-x-3 p-2.5 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
                >
                  <div className="relative">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/25 group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all duration-300">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      )}
                    </div>
                    {/* Online status indicator */}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-lg"></div>
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{user.name}</span>
                    <div className="text-xs text-slate-500 capitalize">{user.role}</div>
                  </div>
                </button>

                {/* Enhanced User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-900/20 border border-slate-200/60 py-3 z-50 animate-in slide-in-from-top-2 duration-300">
                    <div className="px-4 py-4 border-b border-slate-200/60">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt="Profile" 
                                className="w-full h-full object-cover rounded-2xl"
                              />
                            ) : (
                              <User className="h-6 w-6 text-white" />
                            )}
                          </div>
                          {/* Online status indicator */}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-lg"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-bold text-slate-900">{user.name}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-slate-500 capitalize bg-slate-100 px-2 py-1 rounded-lg font-medium">{user.role}</span>
                            <span className="text-xs text-green-600 font-medium">● Online</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="group flex items-center space-x-3 px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all duration-200 hover:scale-105 mx-2"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-200">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium">Profile</span>
                      </Link>
                      
                      {user.role === 'citizen' && (
                        <Link
                          to="/my-reports"
                          className="group flex items-center space-x-3 px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all duration-200 hover:scale-105 mx-2"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl group-hover:from-green-200 group-hover:to-emerald-200 transition-all duration-200">
                            <BarChart3 className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="font-medium">My Reports</span>
                        </Link>
                      )}

                      {(user.role === 'police' || user.role === 'municipal') && (
                        <>
                          <div className="px-4 py-2 mx-2">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide bg-slate-100 px-3 py-1 rounded-lg">Quick Access</p>
                          </div>
                          <Link
                            to="/dashboard"
                            className="group flex items-center space-x-3 px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all duration-200 hover:scale-105 mx-2"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl group-hover:from-purple-200 group-hover:to-indigo-200 transition-all duration-200">
                              <Shield className="h-4 w-4 text-purple-600" />
                            </div>
                            <span className="font-medium">Authority Dashboard</span>
                          </Link>
                          {user.role === 'municipal' && (
                            <Link
                              to="/analytics"
                              className="group flex items-center space-x-3 px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all duration-200 hover:scale-105 mx-2"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <div className="p-2 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl group-hover:from-indigo-200 group-hover:to-blue-200 transition-all duration-200">
                                <BarChart3 className="h-4 w-4 text-indigo-600" />
                              </div>
                              <span className="font-medium">Analytics & Reports</span>
                            </Link>
                          )}
                          <Link
                            to="/notifications"
                            className="group flex items-center space-x-3 px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all duration-200 hover:scale-105 mx-2"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <div className="p-2 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl group-hover:from-yellow-200 group-hover:to-orange-200 transition-all duration-200">
                              <Bell className="h-4 w-4 text-yellow-600" />
                            </div>
                            <span className="font-medium">Notifications</span>
                          </Link>
                        </>
                      )}

                      <div className="border-t border-slate-200/60 my-3 mx-2"></div>
                      <button
                        onClick={handleLogout}
                        className="group w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-xl transition-all duration-200 hover:scale-105 mx-2 flex items-center space-x-3"
                      >
                        <div className="p-2 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl group-hover:from-red-200 group-hover:to-pink-200 transition-all duration-200">
                          <LogOut className="h-4 w-4 text-red-600" />
                        </div>
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="group inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-white/20 rounded-lg">
                    <User className="h-4 w-4" />
                  </div>
                  <span>Sign In</span>
                </div>
              </Link>
            )}

            {/* Enhanced Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden group p-2.5 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300 group-hover:scale-110" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300 group-hover:scale-110" />
              )}
            </button>
          </div>
        </div>

        {/* Enhanced Mobile Navigation */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden py-4 border-t border-slate-200/60 bg-gradient-to-b from-white/95 to-blue-50/30"
          >
            <nav className="space-y-1 px-4">
              {navItems.map((item, index) => {
                if (!canAccessRoute(item)) return null;
                
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`group flex items-center space-x-3 px-3 py-2 rounded-xl text-base font-medium transition-all duration-300 focus:outline-none focus:ring-0 ${
                        location.pathname === item.path
                          ? 'text-blue-600 font-bold bg-blue-50'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.icon && (
                        <div className={`p-2 rounded-lg transition-all duration-300 ${
                          location.pathname === item.path 
                            ? 'bg-blue-100' 
                            : 'bg-slate-100 group-hover:bg-blue-100'
                        }`}>
                          <item.icon className={`h-5 w-5 ${
                            location.pathname === item.path ? 'text-blue-600' : 'text-slate-600 group-hover:text-blue-600'
                          }`} />
                        </div>
                      )}
                      <span className="font-semibold">{item.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
              {!user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="pt-3 border-t border-slate-200/60"
                >
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="p-1 bg-white/20 rounded-lg">
                        <User className="h-4 w-4" />
                      </div>
                      <span>Sign In</span>
                    </div>
                  </Link>
                </motion.div>
              )}
            </nav>
          </motion.div>
        )}


      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        ></div>
      )}

      {/* Photo Gallery Modal */}
      <PhotoGallery
        photos={selectedReportPhotos}
        isOpen={showPhotoGallery}
        onClose={() => setShowPhotoGallery(false)}
        title="Report Photos"
        showPhotoCount={true}
        showNavigation={true}
        showFullscreen={true}
        maxPhotosPerRow={3}
        photoSize="small"
      />

      {/* Report Detail Modal */}
      {showReportDetail && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Report Details</h2>
                <button
                  onClick={() => setShowReportDetail(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Report Header */}
              <div className="flex items-start space-x-4 mb-6">
                <div className={`p-3 rounded-lg ${getColorForSeverity(selectedReport.severity)}`}>
                  <span className="text-2xl">{getReportIcon(selectedReport.type)}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 capitalize mb-2">
                    {selectedReport.title || selectedReport.type || 'Traffic Report'}
                  </h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedReport.severity === 'high' ? 'bg-red-100 text-red-700' :
                      selectedReport.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {selectedReport.severity || 'normal'}
                    </span>
                    <span className="text-sm text-slate-500">
                      {selectedReport.distance ? `${getDistanceText(selectedReport.distance)} away` : 'Location not specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="mb-6">
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <span>Location</span>
                </h4>
                <p className="text-slate-700">{selectedReport.location || 'Location not specified'}</p>
                {selectedReport.coordinates && (
                  <div className="mt-2">
                    <LocationButton 
                      location={selectedReport.location} 
                      variant="default" 
                      size="small"
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedReport.description && (
                <div className="mb-6">
                  <h4 className="font-semibold text-slate-900 mb-2">Description</h4>
                  <p className="text-slate-700 leading-relaxed">{selectedReport.description}</p>
                </div>
              )}

              {/* Photos */}
              {getMainPhoto(selectedReport) && (
                <div className="mb-6">
                  <h4 className="font-semibold text-slate-900 mb-3">Photos</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {getAllPhotos(selectedReport).slice(0, 4).map((photo, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={photo.startsWith('http') ? photo : `${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${photo}`}
                          alt={`Report photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        {index === 3 && hasMultiplePhotos(selectedReport) && (
                          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                            <span className="text-white font-semibold">+{getPhotoCount(selectedReport) - 4} more</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {hasMultiplePhotos(selectedReport) && (
                    <button
                      onClick={() => {
                        setShowPhotoGallery(true);
                        setShowReportDetail(false);
                      }}
                      className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View All Photos
                    </button>
                  )}
                </div>
              )}

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Status:</span>
                  <span className="ml-2 font-medium text-slate-700 capitalize">
                    {selectedReport.status || 'pending'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Reported:</span>
                  <span className="ml-2 font-medium text-slate-700">
                    {selectedReport.reportedAt ? new Date(selectedReport.reportedAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                {selectedReport.poll && (
                  <>
                    <div>
                      <span className="text-slate-500">Still There:</span>
                      <span className="ml-2 font-medium text-red-600">{selectedReport.poll.stillThere || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Resolved:</span>
                      <span className="ml-2 font-medium text-green-600">{selectedReport.poll.resolved || 0}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowReportDetail(false);
                    window.location.href = `/map?report=${selectedReport._id}`;
                  }}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View on Map
                </button>
                <button
                  onClick={() => setShowReportDetail(false)}
                  className="flex-1 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}