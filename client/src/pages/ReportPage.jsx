import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Shield, 
  Construction, 
  Car, 
  Cloud, 
  Crown,
  MapPin,
  Camera,
  Send,
  CheckCircle,
  Upload,
  X,
  Loader2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../utils/api';
import LocationButton from '../components/LocationButton';

export function ReportPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [selectedType, setSelectedType] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReportId, setEditingReportId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for the file inputs
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Check if we're editing an existing report
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      setIsEditing(true);
      setEditingReportId(editId);
      loadReportForEditing(editId);
    }
  }, [searchParams]);

  const loadReportForEditing = async (reportId) => {
    try {
      setIsLoading(true);
      const response = await apiService.getReport(reportId);
      const report = response.data || response;
      
      // Populate form with existing data
      setSelectedType(report.type || '');
      setDescription(report.description || '');
      setSeverity(report.severity || 'medium');
      
      // Handle location
      if (typeof report.location === 'string') {
        setLocation(report.location);
      } else if (report.location?.address) {
        setLocation(report.location.address);
      }
      
      // Handle coordinates
      if (report.coordinates?.coordinates) {
        const [lng, lat] = report.coordinates.coordinates;
        setCoordinates({ lat, lng });
      }
      
      // Handle photos
      if (report.photos && report.photos.length > 0) {
        setPhotoPreviews(report.photos.map(p => p.url || p));
      } else if (report.photo) {
        setPhotoPreviews([report.photo]);
      }
      
      toast.success('Report loaded for editing');
    } catch (error) {
      console.error('Failed to load report for editing:', error);
      toast.error('Failed to load report for editing');
      navigate('/my-reports');
    } finally {
      setIsLoading(false);
    }
  };

  const reportTypes = [
    { id: 'accident', label: t('report.accident'), icon: AlertTriangle, color: 'red' },
    { id: 'police', label: t('report.police'), icon: Shield, color: 'blue' },
    { id: 'pothole', label: t('report.pothole'), icon: AlertTriangle, color: 'orange' },
    { id: 'construction', label: t('report.construction'), icon: Construction, color: 'yellow' },
    { id: 'congestion', label: t('report.congestion'), icon: Car, color: 'purple' },
    { id: 'closure', label: t('report.closure'), icon: AlertTriangle, color: 'gray' },
    { id: 'weather', label: t('report.weather'), icon: Cloud, color: 'cyan' },
    { id: 'vip', label: t('report.vip'), icon: Crown, color: 'pink' }
  ];

  const handlePhotoChange = (event) => {
    const files = Array.from(event.target.files);
    
    // Check if adding these files would exceed 5 photos limit
    if (photos.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }
    
    // Check file size for each photo (10MB limit)
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    // Add new photos
    const newPhotos = [...photos, ...validFiles];
    setPhotos(newPhotos);
    
    // Create previews for new photos
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
    
    // Show success message
    if (validFiles.length === 1) {
      toast.success('Photo uploaded successfully!');
    } else {
      toast.success(`${validFiles.length} photos uploaded successfully!`);
    }
  };

  const handleCameraPhoto = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check if adding this photo would exceed 5 photos limit
    if (photos.length >= 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Photo is too large. Maximum size is 10MB.');
      return;
    }
    
    // Add new photo
    const newPhotos = [...photos, file];
    setPhotos(newPhotos);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreviews(prev => [...prev, reader.result]);
      toast.success('Photo captured successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleCameraClick = () => {
    // Check if device supports camera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Camera not supported on this device');
      return;
    }
    
    // Open camera input
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleFileUploadClick = () => {
    // Check if device supports file input
    if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
      toast.error('File upload not supported on this device');
      return;
    }
    
    // Open file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemovePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreviews(newPreviews);
    
    // Reset the value of the file inputs to allow re-selection of the same file
    if(fileInputRef.current) fileInputRef.current.value = "";
    if(cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleRemoveAllPhotos = () => {
    setPhotos([]);
    setPhotoPreviews([]);
    // Reset the value of the file inputs to allow re-selection of the same file
    if(fileInputRef.current) fileInputRef.current.value = "";
    if(cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleUseCurrentLocation = () => {
  setIsFetchingLocation(true);
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        setCoordinates({ lat: latitude, lng: longitude });
        toast.success('Location fetched successfully!');
        setIsFetchingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error('Could not fetch location. Please enable location services.');
        setIsFetchingLocation(false);
      }
    );
  } else {
    toast.error('Geolocation is not supported by your browser.');
    setIsFetchingLocation(false);
  }
};

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!selectedType || !location || !description) {
    toast.error('Please fill in all required fields');
    return;
  }

  if (!user) {
    toast.error('Please login to submit a report.');
    return;
  }

  // Check if user token is valid
  const token = localStorage.getItem('raasta_sathi_token');
  if (!token) {
    toast.error('Authentication token missing. Please login again.');
    navigate('/login');
    return;
  }

  setIsSubmitting(true);

  // Test connection first
  try {
    console.log('Testing connection...');
    await apiService.testConnection();
    console.log('Connection test successful');
  } catch (error) {
    console.error('Connection test failed:', error);
    toast.error('Connection test failed. Please check your internet connection.');
    setIsSubmitting(false);
    return;
  }

  const formData = new FormData();
  formData.append('type', selectedType);
  formData.append('description', description);
  formData.append('severity', severity);
  formData.append('reportedBy', user._id);
  
  // Generate title from type
  const title = `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Report`;
  formData.append('title', title);

  // Prepare location data (without coordinates)
  const locationData = {
    address: location,
    country: "India" // Default country
  };

  console.log('🔍 Current coordinates state:', coordinates);

  // Handle coordinates separately
  if (coordinates.lat !== null && coordinates.lng !== null && 
      typeof coordinates.lat === 'number' && 
      typeof coordinates.lng === 'number' &&
      !isNaN(coordinates.lat) && 
      !isNaN(coordinates.lng) &&
      coordinates.lat !== 0 && coordinates.lng !== 0) {
    
    // Add coordinates as a separate field
    const coordinatesData = {
      type: 'Point',
      coordinates: [coordinates.lng, coordinates.lat] // MongoDB expects [longitude, latitude]
    };
    formData.append('coordinates', JSON.stringify(coordinatesData));
    console.log('📍 Including coordinates:', coordinatesData);
  } else {
    console.log('📍 No valid coordinates, excluding coordinates field');
  }

  formData.append('location', JSON.stringify(locationData));

  if (photos.length > 0) {
    console.log('Adding photos to form data, count:', photos.length);
    console.log('Photos to be sent:', photos);
    photos.forEach((photo, index) => {
      console.log(`Appending photo ${index + 1}:`, photo.name, photo.size, photo.type);
      formData.append('photos', photo);
    });
    
    // Log the FormData contents
    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`FormData entry: ${key} = File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`FormData entry: ${key} =`, value);
      }
    }
  }

  console.log('Submitting report with data:', {
    type: selectedType,
    description: description,
    severity: severity,
    hasPhotos: photos.length > 0,
    photoCount: photos.length,
    user: user._id
  });

  try {
    let response;
    
    if (isEditing && editingReportId) {
      // Update existing report
      const updateData = {
        type: selectedType,
        description: description,
        severity: severity,
        location: {
          address: location,
          country: "India"
        }
      };
      
      // Generate title from type if not provided
      if (!editingReport.title) {
        updateData.title = `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Report`;
      }
      
      if (coordinates.lat !== null && coordinates.lng !== null && 
          typeof coordinates.lat === 'number' && 
          typeof coordinates.lng === 'number' &&
          !isNaN(coordinates.lat) && 
          !isNaN(coordinates.lng) &&
          coordinates.lat !== 0 && coordinates.lng !== 0) {
        updateData.coordinates = {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat]
        };
      }
      
      response = await apiService.updateReport(editingReportId, updateData);
      console.log('Report update successful:', response);
      toast.success('Report updated successfully!');
      setTimeout(() => {
        navigate('/my-reports');
      }, 2000);
    } else {
      // Create new report
      response = await apiService.createReport(formData);
      console.log('Report submission successful:', response);
      toast.success('Report submitted successfully! Your report will appear on the live map.');
      setTimeout(() => {
        navigate('/map');
      }, 2000);
    }
  } catch (error) {
    console.error('Report submission error:', error);
    const errorMessage = error.message || 'Failed to submit report. Please try again.';
    toast.error(errorMessage);
  } finally {
    setIsSubmitting(false);
  }
};

  const getColorClasses = (color, selected) => {
    const colors = {
      red: selected ? 'bg-red-100 border-red-300 text-red-700' : 'border-red-200 hover:border-red-300 text-red-600',
      blue: selected ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-blue-200 hover:border-blue-300 text-blue-600',
      orange: selected ? 'bg-orange-100 border-orange-300 text-orange-700' : 'border-orange-200 hover:border-orange-300 text-orange-600',
      yellow: selected ? 'bg-yellow-100 border-yellow-300 text-yellow-700' : 'border-yellow-200 hover:border-yellow-300 text-yellow-600',
      purple: selected ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-purple-200 hover:border-purple-300 text-purple-600',
      gray: selected ? 'bg-gray-100 border-gray-300 text-gray-700' : 'border-gray-200 hover:border-gray-300 text-gray-600',
      cyan: selected ? 'bg-cyan-100 border-cyan-300 text-cyan-700' : 'border-cyan-200 hover:border-cyan-300 text-cyan-600',
      pink: selected ? 'bg-pink-100 border-pink-300 text-pink-700' : 'border-pink-200 hover:border-pink-300 text-pink-600'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            {isEditing ? 'Edit Report' : 'Report Traffic Issue'}
          </h1>
          <p className="text-lg text-slate-600">
            {isEditing 
              ? 'Update your existing traffic report' 
              : 'Help your community by reporting real-time traffic conditions'
            }
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading report for editing...</p>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Report Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8"
              >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Report Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-4">
                    What type of issue are you reporting? *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {reportTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = selectedType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setSelectedType(type.id)}
                          className={`p-4 rounded-xl border-2 transition-all text-center ${
                            getColorClasses(type.color, isSelected)
                          }`}
                        >
                          <Icon className="h-6 w-6 mx-auto mb-2" />
                          <span className="text-sm font-medium block">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter location or use current location"
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isFetchingLocation}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-wait"
                  >
                    {isFetchingLocation ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      '📍 Use current location'
                    )}
                  </button>
                  
                  {/* Show Location Button when coordinates are available */}
                  {coordinates.lat !== null && coordinates.lng !== null && (
                    <div className="mt-3">
                      <LocationButton 
                        location={{
                          address: location,
                          coordinates: [coordinates.lng, coordinates.lat]
                        }} 
                        variant="compact" 
                        size="small"
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Severity Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['low', 'medium', 'high'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSeverity(level)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                          severity === level
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

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about the traffic condition..."
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Add Photos (Optional) - Max 5 photos
                  </label>
                  {/* Hidden file inputs */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    className="hidden"
                    accept="image/*"
                    multiple
                  />
                  <input
                    type="file"
                    ref={cameraInputRef}
                    onChange={handleCameraPhoto}
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                  />

                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center transition-colors">
                    {photoPreviews.length > 0 ? (
                      <div className="space-y-4">
                        {/* Photos Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {photoPreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img 
                                src={preview} 
                                alt={`Photo ${index + 1}`} 
                                className="w-full h-24 object-cover rounded-lg" 
                              />
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove photo"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        {/* Remove All Button */}
                        <button
                          type="button"
                          onClick={handleRemoveAllPhotos}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        >
                          Remove All Photos
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                          type="button"
                          onClick={handleFileUploadClick}
                          className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          title="Select photos from device gallery"
                        >
                          <Upload className="h-4 w-4" />
                          Upload Files
                        </button>
                        <button
                          type="button"
                          onClick={handleCameraClick}
                          className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          title="Take photo using device camera"
                        >
                          <Camera className="h-4 w-4" />
                          Take Photo
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{isEditing ? 'Updating...' : 'Submitting...'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Send className="h-5 w-5" />
                      <span>{isEditing ? 'Update Report' : 'Submit Report'}</span>
                    </div>
                  )}
                </button>
              </form>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Reporting Tips</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-600">Be specific about the exact location</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-600">Include multiple photos for better context</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-600">Report safely - don't use while driving</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-600">Update if situation changes</p>
                </div>
              </div>
            </motion.div>

            {/* Reward Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl border border-blue-200 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Earn Rewards</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Verified Report</span>
                  <span className="text-sm font-semibold text-green-600">+10 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">With Photos</span>
                  <span className="text-sm font-semibold text-blue-600">+5 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Community Upvotes</span>
                  <span className="text-sm font-semibold text-purple-600">+1 pt each</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
