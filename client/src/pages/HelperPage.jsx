import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ambulance, 
  Car, 
  Wrench, 
  Fuel, 
  Zap, 
  Truck,
  Phone,
  MapPin,
  Clock,
  Star,
  Send,
  Share,
  Navigation,
  User,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  Camera,
  Upload,
  X,
  Plus,
  Minus,
  CreditCard,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * @typedef {Object} ServiceProvider
 * @property {string} id
 * @property {string} name
 * @property {string} serviceType
 * @property {number} rating
 * @property {string} distance
 * @property {string} estimatedTime
 * @property {string} contactNumber
 * @property {boolean} available
 * @property {string=} price
 * @property {number} completedServices
 * @property {string} responseTime
 * @property {string[]} specializations
 */

/**
 * @typedef {Object} ServiceRequest
 * @property {string} id
 * @property {string} citizenName
 * @property {string} citizenPhone
 * @property {string} serviceType
 * @property {string} location
 * @property {string} description
 * @property {'low'|'medium'|'high'} urgency
 * @property {string} contactNumber
 * @property {string=} alternateContact
 * @property {string} preferredTime
 * @property {string=} budget
 * @property {string} additionalNotes
 * @property {File[]} photos
 * @property {boolean} shareLocation
 * @property {{ lat: number, lng: number }=} coordinates
 */

