import React, { createContext, useContext, useState, useCallback } from 'react';

const CommentContext = createContext();

export const useCommentContext = () => {
  const context = useContext(CommentContext);
  if (!context) {
    throw new Error('useCommentContext must be used within a CommentProvider');
  }
  return context;
};

export const CommentProvider = ({ children }) => {
  const [commentUpdates, setCommentUpdates] = useState({});
  const [globalCommentCounts, setGlobalCommentCounts] = useState({});

  // Simple function to trigger comment updates
  const triggerCommentUpdate = useCallback((reportId, action, data) => {
    console.log('CommentContext: triggerCommentUpdate called with:', { reportId, action, data });
    
    setCommentUpdates(prev => ({
      ...prev,
      [reportId]: {
        action,
        data,
        timestamp: Date.now()
      }
    }));
  }, []);

  // Function to update global comment counts
  const updateGlobalCommentCount = useCallback((reportId, count) => {
    setGlobalCommentCounts(prev => {
      if (prev[reportId] === count) {
        return prev;
      }
      return {
        ...prev,
        [reportId]: count
      };
    });
  }, []);

  // Function to get comment count for a report
  const getCommentCount = useCallback((reportId) => {
    return globalCommentCounts[reportId] || 0;
  }, [globalCommentCounts]);

  // Function to clear updates for a specific report
  const clearReportUpdates = useCallback((reportId) => {
    setCommentUpdates(prev => {
      const newUpdates = { ...prev };
      delete newUpdates[reportId];
      return newUpdates;
    });
  }, []);

  const value = {
    commentUpdates,
    globalCommentCounts,
    triggerCommentUpdate,
    updateGlobalCommentCount,
    getCommentCount,
    clearReportUpdates
  };

  return (
    <CommentContext.Provider value={value}>
      {children}
    </CommentContext.Provider>
  );
};
