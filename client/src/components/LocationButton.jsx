import React from 'react';
import { MapPin, Navigation, ExternalLink, Globe, Map } from 'lucide-react';
import { openInGoogleMaps, openDirectionsInGoogleMaps, hasValidCoordinates } from '../utils/mapUtils';

/**
 * LocationButton Component
 * Provides Google Maps integration for report locations
 */
const LocationButton = ({ 
  location, 
  variant = 'default', // 'default', 'compact', 'icon-only', 'corner', 'floating'
  showDirections = true,
  className = '',
  size = 'default', // 'small', 'default', 'large'
  position = 'default' // 'default', 'top-right', 'top-left', 'bottom-right', 'bottom-left'
}) => {
  if (!location) {
    return null;
  }

  const hasCoordinates = hasValidCoordinates(location);
  
  // Size classes
  const sizeClasses = {
    tiny: 'px-1 py-0.5 text-xs',
    small: 'px-2 py-1 text-xs',
    default: 'px-3 py-2 text-sm',
    large: 'px-4 py-3 text-base'
  };

  // Icon sizes - Made bigger for better visibility
  const iconSizes = {
    tiny: 'h-4 w-4',
    small: 'h-5 w-5',
    default: 'h-6 w-6',
    large: 'h-7 w-7'
  };

  const baseClasses = `inline-flex items-center space-x-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${sizeClasses[size]} ${className}`;

  const handleOpenLocation = () => {
    openInGoogleMaps(location);
  };

  const handleOpenDirections = () => {
    openDirectionsInGoogleMaps(location);
  };

  // Icon-only variant with light blue circles
  if (variant === 'icon-only') {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={handleOpenLocation}
          className={`${baseClasses} bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-full flex items-center justify-center`}
          title="Open location in Google Maps"
          style={{ minWidth: '40px', minHeight: '40px' }}
        >
          <MapPin className={iconSizes[size]} />
        </button>
        {showDirections && hasCoordinates && (
          <button
            onClick={handleOpenDirections}
            className={`${baseClasses} bg-green-100 text-green-600 hover:bg-green-200 rounded-full flex items-center justify-center`}
            title="Get directions to this location"
            style={{ minWidth: '40px', minHeight: '40px' }}
          >
            <Navigation className={iconSizes[size]} />
          </button>
        )}
      </div>
    );
  }

  // Corner variant - small buttons positioned in corners with light blue circles
  if (variant === 'corner') {
    const positionClasses = {
      'top-right': 'absolute top-2 right-2',
      'top-left': 'absolute top-2 left-2',
      'bottom-right': 'absolute bottom-2 right-2',
      'bottom-left': 'absolute bottom-2 left-2',
      'default': ''
    };

    return (
      <div className={`${positionClasses[position]} z-10`}>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenLocation}
            className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-all duration-200 hover:scale-110 flex items-center justify-center"
            title="Open location in Google Maps"
            style={{ minWidth: '32px', minHeight: '32px' }}
          >
            <MapPin className="h-5 w-5" />
          </button>
          {showDirections && hasCoordinates && (
            <button
              onClick={handleOpenDirections}
              className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-all duration-200 hover:scale-110 flex items-center justify-center"
              title="Get directions to this location"
              style={{ minWidth: '32px', minHeight: '32px' }}
            >
              <Navigation className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Floating variant - small floating buttons with light blue circles
  if (variant === 'floating') {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={handleOpenLocation}
          className={`${size === 'tiny' ? 'p-2' : 'p-2.5'} bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-all duration-200 hover:scale-110 flex items-center justify-center`}
          title="Open location in Google Maps"
          style={{ minWidth: size === 'tiny' ? '32px' : '36px', minHeight: size === 'tiny' ? '32px' : '36px' }}
        >
          <MapPin className={iconSizes[size]} />
        </button>
        {showDirections && hasCoordinates && (
          <button
            onClick={handleOpenDirections}
            className={`${size === 'tiny' ? 'p-2' : 'p-2.5'} bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-all duration-200 hover:scale-110 flex items-center justify-center`}
            title="Get directions to this location"
            style={{ minWidth: size === 'tiny' ? '32px' : '36px', minHeight: size === 'tiny' ? '32px' : '36px' }}
          >
            <Navigation className={iconSizes[size]} />
          </button>
        )}
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={handleOpenLocation}
          className={`${baseClasses} bg-blue-100 text-blue-700 hover:bg-blue-200`}
        >
          <MapPin className={iconSizes[size]} />
          <span>View</span>
        </button>
        {showDirections && hasCoordinates && (
          <button
            onClick={handleOpenDirections}
            className={`${baseClasses} bg-green-100 text-green-700 hover:bg-green-200`}
          >
            <Navigation className={iconSizes[size]} />
            <span>Directions</span>
          </button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleOpenLocation}
        className={`${baseClasses} text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300`}
      >
        <MapPin className={iconSizes[size]} />
        <span>Open in Maps</span>
      </button>
      {showDirections && hasCoordinates && (
        <button
          onClick={handleOpenDirections}
          className={`${baseClasses} text-green-600 hover:text-green-700 border border-green-200 hover:border-green-300`}
        >
          <Navigation className={iconSizes[size]} />
          <span>Get Directions</span>
        </button>
      )}
    </div>
  );
};

export default LocationButton;