export function HelperPage() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string>('');
  const [showProviders, setShowProviders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  
  const [formData, setFormData] = useState<Partial<ServiceRequest>>({
    citizenName: user?.name || '',
    citizenPhone: user?.contactNumber || '',
    serviceType: '',
    location: '',
    description: '',
    urgency: 'medium',
    contactNumber: user?.contactNumber || '',
    alternateContact: '',
    preferredTime: 'immediate',
    budget: '',
    additionalNotes: '',
    photos: [],
    shareLocation: false,
    coordinates: undefined
  });

  const serviceTypes = [
    { 
      id: 'ambulance', 
      label: 'Emergency Ambulance', 
      icon: Ambulance, 
      color: 'red',
      description: 'Medical emergency assistance',
      avgPrice: '₹500-2000',
      avgTime: '5-15 mins'
    },
    { 
      id: 'petrol', 
      label: 'Fuel Delivery', 
      icon: Fuel, 
      color: 'orange',
      description: 'Petrol/Diesel delivery service',
      avgPrice: '₹50-100',
      avgTime: '15-30 mins'
    },
    { 
      id: 'mechanic', 
      label: 'Vehicle Mechanic', 
      icon: Wrench, 
      color: 'blue',
      description: 'On-site vehicle repair',
      avgPrice: '₹200-1000',
      avgTime: '20-45 mins'
    },
    { 
      id: 'puncture', 
      label: 'Puncture Repair', 
      icon: Car, 
      color: 'green',
      description: 'Tire puncture fixing',
      avgPrice: '₹100-300',
      avgTime: '15-25 mins'
    },
    { 
      id: 'rental', 
      label: 'Emergency Rental', 
      icon: Car, 
      color: 'purple',
      description: 'Temporary vehicle rental',
      avgPrice: '₹500-1500/day',
      avgTime: '30-60 mins'
    },
    { 
      id: 'ev_charge', 
      label: 'EV Charging', 
      icon: Zap, 
      color: 'yellow',
      description: 'Electric vehicle charging',
      avgPrice: '₹100-500',
      avgTime: '45-120 mins'
    },
    { 
      id: 'towing', 
      label: 'Vehicle Towing', 
      icon: Truck, 
      color: 'gray',
      description: 'Vehicle towing service',
      avgPrice: '₹800-2500',
      avgTime: '20-40 mins'
    }
  ];

  const mockProviders = [
    {
      id: '1',
      name: 'Quick Response Ambulance',
      serviceType: 'ambulance',
      rating: 4.8,
      distance: '2.3 km',
      estimatedTime: '8-12 mins',
      contactNumber: '+91-98765-43210',
      available: true,
      price: '₹800',
      completedServices: 1250,
      responseTime: '< 2 mins',
      specializations: ['Emergency Care', 'ICU Transport', '24/7 Available']
    },
    {
      id: '2',
      name: 'Delhi Fuel Express',
      serviceType: 'petrol',
      rating: 4.5,
      distance: '1.8 km',
      estimatedTime: '15-20 mins',
      contactNumber: '+91-98765-43211',
      available: true,
      price: '₹75',
      completedServices: 890,
      responseTime: '< 5 mins',
      specializations: ['Petrol', 'Diesel', 'Emergency Delivery']
    },
    {
      id: '3',
      name: 'Road Rescue Mechanics',
      serviceType: 'mechanic',
      rating: 4.7,
      distance: '3.1 km',
      estimatedTime: '20-25 mins',
      contactNumber: '+91-98765-43212',
      available: true,
      price: '₹350',
      completedServices: 2100,
      responseTime: '< 3 mins',
      specializations: ['Engine Repair', 'Battery Jump', 'All Vehicles']
    }
  ];

  const handleServiceSelect = (serviceId) => {
    setSelectedService(serviceId);
    setFormData(prev => ({ ...prev, serviceType: serviceId }));
    setCurrentStep(2);
  };

  const handleLocationShare = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setFormData(prev => ({ 
            ...prev, 
            shareLocation: true,
            coordinates: coords,
            location: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
          }));
          toast.success('Location shared successfully!');
        },
        (error) => {
          toast.error('Unable to get your location');
        }
      );
    }
  };

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (uploadedPhotos.length + files.length > 3) {
      toast.error('Maximum 3 photos allowed');
      return;
    }
    
    setUploadedPhotos(prev => [...prev, ...files]);
    setFormData(prev => ({ ...prev, photos: [...(prev.photos || []), ...files] }));
    toast.success(`${files.length} photo(s) uploaded`);
  };

  const removePhoto = (index) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({ 
      ...prev, 
      photos: (prev.photos || []).filter((_, i) => i !== index) 
    }));
  };

  const handleSubmitRequest = async () => {
    if (!formData.contactNumber || !formData.location || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call to send request to service providers
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create the service request
    const serviceRequest = {
      id: Date.now().toString(),
      citizenName: formData.citizenName || user?.name || '',
      citizenPhone: formData.citizenPhone || user?.contactNumber || '',
      serviceType: formData.serviceType || selectedService,
      location: formData.location || '',
      description: formData.description || '',
      urgency: formData.urgency || 'medium',
      contactNumber: formData.contactNumber || '',
      alternateContact: formData.alternateContact,
      preferredTime: formData.preferredTime || 'immediate',
      budget: formData.budget,
      additionalNotes: formData.additionalNotes || '',
      photos: formData.photos || [],
      shareLocation: formData.shareLocation || false,
      coordinates: formData.coordinates
    };

    // Simulate sending to service providers
    console.log('Service Request Sent:', serviceRequest);
    
    setIsSubmitting(false);
    setRequestSubmitted(true);
    toast.success('Service request sent to nearby providers! You will be contacted shortly.');
    
    // Show available providers
    setTimeout(() => {
      setShowProviders(true);
    }, 1500);
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedService('');
    setShowProviders(false);
    setRequestSubmitted(false);
    setUploadedPhotos([]);
    setFormData({
      citizenName: user?.name || '',
      citizenPhone: user?.contactNumber || '',
      serviceType: '',
      location: '',
      description: '',
      urgency: 'medium',
      contactNumber: user?.contactNumber || '',
      alternateContact: '',
      preferredTime: 'immediate',
      budget: '',
      additionalNotes: '',
      photos: [],
      shareLocation: false,
      coordinates: undefined
    });
  };

  const filteredProviders = mockProviders.filter(p => p.serviceType === selectedService);

  if (requestSubmitted && !showProviders) {
    return (
      <div className="min-h-screen bg-slate-50 pt-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Request Submitted Successfully!</h2>
            <p className="text-slate-600 mb-6">
              Your service request has been sent to nearby providers. You will receive calls/messages shortly.
            </p>
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-500">Finding available providers...</span>
            </div>
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Another Request
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Emergency Helper</h1>
          <p className="text-lg text-slate-600">Get quick assistance when you need it most</p>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mt-6 space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 mx-2 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-slate-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 space-x-8 text-xs text-slate-500">
            <span>Select Service</span>
            <span>Fill Details</span>
            <span>Confirm Request</span>
          </div>
        </motion.div>

        {/* Step 1: Service Selection */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8"
          >
            <h2 className="text-xl font-semibold text-slate-900 mb-6">What type of help do you need?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviceTypes.map((service) => {
                const Icon = service.icon;
                return (
                  <motion.button
                    key={service.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleServiceSelect(service.id)}
                    className={`p-6 rounded-xl border-2 border-${service.color}-200 hover:border-${service.color}-300 text-${service.color}-600 hover:bg-${service.color}-50 transition-all text-left group`}
                  >
                    <div className="flex items-start space-x-4">
                      <Icon className="h-8 w-8 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{service.label}</h3>
                        <p className="text-xs text-slate-500 mb-3">{service.description}</p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Avg. Cost:</span>
                            <span className="font-medium">{service.avgPrice}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Avg. Time:</span>
                            <span className="font-medium">{service.avgTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Step 2: Service Details Form */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid lg:grid-cols-3 gap-8"
          >
            {/* Main Form */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Service Request Details</h2>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ← Change Service
                </button>
              </div>

              <div className="space-y-6">
                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={formData.citizenName}
                      onChange={(e) => setFormData(prev => ({ ...prev, citizenName: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Primary Contact *
                    </label>
                    <input
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+91-XXXXX-XXXXX"
                    />
                  </div>
                </div>

                {/* Alternate Contact */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Alternate Contact (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.alternateContact}
                    onChange={(e) => setFormData(prev => ({ ...prev, alternateContact: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Emergency contact number"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Enter your exact location"
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleLocationShare}
                    className={`mt-2 flex items-center space-x-2 text-sm font-medium transition-colors ${
                      formData.shareLocation
                        ? 'text-green-600'
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    <Navigation className="h-4 w-4" />
                    <span>{formData.shareLocation ? 'Location Shared' : 'Share Current Location'}</span>
                  </button>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Problem Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your situation in detail..."
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Urgency and Timing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Urgency Level
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['low', 'medium', 'high'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, urgency: level }))}
                          className={`p-3 rounded-lg border-2 text-sm font-medium capitalize transition-all ${
                            formData.urgency === level
                              ? level === 'low' ? 'bg-green-100 border-green-300 text-green-700'
                                : level === 'medium' ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                                : 'bg-red-100 border-red-300 text-red-700'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Preferred Time
                    </label>
                    <select
                      value={formData.preferredTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="immediate">Immediate (ASAP)</option>
                      <option value="30min">Within 30 minutes</option>
                      <option value="1hour">Within 1 hour</option>
                      <option value="2hour">Within 2 hours</option>
                      <option value="flexible">Flexible timing</option>
                    </select>
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Budget Range (Optional)
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={formData.budget}
                      onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                      placeholder="e.g., ₹500-1000"
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Add Photos (Optional) - Max 3
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Camera className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">Click to upload photos</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB each</p>
                    </label>
                  </div>
                  
                  {/* Uploaded Photos */}
                  {uploadedPhotos.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      {uploadedPhotos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                    placeholder="Any special instructions or additional information..."
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Review Request
                  </button>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-4 border border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Selected Service Info */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Selected Service</h3>
                {serviceTypes.find(s => s.id === selectedService) && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      {(() => {
                        const selected = serviceTypes.find(s => s.id === selectedService);
                        return selected
                          ? React.createElement(selected.icon, { className: 'h-6 w-6 text-blue-600' })
                          : null;
                      })()}
                      <span className="font-medium">{serviceTypes.find(s => s.id === selectedService)?.label}</span>
                    </div>
                    <p className="text-sm text-slate-600">{serviceTypes.find(s => s.id === selectedService)?.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Typical Cost:</span>
                        <span className="font-medium">{serviceTypes.find(s => s.id === selectedService)?.avgPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Response Time:</span>
                        <span className="font-medium">{serviceTypes.find(s => s.id === selectedService)?.avgTime}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Safety Tips */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">🚨 Safety Guidelines</h3>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-600">Verify provider identity before service</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-600">Share location with trusted contacts</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-600">Keep emergency numbers handy</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-600">For life-threatening emergencies, call 108</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review and Submit */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Review Your Request</h2>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ← Edit Details
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Request Summary */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Service Details</h3>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Service:</span>
                        <span className="font-medium capitalize">{selectedService.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Urgency:</span>
                        <span className={`font-medium capitalize ${
                          formData.urgency === 'high' ? 'text-red-600' :
                          formData.urgency === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {formData.urgency}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Timing:</span>
                        <span className="font-medium">{formData.preferredTime}</span>
                      </div>
                      {formData.budget && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Budget:</span>
                          <span className="font-medium">{formData.budget}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Contact Information</h3>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Name:</span>
                        <span className="font-medium">{formData.citizenName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Primary:</span>
                        <span className="font-medium">{formData.contactNumber}</span>
                      </div>
                      {formData.alternateContact && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Alternate:</span>
                          <span className="font-medium">{formData.alternateContact}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Location & Description</h3>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                      <div>
                        <span className="text-slate-600 text-sm">Location:</span>
                        <p className="font-medium">{formData.location}</p>
                        {formData.shareLocation && (
                          <p className="text-green-600 text-xs mt-1">✓ GPS coordinates shared</p>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-600 text-sm">Description:</span>
                        <p className="font-medium">{formData.description}</p>
                      </div>
                      {formData.additionalNotes && (
                        <div>
                          <span className="text-slate-600 text-sm">Additional Notes:</span>
                          <p className="font-medium">{formData.additionalNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {uploadedPhotos.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">Attached Photos</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {uploadedPhotos.map((photo, index) => (
                          <img
                            key={index}
                            src={URL.createObjectURL(photo)}
                            alt={`Attachment ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirmation */}
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <h3 className="font-semibold text-slate-900 mb-4">What happens next?</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                        <p className="text-sm text-slate-700">Your request will be sent to nearby service providers</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                        <p className="text-sm text-slate-700">Available providers will contact you directly</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                        <p className="text-sm text-slate-700">Choose the best provider and confirm service</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                        <p className="text-sm text-slate-700">Track service progress and provide feedback</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <Shield className="h-6 w-6 text-green-600" />
                      <h3 className="font-semibold text-slate-900">Safety Assured</h3>
                    </div>
                    <ul className="text-sm text-slate-700 space-y-1">
                      <li>• All providers are verified and rated</li>
                      <li>• Your location is shared securely</li>
                      <li>• 24/7 support available</li>
                      <li>• Emergency contacts notified if needed</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleSubmitRequest}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending Request...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Send className="h-5 w-5" />
                        <span>Send Service Request</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Available Providers (shown after request submission) */}
        {showProviders && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">
                Available {serviceTypes.find(s => s.id === selectedService)?.label} Providers
              </h2>
              
              <div className="space-y-4">
                {filteredProviders.map((provider) => (
                  <div key={provider.id} className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-slate-900">{provider.name}</h3>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-slate-600">{provider.rating}</span>
                          </div>
                          {provider.available && (
                            <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                              Available Now
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600 mb-4">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{provider.distance} away</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>ETA: {provider.estimatedTime}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{provider.contactNumber}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4" />
                            <span>{provider.completedServices} services</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {provider.specializations.map((spec, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                              {spec}
                            </span>
                          ))}
                        </div>

                        {provider.price && (
                          <div className="text-lg font-semibold text-green-600 mb-4">
                            Service Cost: {provider.price}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <a
                          href={`tel:${provider.contactNumber}`}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center"
                        >
                          Call Now
                        </a>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Submit New Request
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}