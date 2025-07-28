import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle, 
  X, 
  Navigation,
  AlertTriangle,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * @typedef {Object} ServiceRequest
 * @property {string} id
 * @property {string} citizenName
 * @property {string} citizenPhone
 * @property {string} serviceType
 * @property {string} location
 * @property {string} description
 * @property {'low' | 'medium' | 'high'} urgency
 * @property {string} distance
 * @property {string} estimatedTime
 */

export function ServiceRequestNotification() {
  const { user } = useAuth();
  const [currentRequest, setCurrentRequest] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Mock service requests for demo
  const mockRequests = [
    {
      id: '1',
      citizenName: 'Rajesh Kumar',
      citizenPhone: '+91-98765-12345',
      serviceType: 'ambulance',
      location: 'Connaught Place, New Delhi',
      description: 'Medical emergency - chest pain',
      urgency: 'high',
      distance: '2.3 km',
      estimatedTime: '8 mins'
    },
    {
      id: '2',
      citizenName: 'Priya Sharma',
      citizenPhone: '+91-98765-12346',
      serviceType: 'mechanic',
      location: 'India Gate, New Delhi',
      description: 'Car breakdown - engine not starting',
      urgency: 'medium',
      distance: '4.1 km',
      estimatedTime: '12 mins'
    }
  ];

  // Simulate incoming requests for service providers
  useEffect(() => {
    if (user?.role !== 'service_provider') return;

    const showRandomRequest = () => {
      const randomRequest = mockRequests[Math.floor(Math.random() * mockRequests.length)];
      setCurrentRequest(randomRequest);
      setIsVisible(true);
    };

    // Show first request after 3 seconds
    const initialTimer = setTimeout(showRandomRequest, 3000);

    // Then show requests every 30-60 seconds
    const interval = setInterval(() => {
      if (!isVisible) {
        showRandomRequest();
      }
    }, Math.random() * 30000 + 30000); // 30-60 seconds

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [user, isVisible]);

  const handleAccept = () => {
    if (currentRequest) {
      toast.success(`Service request accepted! Citizen ${currentRequest.citizenName} has been notified.`);
      setIsVisible(false);
      setCurrentRequest(null);
    }
  };

  const handleReject = () => {
    if (currentRequest) {
      toast.error('Service request declined.');
      setIsVisible(false);
      setCurrentRequest(null);
    }
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      high: 'border-red-500 bg-red-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-green-500 bg-green-50'
    };
    return colors[urgency] || 'border-gray-500 bg-gray-50';
  };

  const getServiceIcon = (serviceType) => {
    const icons = {
      ambulance: '🚑',
      mechanic: '🔧',
      petrol: '⛽',
      puncture: '🛞',
      rental: '🚗',
      ev_charge: '🔋',
      towing: '🚛'
    };
    return icons[serviceType] || '🔧';
  };

  if (!user || user.role !== 'service_provider' || !isVisible || !currentRequest) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        className="fixed bottom-6 right-6 z-50 max-w-sm w-full"
      >
        <div className={`bg-white rounded-2xl shadow-2xl border-2 ${getUrgencyColor(currentRequest.urgency)} p-6`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{getServiceIcon(currentRequest.serviceType)}</div>
              <div>
                <h3 className="font-bold text-slate-900">New Service Request</h3>
                <p className="text-sm text-slate-600 capitalize">{currentRequest.serviceType} needed</p>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              currentRequest.urgency === 'high' ? 'bg-red-100 text-red-800' :
              currentRequest.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {currentRequest.urgency} priority
            </div>
          </div>

          {/* Citizen Info */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <User className="h-4 w-4 text-slate-500" />
              <span className="font-medium text-slate-900">{currentRequest.citizenName}</span>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <Phone className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">{currentRequest.citizenPhone}</span>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">{currentRequest.location}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Navigation className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">{currentRequest.distance} away • ETA: {currentRequest.estimatedTime}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-700">{currentRequest.description}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAccept}
              className="flex-1 flex items-center justify-center space-x-2 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Accept</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReject}
              className="flex items-center justify-center p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Auto-dismiss timer */}
          <div className="mt-3 text-center">
            <p className="text-xs text-slate-500">Auto-dismiss in 30 seconds</p>
          </div>
        </div>

        {/* Pulsing animation for high priority */}
        {currentRequest.urgency === 'high' && (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 bg-red-500 rounded-2xl opacity-20 pointer-events-none"
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}