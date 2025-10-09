import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Shield, Info, Clock, MapPin } from 'lucide-react';

export function DisclaimerPage() {
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-6">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Disclaimer
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Important information about the use of Raasta Sathi and limitations of our services
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* General Disclaimer */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200/60">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">General Disclaimer</h2>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              The information provided on Raasta Sathi is for general informational purposes only. 
              While we strive to keep the information up to date and correct, we make no representations 
              or warranties of any kind, express or implied, about the completeness, accuracy, reliability, 
              suitability, or availability of the information, products, services, or related graphics 
              contained on the platform for any purpose.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Any reliance you place on such information is therefore strictly at your own risk. 
              In no event will we be liable for any loss or damage including without limitation, 
              indirect or consequential loss or damage, arising from loss of data or profits 
              arising out of, or in connection with, the use of this platform.
            </p>
          </section>

          {/* Traffic Information */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200/60">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Traffic Information Disclaimer</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Real-Time Nature</h3>
                <p className="text-sm text-blue-700">
                  Traffic reports and information are submitted by users and may not always reflect 
                  current conditions. Information can become outdated quickly due to the dynamic 
                  nature of traffic situations.
                </p>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h3 className="font-semibold text-yellow-900 mb-2">User-Generated Content</h3>
                <p className="text-sm text-yellow-700">
                  Reports are submitted by community members and may contain inaccuracies or errors. 
                  We do not verify the accuracy of every report and cannot guarantee their reliability.
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">Emergency Situations</h3>
                <p className="text-sm text-green-700">
                  This platform is not a substitute for emergency services. In case of accidents 
                  or emergencies, always contact appropriate authorities (police, ambulance) immediately.
                </p>
              </div>
            </div>
          </section>

          {/* Location Services */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200/60">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Location Services Disclaimer</h2>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              Our location-based services rely on GPS and other location technologies that may not 
              always be accurate. Location accuracy can vary based on:
            </p>
            <ul className="space-y-2 text-slate-600">
              <li>• GPS signal strength and availability</li>
              <li>• Device hardware and software capabilities</li>
              <li>• Environmental factors (buildings, tunnels, etc.)</li>
              <li>• Network connectivity and service provider limitations</li>
            </ul>
            <p className="text-slate-600 leading-relaxed mt-4">
              We are not responsible for any consequences arising from inaccurate location information.
            </p>
          </section>

          {/* User Responsibility */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200/60">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">User Responsibility</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed">
                By using Raasta Sathi, you acknowledge and agree to the following responsibilities:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-2">Safe Usage</h4>
                  <p className="text-sm text-slate-600">
                    Do not use the platform while driving. Always prioritize road safety over 
                    checking traffic updates.
                  </p>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-2">Accurate Reporting</h4>
                  <p className="text-sm text-slate-600">
                    Provide accurate and truthful information when submitting reports. 
                    False reports can mislead other users.
                  </p>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-2">Privacy Respect</h4>
                  <p className="text-sm text-slate-600">
                    Respect the privacy of others. Do not share personal information 
                    or identifiable details in reports.
                  </p>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-2">Legal Compliance</h4>
                  <p className="text-sm text-slate-600">
                    Ensure your use of the platform complies with all applicable laws 
                    and regulations in your jurisdiction.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Service Availability */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200/60">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Service Availability</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              We strive to maintain high service availability, but we do not guarantee uninterrupted 
              access to our platform. Service may be temporarily unavailable due to:
            </p>
            <ul className="mt-3 space-y-2 text-slate-600">
              <li>• Technical maintenance and updates</li>
              <li>• Server issues or network problems</li>
              <li>• Third-party service dependencies</li>
              <li>• Force majeure events beyond our control</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200/60">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Info className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Third-Party Services</h2>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              Our platform may integrate with third-party services such as:
            </p>
            <ul className="space-y-2 text-slate-600 mb-4">
              <li>• Mapping and navigation services</li>
              <li>• Payment gateways</li>
              <li>• Analytics and monitoring tools</li>
              <li>• Communication services</li>
            </ul>
            <p className="text-slate-600 leading-relaxed">
              We are not responsible for the availability, accuracy, or content of these third-party 
              services. Users should review the terms and privacy policies of these services separately.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200/60">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Limitation of Liability</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              To the maximum extent permitted by applicable law, Raasta Sathi and its operators 
              shall not be liable for any direct, indirect, incidental, special, consequential, 
              or punitive damages, including but not limited to:
            </p>
            <ul className="space-y-2 text-slate-600 mb-4">
              <li>• Loss of profits, data, or business opportunities</li>
              <li>• Personal injury or property damage</li>
              <li>• Interruption of service or data loss</li>
              <li>• Any damages resulting from the use of our platform</li>
            </ul>
            <p className="text-slate-600 leading-relaxed">
              This limitation applies regardless of the form of action, whether in contract, tort, 
              negligence, strict liability, or otherwise.
            </p>
          </section>

          {/* Governing Law */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200/60">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Governing Law</h2>
            <p className="text-slate-600 leading-relaxed">
              This disclaimer and the use of Raasta Sathi shall be governed by and construed in 
              accordance with the laws of India. Any disputes arising from the use of our platform 
              shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.
            </p>
          </section>

          {/* Contact Information */}
          <section className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 sm:p-8 border border-orange-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Questions About This Disclaimer?</h2>
            <p className="text-slate-600 mb-4">
              If you have any questions about this disclaimer or our services, 
              please contact us:
            </p>
            <div className="space-y-2 text-sm text-slate-600">
              <p>📧 Email: legal@raastasathi.com</p>
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
