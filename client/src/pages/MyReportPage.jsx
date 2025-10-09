import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  AlertTriangle, 
  Car, 
  Construction, 
  TrafficCone,
  X,
  Plus,
  Search,
  MessageCircle,
  Clock,
  Eye,
  Heart,
  Calendar,
  Edit2 as Edit,
  CheckCircle,
  XCircle,
  Camera,
  BarChart3,
  Shield,
  Cloud,
  Crown,
  Trash2
} from 'lucide-react';
import { getAllPhotos, hasMultiplePhotos, getPhotoCount, getMainPhoto } from '../utils/photoUtils';
import apiService from '../utils/api';
import toast from 'react-hot-toast';
import PhotoGallery from '../components/PhotoGallery';
import CommentSection from '../components/CommentSection';
import LocationButton from '../components/LocationButton';


export function MyReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedReportForComments, setSelectedReportForComments] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [votingReports, setVotingReports] = useState(new Set());
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [selectedReportPhotos, setSelectedReportPhotos] = useState([]);

  useEffect(() => {
    if (user) {
      loadMyReports();
    }
  }, [user]);

  // Listen for comment updates and refresh report data
  useEffect(() => {
    const handleCommentUpdate = (update) => {
      if (update && update.action) {
        // Refresh the specific report data
        if (selectedReport && selectedReport._id === update.reportId) {
          openComments(selectedReport);
        }
        
        // Refresh the main reports list
        loadMyReports();
      }
    };

    // Listen for updates on all reports
    reports.forEach(report => {
      // This part of the code was removed as per the edit hint.
      // useCommentUpdates(report._id, handleCommentUpdate);
    });
  }, [reports, selectedReport]);

  // Listen for comment updates on the selected report for comments
  useEffect(() => {
    // This part of the code was removed as per the edit hint.
    // useCommentUpdates(
    //   selectedReportForComments?._id, 
    //   (update) => {
    //     if (update && update.action) {
    //       // Refresh the comment modal data
    //       if (selectedReportForComments) {
    //         openComments(selectedReportForComments);
    //       }
    //     }
    //   }
    // );
  }, [selectedReportForComments]);

  const loadMyReports = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Check if user is authenticated
      if (!user) {
        console.log('👤 User not authenticated, setting empty reports');
        setReports([]);
        return;
      }
      
      const response = await apiService.getMyReports();
      console.log('📋 Loaded my reports:', response);
      
      // The axios interceptor already extracts response.data, so response is already the data
      // Check if response has a data property (nested response) or is the direct data
      let reportsData;
      if (response && response.data && Array.isArray(response.data.reports)) {
        // Nested response structure: { data: { reports: [...] } }
        reportsData = response.data.reports;
      } else if (response && response.data && Array.isArray(response.data)) {
        // Direct reports array: { data: [...] }
        reportsData = response.data;
      } else if (Array.isArray(response)) {
        // Direct array response
        reportsData = response;
      } else {
        // Fallback to empty array
        reportsData = [];
      }
      
      console.log('📋 Processed reports data:', reportsData);
      setReports(reportsData);
      
      if (isRefresh) {
        toast.success('Reports refreshed successfully!');
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
      
      // Handle specific error types
      if (error.message.includes('Not authorized') || error.message.includes('401')) {
        toast.error('Please login to view your reports');
        setReports([]);
      } else {
        toast.error('Failed to load your reports');
        setReports([]);
      }
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Handle photo gallery opening
  const handlePhotoGalleryOpen = (report) => {
    const photos = getAllPhotos(report);
    setSelectedReportPhotos(photos);
    setShowPhotoGallery(true);
  };

  const handleDeleteReport = async (reportId) => {
    try {
      setIsDeleting(true);
      await apiService.deleteReport(reportId);
      setReports(prev => prev.filter(report => report._id !== reportId));
      toast.success('Report deleted successfully');
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Failed to delete report:', error);
      toast.error('Failed to delete report');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLikeReport = async (reportId) => {
    try {
      const response = await apiService.likeReport(reportId);
      
      setReports(prev => 
        prev.map(report => {
          if (report._id === reportId) {
            const newLiked = !report.userLiked;
            return {
              ...report,
              userLiked: newLiked,
              likes: response.data?.likes || report.likes || []
            };
          }
          return report;
        })
      );
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Failed to like report:', error);
      toast.error('Failed to update like');
    }
  };

  // Handle poll voting with auto-resolution for report creator
  const handlePollVote = async (reportId, choice) => {
    try {
      // Set loading state for this specific report
      setVotingReports(prev => new Set(prev).add(reportId));
      
      // Find the current report to check if user is the creator
      const currentReport = reports.find(r => r._id === reportId);
      const isReportCreator = currentReport && currentReport.reportedBy === user._id;
      
      // Make the API call
      const response = await apiService.voteOnPoll(reportId, choice);
      console.log('Poll vote response:', response);
      
      // Update the report in local state with new poll data
      setReports(prev => 
        prev.map(report => {
          if (report._id === reportId) {
            const updatedReport = {
              ...report,
              poll: response.data?.pollResults || response.poll || report.poll
            };
            
            // Auto-resolve if report creator votes as resolved
            if (isReportCreator && choice === 'resolved') {
              updatedReport.status = 'Resolved';
              toast.success('Report automatically resolved! You marked it as resolved.');
            }
            
            return updatedReport;
          }
          return report;
        })
      );

      // Update the selected report if it's currently displayed
      if (selectedReport && selectedReport._id === reportId) {
        const updatedSelectedReport = {
          ...selectedReport,
          poll: response.data?.pollResults || response.poll || selectedReport.poll
        };
        
        // Auto-resolve if report creator votes as resolved
        if (isReportCreator && choice === 'resolved') {
          updatedSelectedReport.status = 'Resolved';
        }
        
        setSelectedReport(updatedSelectedReport);
      }
      
      // Show success message
      if (isReportCreator && choice === 'resolved') {
        toast.success('Report automatically resolved! You marked it as resolved.');
      } else {
        toast.success('Vote recorded successfully!');
      }
      
    } catch (error) {
      console.error('Failed to vote on poll:', error);
      toast.error('Failed to record vote');
    } finally {
      // Remove loading state
      setVotingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const handleEditReport = async (reportData) => {
    try {
      setIsEditing(true);
      const response = await apiService.updateReport(reportData._id, reportData);
      
      // Update the report in local state
      setReports(prev => 
        prev.map(report => 
          report._id === reportData._id ? response.data?.report || response : report
        )
      );
      
      // Update the selected report if it's currently displayed
      if (selectedReport && selectedReport._id === reportData._id) {
        setSelectedReport(response.data?.report || response);
      }
      
      toast.success('Report updated successfully!');
      setEditingReport(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update report:', error);
      toast.error('Failed to update report');
      setIsEditing(false);
    }
  };

  const openReportDetail = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const openComments = async (report) => {
    try {
      setIsLoadingComments(true);
      // Fetch fresh comments data
      const response = await apiService.getComments(report._id);
      const updatedReport = {
        ...report,
        comments: response.data?.comments || response || []
      };
      
      setSelectedReportForComments(updatedReport);
      setShowCommentsModal(true);
      
      // Update the report in the main list with fresh comments
      setReports(prev => 
        prev.map(r => r._id === report._id ? updatedReport : r)
      );
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      toast.error('Failed to load comments');
      // Still open modal with existing comments
      setSelectedReportForComments(report);
      setShowCommentsModal(true);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      setIsAddingComment(true);
      const response = await apiService.addComment(selectedReportForComments._id, newComment.trim());
      
      // Update the report in local state with the new comment
      setReports(prev => 
        prev.map(report => {
          if (report._id === selectedReportForComments._id) {
            return {
              ...report,
              comments: [...(report.comments || []), response.data?.comment || response]
            };
          }
          return report;
        })
      );
      
      // Update the selected report for comments
      setSelectedReportForComments(prev => ({
        ...prev,
        comments: [...(prev.comments || []), response.data?.comment || response]
      }));
      
      // Update the selected report in detail modal if it's open
      if (selectedReport && selectedReport._id === selectedReportForComments._id) {
        setSelectedReport(prev => ({
          ...prev,
          comments: [...(prev.comments || []), response.data?.comment || response]
        }));
      }
      
      setNewComment('');
      toast.success('Comment added successfully!');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentIndex) => {
    const comment = selectedReportForComments.comments[commentIndex];
    
    // Check if user owns the comment or is admin
    if (comment.user?._id !== user._id && user.role !== 'admin') {
      toast.error('You can only delete your own comments');
      return;
    }

    try {
      // Delete comment from database first
      await apiService.deleteComment(selectedReportForComments._id, comment._id);
      
      // Remove comment from local state after successful database deletion
      const updatedComments = selectedReportForComments.comments.filter((_, index) => index !== commentIndex);
      
      setSelectedReportForComments(prev => ({
        ...prev,
        comments: updatedComments
      }));
      
      // Update the report in the main list
      setReports(prev => 
        prev.map(r => {
          if (r._id === selectedReportForComments._id) {
            return { ...r, comments: updatedComments };
          }
          return r;
        })
      );
      
      // Update the selected report in detail modal if it's open
      if (selectedReport && selectedReport._id === selectedReportForComments._id) {
        setSelectedReport(prev => ({
          ...prev,
          comments: updatedComments
        }));
      }
      
      toast.success('Comment deleted successfully!');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment from database');
    }
  };

  const getIconForType = (type) => {
    const icons = {
      accident: AlertTriangle,
      police: Shield,
      construction: Construction,
      congestion: Car,
      weather: Cloud,
      vip: Crown,
      pothole: AlertTriangle,
      closure: AlertTriangle
    };
    return icons[type] || AlertTriangle;
  };

  const getColorForSeverity = (severity) => {
    const colors = {
      low: 'text-green-600 bg-green-100 border-green-200',
      medium: 'text-yellow-600 bg-yellow-100 border-yellow-200',
      high: 'text-red-600 bg-red-100 border-red-200'
    };
    return colors[severity] || 'text-gray-600 bg-gray-100 border-gray-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      Active: 'bg-yellow-100 text-yellow-800',
      Resolved: 'bg-green-100 text-green-800',
      'Fake Report': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const reportTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'accident', label: 'Accidents' },
    { value: 'pothole', label: 'Potholes' },
    { value: 'construction', label: 'Construction' },
    { value: 'congestion', label: 'Traffic Jams' },
    { value: 'police', label: 'Police Checkpoints' },
    { value: 'weather', label: 'Weather Hazards' },
    { value: 'closure', label: 'Road Closures' },
    { value: 'vip', label: 'VIP Movement' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'Active', label: 'Active' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Fake Report', label: 'Fake Report' }
  ];

  // Ensure reports is always an array
  const reportsArray = Array.isArray(reports) ? reports : [];
  
  // Debug logging
  console.log('🔍 Current reports state:', reports);
  console.log('🔍 Reports type:', typeof reports);
  console.log('🔍 Reports is array:', Array.isArray(reports));
  console.log('🔍 Safe reports array:', reportsArray);
  
  const filteredReports = reportsArray.filter(report => {
    const matchesSearch = searchTerm === '' || 
      (report.title && report.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.location && typeof report.location === 'string' && report.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.location && typeof report.location === 'object' && report.location.address && report.location.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.description && report.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: reportsArray.length,
    active: reportsArray.filter(r => r.status === 'Active').length,
    resolved: reportsArray.filter(r => r.status === 'Resolved').length,
    fake: reportsArray.filter(r => r.status === 'Fake Report').length,
    totalLikes: reportsArray.reduce((sum, r) => sum + (r.likes?.length || 0), 0),
    totalViews: reportsArray.reduce((sum, r) => sum + (r.views || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading your reports...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 pt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Authentication Required</h3>
              <p className="text-slate-600 mb-6">
                Please login to view and manage your reports
              </p>
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Login</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header with Background */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-4 text-white shadow-xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
                <div className="mb-3 lg:mb-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                        My Reports Dashboard
                      </h1>
                      <p className="text-base text-blue-100 max-w-xl">
                        Track, manage, and monitor all your traffic reports in one place. 
                        Get real-time updates and insights about your contributions to road safety.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => loadMyReports(true)}
                    disabled={isRefreshing}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    title="Refresh Reports"
                  >
                    <svg className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-xs lg:text-sm">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                  <Link
                    to="/report"
                    className="flex items-center justify-center space-x-2 px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-bold hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-105"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-xs lg:text-sm">Create New Report</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Compact Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { 
                label: 'Total', 
                value: stats.total, 
                icon: BarChart3, 
                gradient: 'from-blue-500 to-blue-600'
              },
              { 
                label: 'Active', 
                value: stats.active, 
                icon: Clock, 
                gradient: 'from-yellow-500 to-yellow-600'
              },
              { 
                label: 'Resolved', 
                value: stats.resolved, 
                icon: CheckCircle, 
                gradient: 'from-green-500 to-green-600'
              },
              { 
                label: 'Likes', 
                value: stats.totalLikes, 
                icon: Heart, 
                gradient: 'from-red-500 to-red-600'
              },
              { 
                label: 'Views', 
                value: stats.totalViews, 
                icon: Eye, 
                gradient: 'from-indigo-500 to-indigo-600'
              }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group bg-white rounded-lg p-2 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-md bg-gradient-to-r ${stat.gradient} shadow-sm`}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <div className={`text-sm font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                        {stat.value}
                      </div>
                      <p className="text-xs font-medium text-slate-600">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Compact Filters and Search */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6"
        >
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-3">
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md">
                <Search className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Search & Filter</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search reports..."
                    className="w-full pl-8 pr-2.5 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                >
                  {reportTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Active Filters Display */}
            {(searchTerm || filterType !== 'all' || filterStatus !== 'all') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 pt-3 border-t border-slate-200"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-slate-600">Active:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                      <Search className="h-2.5 w-2.5" />
                      <span>"{searchTerm}"</span>
                      <button
                        onClick={() => setSearchTerm('')}
                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </span>
                  )}
                  {filterType !== 'all' && (
                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                      <span>{reportTypes.find(t => t.value === filterType)?.label}</span>
                      <button
                        onClick={() => setFilterType('all')}
                        className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </span>
                  )}
                  {filterStatus !== 'all' && (
                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                      <span>{filterStatus}</span>
                      <button
                        onClick={() => setFilterStatus('all')}
                        className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('all');
                      setFilterStatus('all');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 underline"
                  >
                    Clear All
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Enhanced Reports List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md">
                <BarChart3 className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">Your Reports</h3>
                <p className="text-slate-500 text-xs">Manage and monitor all your traffic reports</p>
              </div>
            </div>
            
            {/* Results Count */}
            <div className="text-right">
              <div className="text-lg font-bold text-slate-800">{filteredReports.length}</div>
              <div className="text-xs text-slate-500">
                {filteredReports.length === 1 ? 'Report' : 'Reports'} found
              </div>
            </div>
          </div>

          {/* Reports Grid - 3 Cards per Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredReports.map((report, index) => {
                const Icon = getIconForType(report.type);
                return (
                  <motion.div
                    key={report._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="group relative bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
                    onClick={() => openReportDetail(report)}
                  >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    

                    
                    <div className="relative z-10 p-3 flex flex-col h-full">
                      {/* Header Section - Fixed Height */}
                      <div className="flex items-start justify-between mb-2 flex-shrink-0">
                        <div className="flex flex-col space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <div className={`p-1.5 rounded-lg ${
                              report.severity === 'high' ? 'bg-red-100 text-red-600' :
                              report.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            
                            {/* Location Button */}
                            <LocationButton 
                              location={report.location} 
                              variant="floating" 
                              size="small"
                            />
                          </div>
                          
                          {/* Title - Below Navigation Icons */}
                          <h3 className="font-semibold text-slate-900 capitalize text-sm line-clamp-2 flex-shrink-0 min-h-[1.25rem]">
                            {report.title || `${report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report`}
                          </h3>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {/* Date and Status Row */}
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs text-slate-500">
                              {report.createdAt 
                                ? new Date(report.createdAt).toLocaleDateString()
                                : 'Date not specified'
                              }
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold shadow-md ${
                              report.status === 'Fake Report'
                                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                                : report.status === 'Resolved' 
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                                : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
                            }`}>
                              {report.status === 'Fake Report' ? '🔴 Fake Report' : report.status === 'Resolved' ? '✅ Resolved' : '🟡 Active'}
                            </span>
                          </div>
                          
                          {/* Action Buttons - Shifted Right */}
                          <div className="flex items-center justify-end space-x-0.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openComments(report);
                              }}
                              disabled={isLoadingComments}
                              className="p-1 text-green-600 hover:bg-green-100 rounded-lg transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="View Comments"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingReport(report);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-300 hover:scale-110"
                              title="Edit Report"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteModal(report._id);
                              }}
                              className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-300 hover:scale-110"
                              title="Delete Report"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Image Section - Slightly Larger Size */}
                      <div className="mb-2 flex-shrink-0">
                        {getMainPhoto(report) ? (
                          <div className="relative">
                            <img 
                              src={apiService.getImageUrl(getMainPhoto(report))} 
                              alt="Report photo" 
                              className="w-full h-20 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                            />
                            
                            {/* Photo count indicator */}
                            {hasMultiplePhotos(report) && (
                              <div className="absolute top-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded-full">
                                +{getPhotoCount(report) - 1}
                              </div>
                            )}
                            
                            {/* View All Photos Button */}
                            {hasMultiplePhotos(report) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handlePhotoGalleryOpen(report); }}
                                className="absolute bottom-1 left-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded-full hover:bg-opacity-90 transition-all"
                              >
                                View All
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="bg-slate-100 rounded-lg h-20 flex items-center justify-center">
                            <div className="text-center text-slate-400">
                              <Camera className="h-4 w-4 mx-auto mb-1" />
                              <p className="text-xs">No image</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Description - Fixed Height */}
                      <div className="mb-2 flex-shrink-0 min-h-[1rem]">
                        {report.description ? (
                          <div className="text-slate-600 text-xs line-clamp-2">
                            {report.description.split('\n').map((line, index) => {
                              if (line.trim() && line.trim() === line.trim().toUpperCase() && line.trim().length > 3) {
                                // This is a heading - make it bold
                                return (
                                  <span key={index} className="font-bold text-slate-700">
                                    {line.trim()}
                                  </span>
                                );
                              } else if (line.trim()) {
                                // This is content
                                return (
                                  <span key={index}>
                                    {line.trim()}
                                  </span>
                                );
                              } else {
                                // Empty line - add space
                                return <span key={index}> </span>;
                              }
                            })}
                          </div>
                        ) : (
                          <div className="h-4"></div>
                        )}
                      </div>
                      
                      {/* Location - Fixed Height */}
                      <div className="mb-2 flex-shrink-0 min-h-[0.75rem]">
                        <p className="text-slate-600 text-xs line-clamp-1">
                          {typeof report.location === 'string' 
                            ? report.location 
                            : report.location?.address || 'Location not specified'
                          }
                        </p>
                      </div>
                      
                      {/* Poll Section - Smaller Size */}
                      <div className="mb-2 flex-shrink-0">
                        <div className="text-xs font-medium text-slate-700 mb-1 flex items-center">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
                          Community Poll
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-1.5 border border-blue-200 shadow-sm">
                          <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                            <div className="text-center">
                              <div className="text-sm font-bold text-red-600">{report.poll?.stillThere || 0}</div>
                              <div className="text-xs text-slate-600">Still There</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-bold text-green-600">{report.poll?.resolved || 0}</div>
                              <div className="text-xs text-slate-600">Resolved</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-bold text-red-600">{report.poll?.notSure || 0}</div>
                              <div className="text-xs text-slate-600">Fake Report</div>
                            </div>
                          </div>
                          
                          {/* Voting Buttons for Active Reports */}
                          {report.status === 'Active' && !report.isExpired && (
                            <div className="grid grid-cols-3 gap-0.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePollVote(report._id, 'stillThere');
                                }}
                                disabled={votingReports.has(report._id)}
                                className="px-1 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200"
                              >
                                {votingReports.has(report._id) ? 'Voting...' : 'Still There'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePollVote(report._id, 'resolved');
                                }}
                                disabled={votingReports.has(report._id)}
                                className="px-1 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 disabled:opacity-50 transition-all duration-200 border border-green-200"
                              >
                                {votingReports.has(report._id) ? 'Voting...' : 'Resolved'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePollVote(report._id, 'notSure');
                                }}
                                disabled={votingReports.has(report._id)}
                                className="px-1 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200"
                              >
                                {votingReports.has(report._id) ? 'Voting...' : 'Fake Report'}
                              </button>
                            </div>
                          )}
                          
                          {/* Poll Statistics */}
                          <div className="text-center text-xs text-slate-600 mt-1.5 pt-1.5 border-t border-blue-200">
                            {(() => {
                              const totalVotes = (report.poll?.stillThere || 0) + (report.poll?.resolved || 0) + (report.poll?.notSure || 0);
                              const resolvedPercentage = totalVotes > 0 ? Math.round(((report.poll?.resolved || 0) / totalVotes) * 100) : 0;
                              return (
                                <>
                                  Total: <span className="text-xs font-medium text-blue-600">{totalVotes}</span>
                                  {totalVotes > 0 && (
                                    <span className="ml-1">
                                      • Resolved: <span className="text-xs font-medium text-green-600">{resolvedPercentage}%</span>
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                      
                      {/* Footer Stats */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 mt-auto">
                        <div className="flex items-center space-x-2 text-xs text-slate-600">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3 text-blue-500" />
                            <span>{report.views || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="h-3 w-3 text-red-500" />
                            <span>{report.likes?.length || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-3 w-3 text-green-500" />
                            <span>{report.comments?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Empty State */}
        {filteredReports.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <AlertTriangle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {reportsArray.length === 0 ? 'No reports yet' : 'No reports match your filters'}
            </h3>
            <p className="text-slate-600 mb-6">
              {reportsArray.length === 0 
                ? 'Start contributing to your community by reporting traffic issues'
                : 'Try adjusting your search terms or filters'
              }
            </p>
            {reportsArray.length === 0 && (
              <Link
                to="/report"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Create Your First Report</span>
              </Link>
            )}
          </motion.div>
        )}

        {/* Report Detail Modal */}
        <AnimatePresence>
          {showDetailModal && selectedReport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowDetailModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Report Details</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Column - Basic Information and Timeline */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Basic Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-slate-600">Type</label>
                          <p className="text-slate-900 capitalize">{selectedReport.type}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Title</label>
                          <p className="text-slate-900">{selectedReport.title || 'No title'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Description</label>
                                                      <div className="text-slate-900 whitespace-pre-line">
                              {selectedReport.description ? 
                                selectedReport.description.split('\n').map((line, index) => {
                                  if (line.trim() && line.trim() === line.trim().toUpperCase() && line.trim().length > 3) {
                                    // This is a heading - make it bold
                                    return (
                                      <div key={index} className="font-bold text-slate-800 mb-2 mt-3 first:mt-0">
                                        {line.trim()}
                                      </div>
                                    );
                                  } else if (line.trim()) {
                                    // This is content - add proper spacing
                                    return (
                                      <div key={index} className="mb-2">
                                        {line.trim()}
                                      </div>
                                    );
                                  } else {
                                    // Empty line - add spacing
                                    return <div key={index} className="mb-3"></div>;
                                  }
                                })
                                : 'No description'
                              }
                            </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Severity</label>
                          <p className="text-slate-900 capitalize">{selectedReport.severity}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Status</label>
                          <p className="text-slate-900 capitalize">{selectedReport.status || 'pending'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Location</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-slate-600">Address</label>
                          <p className="text-slate-900">
                            {typeof selectedReport.location === 'string' 
                              ? selectedReport.location 
                              : selectedReport.location?.address || 'Not specified'
                            }
                          </p>
                        </div>
                        {selectedReport.coordinates && (
                          <div>
                            <label className="text-sm font-medium text-slate-600">Coordinates</label>
                            <p className="text-slate-900">
                              {selectedReport.coordinates.coordinates?.[1]?.toFixed(6)}, {selectedReport.coordinates.coordinates?.[0]?.toFixed(6)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Timeline</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-slate-600">Created</label>
                          <p className="text-slate-900">
                            {selectedReport.createdAt 
                              ? new Date(selectedReport.createdAt).toLocaleString()
                              : 'Not specified'
                            }
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Last Updated</label>
                          <p className="text-slate-900">
                            {selectedReport.updatedAt 
                              ? new Date(selectedReport.updatedAt).toLocaleString()
                              : 'Not specified'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Engagement</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Likes</span>
                          <span className="text-slate-900 font-medium">{selectedReport.likes?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Comments</span>
                          <span className="text-slate-900 font-medium">{selectedReport.comments?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Views</span>
                          <span className="text-slate-900 font-medium">{selectedReport.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Image, Poll, and Comments */}
                  <div className="space-y-6">

                    {/* New Layout: Community Poll First, then Comments - Both take full width */}
                    
                    {/* Photo Section - Enhanced Display */}
                    {getMainPhoto(selectedReport) && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {hasMultiplePhotos(selectedReport) ? 'Report Photos' : 'Report Photo'}
                          </h3>
                          {hasMultiplePhotos(selectedReport) && (
                            <button
                              onClick={() => handlePhotoGalleryOpen(selectedReport)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              View All Photos
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          {/* Main Photo */}
                          <div className="relative">
                            <img 
                              src={apiService.getImageUrl(getMainPhoto(selectedReport))} 
                              alt="Report photo" 
                              className="w-full h-96 object-cover rounded-lg border border-slate-200"
                            />
                            {hasMultiplePhotos(selectedReport) && (
                              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full font-medium">
                                +{getPhotoCount(selectedReport) - 1} more
                              </div>
                            )}
                          </div>
                          
                          {/* Additional Photos Grid - Show up to 3 more photos */}
                          {hasMultiplePhotos(selectedReport) && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">
                                  All Photos ({getPhotoCount(selectedReport)})
                                </span>
                              </div>
                              
                              {/* Photo Grid */}
                              <div className="grid grid-cols-3 gap-2">
                                {getAllPhotos(selectedReport).slice(1, 4).map((photo, index) => (
                                  <div key={index} className="relative">
                                    <img 
                                      src={apiService.getImageUrl(photo)} 
                                      alt={`Photo ${index + 2}`} 
                                      className="w-full h-24 object-cover rounded-lg border border-slate-200"
                                    />
                                    {index === 2 && getPhotoCount(selectedReport) > 4 && (
                                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                        <span className="text-white text-xs font-medium">
                                          +{getPhotoCount(selectedReport) - 4}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Community Poll Section - Larger Size */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">Community Poll</h3>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 border-2 border-blue-200 shadow-sm">
                        <div className="grid grid-cols-3 gap-8 mb-8">
                          <div className="text-center">
                            <div className="text-4xl mb-4">✅</div>
                            <div className="text-3xl font-bold text-blue-600">{selectedReport.poll?.stillThere || 0}</div>
                            <div className="text-base text-slate-500">Still There</div>
                          </div>
                          <div className="text-center">
                            <div className="text-4xl mb-4">🟢</div>
                            <div className="text-3xl font-bold text-green-600">{selectedReport.poll?.resolved || 0}</div>
                            <div className="text-base text-slate-500">Resolved</div>
                          </div>
                          <div className="text-center">
                            <div className="text-4xl mb-4">❌</div>
                            <div className="text-3xl font-bold text-red-600">{selectedReport.poll?.notSure || 0}</div>
                            <div className="text-base text-slate-500">Fake Report</div>
                          </div>
                        </div>
                        
                        {/* Poll Statistics */}
                        <div className="text-center text-lg text-slate-600 mb-8">
                          {(() => {
                            const totalVotes = (selectedReport.poll?.stillThere || 0) + (selectedReport.poll?.resolved || 0) + (selectedReport.poll?.notSure || 0);
                            const resolvedPercentage = totalVotes > 0 ? Math.round(((selectedReport.poll?.resolved || 0) / totalVotes) * 100) : 0;
                            return (
                              <>
                                Total Votes: <span className="font-medium text-xl">{totalVotes}</span>
                                {totalVotes > 0 && (
                                  <span className="ml-3">
                                    • Resolved: <span className="font-medium text-green-600 text-xl">{resolvedPercentage}%</span>
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        
                        {/* Voting Buttons */}
                        {user && selectedReport.status === 'Active' && !selectedReport.isExpired && (
                          <div className="grid grid-cols-3 gap-4">
                            <button
                              onClick={() => handlePollVote(selectedReport._id, 'stillThere')}
                              disabled={votingReports.has(selectedReport._id)}
                              className="px-6 py-3 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300 font-medium"
                            >
                              {votingReports.has(selectedReport._id) ? 'Voting...' : '🚨 Still There'}
                            </button>
                            <button
                              onClick={() => handlePollVote(selectedReport._id, 'resolved')}
                              disabled={votingReports.has(selectedReport._id)}
                              className="px-6 py-3 text-sm bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-all duration-200 border border-green-200 hover:border-green-300 font-medium"
                            >
                              {votingReports.has(selectedReport._id) ? 'Voting...' : '✅ Resolved'}
                            </button>
                            <button
                              onClick={() => handlePollVote(selectedReport._id, 'notSure')}
                              disabled={votingReports.has(selectedReport._id)}
                              className="px-6 py-3 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all duration-200 border border-red-200 hover:border-red-300 font-medium"
                            >
                              {votingReports.has(selectedReport._id) ? 'Voting...' : '❌ Fake Report'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Comments Section - Full Width */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-900">Comments</h3>
                    <button
                      onClick={() => openComments(selectedReport)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      View All ({selectedReport.comments?.length || 0})
                    </button>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-6 min-h-64">
                    {selectedReport.comments && selectedReport.comments.length > 0 ? (
                      <div className="space-y-4">
                        {selectedReport.comments.slice(-6).map((comment, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {comment.user?.name?.charAt(0) || 'A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-slate-900">
                                  {comment.user?.name || 'Anonymous'}
                                </span>
                                <span className="text-xs text-slate-500 ml-2">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <p className="text-slate-700 ml-11">{comment.text}</p>
                          </div>
                        ))}
                        {selectedReport.comments.length > 6 && (
                          <div className="text-center py-3">
                            <p className="text-sm text-slate-500">
                              +{selectedReport.comments.length - 6} more comments
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center text-slate-400">
                          <MessageCircle className="h-12 w-12 mx-auto mb-3" />
                          <p className="text-base">No comments yet</p>
                          <p className="text-sm">Be the first to comment!</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setEditingReport(selectedReport);
                      setShowDetailModal(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Report
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Report Modal */}
        <AnimatePresence>
          {editingReport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setEditingReport(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Edit Report</h2>
                  <button
                    onClick={() => setEditingReport(null)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleEditReport(editingReport);
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                    <select
                      value={editingReport.type || ''}
                      onChange={(e) => setEditingReport({...editingReport, type: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {reportTypes.filter(type => type.value !== 'all').map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title field removed - not required for editing */}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea
                      value={editingReport.description || ''}
                      onChange={(e) => setEditingReport({...editingReport, description: e.target.value})}
                      rows={6}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                      placeholder="Enter report description"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={typeof editingReport.location === 'string' 
                        ? editingReport.location 
                        : editingReport.location?.address || ''
                      }
                      onChange={(e) => setEditingReport({
                        ...editingReport, 
                        location: { 
                          ...editingReport.location, 
                          address: e.target.value 
                        }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter location"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Severity</label>
                    <select
                      value={editingReport.severity || 'medium'}
                      onChange={(e) => setEditingReport({...editingReport, severity: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditingReport(null)}
                      className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isEditing}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          {/* Loader2 icon was removed, so using a placeholder or removing if not needed */}
                          {/* <Loader2 className="h-4 w-4 animate-spin" /> */}
                          <span>Updating...</span>
                        </div>
                      ) : (
                        'Update Report'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteModal(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-md w-full"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Report</h3>
                  <p className="text-slate-600 mb-6">
                    Are you sure you want to delete this report? This action cannot be undone and will remove the report from everywhere in the system.
                  </p>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowDeleteModal(null)}
                      className="flex-1 px-4 py-3 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteReport(showDeleteModal)}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Deleting...</span>
                        </div>
                      ) : (
                        'Delete Report'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {filteredReports.length > 0 && (
          <div className="mt-8 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 px-6 py-3">
              <p className="text-sm text-slate-600">
                Showing {filteredReports.length} of {reportsArray.length} reports
              </p>
            </div>
          </div>
        )}

        {/* Comments Modal */}
        <AnimatePresence>
          {showCommentsModal && selectedReportForComments && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowCommentsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Comments</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openComments(selectedReportForComments)}
                      disabled={isLoadingComments}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh Comments"
                    >
                      <svg className={`w-4 h-4 ${isLoadingComments ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowCommentsModal(false)}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                <CommentSection 
                  reportId={selectedReportForComments._id} 
                  onCommentUpdate={() => {
                    // Refresh the report data after comment update
                    openComments(selectedReportForComments);
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo Gallery Modal */}
        <PhotoGallery
          photos={selectedReportPhotos}
          isOpen={showPhotoGallery}
          onClose={() => setShowPhotoGallery(false)}
        />

      </div>
    </div>
  );
}