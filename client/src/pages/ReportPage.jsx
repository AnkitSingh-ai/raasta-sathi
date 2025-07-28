import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Shield, 
  Construction, 
  Car, 
  Cloud, 
  Crown,
  MapPin,
  Camera,
  Send,
  CheckCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';

export function ReportPage() {
  const { t } = useLanguage();
  const [selectedType, setSelectedType] = useState<string>('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportTypes = [
    { id: 'accident', label: t('report.accident'), icon: AlertTriangle, color: 'red' },
    { id: 'police', label: t('report.police'), icon: Shield, color: 'blue' },
    { id: 'pothole', label: t('report.pothole'), icon: AlertTriangle, color: 'orange' },
    { id: 'construction', label: t('report.construction'), icon: Construction, color: 'yellow' },
    { id: 'congestion', label: t('report.congestion'), icon: Car, color: 'purple' },
    { id: 'closure', label: t('report.closure'), icon: AlertTriangle, color: 'gray' },
    { id: 'weather', label: t('report.weather'), icon: Cloud, color: 'cyan' },
    { id: 'vip', label: t('report.vip'), icon: Crown, color: 'pink' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedType || !location || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Report submitted successfully! +10 points earned');
    
    // Reset form
    setSelectedType('');
    setLocation('');
    setDescription('');
    setSeverity('medium');
    setIsSubmitting(false);
  };

  const getColorClasses = (color, selected) => {
    const colors = {
      red: selected ? 'bg-red-100 border-red-300 text-red-700' : 'border-red-200 hover:border-red-300 text-red-600',
      blue: selected ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-blue-200 hover:border-blue-300 text-blue-600',
      orange: selected ? 'bg-orange-100 border-orange-300 text-orange-700' : 'border-orange-200 hover:border-orange-300 text-orange-600',
      yellow: selected ? 'bg-yellow-100 border-yellow-300 text-yellow-700' : 'border-yellow-200 hover:border-yellow-300 text-yellow-600',
      purple: selected ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-purple-200 hover:border-purple-300 text-purple-600',
      gray: selected ? 'bg-gray-100 border-gray-300 text-gray-700' : 'border-gray-200 hover:border-gray-300 text-gray-600',
      cyan: selected ? 'bg-cyan-100 border-cyan-300 text-cyan-700' : 'border-cyan-200 hover:border-cyan-300 text-cyan-600',
      pink: selected ? 'bg-pink-100 border-pink-300 text-pink-700' : 'border-pink-200 hover:border-pink-300 text-pink-600'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Report Traffic Issue</h1>
          <p className="text-lg text-slate-600">Help your community by reporting real-time traffic conditions</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Report Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Report Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-4">
                    What type of issue are you reporting? *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {reportTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = selectedType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setSelectedType(type.id)}
                          className={`p-4 rounded-xl border-2 transition-all text-center ${
                            getColorClasses(type.color, isSelected)
                          }`}
                        >
                          <Icon className="h-6 w-6 mx-auto mb-2" />
                          <span className="text-sm font-medium block">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter location or use current location"
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    📍 Use current location
                  </button>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Severity Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['low', 'medium', 'high'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSeverity(level)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                          severity === level
                            ? level === 'low' ? 'bg-green-100 border-green-300 text-green-700'
                              : level === 'medium' ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                              : 'bg-red-100 border-red-300 text-red-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about the traffic condition..."
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Add Photo (Optional)
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-slate-400 transition-colors">
                    <Camera className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB</p>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Send className="h-5 w-5" />
                      <span>Submit Report</span>
                    </div>
                  )}
                </button>
              </form>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Reporting Tips</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-600">Be specific about the exact location</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-600">Include photos when possible</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-600">Report safely - don't use while driving</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-600">Update if situation changes</p>
                </div>
              </div>
            </motion.div>

            {/* Reward Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl border border-blue-200 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Earn Rewards</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Verified Report</span>
                  <span className="text-sm font-semibold text-green-600">+10 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">With Photo</span>
                  <span className="text-sm font-semibold text-blue-600">+5 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Community Upvotes</span>
                  <span className="text-sm font-semibold text-purple-600">+1 pt each</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}