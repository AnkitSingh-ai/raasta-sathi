import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Navigation, 
  MapPin, 
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
  Building,
  Car,
  AlertTriangle,
  Wrench
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'citizen'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      login(formData.email, formData.password, formData.role, formData.name);
      
      const welcomeMessage = formData.role === 'citizen' 
        ? 'Welcome back!' 
        : `Welcome, ${formData.role === 'police' ? 'Officer' : 
            formData.role === 'municipal' ? 'Municipal Authority' : 'Service Provider'}!`;
      
      toast.success(isLogin ? welcomeMessage : 'Account created successfully!');
      
      // Redirect based on role
      if (formData.role === 'citizen') {
        navigate('/');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const features = [
    { icon: Users, text: 'Join 50,000+ active reporters' },
    { icon: Shield, text: 'Verified by traffic authorities' },
    { icon: CheckCircle, text: 'Real-time incident updates' },
    { icon: MapPin, text: 'Hyperlocal traffic intelligence' }
  ];

  const roleFeatures = {
    citizen: [
      { icon: AlertTriangle, text: 'Report traffic incidents instantly' },
      { icon: MapPin, text: 'Get location-based notifications' },
      { icon: CheckCircle, text: 'Earn points and badges' },
      { icon: Users, text: 'Join community leaderboard' }
    ],
    police: [
      { icon: Shield, text: 'Verify and manage reports' },
      { icon: Car, text: 'Monitor traffic conditions' },
      { icon: Building, text: 'Access authority dashboard' },
      { icon: CheckCircle, text: 'Real-time incident management' }
    ],
    municipal: [
      { icon: Building, text: 'Municipal authority access' },
      { icon: AlertTriangle, text: 'Infrastructure monitoring' },
      { icon: CheckCircle, text: 'Report validation system' },
      { icon: MapPin, text: 'City-wide analytics' }
    ],
    service_provider: [
      { icon: Wrench, text: 'Emergency service coordination' },
      { icon: Shield, text: 'Priority service requests' },
      { icon: Car, text: 'Route optimization' },
      { icon: CheckCircle, text: 'Real-time service alerts' }
    ]
  };

  const quickLoginOptions = [
    { role: 'citizen', label: 'Citizen Login', icon: Users, color: 'blue' },
    { role: 'police', label: 'Police Login', icon: Shield, color: 'green' },
    { role: 'municipal', label: 'Municipal Login', icon: Building, color: 'purple' },
    { role: 'service_provider', label: 'Service Provider', icon: Wrench, color: 'red' }
  ];

  const handleQuickLogin = (role) => {
    setFormData({
      ...formData,
      role,
      email: `demo.${role}@raastasathi.com`,
      password: 'demo123'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white space-y-8 lg:pr-8"
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Navigation className="h-12 w-12 text-white" />
              <MapPin className="h-6 w-6 text-green-300 absolute -bottom-1 -right-1" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Raasta Sathi</h1>
              <p className="text-blue-100">राास्ता साथी</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold leading-tight">
              Real-time Traffic Intelligence for Smarter Commutes
            </h2>
            <p className="text-xl text-blue-100 leading-relaxed">
              Join thousands of citizens, police officers, and authorities in creating 
              a collaborative traffic reporting ecosystem.
            </p>
          </div>

          <div className="space-y-4">
            {(roleFeatures[formData.role] || features).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-blue-100">{feature.text}</span>
                </motion.div>
              );
            })}
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">50K+</div>
                <div className="text-sm text-blue-200">Active Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold">25K+</div>
                <div className="text-sm text-blue-200">Monthly Reports</div>
              </div>
              <div>
                <div className="text-2xl font-bold">95%</div>
                <div className="text-sm text-blue-200">Accuracy Rate</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Join Raasta Sathi'}
            </h3>
            <p className="text-slate-600">
              {isLogin 
                ? 'Sign in to continue reporting and earning rewards' 
                : 'Create your account to start contributing to safer roads'
              }
            </p>
          </div>

          {/* Quick Login Options */}
          {isLogin && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-900 mb-3">Quick Demo Login:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickLoginOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.role}
                      onClick={() => handleQuickLogin(option.role)}
                      className={`flex items-center space-x-2 p-2 rounded-lg border-2 transition-all text-xs ${
                        formData.role === option.role
                          ? `border-${option.color}-300 bg-${option.color}-50 text-${option.color}-700`
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Account Type
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="citizen">🚗 Citizen Reporter</option>
                <option value="police">👮‍♂️ Traffic Police Officer</option>
                <option value="municipal">🏛️ Municipal Authority</option>
                <option value="service_provider">🔧 Service Provider</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {formData.role === 'citizen' && 'Report incidents, earn points, and help your community'}
                {formData.role === 'police' && 'Verify reports, manage traffic, access authority dashboard'}
                {formData.role === 'municipal' && 'Monitor infrastructure, validate reports, city analytics'}
                {formData.role === 'service_provider' && 'Provide emergency services, respond to citizen requests'}
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-blue-600 hover:text-blue-700 font-semibold"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>

          {isLogin && (
            <div className="mt-6 text-center">
              <button className="text-sm text-slate-500 hover:text-slate-700">
                Forgot your password?
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              By continuing, you agree to our Terms of Service and Privacy Policy. 
              Your data is secure and used only for traffic intelligence purposes.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}