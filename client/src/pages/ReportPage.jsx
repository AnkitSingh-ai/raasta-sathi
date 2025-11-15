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
  Loader2,
  Sparkles,
  Wand2,
  Edit3
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../utils/api';
import LocationButton from '../components/LocationButton';
import { generateTrafficReportDescription, generateTrafficReportDescriptionWithPhoto } from '../utils/geminiService';

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
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiGeneratedDescription, setAiGeneratedDescription] = useState('');
  const [showAIOptions, setShowAIOptions] = useState(false);

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

  // AI Description Generation Functions
  const handleGenerateAIDescription = async () => {
    if (!selectedType || !location || !severity) {
      toast.error('Please fill in the report type, location, and severity first');
      return;
    }

    try {
      setIsGeneratingAI(true);
      
      // Get the report type label (e.g., "Accident", "Traffic Jam", "Road Closure")
      const reportTypeLabel = reportTypes.find(type => type.id === selectedType)?.label || selectedType;
      
      let generatedDescription;
      
      try {
        if (photos.length > 0) {
          // Generate description with photo analysis
          generatedDescription = await generateTrafficReportDescriptionWithPhoto(
            reportTypeLabel,
            location,
            severity,
            photos[0] // Use first photo for analysis
          );
        } else {
          // Generate description without photo
          generatedDescription = await generateTrafficReportDescription(
            reportTypeLabel,
            location,
            severity
          );
        }
        
        // Check if we got a valid description
        if (!generatedDescription || generatedDescription.trim().length === 0) {
          throw new Error('Generated description is empty');
        }
        
        setAiGeneratedDescription(generatedDescription);
        setShowAIOptions(true);
        
        // Check if API key is configured to show appropriate message
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your-api-key-here') {
          toast.success('Description generated (using fallback mode - configure Gemini API key for AI features)');
        } else {
          toast.success('AI description generated successfully!');
        }
      } catch (genError) {
        console.error('Error during AI generation:', genError);
        // The geminiService should have already returned a local fallback description
        // But if we still get an error, show a helpful message
        toast.error('AI generation failed. Please check your Gemini API key configuration or write the description manually.');
        throw genError; // Re-throw to be caught by outer catch
      }
      
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error(error.message || 'Failed to generate description. Please try again or write manually.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleUseAIDescription = () => {
    setDescription(aiGeneratedDescription);
    setShowAIOptions(false);
    toast.success('AI description applied to your report!');
  };

  const handleEditAIDescription = () => {
    setDescription(aiGeneratedDescription);
    setShowAIOptions(false);
    toast.success('AI description applied! You can now edit it further.');
  };

  const handleRegenerateAI = async () => {
    await handleGenerateAIDescription();
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

  // Check word limit
  const wordCount = description.split(' ').filter(word => word.length > 0).length;
  if (wordCount > 250) {
    toast.error(`Description is too long. Please keep it under 250 words (currently ${wordCount} words)`);
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
  // Note: reportedBy is set automatically by the server from the authenticated user

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
    
    // Add coordinates as simple fields to avoid parsing issues
    formData.append('coordinatesType', 'Point');
    formData.append('coordinatesLng', coordinates.lng.toString());
    formData.append('coordinatesLat', coordinates.lat.toString());
  } else {
    // No valid coordinates
  }

  // Send location as simple fields to avoid parsing issues
  formData.append('locationAddress', location);
  formData.append('locationCountry', 'India');

  if (photos.length > 0) {
    photos.forEach((photo, index) => {
      formData.append('photos', photo);
    });
  }



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
    
    // Handle restriction error specifically
    if (error.response?.status === 403 && error.response?.data?.restrictionDetails) {
      const restrictionDetails = error.response.data.restrictionDetails;
      const daysLeft = restrictionDetails.daysLeft;
      
      // Show restriction message with countdown
      toast.error(
        `You are restricted from posting new reports because of fake reports for ${daysLeft} more day(s).`,
        {
          duration: 8000,
          style: {
            background: '#fee2e2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            fontSize: '14px',
            maxWidth: '400px'
          }
        }
      );
    } else {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit report. Please try again.';
      toast.error(errorMessage);
    }
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <div className="relative">
            {/* Background decorative elements */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-36 h-36 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10">
              {/* Enhanced Header with Colored Background */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-4 mb-4 shadow-xl border border-white/20 backdrop-blur-sm">
                <div className="inline-flex items-center justify-center p-1.5 bg-white/20 rounded-xl mb-3 backdrop-blur-sm border border-white/30">
                  <div className="p-1 bg-white/30 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                <h1 className="text-xl lg:text-2xl font-bold text-white mb-2">
                  {isEditing ? 'Edit Report' : 'Report Traffic Issue'}
                </h1>
                <p className="text-sm text-blue-100 max-w-xl mx-auto leading-relaxed">
                  {isEditing 
                    ? 'Update your existing traffic report with the latest information' 
                    : 'Help your community by reporting real-time traffic conditions and road safety issues'
                  }
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center py-20"
          >
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-slate-600 mt-4 text-lg font-medium">Loading report for editing...</p>
            </div>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Enhanced Report Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-8 relative overflow-hidden"
              >
                {/* Form background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-100/50 to-blue-100/50 rounded-full translate-y-12 -translate-x-12 blur-2xl"></div>
                
                <div className="relative z-10">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Enhanced Report Type Selection */}
                    <div>
                      <label className="block text-lg font-bold text-slate-900 mb-6 flex items-center space-x-3">
                        <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                        <span>What type of issue are you reporting? *</span>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {reportTypes.map((type) => {
                          const Icon = type.icon;
                          const isSelected = selectedType === type.id;
                          return (
                            <motion.button
                              key={type.id}
                              type="button"
                              onClick={() => setSelectedType(type.id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`p-4 rounded-xl border-2 transition-all duration-300 text-center group relative overflow-hidden ${
                                getColorClasses(type.color, isSelected)
                              } ${isSelected ? 'ring-4 ring-offset-2 ring-blue-500/30 shadow-lg' : 'hover:shadow-md'}`}
                            >
                              {isSelected && (
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                              )}
                              <div className="relative z-10">
                                <div className={`p-2 rounded-lg mx-auto mb-3 w-fit ${
                                  isSelected ? 'bg-white/20' : 'bg-slate-50/50'
                                }`}>
                                  <Icon className={`h-6 w-6 mx-auto transition-transform duration-300 ${
                                    isSelected ? 'scale-110' : 'group-hover:scale-110'
                                  }`} />
                                </div>
                                <span className="text-xs font-semibold block">{type.label}</span>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Enhanced Location Section */}
                    <div>
                      <label className="block text-lg font-bold text-slate-900 mb-4 flex items-center space-x-3">
                        <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
                        <span>Location *</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-blue-500" />
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Enter location or use current location"
                            className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-lg bg-white/80 backdrop-blur-sm"
                            required
                          />
                        </div>
                      </div>
                      <motion.button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={isFetchingLocation}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all duration-300"
                      >
                        {isFetchingLocation ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Fetching...
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            📍 Use current location
                          </>
                        )}
                      </motion.button>
                      
                      {/* Enhanced Location Button */}
                      {coordinates.lat !== null && coordinates.lng !== null && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4"
                        >
                          <LocationButton 
                            location={{
                              address: location,
                              coordinates: [coordinates.lng, coordinates.lat]
                            }} 
                            variant="compact" 
                            size="small"
                            className="w-full"
                          />
                        </motion.div>
                      )}
                    </div>

                    {/* Enhanced Severity Section */}
                    <div>
                      <label className="block text-lg font-bold text-slate-900 mb-4 flex items-center space-x-3">
                        <div className="w-2 h-8 bg-gradient-to-b from-yellow-500 to-red-500 rounded-full"></div>
                        <span>Severity Level</span>
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { level: 'low', color: 'green', icon: '🟢' },
                          { level: 'medium', color: 'yellow', icon: '🟡' },
                          { level: 'high', color: 'red', icon: '🔴' }
                        ].map(({ level, color, icon }) => (
                          <motion.button
                            key={level}
                            type="button"
                            onClick={() => setSeverity(level)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`p-3 rounded-xl border-2 text-xs font-bold capitalize transition-all duration-300 relative overflow-hidden ${
                              severity === level
                                ? level === 'low' ? 'bg-green-100 border-green-400 text-green-700 shadow-lg ring-4 ring-green-500/30'
                                  : level === 'medium' ? 'bg-yellow-100 border-yellow-400 text-yellow-700 shadow-lg ring-4 ring-yellow-500/30'
                                  : 'bg-red-100 border-red-400 text-red-700 shadow-lg ring-4 ring-red-500/30'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="text-xl mb-2">{icon}</div>
                            <span className="uppercase tracking-wide">{level}</span>
                            {severity === level && (
                              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Enhanced Description Section with AI Generation */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-lg font-bold text-slate-900 flex items-center space-x-3">
                          <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                          <span>Description *</span>
                        </label>
                        
                                                {/* AI Generation Button */}
                        <div className="relative group">
                          <motion.button
                            type="button"
                            onClick={handleGenerateAIDescription}
                            disabled={isGeneratingAI || !selectedType || !location || !severity}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
                              isGeneratingAI || !selectedType || !location || !severity
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl'
                            }`}
                          >
                            {isGeneratingAI ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                <span>Generate AI Description</span>
                              </>
                            )}
                          </motion.button>
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
                            <div className="flex items-center space-x-2">
                              <Wand2 className="h-3 w-3" />
                              <span>AI generates descriptions based on your report details</span>
                            </div>
                            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-t-4 border-transparent border-t-slate-900"></div>
                          </div>
                        </div>
                        

                        

                      </div>

                      {/* AI Generated Description Preview */}
                      {showAIOptions && aiGeneratedDescription && (
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Wand2 className="h-5 w-5 text-purple-600" />
                              <span className="font-semibold text-purple-800">AI Generated Description</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowAIOptions(false)}
                              className="text-purple-500 hover:text-purple-700"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                          
                          <div className="bg-white p-3 rounded-lg border border-purple-100 mb-3">
                            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                              {aiGeneratedDescription.split('\n').map((line, index) => {
                                if (line.trim() && line.trim() === line.trim().toUpperCase() && line.trim().length > 3) {
                                  // This is a heading - make it bold
                                  return (
                                    <div key={index} className="font-bold text-slate-800 mb-2 mt-3 first:mt-0">
                                      {line.trim()}
                                    </div>
                                  );
                                } else if (line.trim()) {
                                  // This is content - add proper spacing
                                  return (
                                    <div key={index} className="mb-2">
                                      {line.trim()}
                                    </div>
                                  );
                                } else {
                                  // Empty line - add spacing
                                  return <div key={index} className="mb-3"></div>;
                                }
                              })}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <motion.button
                              type="button"
                              onClick={handleUseAIDescription}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors duration-200"
                            >
                              <CheckCircle className="h-4 w-4 inline mr-2" />
                              Use As-Is
                            </motion.button>
                            
                            <motion.button
                              type="button"
                              onClick={handleEditAIDescription}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                            >
                              <Edit3 className="h-4 w-4 inline mr-2" />
                              Edit & Use
                            </motion.button>
                            
                            <motion.button
                              type="button"
                              onClick={handleRegenerateAI}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors duration-200"
                            >
                              <Wand2 className="h-4 w-4 inline mr-2" />
                              Regenerate
                            </motion.button>
                          </div>
                        </motion.div>
                      )}

                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Provide detailed information about the traffic condition, road issue, or incident... (Max 1500 characters, 250 words)"
                          rows={8}
                          maxLength={1500}
                          className="relative w-full px-6 py-5 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 resize-none text-lg bg-white/80 backdrop-blur-sm font-mono"
                          required
                        />
                      </div>
                      
                      {/* Word Count Display */}
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-sm text-slate-500">
                          {description.length}/1500 characters
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className={`text-sm ${
                            description.split(' ').filter(word => word.length > 0).length > 250 
                              ? 'text-red-600 font-semibold' 
                              : description.split(' ').filter(word => word.length > 0).length > 200 
                                ? 'text-orange-600' 
                                : 'text-slate-500'
                          }`}>
                            {description.split(' ').filter(word => word.length > 0).length}/250 words
                          </div>
                          {selectedType && location && severity && (
                            <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              <Sparkles className="h-3 w-3" />
                              <span>AI Ready</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Word Limit Warning */}
                      {description.split(' ').filter(word => word.length > 0).length > 250 && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700 font-medium">
                            ⚠️ Description exceeds 250 word limit. Please shorten it before submitting.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Photo Upload Section */}
                    <div>
                      <label className="block text-lg font-bold text-slate-900 mb-4 flex items-center space-x-3">
                        <div className="w-2 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                        <span>Add Photos (Optional) - Max 5 photos</span>
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

                      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/30 group">
                        {photoPreviews.length > 0 ? (
                          <div className="space-y-8">
                            {/* Enhanced Photos Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                              {photoPreviews.map((preview, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="relative group/photo overflow-hidden rounded-xl shadow-lg"
                                >
                                  <img 
                                    src={preview} 
                                    alt={`Photo ${index + 1}`} 
                                    className="w-full h-40 object-cover transition-transform duration-300 group-hover/photo:scale-110" 
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePhoto(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover/photo:opacity-100 transition-all duration-300 hover:bg-red-600 shadow-lg"
                                    aria-label="Remove photo"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                                    <span className="text-white text-sm font-medium">Photo {index + 1}</span>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                            
                            {/* Enhanced Remove All Button */}
                            <motion.button
                              type="button"
                              onClick={handleRemoveAllPhotos}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-8 py-4 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all duration-300 text-sm font-semibold border border-red-200 hover:border-red-300"
                            >
                              🗑️ Remove All Photos
                            </motion.button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <motion.button
                              type="button"
                              onClick={handleFileUploadClick}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-base font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl border border-blue-400"
                              title="Select photos from device gallery"
                            >
                              <Upload className="h-6 w-6" />
                              📁 Upload Files
                            </motion.button>
                            <motion.button
                              type="button"
                              onClick={handleCameraClick}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-base font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl border border-green-400"
                              title="Take photo using device camera"
                            >
                              <Camera className="h-6 w-6" />
                              📸 Take Photo
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white rounded-2xl font-bold text-xl hover:from-blue-700 hover:via-purple-700 hover:to-green-700 transition-all duration-300 shadow-2xl hover:shadow-3xl transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        {isSubmitting ? (
                          <div className="flex items-center justify-center space-x-3">
                            <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>{isEditing ? 'Updating...' : 'Submitting...'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-3">
                            <Send className="h-7 w-7" />
                            <span>{isEditing ? 'Update Report' : 'Submit Report'}</span>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            </div>

            {/* Enhanced Sidebar */}
            <div className="space-y-8">
              {/* Enhanced Tips Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-100/50 to-blue-100/50 rounded-full -translate-y-12 translate-x-12 blur-2xl"></div>
                
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center space-x-3">
                    <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
                    <span>Reporting Tips</span>
                  </h3>
                  <div className="space-y-5">
                    {[
                      'Be specific about the exact location',
                      'Include multiple photos for better context',
                      'Report safely - don\'t use while driving',
                      'Update if situation changes'
                    ].map((tip, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex items-start space-x-4 group"
                      >
                        <div className="p-2 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors duration-300">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-sm text-slate-600 font-medium">{tip}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Enhanced Reward Info Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-gradient-to-br from-blue-50/90 to-green-50/90 backdrop-blur-xl rounded-3xl border border-blue-200/60 p-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/50 to-purple-200/50 rounded-full -translate-y-10 translate-x-10 blur-2xl"></div>
                
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center space-x-3">
                    <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                    <span>Earn Rewards</span>
                  </h3>
                  <div className="space-y-5">
                    {[
                      { label: 'Verified Report', points: '+10 pts', color: 'green' },
                      { label: 'With Photos', points: '+5 pts', color: 'blue' },
                      { label: 'Community Upvotes', points: '+1 pt each', color: 'purple' }
                    ].map((reward, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-white/40 hover:bg-white/80 transition-all duration-300"
                      >
                        <span className="text-sm text-slate-700 font-medium">{reward.label}</span>
                        <span className={`text-sm font-bold text-${reward.color}-600 bg-${reward.color}-100 px-4 py-2 rounded-full`}>
                          {reward.points}
                        </span>
                      </motion.div>
                    ))}
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
