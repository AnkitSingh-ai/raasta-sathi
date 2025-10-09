import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import apiService from '../utils/api';
import toast from 'react-hot-toast';

const ReportContext = createContext();

export function ReportProvider({ children }) {
  const { user } = useAuth();
  const [reportStates, setReportStates] = useState(new Map()); // Map of reportId -> { likes: [], viewedBy: [], views: number }

  // Update report state across all instances
  const updateReportState = useCallback((reportId, updates) => {
    setReportStates(prev => {
      const newMap = new Map(prev);
      const currentState = newMap.get(reportId) || { likes: [], viewedBy: [], views: 0 };
      newMap.set(reportId, { ...currentState, ...updates });
      return newMap;
    });
  });

  // Check if current user has liked a report
  const isUserLiked = useCallback((reportId) => {
    if (!user) return false;
    
    const reportState = reportStates.get(reportId);
    if (!reportState || !reportState.likes) return false;
    
    // Ensure likes is an array
    if (!Array.isArray(reportState.likes)) return false;
    
    return reportState.likes.some(like => 
      (like._id && like._id === user._id) || 
      (like.id && like.id === user._id) ||
      (like.userId && like.userId === user._id)
    );
  }, [user, reportStates]);

  // Check if current user has viewed a report
  const isUserViewed = useCallback((reportId) => {
    if (!user) return false;
    
    const reportState = reportStates.get(reportId);
    if (!reportState || !reportState.viewedBy) return false;
    
    // Ensure viewedBy is an array
    if (!Array.isArray(reportState.viewedBy)) return false;
    
    return reportState.viewedBy.some(viewer => 
      (viewer._id && viewer._id === user._id) || 
      (viewer.id && viewer.id === user._id) ||
      (viewer.userId && viewer.userId === user._id)
    );
  }, [user, reportStates]);

  // Get like count for a report
  const getLikeCount = useCallback((reportId) => {
    const reportState = reportStates.get(reportId);
    if (!reportState || !reportState.likes) return 0;
    
    // Ensure likes is an array
    if (!Array.isArray(reportState.likes)) return 0;
    
    return reportState.likes.length;
  }, [reportStates]);

  // Get view count for a report
  const getViewCount = useCallback((reportId) => {
    const reportState = reportStates.get(reportId);
    if (!reportState) return 0;
    return reportState.views || 0;
  }, [reportStates]);

  // Handle like/unlike
  const handleLike = useCallback(async (reportId) => {
    if (!user) {
      toast.error('Please login to like reports');
      return;
    }

    try {
      // Optimistically update UI
      const isCurrentlyLiked = isUserLiked(reportId);
      const currentState = reportStates.get(reportId) || { likes: [], viewedBy: [], views: 0 };
      
      console.log('HandleLike - Current state for report:', reportId, {
        currentState,
        currentLikes: currentState.likes,
        isArray: Array.isArray(currentState.likes)
      });
      
      // Ensure likes is always an array
      const currentLikes = Array.isArray(currentState.likes) ? currentState.likes : [];
      
      if (isCurrentlyLiked) {
        // Remove like
        const updatedLikes = currentLikes.filter(like => 
          !((like._id && like._id === user._id) || 
            (like.id && like.id === user._id) ||
            (like.userId && like.userId === user._id))
        );
        updateReportState(reportId, { likes: updatedLikes });
      } else {
        // Add like - ensure user can only like once
        const userAlreadyLiked = currentLikes.some(like => 
          (like._id && like._id === user._id) || 
          (like.id && like.id === user._id) ||
          (like.userId && like.userId === user._id)
        );
        
        if (!userAlreadyLiked) {
          const newLike = { _id: user._id, likedAt: new Date(), id: user._id };
          updateReportState(reportId, { likes: [...currentLikes, newLike] });
        }
      }

      // Call backend API
      const response = await apiService.likeReport(reportId);
      
      // Update with actual backend data
      if (response.data) {
        updateReportState(reportId, { 
          likes: response.data.likes || [],
          isLiked: response.data.isLiked || false
        });
      }

      toast.success(isCurrentlyLiked ? 'Like removed!' : 'Report liked!');
    } catch (error) {
      // Revert optimistic update on error
      toast.error('Failed to update like. Please try again.');
      console.error('Like error:', error);
    }
  }, [user, reportStates, isUserLiked, updateReportState]);

  // Handle view increment - only once per user per report
  const handleViewIncrement = useCallback((reportId) => {
    if (!user) return; // Silent return for non-logged users

    const currentState = reportStates.get(reportId) || { likes: [], viewedBy: [], views: 0 };
    
    // Ensure viewedBy is always an array
    const currentViewedBy = Array.isArray(currentState.viewedBy) ? currentState.viewedBy : [];
    
    // Check if user already viewed
    const userAlreadyViewed = currentViewedBy.some(viewer => 
      (viewer._id && viewer._id === user._id) || 
      (viewer.id && viewer.id === user._id) ||
      (viewer.userId && viewer.userId === user._id)
    );
    
    if (!userAlreadyViewed) {
      // Add user to viewedBy and increment view count
      const newViewer = { _id: user._id, viewedAt: new Date(), id: user._id };
      updateReportState(reportId, {
        viewedBy: [...currentViewedBy, newViewer],
        views: (currentState.views || 0) + 1
      });
    }
  }, [user, reportStates, updateReportState]);

  // Initialize report state from existing data
  const initializeReportState = useCallback((report) => {
    if (!report || !report._id) return;
    
    const reportId = report._id;
    const existingState = reportStates.get(reportId);
    
    if (!existingState) {
      console.log('Initializing report state for:', reportId, {
        originalLikes: report.likes,
        originalViewedBy: report.viewedBy,
        originalViews: report.views
      });
      
      updateReportState(reportId, {
        likes: Array.isArray(report.likes) ? report.likes : (report.likes ? [report.likes] : []),
        viewedBy: Array.isArray(report.viewedBy) ? report.viewedBy : (report.viewedBy ? [report.viewedBy] : []),
        views: report.views || 0
      });
    }
  }, [reportStates, updateReportState]);

  // Initialize multiple reports
  const initializeReports = useCallback((reports) => {
    if (!Array.isArray(reports)) return;
    
    reports.forEach(report => {
      if (report && report._id) {
        initializeReportState(report);
      }
    });
  }, [initializeReportState]);

  const value = {
    reportStates,
    isUserLiked,
    isUserViewed,
    getLikeCount,
    getViewCount,
    handleLike,
    handleViewIncrement,
    initializeReportState,
    initializeReports,
    updateReportState
  };

  return (
    <ReportContext.Provider value={value}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
}
