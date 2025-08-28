import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const PhotoGallery = ({ 
  photos = [], 
  isOpen, 
  onClose, 
  title = "Photos"
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!isOpen || photos.length === 0) return null;

  const handlePrevious = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
          onClick={onClose}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Main Photo */}
            <img
              src={typeof photos[currentPhotoIndex] === 'object' ? photos[currentPhotoIndex].url : photos[currentPhotoIndex]}
              alt={`Photo ${currentPhotoIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Navigation Arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Photo Counter */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {currentPhotoIndex + 1} / {photos.length}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Thumbnail Strip at Bottom */}
            {photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(index); }}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentPhotoIndex 
                        ? 'border-white border-opacity-100' 
                        : 'border-white border-opacity-30'
                    }`}
                  >
                    <img
                      src={typeof photo === 'object' ? photo.url : photo}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PhotoGallery;
