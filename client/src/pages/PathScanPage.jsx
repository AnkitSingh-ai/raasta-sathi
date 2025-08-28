import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Navigation, 
  MapPin, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Route,
  Zap,
  Car,
  Shield,
  Construction,
  Eye,
  Star,
  RefreshCw,
  Bell,
  Map,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../utils/api';
import toast from 'react-hot-toast';
import PhotoGallery from '../components/PhotoGallery';
import { getAllPhotos, hasMultiplePhotos, getPhotoCount } from '../utils/photoUtils';

/**
 * @typedef {Object} PathReport
 * @property {string} id
 * @property {'accident' | 'police' | 'construction' | 'congestion' | 'clear'} type
 * @property {string} location
 * @property {string} description
 * @property {'low' | 'medium' | 'high'} severity
 * @property {string} timestamp
 * @property {string} distance
 */

export function PathScanPage() {
  const { user } = useAuth();
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [routePath, setRoutePath] = useState(null);
  const [routeDistance, setRouteDistance] = useState(0);
  const [routeDuration, setRouteDuration] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [selectedReportPhotos, setSelectedReportPhotos] = useState([]);

  // Load all reports on component mount
  useEffect(() => {
    loadAllReports();
    getUserLocation();
  }, []);

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

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location not available:', error);
        }
      );
    }
  };

  // Handle photo gallery opening
  const handlePhotoGalleryOpen = (report) => {
    const photos = getAllPhotos(report);
    setSelectedReportPhotos(photos);
    setShowPhotoGallery(true);
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
      // For demo purposes, we'll simulate Google Maps API response
      // In production, you'd use the actual Google Maps Directions API
      
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

  // Check if a report is along the route using more sophisticated logic
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

  const handleScanAgain = () => {
    setScanResults(null);
    setStartLocation('');
    setEndLocation('');
    toast('Ready for new scan', { icon: '🔄' });
  };

  const handleSetAlert = () => {
    if (!scanResults) {
      toast.error('Please scan a route first');
      return;
    }

    const newAlert = {
      id: Date.now(),
      route: `${startLocation} to ${endLocation}`,
      status: scanResults.status,
      timestamp: new Date().toISOString(),
      reports: scanResults.reports.length
    };

    setAlerts(prev => [...prev, newAlert]);
    toast.success('Route alert set successfully!');
  };

  const handleStartNavigation = () => {
    if (!scanResults) {
      toast.error('Please scan a route first');
      return;
    }

    // Open Google Maps with the route
    const googleMapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(scanResults.startLocation)}/${encodeURIComponent(scanResults.endLocation)}`;
    
    // Show route info
    const routeInfo = {
      start: scanResults.startLocation,
      end: scanResults.endLocation,
      status: scanResults.status,
      estimatedTime: scanResults.estimatedTime,
      incidents: scanResults.reports.length,
      distance: scanResults.routeDistance,
      baseTime: scanResults.routeDuration
    };

    toast.success(`Opening Google Maps: ${scanResults.startLocation} → ${scanResults.endLocation}`);
    console.log('Navigation data:', routeInfo);
    
    // Open Google Maps in new tab
    window.open(googleMapsUrl, '_blank');
  };

  const removeAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    toast.success('Alert removed');
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Route className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Path Scanner</h1>
          <p className="text-lg text-slate-600">Check your route for traffic conditions and incidents</p>
          
          {/* Refresh Button */}
          <div className="mt-4">
            <button
              onClick={loadAllReports}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh Reports'}</span>
            </button>
          </div>
        </motion.div>

        {/* Scan Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8"
        >
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Enter Your Route</h2>
          
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
              </div>
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
        </motion.div>

        {/* Scan Results */}
        {scanResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Overall Status */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Route Status</h2>
                <div className="flex items-center space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < scanResults.overallRating ? 'text-yellow-500 fill-current' : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${getStatusColor(scanResults.status)}`}>
                    {React.createElement(getStatusIcon(scanResults.status), { className: 'h-8 w-8' })}
                  </div>
                  <h3 className="font-semibold text-slate-900 capitalize mb-1">{scanResults.status}</h3>
                  <p className="text-sm text-slate-600">
                    {scanResults.status === 'clear' && 'Route is clear with minimal delays'}
                    {scanResults.status === 'caution' && 'Some delays expected on this route'}
                    {scanResults.status === 'blocked' && 'Significant delays or blockages detected'}
                  </p>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-3">
                    <Clock className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">Estimated Time</h3>
                  <p className="text-sm text-slate-600">{scanResults.estimatedTime}</p>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-3">
                    <Eye className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">Reports Found</h3>
                  <p className="text-sm text-slate-600">{scanResults.reports.length} incidents</p>
                </div>
              </div>
            </div>

            {/* Detailed Reports */}
            {scanResults.reports.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-6">Route Incidents</h3>
                <div className="space-y-4">
                  {scanResults.reports.map((report, index) => {
                    const Icon = getReportIcon(report.type);
                    return (
                      <div key={report.id} className="flex items-start space-x-4 p-4 border border-slate-200 rounded-lg">
                        {/* Enhanced Photo Preview */}
                        {getMainPhoto(report) && (
                          <div className="flex-shrink-0 relative">
                            <img 
                              src={getMainPhoto(report)} 
                              alt="Report" 
                              className="w-20 h-20 object-cover rounded-lg"
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
                                  View All Photos
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
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-slate-900 capitalize">{report.type}</h4>
                            <span className="text-xs text-slate-500">{report.timestamp}</span>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">{report.location}</p>
                          <p className="text-sm text-slate-700 mb-2">{report.description}</p>
                          <p className="text-xs text-slate-500">{report.distance}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Route Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900">Route Information</h3>
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Map className="h-4 w-4" />
                  <span>{showMap ? 'Hide' : 'Show'} Route Map</span>
                </button>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-3">
                    <Route className="h-8 w-8" />
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-1">Route Distance</h4>
                  <p className="text-sm text-slate-600">{scanResults.routeDistance} km</p>
                </div>
                
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-3">
                    <Clock className="h-8 w-8" />
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-1">Base Time</h4>
                  <p className="text-sm text-slate-600">{scanResults.routeDuration} mins</p>
                </div>
                
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-3">
                    <Eye className="h-8 w-8" />
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-1">Incidents Found</h4>
                  <p className="text-sm text-slate-600">{scanResults.reports.length}</p>
                </div>
              </div>

              {/* Route Map Visualization */}
              <AnimatePresence>
                {showMap && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-slate-900">Route Visualization</h4>
                      <button
                        onClick={() => window.open(`https://www.google.com/maps/dir/${encodeURIComponent(scanResults.startLocation)}/${encodeURIComponent(scanResults.endLocation)}`, '_blank')}
                        className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Open in Google Maps</span>
                      </button>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-slate-600">Start: {scanResults.startLocation}</span>
                      </div>
                      
                      {scanResults.routePath && scanResults.routePath.slice(1, -1).map((waypoint, index) => (
                        <div key={index} className="flex items-center space-x-4 mb-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-slate-600">Waypoint {index + 1}</span>
                        </div>
                      ))}
                      
                      <div className="flex items-center space-x-4">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-slate-600">End: {scanResults.endLocation}</span>
                      </div>
                      
                      {/* Incident Markers */}
                      {scanResults.reports.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <h5 className="font-medium text-slate-900 mb-2">Traffic Incidents on Route:</h5>
                          <div className="space-y-2">
                            {scanResults.reports.map((report, index) => (
                              <div key={index} className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  report.severity === 'high' ? 'bg-red-500' :
                                  report.severity === 'medium' ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}></div>
                                <span className="text-sm text-slate-600">
                                  {report.type} - {report.location} ({report.distance})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Alternative Routes */}
            {scanResults.alternatives && scanResults.alternatives.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-6">Alternative Routes</h3>
                <div className="space-y-3">
                  {scanResults.alternatives.map((alternative, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Route className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{alternative.name}</h4>
                            <p className="text-sm text-slate-600">{alternative.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-slate-500">
                            Time: <span className="font-medium">{alternative.totalTime} mins</span>
                            <span className={`ml-1 ${alternative.timeIncrease.startsWith('+') ? 'text-red-600' : 'text-green-600'}`}>
                              ({alternative.timeIncrease})
                            </span>
                          </span>
                          <span className="text-sm text-slate-500">
                            Distance: <span className="font-medium">{alternative.distance} km</span>
                          </span>
                          <span className="text-slate-500">
                            Reason: <span className="font-medium">{alternative.reason}</span>
                          </span>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors ml-4">
                        Select Route
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={handleStartNavigation}
                  className="flex items-center space-x-2 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Navigation className="h-5 w-5" />
                  <span>Start Navigation</span>
                </button>
                <button 
                  onClick={handleSetAlert}
                  className="flex items-center space-x-2 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Zap className="h-5 w-5" />
                  <span>Set Alert</span>
                </button>
                <button 
                  onClick={handleScanAgain}
                  className="flex items-center space-x-2 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Search className="h-5 w-5" />
                  <span>Scan Again</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-900">Route Alerts</h3>
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Bell className="h-4 w-4" />
                <span>{showAlerts ? 'Hide' : 'Show'} Alerts ({alerts.length})</span>
              </button>
            </div>
            
            <AnimatePresence>
              {showAlerts && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            alert.status === 'clear' ? 'bg-green-100 text-green-800' :
                            alert.status === 'caution' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {alert.status}
                          </span>
                          <span className="text-sm text-slate-600">{alert.route}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Set on {new Date(alert.timestamp).toLocaleString()} • {alert.reports} incidents detected
                        </div>
                      </div>
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6 mt-8"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">💡 Path Scanner Tips</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-600">Use specific landmarks for better accuracy</p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-600">Check multiple times during peak hours</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-600">Consider alternative routes for better time</p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-600">Report new incidents you encounter</p>
              </div>
            </div>
          </div>
        </motion.div>

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
    </div>
  );
}