/**
 * Get the main/primary photo from a report
 * @param {Object} report - The report object
 * @returns {string|null} - The main photo URL or null if no photo
 */
export const getMainPhoto = (report) => {
  if (!report) return null;
  
  // Check if report has a single photo field
  if (report.photo) return report.photo;
  
  // Check if report has photos array
  if (report.photos && report.photos.length > 0) {
    const firstPhoto = report.photos[0];
    // Handle both string URLs and objects with url property
    if (typeof firstPhoto === 'string') {
      return firstPhoto;
    } else if (typeof firstPhoto === 'object' && firstPhoto.url) {
      return firstPhoto.url;
    }
  }
  
  return null;
};

/**
 * Get all photos from a report (both single photo and photos array)
 * @param {Object} report - The report object
 * @returns {Array} - Array of photo URLs
 */
export const getAllPhotos = (report) => {
  if (!report) return [];
  
  const photos = [];
  
  // Add single photo if it exists
  if (report.photo) {
    photos.push(report.photo);
  }
  
  // Add photos from photos array if it exists
  if (report.photos && report.photos.length > 0) {
    report.photos.forEach(photo => {
      if (typeof photo === 'string') {
        // If it's a string URL, add it directly
        if (!photos.includes(photo)) { // Avoid duplicates
          photos.push(photo);
        }
      } else if (typeof photo === 'object' && photo.url) {
        // If it's an object with url property, add the URL
        if (!photos.includes(photo.url)) { // Avoid duplicates
          photos.push(photo.url);
        }
      }
    });
  }
  
  return photos;
};

/**
 * Get the number of photos in a report
 * @param {Object} report - The report object
 * @returns {number} - The total number of photos
 */
export const getPhotoCount = (report) => {
  return getAllPhotos(report).length;
};

/**
 * Check if a report has multiple photos
 * @param {Object} report - The report object
 * @returns {boolean} - True if report has multiple photos
 */
export const hasMultiplePhotos = (report) => {
  return getPhotoCount(report) > 1;
};

/**
 * Get photos for display in a grid (with limit)
 * @param {Object} report - The report object
 * @param {number} limit - Maximum number of photos to return
 * @returns {Array} - Array of photo URLs (limited)
 */
export const getPhotosForDisplay = (report, limit = 4) => {
  const allPhotos = getAllPhotos(report);
  return allPhotos.slice(0, limit);
};

/**
 * Get remaining photo count after displaying initial photos
 * @param {Object} report - The report object
 * @param {number} displayedCount - Number of photos already displayed
 * @returns {number} - Number of remaining photos
 */
export const getRemainingPhotoCount = (report, displayedCount = 1) => {
  const totalCount = getPhotoCount(report);
  return Math.max(0, totalCount - displayedCount);
};
