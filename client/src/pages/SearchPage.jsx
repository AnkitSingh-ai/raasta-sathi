import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Shield, 
  Construction, 
  Car, 
  Cloud, 
  Crown,
  Navigation,
  MessageCircle,
  Heart,
  X,
  Share2,
  Eye,
  CheckCircle,
  Star,
  Crosshair,
  RefreshCw,
  ExternalLink,
  Map
} from 'lucide-react';
import { getAllPhotos, hasMultiplePhotos, getPhotoCount, getMainPhoto } from '../utils/photoUtils';
import apiService from '../utils/api';
import toast from 'react-hot-toast';
import PhotoGallery from '../components/PhotoGallery';
import CommentSection from '../components/CommentSection';
import LocationButton from '../components/LocationButton';


/**
 * @typedef {Object} SearchResult
 * @property {string} id
 * @property {'accident' | 'police' | 'construction' | 'congestion'} type
 * @property {string} location
 * @property {string} description
 * @property {'low' | 'medium' | 'high'} severity
 * @property {string} timestamp
 * @property {string} distance
 * @property {number} likes
 * @property {number} comments
 * @property {boolean} verified
 */

// PathScannerContent Component
function PathScannerContent() {
  const { user } = useAuth();
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [selectedReportPhotos, setSelectedReportPhotos] = useState([]);
  const [routePath, setRoutePath] = useState(null);
  const [routeDistance, setRouteDistance] = useState(0);
  const [routeDuration, setRouteDuration] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Load all reports on component mount
  useEffect(() => {
    loadAllReports();
  }, []);

  // Handle photo gallery opening
  const handlePhotoGalleryOpen = (report) => {
    const photos = getAllPhotos(report);
    setSelectedReportPhotos(photos);
    setShowPhotoGallery(true);
  };

  // Get current user location
  const getCurrentLocation = () => {
    console.log('📍 getCurrentLocation called!'); // Debug log
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        
        // Reverse geocode to get address
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        console.error('Location error:', error);
        let errorMessage = 'Failed to get location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'Unknown location error occurred.';
        }
        
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Reverse geocode coordinates to address
  const reverseGeocode = async (latitude, longitude) => {
    try {
      // Using a free reverse geocoding service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          const address = data.display_name.split(',').slice(0, 3).join(',');
          setStartLocation(address);
          toast.success('Current location detected!', { icon: '📍' });
        } else {
          setStartLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          toast.success('Current coordinates detected!', { icon: '📍' });
        }
      } else {
        // Fallback to coordinates if geocoding fails
        setStartLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        toast.success('Current coordinates detected!', { icon: '📍' });
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      // Fallback to coordinates
      setStartLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      toast.success('Current coordinates detected!', { icon: '📍' });
    } finally {
      setLocationLoading(false);
    }
  };

  // Clear location error
  const clearLocationError = () => {
    setLocationError(null);
  };

  const loadAllReports = async () => {
    try {
      setLoading(true);
      const response = await apiService.getReports();
      setAllReports(response || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('Failed to load traffic reports');
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Get route from Google Maps Directions API
  const getGoogleMapsRoute = async (startLocation, endLocation) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock route data (replace with actual Google Maps API call)
      const mockRoute = {
        distance: Math.floor(Math.random() * 20) + 5, // 5-25 km
        duration: Math.floor(Math.random() * 45) + 15, // 15-60 mins
        path: [
          { lat: 28.6139, lng: 77.2090 }, // Start
          { lat: 28.6500, lng: 77.1800 }, // Waypoint 1
          { lat: 28.6800, lng: 77.1500 }, // Waypoint 2
          { lat: 28.7041, lng: 77.1025 }  // End
        ]
      };
      
      setRouteDistance(mockRoute.distance);
      setRouteDuration(mockRoute.duration);
      setRoutePath(mockRoute.path);
      
      return mockRoute;
    } catch (error) {
      console.error('Failed to get route:', error);
      toast.error('Failed to get route from Google Maps');
      return null;
    }
  };

  // Check if a report is along the route
  const isReportOnRoute = (report, routePath, tolerance = 1.5) => {
    if (!report.location?.coordinates || !routePath || routePath.length < 2) return false;
    
    const reportLat = report.location.coordinates[1];
    const reportLon = report.location.coordinates[0];
    
    // Check if report is near any segment of the route
    for (let i = 0; i < routePath.length - 1; i++) {
      const segmentStart = routePath[i];
      const segmentEnd = routePath[i + 1];
      
      // Calculate distance from report to this route segment
      const distanceToSegment = distanceToLineSegment(
        reportLat, reportLon,
        segmentStart.lat, segmentStart.lng,
        segmentEnd.lat, segmentEnd.lng
      );
      
      // If report is within tolerance distance of any segment, it's on the route
      if (distanceToSegment <= tolerance) {
        return true;
      }
    }
    
    return false;
  };

  // Calculate distance from point to line segment
  const distanceToLineSegment = (px, py, x1, y1, x2, y2) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy) * 111; // Convert to km (roughly)
  };

  const handleScan = async () => {
    if (!startLocation || !endLocation) {
      toast.error('Please enter both start and end locations');
      return;
    }

    setIsScanning(true);
    
    try {
      // Step 1: Get route from Google Maps
      toast('Getting route from Google Maps...', { icon: '🗺️' });
      const route = await getGoogleMapsRoute(startLocation, endLocation);
      
      if (!route) {
        toast.error('Failed to get route. Please try again.');
        setIsScanning(false);
        return;
      }

      // Step 2: Check for reports along the route
      toast('Analyzing traffic conditions...', { icon: '🔍' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter reports that are on the route
      const routeReports = allReports.filter(report => 
        isReportOnRoute(report, route.path)
      );
      
      // Step 3: Calculate route status based on real reports
      let status = 'clear';
      let overallRating = 5;
      let estimatedTime = route.duration;
      
      if (routeReports.length > 0) {
        const highSeverityCount = routeReports.filter(r => r.severity === 'high').length;
        const mediumSeverityCount = routeReports.filter(r => r.severity === 'medium').length;
        
        if (highSeverityCount > 0) {
          status = 'blocked';
          overallRating = Math.max(1, 5 - highSeverityCount);
          estimatedTime = route.duration + (highSeverityCount * 10);
        } else if (mediumSeverityCount > 0) {
          status = 'caution';
          overallRating = Math.max(2, 5 - mediumSeverityCount);
          estimatedTime = route.duration + (mediumSeverityCount * 5);
        }
      }

      // Step 4: Generate alternative routes based on real data
      const alternatives = generateAlternativeRoutes(route, routeReports);
      
      const results = {
        status,
        overallRating,
        estimatedTime: `${estimatedTime} mins`,
        routeDistance: route.distance,
        routeDuration: route.duration,
        reports: routeReports.map(report => ({
          id: report._id,
          type: report.type,
          location: report.location?.address || 'Unknown location',
          description: report.description,
          severity: report.severity,
          timestamp: report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A',
          distance: `${calculateDistance(
            route.path[0].lat, route.path[0].lng,
            report.location?.coordinates?.[1] || 0,
            report.location?.coordinates?.[0] || 0
          ).toFixed(1)} km from start`,
          photo: report.photo,
          originalReport: report
        })),
        alternatives,
        routePath: route.path,
        startLocation,
        endLocation
      };

      setScanResults(results);
      
      if (routeReports.length === 0) {
        toast.success(`Route is clean! No traffic incidents detected. Estimated time: ${estimatedTime} mins`);
      } else {
        toast.success(`Path scan completed! Found ${routeReports.length} incident(s) along your route.`);
      }
    } catch (error) {
      console.error('Scan failed:', error);
      toast.error('Path scan failed. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      clear: 'text-green-600 bg-green-100',
      caution: 'text-yellow-600 bg-yellow-100',
      blocked: 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (status) => {
    const icons = {
      clear: CheckCircle,
      caution: AlertTriangle,
      blocked: AlertTriangle
    };
    return icons[status] || AlertTriangle;
  };

  const generateAlternativeRoutes = (route, routeReports) => {
    const alternatives = [];
    const baseTime = route.duration;
    
    // Alternative 1: Via outer route (longer but potentially clearer)
    if (routeReports.length > 0) {
      alternatives.push({
        name: 'Via Outer Ring Road',
        description: 'Longer route but avoids city center traffic',
        timeIncrease: '+8 mins',
        totalTime: baseTime + 8,
        reason: 'Avoids detected incidents',
        distance: route.distance + 3
      });
    }
    
    // Alternative 2: Via metro route
    alternatives.push({
      name: 'Via Metro Route',
      description: 'Public transport option',
      timeIncrease: '+12 mins',
      totalTime: baseTime + 12,
      reason: 'No traffic incidents',
      distance: route.distance + 2
    });
    
    // Alternative 3: Via inner circle (shorter but potentially congested)
    if (routeReports.filter(r => r.severity === 'high').length === 0) {
      alternatives.push({
        name: 'Via Inner Circle',
        description: 'Shorter route through city center',
        timeIncrease: '-3 mins',
        totalTime: baseTime - 3,
        reason: 'Minimal incidents detected',
        distance: route.distance - 1
      });
    }
    
    // Alternative 4: Expressway route (if no high severity incidents)
    if (routeReports.filter(r => r.severity === 'high').length === 0) {
      alternatives.push({
        name: 'Via Expressway',
        description: 'High-speed route with toll',
        timeIncrease: '-5 mins',
        totalTime: baseTime - 5,
        reason: 'Clear route with minimal traffic',
        distance: route.distance + 1
      });
    }
    
    return alternatives;
  };

  const getReportIcon = (type) => {
    const icons = {
      accident: AlertTriangle,
      police: Shield,
      construction: Construction,
      congestion: Car,
      clear: CheckCircle
    };
    return icons[type] || AlertTriangle;
  };

  const handleStartNavigation = () => {
    if (!scanResults) {
      toast.error('Please scan a route first');
      return;
    }

    // Open Google Maps with the route
    const googleMapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(scanResults.startLocation)}/${encodeURIComponent(scanResults.endLocation)}`;
    
    toast.success(`Opening Google Maps: ${scanResults.startLocation} → ${scanResults.endLocation}`);
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={loadAllReports}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh Reports'}</span>
        </button>
      </div>



      {/* Scan Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">From</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
            <input
              type="text"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              placeholder="Enter starting location"
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {/* Current Location Button - Blue Circle */}
            <button
              onClick={getCurrentLocation}
              disabled={locationLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg z-10"
              title="Use current location"
              style={{ minWidth: '40px', minHeight: '40px' }}
            >
              {locationLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Crosshair className="h-5 w-5" />
              )}
            </button>
          </div>
          
          {/* Location Error Display */}
          {locationError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{locationError}</p>
                  <button
                    onClick={clearLocationError}
                    className="text-xs text-red-600 hover:text-red-800 underline mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
          

        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">To</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
            <input
              type="text"
              value={endLocation}
              onChange={(e) => setEndLocation(e.target.value)}
              placeholder="Enter destination"
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

                    {/* Location Actions Section */}


            <button
              onClick={handleScan}
              disabled={isScanning || !startLocation || !endLocation}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isScanning ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Scanning Route...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Scan Path</span>
                </div>
              )}
            </button>
      </div>

      {/* Scan Results */}
      {scanResults && (
        <div className="space-y-6">
          {/* Overall Status */}
          <div className="bg-slate-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Route Status</h3>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < scanResults.overallRating ? 'text-yellow-500 fill-current' : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Current Location Info */}
            {userLocation && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Crosshair className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Current Location:</span>
                  <span className="text-sm text-blue-700">
                    {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                  </span>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${getStatusColor(scanResults.status)}`}>
                  {React.createElement(getStatusIcon(scanResults.status), { className: 'h-6 w-6' })}
                </div>
                <h4 className="font-semibold text-slate-900 capitalize mb-1">{scanResults.status}</h4>
                <p className="text-xs text-slate-600">
                  {scanResults.status === 'clear' && 'Route is clear'}
                  {scanResults.status === 'caution' && 'Some delays expected'}
                  {scanResults.status === 'blocked' && 'Significant delays detected'}
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-2">
                  <Clock className="h-6 w-6" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">Est. Time</h4>
                <p className="text-xs text-slate-600">{scanResults.estimatedTime}</p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mb-2">
                  <Eye className="h-6 w-6" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">Incidents</h4>
                <p className="text-xs text-slate-600">{scanResults.reports.length} found</p>
              </div>
            </div>
          </div>

          {/* Route Reports */}
          {scanResults.reports.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Route Incidents</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {scanResults.reports.map((report) => {
                  const Icon = getReportIcon(report.type);
                  return (
                    <div key={report.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-slate-200">
                      {/* Enhanced Photo Preview */}
                      {getMainPhoto(report) && (
                        <div className="flex-shrink-0 relative">
                          <img 
                            src={getMainPhoto(report)} 
                            alt="Report" 
                            className="w-16 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          {hasMultiplePhotos(report) && (
                            <>
                              <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded-full font-medium">
                                +{getPhotoCount(report) - 1} more
                              </div>
                              <button
                                onClick={() => handlePhotoGalleryOpen(report)}
                                className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                                title="View All Photos"
                              >
                                View All
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      
                      <div className={`p-2 rounded-lg ${
                        report.severity === 'high' ? 'bg-red-100 text-red-600' :
                        report.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-medium text-slate-900 capitalize text-sm">{report.type}</h5>
                          <span className="text-xs text-slate-500">{report.distance}</span>
                        </div>
                        <p className="text-xs text-slate-600 mb-1">{report.location}</p>
                        
                        {/* Location Button - Floating style */}
                        <div className="flex justify-end">
                          <LocationButton 
                            location={report.location} 
                            variant="floating" 
                            size="small"
                          />
                        </div>
                        
                        <p className="text-xs text-slate-700">{report.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Route Information */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-900">Route Information</h4>
              <button
                onClick={() => setShowMap(!showMap)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              >
                <Map className="h-4 w-4" />
                <span>{showMap ? 'Hide' : 'Show'} Route Map</span>
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-2">
                  <Navigation className="h-6 w-6" />
                </div>
                <h5 className="font-medium text-slate-900 mb-1 text-sm">Route Distance</h5>
                <p className="text-xs text-slate-600">{scanResults.routeDistance} km</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-2">
                  <Clock className="h-6 w-6" />
                </div>
                <h5 className="font-medium text-slate-900 mb-1 text-sm">Base Time</h5>
                <p className="text-xs text-slate-600">{scanResults.routeDuration} mins</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mb-2">
                  <Eye className="h-6 w-6" />
                </div>
                <h5 className="font-medium text-slate-900 mb-1 text-sm">Incidents</h5>
                <p className="text-xs text-slate-600">{scanResults.reports.length}</p>
              </div>
            </div>

            {/* Distance from Current Location */}
            {userLocation && scanResults.routePath && scanResults.routePath.length > 0 && (
              <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Crosshair className="h-4 w-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Distance from your location:</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">
                    {calculateDistance(
                      userLocation.latitude,
                      userLocation.longitude,
                      scanResults.routePath[0].lat,
                      scanResults.routePath[0].lng
                    ).toFixed(1)} km
                  </span>
                </div>
              </div>
            )}

            {/* Route Map Visualization */}
            {showMap && (
              <div className="border border-slate-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-slate-900 text-sm">Route Visualization</h5>
                  <button
                    onClick={() => window.open(`https://www.google.com/maps/dir/${encodeURIComponent(scanResults.startLocation)}/${encodeURIComponent(scanResults.endLocation)}`, '_blank')}
                    className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Open in Google Maps</span>
                  </button>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-slate-600">Start: {scanResults.startLocation}</span>
                  </div>
                  
                  {scanResults.routePath && scanResults.routePath.slice(1, -1).map((waypoint, index) => (
                    <div key={index} className="flex items-center space-x-3 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-slate-600">Waypoint {index + 1}</span>
                    </div>
                  ))}
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-slate-600">End: {scanResults.endLocation}</span>
                  </div>
                  
                  {/* Incident Markers */}
                  {scanResults.reports.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <h6 className="font-medium text-slate-900 mb-2 text-xs">Traffic Incidents on Route:</h6>
                      <div className="space-y-1">
                        {scanResults.reports.map((report, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              report.severity === 'high' ? 'bg-red-500' :
                              report.severity === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}></div>
                            <span className="text-xs text-slate-600">
                              {report.type} - {report.location} ({report.distance})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Alternative Routes */}
          {scanResults.alternatives && scanResults.alternatives.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Alternative Routes</h4>
              <div className="space-y-3">
                {scanResults.alternatives.map((alternative, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Navigation className="h-3 w-3 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-slate-900 text-sm">{alternative.name}</h5>
                          <p className="text-xs text-slate-600">{alternative.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="text-slate-500">
                          Time: <span className="font-medium">{alternative.totalTime} mins</span>
                          <span className={`ml-1 ${alternative.timeIncrease.startsWith('+') ? 'text-red-600' : 'text-green-600'}`}>
                            ({alternative.timeIncrease})
                          </span>
                        </span>
                        <span className="text-slate-500">
                          Distance: <span className="font-medium">{alternative.distance} km</span>
                        </span>
                        <span className="text-slate-500">
                          Reason: <span className="font-medium">{alternative.reason}</span>
                        </span>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors ml-3">
                      Select Route
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Button */}
          <button 
            onClick={handleStartNavigation}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ExternalLink className="h-5 w-5" />
            <span>Open in Google Maps</span>
          </button>

          {/* Scan Again Button */}
          <button 
            onClick={() => {
              setScanResults(null);
              setStartLocation('');
              setEndLocation('');
              setShowMap(false);
              toast('Ready for new scan', { icon: '🔄' });
            }}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Search className="h-5 w-5" />
            <span>Scan New Route</span>
          </button>
        </div>
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
        photoSize="medium"
      />
    </div>
  );
}

export function SearchPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('distance');
  const [userLocation, setUserLocation] = useState('');
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedReportForComments, setSelectedReportForComments] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [votingReports, setVotingReports] = useState(new Set());
  const [showPathScan, setShowPathScan] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [selectedReportPhotos, setSelectedReportPhotos] = useState([]);
  const [showComments, setShowComments] = useState(false);

  /** @type [SearchResult[], Function] */
  // const [results, setResults] = useState([
  //   {
  //     id: '1',
  //     type: 'accident',
  //     location: 'Connaught Place, New Delhi',
  //     description: 'Minor collision between two vehicles, traffic moving slowly',
  //     severity: 'medium',
  //     timestamp: '5 mins ago',
  //     distance: '0.8 km',
  //     likes: 12,
  //     comments: 3,
  //     verified: true
  //   },
  //   {
  //     id: '2',
  //     type: 'construction',
  //     location: 'Ring Road Junction',
  //     description: 'Road repair work in progress, one lane closed',
  //     severity: 'high',
  //     timestamp: '1 hour ago',
  //     distance: '2.3 km',
  //     likes: 25,
  //     comments: 8,
  //     verified: true
  //   },
  //   {
  //     id: '3',
  //     type: 'police',
  //     location: 'India Gate Circle',
  //     description: 'Police checkpoint for document verification',
  //     severity: 'low',
  //     timestamp: '30 mins ago',
  //     distance: '1.5 km',
  //     likes: 8,
  //     comments: 2,
  //     verified: true
  //   }
  // ]);

  const filterOptions = [
    { value: 'all', label: 'All Issues', icon: Eye },
    { value: 'accident', label: 'Accidents', icon: AlertTriangle },
    { value: 'police', label: 'Police', icon: Shield },
    { value: 'construction', label: 'Construction', icon: Construction },
    { value: 'congestion', label: 'Traffic Jams', icon: Car }
  ];

  const sortOptions = [
    { value: 'distance', label: 'Nearest First' },
    { value: 'time', label: 'Most Recent' },
    { value: 'severity', label: 'High Severity' },
    { value: 'popularity', label: 'Most Liked' }
  ];

  const getIconForType = (type) => {
    const icons = {
      accident: AlertTriangle,
      police: Shield,
      construction: Construction,
      congestion: Car
    };
    return icons[type] || AlertTriangle;
  };

  const getColorForSeverity = (severity) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-red-600 bg-red-100'
    };
    return colors[severity] || 'text-gray-600 bg-gray-100';
  };

  // Handle photo gallery opening
  const handlePhotoGalleryOpen = (report) => {
    const photos = getAllPhotos(report);
    setSelectedReportPhotos(photos);
    setShowPhotoGallery(true);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserCoordinates(coords);
          setUserLocation(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
          toast.success('Location updated! Showing nearest issues.');
          // Re-sort by distance
          setSortBy('distance');
          setLocationLoading(false);
        },
        (error) => {
          toast.error('Unable to get your location');
          setLocationLoading(false);
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
    }
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
        setResults(prev => 
          prev.map(report => 
            (report._id === reportId || report.id === reportId)
              ? { ...report, poll: response.data.pollResults }
              : report
          )
        );
        
        // Update selected report if it's the same one
        if (selectedReport && (selectedReport._id === reportId || selectedReport.id === reportId)) {
          setSelectedReport(prev => ({ ...prev, poll: response.data.pollResults }));
        }
        
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

  const openReportDetail = (report) => {
    setSelectedReport(report);
    setShowReportDetail(true);
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
      setResults(prev => 
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

  const handleLike = async (reportId) => {
    if (!user) {
      toast.error('Please login to like reports');
      return;
    }

    try {
      // Store original state for potential rollback
      const originalResults = [...results];
      const originalFilteredResults = [...filteredResults];
      
      // Optimistically update UI for both results and filteredResults
      const updateReportLikes = (report) => {
        if (report._id === reportId) {
          const isCurrentlyLiked = report.likes?.some(like => like._id === user._id);
          const newLiked = !isCurrentlyLiked;
          
          console.log(`🔍 Like Debug - Report ${reportId}:`);
          console.log(`   Current likes count: ${report.likes?.length || 0}`);
          console.log(`   User already liked: ${isCurrentlyLiked}`);
          console.log(`   Action: ${newLiked ? 'ADD' : 'REMOVE'} like`);
          
          if (newLiked) {
            // Add like
            const updatedReport = {
              ...report,
              likes: [...(report.likes || []), { _id: user._id, likedAt: new Date(), id: user._id }]
            };
            console.log(`   New likes count: ${updatedReport.likes.length}`);
            return updatedReport;
          } else {
            // Remove like
            const updatedReport = {
              ...report,
              likes: (report.likes || []).filter(like => like._id !== user._id)
            };
            console.log(`   New likes count: ${updatedReport.likes.length}`);
            return updatedReport;
          }
        }
        return report;
      };

      setResults(prevResults => prevResults.map(updateReportLikes));
      setFilteredResults(prevResults => prevResults.map(updateReportLikes));

      // Call backend API
      const response = await apiService.likeReport(reportId);
      
      // Update with actual data from backend - use the response data directly
      const updateBackendLikes = (report) => {
        if (report._id === reportId) {
          // Use the backend response to update the likes array
          const backendLikesCount = response.data.likes;
          const isLiked = response.data.isLiked;
          
          console.log(`🔍 Backend Update Debug - Report ${reportId}:`);
          console.log(`   Backend response - likes: ${backendLikesCount}, isLiked: ${isLiked}`);
          console.log(`   Current frontend likes count: ${report.likes?.length || 0}`);
          
          // Create a new likes array based on backend response
          // If user liked, ensure their like is included
          let newLikes = [];
          
          if (isLiked) {
            // User liked - create array with their like + any existing likes from other users
            const existingOtherLikes = (report.likes || []).filter(like => like._id !== user._id);
            newLikes = [
              ...existingOtherLikes,
              { _id: user._id, likedAt: new Date(), id: user._id }
            ];
          } else {
            // User unliked - remove their like, keep others
            newLikes = (report.likes || []).filter(like => like._id !== user._id);
          }
          
          console.log(`   New likes count: ${newLikes.length}`);
          return {
            ...report,
            likes: newLikes
          };
        }
        return report;
      };

      setResults(prevResults => prevResults.map(updateBackendLikes));
      setFilteredResults(prevResults => prevResults.map(updateBackendLikes));

      toast.success('Thank you for your feedback!');
    } catch (error) {
      // Revert to original state on error
      setResults(originalResults);
      setFilteredResults(originalFilteredResults);
      
      toast.error('Failed to update like. Please try again.');
      console.error('Like error:', error);
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
      setResults(prev => 
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

  const handleShare = (platform, report) => {
    const reportText = `${report.type} - ${getLocationText(report.location)}\n${report.description}\n\nView on Raasta Sathi`;
    const encodedText = encodeURIComponent(reportText);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodedText}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodedText}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(reportText).then(() => {
          toast.success('Report details copied to clipboard!');
        }).catch(() => {
          toast.error('Failed to copy to clipboard');
        });
        return;
      default:
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

    const filteredResults = results
    .filter(result => {
      const matchesFilter = selectedFilter === 'all' || result.type === selectedFilter;
      const matchesSearch = searchQuery === '' || 
        result.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          if (!userCoordinates) return 0;
          const distA = a.location?.coordinates ? calculateDistance(
            userCoordinates.latitude, userCoordinates.longitude,
            a.location.coordinates[1], a.location.coordinates[0]
          ) : Infinity;
          const distB = b.location?.coordinates ? calculateDistance(
            userCoordinates.latitude, userCoordinates.longitude,
            b.location.coordinates[1], b.location.coordinates[0]
          ) : Infinity;
          return distA - distB;
        case 'time':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'severity':
          const severityOrder = { high: 3, medium: 2, low: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        case 'popularity':
          const likesA = Array.isArray(a.likes) ? a.likes.length : (a.likes || 0);
          const likesB = Array.isArray(b.likes) ? b.likes.length : (b.likes || 0);
          return likesB - likesA;
        default:
          return 0;
      }
    });

  useEffect(() => {
    // Auto-detect user location on page load
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserCoordinates(coords);
          setUserLocation(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
          setSortBy('distance'); // Default to distance sorting
          setLocationLoading(false);
        },
        (error) => {
          console.log('Location not available:', error);
          setLocationLoading(false);
        }
      );
    }

    // Load reports
    apiService.getReports()
      .then(data => {
        setResults(data);
        setLoading(false);
      })
      .catch(err => {
        setResults([]);
        setLoading(false);
      });
  }, []);

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
    results.forEach(report => {
      // Comment updates are now handled through local state and API calls
    });
  }, [results, selectedReport]);

  // Listen for comment updates on the selected report for comments
  useEffect(() => {
    // Comment updates are now handled through local state and API calls
  }, [selectedReportForComments]);

  const getLocationText = (loc) => {
    if (typeof loc === 'string') return loc;
    if (loc && typeof loc === 'object') return loc.address || loc.city || loc.country || 'Unknown location';
    return 'Unknown location';
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  // Get distance text for display
  const getDistanceText = (report) => {
    if (!userCoordinates || !report.location || !report.location.coordinates) {
      return 'N/A';
    }
    
    const distance = calculateDistance(
      userCoordinates.latitude,
      userCoordinates.longitude,
      report.location.coordinates[1], // MongoDB stores as [lng, lat]
      report.location.coordinates[0]
    );
    
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  };

  // ...rest of your component...


  return (
    <div className="min-h-screen bg-slate-50 pt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-slate-900">Search Traffic Issues</h1>
          <button
            onClick={() => setShowPathScan(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <MapPin className="h-5 w-5" />
            <span>Path Scan</span>
          </button>
        </div>
          <p className="text-lg text-slate-600">Find traffic reports and incidents near you</p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8"
        >
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by location or description..."
              className="w-full pl-12 pr-4 py-4 border border-slate-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleGetLocation}
              disabled={locationLoading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {locationLoading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Crosshair className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Location Status */}
          {userLocation && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Location detected - showing nearest issues by default
                </span>
              </div>
            </div>
          )}
          {!userLocation && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  Click the location button to see nearest issues
                </span>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            {filterOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedFilter(option.value)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedFilter === option.value
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-slate-500">
              {filteredResults.length} results found
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <div className="space-y-4">
          {filteredResults.map((result, index) => {
            const Icon = getIconForType(result.type);
            return (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${getColorForSeverity(result.severity)}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 capitalize">
                        {result.type.replace('_', ' ')}
                      </h3>
                      <div className="flex items-center space-x-3 text-sm text-slate-500">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{getDistanceText(result)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{result.createdAt ? new Date(result.createdAt).toLocaleString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    
                  <p className="text-slate-600 mb-2">{getLocationText(result.location)}</p>
                    <p className="text-slate-700 mb-4">{result.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(result._id || result.id);
                          }}
                          className={`flex items-center space-x-1 text-sm ${
                            result.likes?.some(like => like.user === user?._id) ? 'text-red-500' : 'text-slate-500'
                          } hover:text-red-500 transition-colors`}
                        >
                          <Heart className={`h-4 w-4 ${result.likes?.some(like => like._id === user?._id) ? 'fill-current' : ''}`} />
                          <span>{Array.isArray(result.likes) ? result.likes.length : (result.likes || 0)}</span>
                        </button>
                        <button
                          onClick={() => openComments(result)}
                          disabled={isAddingComment}
                          className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="View Comments"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>{Array.isArray(result.comments) ? result.comments.length : (result.comments || 0)}</span>
                        </button>
                        {result.status === 'resolved' && (
                          <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                            Resolved
                          </span>
                        )}
                        {result.status === 'pending' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-600 text-xs rounded-full">
                            Pending
                          </span>
                        )}
                        {result.status === 'in-progress' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                            In Progress
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => openReportDetail(result)}
                          className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => handleShare('copy', result)}
                          className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-sm hover:bg-green-200 transition-colors"
                          title="Share Report"
                        >
                          <Navigation className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredResults.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Search className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No results found</h3>
            <p className="text-slate-600">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
          </motion.div>
        )}



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
                className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 capitalize">
                      {selectedReport.type.replace('_', ' ')} Report
                    </h2>
                    <p className="text-slate-600 mt-1">
                      Reported on {selectedReport.createdAt ? new Date(selectedReport.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowReportDetail(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Report Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                                        {/* Photo */}
                    {getMainPhoto(selectedReport) && (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-slate-600">
                            {hasMultiplePhotos(selectedReport) ? 'Report Photos' : 'Report Photo'}
                          </h4>
                          {hasMultiplePhotos(selectedReport) && (
                            <button
                              onClick={() => handlePhotoGalleryOpen(selectedReport)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              View All Photos
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          {/* Main Photo */}
                          <div className="relative">
                            <img 
                              src={getMainPhoto(selectedReport)} 
                              alt="Report" 
                              className="w-full h-48 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            {hasMultiplePhotos(selectedReport) && (
                              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full font-medium">
                                +{getPhotoCount(selectedReport) - 1} more
                              </div>
                            )}
                          </div>
                          
                          {/* Additional Photos Grid - Show up to 3 more photos */}
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
                                      alt={`Photo ${index + 2}`} 
                                      className="w-full h-20 object-cover rounded-lg border border-slate-200"
                                    />
                                    {index === 2 && getPhotoCount(selectedReport) - 4 > 0 && (
                                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                        <span className="text-white text-xs font-medium">
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
                      </div>
                    )}

                    {/* Description */}
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-slate-600 mb-2">Description</h4>
                      <p className="text-slate-700">{selectedReport.description}</p>
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

                    {/* Location */}
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-slate-600 mb-2">Location</h4>
                      <p className="text-slate-700">{getLocationText(selectedReport.location)}</p>
                      {selectedReport.location?.coordinates && (
                        <p className="text-xs text-slate-500 mt-1">
                          Coordinates: {selectedReport.location.coordinates[1].toFixed(4)}, {selectedReport.location.coordinates[0].toFixed(4)}
                        </p>
                      )}
                      
                      {/* Location Button */}
                      <div className="mt-3 flex justify-center">
                        <LocationButton 
                          location={selectedReport.location} 
                          variant="default" 
                          size="default"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
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
                        <h4 className="text-sm font-medium text-slate-600 mb-2">Status</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedReport.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                          selectedReport.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedReport.status || 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Reporter Info */}
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-slate-600 mb-2">Reported By</h4>
                      <span className="text-sm text-slate-700">
                        {typeof selectedReport.reportedBy === 'object' && selectedReport.reportedBy?.name ? 
                          selectedReport.reportedBy.name : 'Anonymous'}
                      </span>
                    </div>

                    {/* Engagement Stats */}
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-slate-600 mb-3">Engagement</h4>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-slate-900">
                            {Array.isArray(selectedReport.likes) ? selectedReport.likes.length : (selectedReport.likes || 0)}
                          </div>
                          <div className="text-xs text-slate-600">Likes</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-slate-900">
                            {Array.isArray(selectedReport.comments) ? selectedReport.comments.length : (selectedReport.comments || 0)}
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
                            <div key={index} className="relative bg-white rounded-lg p-3 border border-slate-200">
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
                              +{Math.max(0, (selectedReport.comments?.length || 0) - 2)} more comments
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-4">
                          No comments yet. Be the first to comment!
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Share Section */}
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-slate-600 mb-3">Share This Report</h4>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleShare('whatsapp', selectedReport)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                      <span>WhatsApp</span>
                    </button>
                    
                    <button
                      onClick={() => handleShare('telegram', selectedReport)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                      <span>Telegram</span>
                    </button>
                    
                    <button
                      onClick={() => handleShare('twitter', selectedReport)}
                      className="flex items-center space-x-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.665 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                      <span>Twitter</span>
                    </button>
                    
                    <button
                      onClick={() => handleShare('facebook', selectedReport)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span>Facebook</span>
                    </button>
                    
                    <button
                      onClick={() => handleShare('copy', selectedReport)}
                      className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy Link</span>
                    </button>
                  </div>
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
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
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

          {/* PathScan Modal */}
          {showPathScan && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowPathScan(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Path Scanner</h2>
                  <button
                    onClick={() => setShowPathScan(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                {/* Path Scanner Content */}
                <PathScannerContent />
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