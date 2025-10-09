// Temporary registration storage
// This holds registration data until email verification is complete

const tempRegistrations = new Map();

// Store temporary registration data
export const storeTempRegistration = (email, registrationData) => {
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  tempRegistrations.set(tempId, {
    ...registrationData,
    email,
    tempId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes expiry
  });
  
  return tempId;
};

// Get temporary registration data
export const getTempRegistration = (tempId) => {
  const registration = tempRegistrations.get(tempId);
  
  if (!registration) {
    return null;
  }
  
  // Check if expired
  if (new Date() > registration.expiresAt) {
    tempRegistrations.delete(tempId);
    return null;
  }
  
  return registration;
};

// Remove temporary registration data
export const removeTempRegistration = (tempId) => {
  tempRegistrations.delete(tempId);
};

// Clean up expired registrations
export const cleanupExpiredRegistrations = () => {
  const now = new Date();
  for (const [tempId, registration] of tempRegistrations.entries()) {
    if (now > registration.expiresAt) {
      tempRegistrations.delete(tempId);
    }
  }
};

// Get registration count (for monitoring)
export const getTempRegistrationCount = () => {
  return tempRegistrations.size;
};

// Clean up expired registrations every 5 minutes
setInterval(cleanupExpiredRegistrations, 5 * 60 * 1000);
