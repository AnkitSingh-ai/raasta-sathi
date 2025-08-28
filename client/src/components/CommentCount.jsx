import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useCommentContext } from '../contexts/CommentContext';

const CommentCount = ({ reportId, initialCount = 0, className = "" }) => {
  const { getCommentCount } = useCommentContext();
  
  // Get the current comment count from context, fallback to initial count
  const commentCount = getCommentCount(reportId) || initialCount;

  return (
    <div className={`flex items-center space-x-1 text-sm text-slate-600 ${className}`}>
      <MessageCircle className="w-4 h-4" />
      <span>{commentCount}</span>
    </div>
  );
};

export default CommentCount;
