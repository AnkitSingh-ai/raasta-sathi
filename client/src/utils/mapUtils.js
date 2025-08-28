/**
 * Utility functions for Google Maps integration
 */

import { MapPin, Navigation } from 'lucide-react';

/**
 * Opens Google Maps with the specified location
 * @param {Object} location - Location object with coordinates or address
 * @param {Array} location.coordinates - [longitude, latitude] array
 * @param {string} location.address - Address string
 * @param {string} location.city - City name
 * @param {string} location.state - State name
 * @param {string} location.country - Country name
 */
export const openInGoogleMaps = (location) => {
  if (!location) {
    console.error('No location provided');
    return;
  }

  let googleMapsUrl = 'https://www.google.com/maps';

  // If coordinates are available, use them for precise location
  if (location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
    const [lng, lat] = location.coordinates;
    if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
      googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    }
  }
  // If no coordinates, try to use address
  else if (location.address) {
    const encodedAddress = encodeURIComponent(location.address);
    googleMapsUrl = `https://www.google.com/maps/search/${encodedAddress}`;
  }
  // Fallback to city/state/country
  else {
    const addressParts = [location.city, location.state, location.country]
      .filter(Boolean)
      .join(', ');
    
    if (addressParts) {
      const encodedAddress = encodeURIComponent(addressParts);
      googleMapsUrl = `https://www.google.com/maps/search/${encodedAddress}`;
    }
  }

  // Open Google Maps in a new tab
  window.open(googleMapsUrl, '_blank');
};

/**
 * Opens Google Maps with directions from current location to the specified location
 * @param {Object} location - Destination location object
 * @param {string} startLocation - Starting location (optional, defaults to "My Location")
 */
export const openDirectionsInGoogleMaps = (location, startLocation = 'My Location') => {
  if (!location) {
    console.error('No destination location provided');
    return;
  }

  let destination = '';

  // If coordinates are available, use them for precise destination
  if (location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
    const [lng, lat] = location.coordinates;
    if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
      destination = `${lat},${lng}`;
    }
  }
  // If no coordinates, try to use address
  else if (location.address) {
    destination = encodeURIComponent(location.address);
  }
  // Fallback to city/state/country
  else {
    const addressParts = [location.city, location.state, location.country]
      .filter(Boolean)
      .join(', ');
    
    if (addressParts) {
      destination = encodeURIComponent(addressParts);
    }
  }

  if (!destination) {
    console.error('Could not determine destination location');
    return;
  }

  const encodedStart = encodeURIComponent(startLocation);
  const googleMapsUrl = `https://www.google.com/maps/dir/${encodedStart}/${destination}`;
  
  // Open Google Maps with directions in a new tab
  window.open(googleMapsUrl, '_blank');
};

/**
 * Gets a formatted location string for display
 * @param {Object} location - Location object
 * @returns {string} Formatted location string
 */
export const getFormattedLocation = (location) => {
  if (!location) return 'Location not specified';
  
  if (typeof location === 'string') return location;
  
  if (location.address) return location.address;
  
  const parts = [location.city, location.state, location.country]
    .filter(Boolean);
  
  return parts.length > 0 ? parts.join(', ') : 'Location not specified';
};

/**
 * Checks if a location has valid coordinates
 * @param {Object} location - Location object
 * @returns {boolean} True if coordinates are valid
 */
export const hasValidCoordinates = (location) => {
  return location && 
         location.coordinates && 
         Array.isArray(location.coordinates) && 
         location.coordinates.length === 2 &&
         typeof location.coordinates[0] === 'number' &&
         typeof location.coordinates[1] === 'number' &&
         !isNaN(location.coordinates[0]) &&
         !isNaN(location.coordinates[1]);
};

/**
 * Gets coordinates as [lat, lng] array for Google Maps
 * @param {Object} location - Location object
 * @returns {Array|null} [latitude, longitude] array or null if invalid
 */
export const getCoordinatesForGoogleMaps = (location) => {
  if (!hasValidCoordinates(location)) return null;
  
  // Google Maps expects [lat, lng] but our coordinates are [lng, lat]
  const [lng, lat] = location.coordinates;
  return [lat, lng];
};
