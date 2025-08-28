import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navigation, MapPin, Globe2, User, Menu, X, LogOut, Bell, Settings, Search, Route, HelpCircle, Award, Trophy, BarChart3, Shield, RefreshCw, Eye, MessageCircle } from 'lucide-react';
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

  // Mock notifications based on user role
  const getNotifications = () => {
    if (!user) return [];

    if (user.role === 'citizen') {
      return [
        {
          id: 1,
          type: 'accident',
          message: 'Traffic accident reported 500m from your location',
          time: '2 mins ago',
          severity: 'high'
        },
        {
          id: 2,
          type: 'helper',
          message: 'Emergency service request accepted by provider',
          time: '15 mins ago',
          severity: 'medium'
        }
      ];
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
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 header-nav">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 focus:outline-none focus:ring-0">
            <div className="relative">
              <Navigation className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 absolute -bottom-1 -right-1" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Raasta Sathi
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 header-nav">
            {navItems.map((item) => {
              if (!canAccessRoute(item)) return null;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors hover:text-blue-600 flex items-center space-x-1 focus:outline-none focus:ring-0 ${
                    location.pathname === item.path
                      ? 'text-blue-600'
                      : 'text-slate-600'
                  }`}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Globe2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm font-medium">{language.toUpperCase()}</span>
            </button>

            {/* Notifications */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  {user.role === 'citizen' ? (
                    recentReports.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                        <span className="text-xs text-white font-bold">{recentReports.length}</span>
                      </span>
                    )
                  ) : (
                    userNotifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></span>
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
                            {user.role === 'citizen' ? 'Recent Reports Near You' : 'Notifications'}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {user.role === 'citizen' ? 
                              (userLocation ? 
                                'Traffic incidents within 5km radius' : 
                                'Enable location or enter manually to see nearby reports'
                              ) : 
                             user.role === 'service_provider' ? 'Service requests' : 'System notifications'
                            }
                          </p>
                        </div>
                        {user.role === 'citizen' && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-slate-400">
                              {userLocation ? '📍 Located' : '📍 Locating...'}
                            </span>
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
                        // Show recent reports for citizens
                        recentReports.length > 0 ? (
                          recentReports.map((report) => (
                            <div key={report._id} className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 cursor-pointer" onClick={() => handleOpenReportDetail(report)}>
                              <div className="flex items-start space-x-2 sm:space-x-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                  report.status === 'resolved' ? 'bg-green-500' :
                                  report.status === 'in_progress' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-slate-900">{report.title || report.type || 'Traffic Report'}</p>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      report.severity === 'high' ? 'bg-red-100 text-red-700' :
                                      report.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {report.severity || 'normal'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 mt-1">{report.type || 'Traffic Incident'}</p>
                                  <div className="flex items-center space-x-2 sm:space-x-3 mt-2 text-xs text-slate-500">
                                    <span className="flex items-center space-x-1">
                                      <MapPin className="h-3 w-3" />
                                      <span>{getDistanceText(report.distance)} away</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                      <Eye className="h-3 w-3" />
                                      <span>{report.views || 0}</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                      <MessageCircle className="h-3 w-3" />
                                      <span>{Array.isArray(report.comments) ? report.comments.length : 0}</span>
                                    </span>
                                  </div>
                                  {report.description && (
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{report.description}</p>
                                  )}
                                </div>
                                {getMainPhoto(report) && (
                                  <div className="ml-2 relative">
                                    <img 
                                      src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${getMainPhoto(report)}`}
                                      alt="Report photo"
                                      className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg"
                                    />
                                    {hasMultiplePhotos(report) && (
                                      <>
                                        <div className="absolute -top-1 -right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded-full font-medium">
                                          +{getPhotoCount(report) - 1} more
                                        </div>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handlePhotoGalleryOpen(report); }}
                                          className="absolute -bottom-1 -left-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded-lg hover:bg-blue-700 transition-colors"
                                          title="View All Photos"
                                        >
                                          👁️
                                        </button>
                                      </>
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
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-slate-700">{user.name}</span>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                    <div className="px-3 sm:px-4 py-3 border-b border-slate-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center overflow-hidden">
                          {user.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{getUserRoleDisplay()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                      
                      {user.role === 'citizen' && (
                        <Link
                          to="/my-reports"
                          className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <BarChart3 className="h-4 w-4" />
                          <span>My Reports</span>
                        </Link>
                      )}

                      {(user.role === 'police' || user.role === 'municipal') && (
                        <>
                          <div className="px-3 sm:px-4 py-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quick Access</p>
                          </div>
                          <Link
                            to="/dashboard"
                            className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Shield className="h-4 w-4" />
                            <span>Authority Dashboard</span>
                          </Link>
                          {user.role === 'municipal' && (
                            <Link
                              to="/analytics"
                              className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <BarChart3 className="h-4 w-4" />
                              <span>Analytics & Reports</span>
                            </Link>
                          )}
                          <Link
                            to="/notifications"
                            className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Bell className="h-4 w-4" />
                            <span>Notifications</span>
                          </Link>
                        </>
                      )}

                      <div className="border-t border-slate-200 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 sm:px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 sm:p-2 rounded-md text-slate-600 hover:text-slate-900"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 sm:py-4 border-t border-slate-200">
            <nav className="space-y-1 sm:space-y-2 header-nav">
              {navItems.map((item) => {
                if (!canAccessRoute(item)) return null;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors focus:outline-none focus:ring-0 ${
                      location.pathname === item.path
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.icon && <item.icon className="h-5 w-5" />}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              {!user && (
                <div className="pt-2 border-t border-slate-200">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </nav>
          </div>
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