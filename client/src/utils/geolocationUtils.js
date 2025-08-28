// Geolocation utility functions with better error handling

// Common location coordinates for fallback
export const COMMON_LOCATIONS = {
  'delhi': { lat: 28.7041, lng: 77.1025, name: 'Delhi' },
  'noida': { lat: 28.5355, lng: 77.3910, name: 'Noida' },
  'gurgaon': { lat: 28.4595, lng: 77.0266, name: 'Gurgaon' },
  'ghaziabad': { lat: 28.6692, lng: 77.4538, name: 'Ghaziabad' },
  'faridabad': { lat: 28.4089, lng: 77.3178, name: 'Faridabad' },
  'mumbai': { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
  'bangalore': { lat: 12.9716, lng: 77.5946, name: 'Bangalore' },
  'chennai': { lat: 13.0827, lng: 80.2707, name: 'Chennai' },
  'kolkata': { lat: 22.5726, lng: 88.3639, name: 'Kolkata' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, name: 'Hyderabad' }
};

// Default fallback location (Delhi/Noida area)
export const DEFAULT_LOCATION = { lat: 28.6100, lng: 77.3569, name: 'Delhi/Noida Area' };

// Get user location with comprehensive error handling
export const getUserLocation = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported by this browser');
      reject(new Error('Geolocation not supported'));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000 // 5 minutes
    };

    const geolocationOptions = { ...defaultOptions, ...options };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log('📍 Location obtained successfully:', { 
          lat: latitude, 
          lng: longitude, 
          accuracy: accuracy 
        });
        
        resolve({
          lat: latitude,
          lng: longitude,
          accuracy: accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        
        // Handle specific error codes
        let errorMessage = 'Failed to get location';
        let errorType = 'unknown';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
            errorType = 'permission_denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. This might be due to poor GPS signal or network issues.';
            errorType = 'position_unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            errorType = 'timeout';
            break;
          default:
            errorMessage = 'An unexpected error occurred while getting your location.';
            errorType = 'unknown';
        }
        
        const geolocationError = new Error(errorMessage);
        geolocationError.code = error.code;
        geolocationError.type = errorType;
        
        reject(geolocationError);
      },
      geolocationOptions
    );
  });
};

// Try to get location with fallback strategy
export const getLocationWithFallback = async (options = {}) => {
  try {
    // First try with high accuracy
    return await getUserLocation({ ...options, enableHighAccuracy: true });
  } catch (error) {
    console.log('🔄 High accuracy failed, trying low accuracy...');
    
    // If high accuracy fails, try low accuracy
    if (error.code === 2) { // TIMEOUT
      try {
        return await getUserLocation({ ...options, enableHighAccuracy: false, timeout: 10000 });
      } catch (lowAccuracyError) {
        console.log('🔄 Low accuracy also failed, using fallback location');
        throw lowAccuracyError;
      }
    }
    
    throw error;
  }
};

// Get coordinates for a location name
export const getLocationCoordinates = (locationName) => {
  if (!locationName) return null;
  
  const normalizedName = locationName.toLowerCase().trim();
  
  // Check exact matches first
  if (COMMON_LOCATIONS[normalizedName]) {
    return COMMON_LOCATIONS[normalizedName];
  }
  
  // Check partial matches
  for (const [key, value] of Object.entries(COMMON_LOCATIONS)) {
    if (key.includes(normalizedName) || normalizedName.includes(key)) {
      return value;
    }
  }
  
  return null;
};

// Validate coordinates
export const isValidCoordinates = (lat, lng) => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Format distance for display
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
};
