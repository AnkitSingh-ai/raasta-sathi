import React, { useState ,useEffect} from 'react';
import apiService from '../utils/api';
import { motion } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Filter, 
  AlertTriangle, 
  Shield, 
  Construction, 
  Car,
  Clock,
  Navigation,
  Eye,
  Heart,
  MessageCircle,
  Crosshair,
  Plus,
  Route
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

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

export function SearchPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('distance');
  const [userLocation, setUserLocation] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
          toast.success('Location updated! Showing nearest issues.');
          // Re-sort by distance
          setSortBy('distance');
        },
        (error) => {
          toast.error('Unable to get your location');
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'near-me':
        handleGetLocation();
        break;
      case 'report':
        if (user) {
          window.location.href = '/report';
        } else {
          toast.error('Please login to report issues');
        }
        break;
      case 'path-scan':
        if (user?.role === 'citizen') {
          window.location.href = '/path-scan';
        } else {
          toast.error('Path scan is available for citizens only');
        }
        break;
      default:
        toast.info(`${action} feature coming soon!`);
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
          return parseFloat(a.distance) - parseFloat(b.distance);
        case 'time':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'severity':
          const severityOrder = { high: 3, medium: 2, low: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        case 'popularity':
          return b.likes - a.likes;
        default:
          return 0;
      }
    });

  useEffect(() => {
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
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Search Traffic Issues</h1>
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
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Crosshair className="h-4 w-4" />
            </button>
          </div>

          {/* Location Status */}
          {userLocation && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">Location updated - showing nearest issues</span>
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
                          <span>{result.distance}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{result.timestamp}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-slate-600 mb-2">{result.location}</p>
                    <p className="text-slate-700 mb-4">{result.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 text-sm text-slate-500">
                          <Heart className="h-4 w-4" />
                          <span>{result.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-slate-500">
                          <MessageCircle className="h-4 w-4" />
                          <span>{result.comments}</span>
                        </div>
                        {result.verified && (
                          <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                            Verified
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm hover:bg-blue-200 transition-colors">
                          View Details
                        </button>
                        <button className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-sm hover:bg-green-200 transition-colors">
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

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-6 text-white mt-8"
        >
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => handleQuickAction('near-me')}
              className="flex items-center space-x-2 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <MapPin className="h-5 w-5" />
              <span>Search Near Me</span>
            </button>
            <button 
              onClick={() => handleQuickAction('report')}
              className="flex items-center space-x-2 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Report New Issue</span>
            </button>
            <button 
              onClick={() => handleQuickAction('path-scan')}
              className="flex items-center space-x-2 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <Route className="h-5 w-5" />
              <span>Path Scanner</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}