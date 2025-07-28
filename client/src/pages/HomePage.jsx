import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  MapPin, 
  Shield, 
  Trophy, 
  AlertTriangle, 
  Navigation,
  Clock,
  Award,
  BarChart3,
  Smartphone,
  Bell,
  Eye,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Footer } from '../components/Footer';

export function HomePage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const features = [
    {
      icon: Users,
      title: t('features.citizen'),
      description: 'Citizens can report traffic incidents, road conditions, and safety concerns in real-time',
      link: '/report',
      linkText: 'Start Reporting',
      color: 'blue'
    },
    {
      icon: Clock,
      title: t('features.realtime'),
      description: 'Live updates on traffic conditions, incidents, and alternative routes for better navigation',
      link: '/map',
      linkText: 'View Live Map',
      color: 'green'
    },
    {
      icon: Shield,
      title: t('features.authority'),
      description: 'Dedicated dashboard for traffic police and municipal authorities to manage reports',
      link: '/dashboard',
      linkText: 'Authority Login',
      color: 'purple'
    },
    {
      icon: Trophy,
      title: t('features.gamification'),
      description: 'Earn points, badges, and recognition for contributing valuable traffic information',
      link: '/leaderboard',
      linkText: 'View Leaderboard',
      color: 'orange'
    }
  ];

  const stats = [
    { number: '50K+', label: 'Active Users', icon: Users },
    { number: '25K+', label: 'Reports Monthly', icon: AlertTriangle },
    { number: '95%', label: 'Accuracy Rate', icon: Award },
    { number: '24/7', label: 'Live Monitoring', icon: Clock }
  ];

  // Recent reports for public view
  const recentReports = [
    {
      id: 1,
      type: 'accident',
      location: 'Connaught Place',
      time: '5 mins ago',
      severity: 'high'
    },
    {
      id: 2,
      type: 'police',
      location: 'India Gate',
      time: '15 mins ago',
      severity: 'medium'
    },
    {
      id: 3,
      type: 'construction',
      location: 'Ring Road',
      time: '1 hour ago',
      severity: 'low'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-green-500/5 to-orange-500/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                {t('hero.title')}
                <span className="block bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  राास्ता साथी
                </span>
              </h1>
              <p className="mt-6 text-xl text-slate-600 leading-relaxed">
                {t('hero.subtitle')}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {user ? (
                  user.role === 'citizen' ? (
                    <Link
                      to="/report"
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      {t('hero.cta')}
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Go to Dashboard
                    </Link>
                  )
                ) : (
                  <Link
                    to="/login"
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Get Started
                  </Link>
                )}
                <Link
                  to="/map"
                  className="px-8 py-4 bg-white text-slate-700 border-2 border-slate-200 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                >
                  View Live Map
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-green-500/5 rounded-2xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <Navigation className="h-6 w-6 text-blue-600" />
                      <span className="font-semibold text-slate-900">Live Traffic Map</span>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-slate-500">Live</span>
                    </div>
                  </div>
                  <div className="bg-slate-100 rounded-lg h-48 flex items-center justify-center mb-4">
                    <MapPin className="h-16 w-16 text-slate-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <span className="text-sm text-red-700">3 Accidents</span>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
                      <Shield className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm text-yellow-700">5 Checkpoints</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl mb-4">
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2">{stat.number}</div>
                <div className="text-slate-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Reports Section - Public View */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Recent Traffic Reports</h2>
            <p className="text-xl text-slate-600">Live updates from our community</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {recentReports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-slate-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${
                    report.severity === 'high' ? 'bg-red-100 text-red-600' :
                    report.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-slate-500">{report.time}</span>
                </div>
                <h3 className="font-semibold text-slate-900 capitalize mb-2">{report.type}</h3>
                <p className="text-slate-600 text-sm">{report.location}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/map"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Eye className="h-5 w-5" />
              <span>View All Reports on Map</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Powerful Features for Smart Traffic Management
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Comprehensive solution connecting citizens, authorities, and emergency services
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 border border-slate-100 group"
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 rounded-xl mb-6`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed mb-4">{feature.description}</p>
                  <Link
                    to={feature.link}
                    className={`inline-flex items-center space-x-2 text-${feature.color}-600 hover:text-${feature.color}-700 font-medium group-hover:translate-x-1 transition-all`}
                  >
                    <span>{feature.linkText}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Join the Movement for Safer Roads
            </h2>
            <p className="text-xl text-blue-100 mb-10 leading-relaxed">
              Be part of a community-driven initiative to make traffic safer and more efficient for everyone
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Sign Up Now
                  </Link>
                  <Link
                    to="/map"
                    className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200"
                  >
                    Explore Map
                  </Link>
                </>
              ) : (
                <>
                  {user.role === 'citizen' && (
                    <Link
                      to="/report"
                      className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Start Reporting Now
                    </Link>
                  )}
                  <Link
                    to="/leaderboard"
                    className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200"
                  >
                    View Leaderboard
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}