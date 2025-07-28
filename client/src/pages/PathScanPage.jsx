import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

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

  const handleScan = async () => {
    if (!startLocation || !endLocation) {
      toast.error('Please enter both start and end locations');
      return;
    }

    setIsScanning(true);
    
    // Simulate scanning process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock scan results
    const mockResults = {
      status: Math.random() > 0.7 ? 'blocked' : Math.random() > 0.4 ? 'caution' : 'clear',
      overallRating: Math.floor(Math.random() * 5) + 1,
      estimatedTime: `${Math.floor(Math.random() * 30) + 15} mins`,
      reports: [
        {
          id: '1',
          type: 'construction',
          location: 'Ring Road Junction',
          description: 'Road repair work causing delays',
          severity: 'medium',
          timestamp: '10 mins ago',
          distance: '2.3 km from start'
        },
        {
          id: '2',
          type: 'police',
          location: 'Connaught Place',
          description: 'Routine traffic checking',
          severity: 'low',
          timestamp: '25 mins ago',
          distance: '5.1 km from start'
        }
      ],
      alternatives: [
        'Via Outer Ring Road (+8 mins)',
        'Via Metro Route (+12 mins)',
        'Via Inner Circle (-3 mins, heavy traffic)'
      ]
    };

    setScanResults(mockResults);
    setIsScanning(false);
    toast.success('Path scan completed!');
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

            {/* Alternative Routes */}
            {scanResults.alternatives && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-6">Alternative Routes</h3>
                <div className="space-y-3">
                  {scanResults.alternatives.map((alternative, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Route className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-slate-900">{alternative}</span>
                      </div>
                      <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                        Select
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
                <button className="flex items-center space-x-2 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                  <Navigation className="h-5 w-5" />
                  <span>Start Navigation</span>
                </button>
                <button className="flex items-center space-x-2 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                  <Zap className="h-5 w-5" />
                  <span>Set Alerts</span>
                </button>
                <button className="flex items-center space-x-2 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                  <Search className="h-5 w-5" />
                  <span>Scan Again</span>
                </button>
              </div>
            </div>
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
      </div>
    </div>
  );
}