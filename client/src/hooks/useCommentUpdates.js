import { useEffect, useCallback, useRef } from 'react';
import { useCommentContext } from '../contexts/CommentContext';

export const useCommentUpdates = (reportId, onUpdate) => {
  const { commentUpdates, clearReportUpdates } = useCommentContext();
  const lastUpdateRef = useRef(null);

  const handleCommentUpdate = useCallback((update) => {
    if (update && onUpdate && reportId) {
      // Prevent duplicate updates
      if (lastUpdateRef.current === update.timestamp) {
        return;
      }
      
      // Only process updates for the specific report
      if (update.action && ['commentAdded', 'commentDeleted', 'replyAdded', 'commentEdited'].includes(update.action)) {
        lastUpdateRef.current = update.timestamp;
        onUpdate(update);
      }
    }
  }, [onUpdate, reportId]);

  useEffect(() => {
    const update = commentUpdates[reportId];
    if (update) {
      handleCommentUpdate(update);
    }
  }, [commentUpdates, reportId, handleCommentUpdate]);

  // Cleanup function to clear updates when component unmounts
  useEffect(() => {
    return () => {
      if (reportId && clearReportUpdates) {
        clearReportUpdates(reportId);
      }
    };
  }, [reportId, clearReportUpdates]);

  return commentUpdates[reportId];
};
