import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Cookie, Settings, Eye, Lock } from 'lucide-react';

export function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            to="/" 
            className="inline-flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6">
            <Cookie className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Cookie Policy
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Learn how Raasta Sathi uses cookies and similar technologies to enhance your experience
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* What are Cookies */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200/60">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Cookie className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">What Are Cookies?</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Cookies are small text files that are stored on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences, 
              analyzing how you use our site, and personalizing content.
            </p>
          </section>

          {/* Types of Cookies */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200/60">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Settings className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Types of Cookies We Use</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Essential Cookies</h3>
                  <p className="text-sm text-blue-700">
                    Required for basic website functionality, including authentication and security features.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-2">Functional Cookies</h3>
                  <p className="text-sm text-green-700">
                    Remember your preferences and settings to provide a personalized experience.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-900 mb-2">Analytics Cookies</h3>
                  <p className="text-sm text-yellow-700">
                    Help us understand how visitors interact with our website to improve performance.
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-2">Location Cookies</h3>
                  <p className="text-sm text-purple-700">
                    Store your location preferences to show relevant traffic reports and alerts.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How We Use Cookies */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200/60">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">How We Use Cookies</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-slate-600">
                  <strong>Authentication:</strong> Keep you signed in and secure your account
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-slate-600">
                  <strong>Location Services:</strong> Remember your location preferences for traffic reports
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-slate-600">
                  <strong>User Experience:</strong> Remember your language preferences and settings
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-slate-600">
                  <strong>Performance:</strong> Analyze website usage to improve our services
                </p>
              </div>
            </div>
          </section>

          {/* Cookie Management */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200/60">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Lock className="h-5 w-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Managing Your Cookies</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed">
                You have control over cookies and can manage them through your browser settings. 
                However, disabling certain cookies may affect the functionality of our website.
              </p>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-2">Browser Settings</h4>
                <p className="text-sm text-slate-600 mb-3">
                  Most browsers allow you to control cookies through their settings. Look for:
                </p>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Privacy & Security settings</li>
                  <li>• Cookie preferences</li>
                  <li>• Site data management</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Our Cookie Consent</h4>
                <p className="text-sm text-blue-700">
                  When you first visit our website, you'll see a cookie consent banner. 
                  You can accept all cookies, reject non-essential ones, or customize your preferences.
                </p>
              </div>
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200/60">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Third-Party Cookies</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              We may use third-party services that place cookies on your device. These services help us:
            </p>
            <ul className="mt-3 space-y-2 text-slate-600">
              <li>• Analyze website traffic and performance</li>
              <li>• Provide location and mapping services</li>
              <li>• Enhance security and authentication</li>
              <li>• Improve user experience and functionality</li>
            </ul>
          </section>

          {/* Updates to Policy */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200/60">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Updates to This Policy</h2>
            <p className="text-slate-600 leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in our practices 
              or for other operational, legal, or regulatory reasons. We will notify you of any 
              material changes by posting the new policy on this page.
            </p>
          </section>

          {/* Contact Information */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 border border-blue-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Questions About Cookies?</h2>
            <p className="text-slate-600 mb-4">
              If you have any questions about our use of cookies or this Cookie Policy, 
              please contact us:
            </p>
            <div className="space-y-2 text-sm text-slate-600">
              <p>📧 Email: privacy@raastasathi.com</p>
              <p>📞 Phone: +91-11-XXXX-XXXX</p>
              <p>📍 Address: New Delhi, India</p>
            </div>
          </section>
        </div>

        {/* Last Updated */}
        <div className="text-center mt-12">
          <p className="text-sm text-slate-500">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
