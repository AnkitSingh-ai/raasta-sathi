import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navigation, MapPin, Globe2, User, Menu, X, LogOut, Bell, Settings, Search, Route, HelpCircle, Award, Trophy, BarChart3, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export function Header() {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Define navigation items based on user role
  const getNavItems = () => {
    const baseItems = [
      { path: '/', label: t('nav.home'), public: true },
      { path: '/map', label: t('nav.map'), public: true },
      { path: '/search', label: 'Search', public: true, icon: Search }
    ];

    if (!user) return baseItems;

    // Citizen-specific items
    if (user.role === 'citizen') {
      return [
        ...baseItems,
        { path: '/path-scan', label: 'Path Scan', protected: true, icon: Route },
        { path: '/report', label: t('nav.report'), protected: true },
        { path: '/helper', label: 'Helper', protected: true, icon: HelpCircle }
      ];
    }

    // Service provider items
    if (user.role === 'service_provider') {
      return [
        ...baseItems,
        { path: '/service-provider', label: 'Service Requests', authority: true },
        { path: '/report', label: t('nav.report'), protected: true }
      ];
    }

    // Police users - only basic navigation + report
    if (user.role === 'police') {
      return [
        ...baseItems,
        { path: '/report', label: t('nav.report'), protected: true }
      ];
    }

    // Municipal authority users get full access
    if (user.role === 'municipal') {
      return [
        ...baseItems,
        { path: '/report', label: t('nav.report'), protected: true },
        { path: '/dashboard', label: t('nav.dashboard'), authority: true },
        { path: '/analytics', label: t('nav.analytics'), authority: true }
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  // Mock notifications based on user role
  const getNotifications = () => {
    if (!user) return [];

    if (user.role === 'citizen') {
      return [
        {
          id: 1,
          type: 'accident',
          message: 'Traffic accident reported 500m from your location',
          time: '2 mins ago',
          severity: 'high'
        },
        {
          id: 2,
          type: 'helper',
          message: 'Emergency service request accepted by provider',
          time: '15 mins ago',
          severity: 'medium'
        }
      ];
    }

    if (user.role === 'service_provider') {
      return [
        {
          id: 1,
          type: 'request',
          message: 'New ambulance service request in your area',
          time: '1 min ago',
          severity: 'high'
        },
        {
          id: 2,
          type: 'completed',
          message: 'Service completed - payment received',
          time: '30 mins ago',
          severity: 'low'
        }
      ];
    }

    // Authority notifications (police, municipal)
    return [
      {
        id: 1,
        type: 'urgent',
        message: 'High priority accident report requires verification',
        time: '1 min ago',
        severity: 'high'
      },
      {
        id: 2,
        type: 'report',
        message: '15 new reports pending verification',
        time: '10 mins ago',
        severity: 'medium'
      }
    ];
  };

  const notifications = getNotifications();

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const canAccessRoute = (item) => {
    if (item.public) return true;
    if (!user) return false;
    if (item.authority && user.role === 'citizen') return false;
    return true;
  };

  const getUserRoleDisplay = () => {
    if (!user) return '';
    switch (user.role) {
      case 'citizen': return 'Citizen Reporter';
      case 'police': return 'Traffic Police';
      case 'municipal': return 'Municipal Authority';
      case 'service_provider': return 'Service Provider';
      default: return 'User';
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="relative">
              <Navigation className="h-8 w-8 text-blue-600" />
              <MapPin className="h-4 w-4 text-green-500 absolute -bottom-1 -right-1" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Raasta Sathi
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              if (!canAccessRoute(item)) return null;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors hover:text-blue-600 flex items-center space-x-1 ${
                    location.pathname === item.path
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                      : 'text-slate-600'
                  }`}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Globe2 className="h-4 w-4" />
              <span className="text-sm font-medium">{language.toUpperCase()}</span>
            </button>

            {/* Notifications */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-200">
                      <h3 className="font-semibold text-slate-900">Notifications</h3>
                      <p className="text-xs text-slate-500">
                        {user.role === 'citizen' ? 'Updates and alerts' : 
                         user.role === 'service_provider' ? 'Service requests' : 'System notifications'}
                      </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div key={notification.id} className="px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0">
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.severity === 'high' ? 'bg-red-500' :
                              notification.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <div className="flex-1">
                              <p className="text-sm text-slate-900">{notification.message}</p>
                              <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-slate-200">
                      <Link
                        to="/profile?tab=notifications"
                        onClick={() => setShowNotifications(false)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Notification settings →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Menu or Login Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">
                      {user.role === 'citizen' ? `${user.points} pts • ${user.badge}` : getUserRoleDisplay()}
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-lg">
                    {user.avatar || <User className="h-5 w-5 text-white" />}
                  </div>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-200">
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                      <p className="text-xs text-slate-400 capitalize mt-1">
                        {getUserRoleDisplay()} Account
                      </p>
                    </div>
                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Profile Settings
                      </Link>

                      {/* Quick Access Options for Citizens */}
                      {user.role === 'citizen' && (
                        <>
                          <div className="px-4 py-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quick Access</p>
                          </div>
                          <Link
                            to="/profile?tab=achievements"
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Award className="h-4 w-4" />
                            <span>My Achievements</span>
                          </Link>
                          <Link
                            to="/profile?tab=leaderboard"
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Trophy className="h-4 w-4" />
                            <span>Leaderboard</span>
                          </Link>
                          <Link
                            to="/profile?tab=notifications"
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Bell className="h-4 w-4" />
                            <span>Notifications</span>
                          </Link>
                        </>
                      )}

                      {user.role === 'service_provider' && (
                        <Link
                          to="/service-provider"
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Service Dashboard
                        </Link>
                      )}

                      {/* Quick Access for Police and Municipal */}
                      {(user.role === 'police' || user.role === 'municipal') && (
                        <>
                          <div className="px-4 py-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quick Access</p>
                          </div>
                          <Link
                            to="/dashboard"
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Shield className="h-4 w-4" />
                            <span>Authority Dashboard</span>
                          </Link>
                          {user.role === 'municipal' && (
                            <Link
                              to="/analytics"
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <BarChart3 className="h-4 w-4" />
                              <span>Analytics & Reports</span>
                            </Link>
                          )}
                          <Link
                            to="/profile?tab=notifications"
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Bell className="h-4 w-4" />
                            <span>Notifications</span>
                          </Link>
                        </>
                      )}

                      <div className="border-t border-slate-200 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-900"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            <nav className="space-y-2">
              {navItems.map((item) => {
                if (!canAccessRoute(item)) return null;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.icon && <item.icon className="h-5 w-5" />}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              {!user && (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        ></div>
      )}
    </header>
  );
}