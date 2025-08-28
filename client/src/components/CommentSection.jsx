import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Reply, 
  Edit3, 
  Trash2, 
  MoreVertical,
  Hand,
  Clock,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

import { 
  addComment, 
  getComments, 
  likeComment, 
  dislikeComment, 
  removeCommentReaction,
  addReply,
  likeReply,
  dislikeReply,
  removeReplyReaction,
  editComment,
  deleteComment,
  deleteReply
} from '../utils/api';
import { toast } from 'react-hot-toast';

const CommentSection = ({ reportId, onCommentUpdate }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [showReplies, setShowReplies] = useState({});

  // Load comments
  useEffect(() => {
    loadComments();
  }, [reportId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await getComments(reportId);
      const commentsData = response.comments || [];
      setComments(commentsData);
      
      // Update global comment count
      // Comment count updated locally
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // Submit new comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      console.log('CommentSection: Adding comment for report:', reportId);
      const response = await addComment(reportId, newComment.trim());
      setNewComment('');
      await loadComments();
      
      console.log('CommentSection: Comment added successfully');
      
      if (onCommentUpdate) onCommentUpdate();
      toast.success('Comment added successfully!');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  };

  // Handle comment reactions
  const handleCommentReaction = async (commentId, action) => {
    try {
      let response;
      if (action === 'like') {
        response = await likeComment(reportId, commentId);
      } else if (action === 'dislike') {
        response = await dislikeComment(reportId, commentId);
      } else if (action === 'remove') {
        response = await removeCommentReaction(reportId, commentId);
      }

      // Update the specific comment
      setComments(prev => prev.map(comment => 
        comment._id === commentId ? response.comment : comment
      ));
      
      // Don't trigger global updates for reactions (too frequent)
      // Only update local state
    } catch (error) {
      console.error('Failed to handle comment reaction:', error);
      toast.error('Failed to update comment');
    }
  };

  // Handle reply reactions
  const handleReplyReaction = async (commentId, replyId, action) => {
    try {
      let response;
      if (action === 'like') {
        response = await likeReply(reportId, commentId, replyId);
      } else if (action === 'dislike') {
        response = await dislikeReply(reportId, commentId, replyId);
      } else if (action === 'remove') {
        response = await removeReplyReaction(reportId, commentId, replyId);
      }

      // Update the specific comment
      setComments(prev => prev.map(comment => 
        comment._id === commentId ? response.comment : comment
      ));
      
      // Don't trigger global updates for reply reactions (too frequent)
      // Only update local state
    } catch (error) {
      console.error('Failed to handle reply reaction:', error);
      toast.error('Failed to update reply');
    }
  };

  // Submit reply
  const handleSubmitReply = async (commentId) => {
    if (!replyText.trim()) return;

    try {
      await addReply(reportId, commentId, replyText.trim());
      setReplyText('');
      setReplyingTo(null);
      await loadComments();
      
      // Reply added successfully
      
      if (onCommentUpdate) onCommentUpdate();
      toast.success('Reply added successfully!');
    } catch (error) {
      console.error('Failed to add reply:', error);
      toast.error('Failed to add reply');
    }
  };

  // Edit comment
  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return;

    try {
      await editComment(reportId, commentId, editText.trim());
      setEditText('');
      setEditingComment(null);
      await loadComments();
      
      // Comment edited successfully
      
      if (onCommentUpdate) onCommentUpdate();
      toast.success('Comment updated successfully!');
    } catch (error) {
      console.error('Failed to edit comment:', error);
      toast.error('Failed to edit comment');
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteComment(reportId, commentId);
      await loadComments();
      
      // Comment deleted successfully
      
      if (onCommentUpdate) onCommentUpdate();
      toast.success('Comment deleted successfully!');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  // Delete reply
  const handleDeleteReply = async (commentId, replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;

    try {
      await deleteReply(reportId, commentId, replyId);
      await loadComments();
      
      // Reply deleted successfully
      
      if (onCommentUpdate) onCommentUpdate();
      toast.success('Reply deleted successfully!');
    } catch (error) {
      console.error('Failed to delete reply:', error);
      toast.error('Failed to delete reply');
    }
  };

  // Check if user has reacted to comment
  const hasUserReacted = (comment, userId, type) => {
    if (type === 'like') {
      return comment.likes?.some(like => like.user === userId);
    } else if (type === 'dislike') {
      return comment.dislikes?.some(dislike => dislike.user === userId);
    }
    return false;
  };

  // Check if user has reacted to reply
  const hasUserReactedToReply = (reply, userId, type) => {
    if (type === 'like') {
      return reply.likes?.some(like => like.user === userId);
    } else if (type === 'dislike') {
      return reply.dislikes?.some(dislike => dislike.user === userId);
    }
    return false;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Comment Form */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                maxLength="500"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500">
                  {newComment.length}/500 characters
                </span>
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <motion.div
            key={comment._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg p-4 shadow-sm border"
          >
            {/* Comment Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {comment.user?.name || 'Anonymous'}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(comment.createdAt)}</span>
                    {comment.isEdited && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">Edited</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Comment Actions */}
              {user && comment.user?._id === user._id && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingComment(comment._id);
                      setEditText(comment.text);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Comment Content */}
            {editingComment === comment._id ? (
              <div className="mb-3">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  maxLength="500"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-500">
                    {editText.length}/500 characters
                  </span>
                  <div className="space-x-2">
                    <button
                      onClick={() => {
                        setEditingComment(null);
                        setEditText('');
                      }}
                      className="px-3 py-1 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleEditComment(comment._id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 mb-3">{comment.text}</p>
            )}

            {/* Comment Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Like Button */}
                <button
                  onClick={() => handleCommentReaction(
                    comment._id, 
                    hasUserReacted(comment, user?._id, 'like') ? 'remove' : 'like'
                  )}
                  className={`comment-reaction-btn flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
                    hasUserReacted(comment, user?._id, 'like')
                      ? 'liked'
                      : 'neutral'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{comment.likes?.length || 0}</span>
                </button>

                {/* Dislike Button */}
                <button
                  onClick={() => handleCommentReaction(
                    comment._id, 
                    hasUserReacted(comment, user?._id, 'dislike') ? 'remove' : 'dislike'
                  )}
                  className={`comment-reaction-btn flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
                    hasUserReacted(comment, user?._id, 'dislike')
                      ? 'disliked'
                      : 'neutral'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>{comment.dislikes?.length || 0}</span>
                </button>

                {/* Reply Button */}
                <button
                  onClick={() => {
                    setReplyingTo(replyingTo === comment._id ? null : comment._id);
                    setReplyText('');
                  }}
                  className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <Reply className="w-4 h-4" />
                  <span>Reply</span>
                </button>
              </div>

              {/* Show Replies Toggle */}
              {comment.replies && comment.replies.length > 0 && (
                <button
                  onClick={() => setShowReplies(prev => ({
                    ...prev,
                    [comment._id]: !prev[comment._id]
                  }))}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showReplies[comment._id] ? 'Hide' : 'Show'} {comment.replies.length} replies
                </button>
              )}
            </div>

            {/* Reply Form */}
            {replyingTo === comment._id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 ml-8 border-l-2 border-gray-200 pl-4"
              >
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitReply(comment._id);
                }} className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="w-full p-2 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows="2"
                        maxLength="300"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-500">
                          {replyText.length}/300 characters
                        </span>
                        <div className="space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText('');
                            }}
                            className="px-3 py-1 text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={!replyText.trim()}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Replies */}
            <AnimatePresence>
              {showReplies[comment._id] && comment.replies && comment.replies.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 ml-8 space-y-3"
                >
                  {comment.replies.map((reply) => (
                    <motion.div
                      key={reply._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-gray-50 rounded-lg p-3 border-l-2 border-green-200"
                    >
                      {/* Reply Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              {reply.user?.name || 'Anonymous'}
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(reply.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Reply Actions */}
                        {user && reply.user?._id === user._id && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleDeleteReply(comment._id, reply._id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete reply"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Reply Content */}
                      <p className="text-sm text-gray-800 mb-2">{reply.text}</p>

                      {/* Reply Actions */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleReplyReaction(
                            comment._id,
                            reply._id,
                            hasUserReactedToReply(reply, user?._id, 'like') ? 'remove' : 'like'
                          )}
                          className={`comment-reaction-btn flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                            hasUserReactedToReply(reply, user?._id, 'like')
                              ? 'liked'
                              : 'neutral'
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>{reply.likes?.length || 0}</span>
                        </button>

                        <button
                          onClick={() => handleReplyReaction(
                            comment._id,
                            reply._id,
                            hasUserReactedToReply(reply, user?._id, 'dislike') ? 'remove' : 'dislike'
                          )}
                          className={`comment-reaction-btn flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                            hasUserReactedToReply(reply, user?._id, 'dislike')
                              ? 'disliked'
                              : 'neutral'
                          }`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                          <span>{reply.dislikes?.length || 0}</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* No Comments Message */}
      {comments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
