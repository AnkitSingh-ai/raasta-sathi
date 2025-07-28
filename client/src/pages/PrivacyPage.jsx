import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, MapPin, Users, Bell, Settings } from 'lucide-react';

export function PrivacyPage() {
  const sections = [
    {
      title: "Information We Collect",
      icon: Database,
      content: [
        "Account information: Name, email address, phone number, and role (citizen, police, municipal, emergency)",
        "Location data: GPS coordinates when reporting incidents or using location-based features",
        "Report data: Traffic incident descriptions, photos, timestamps, and verification status",
        "Usage data: App interactions, feature usage, and performance analytics",
        "Device information: Device type, operating system, and app version for technical support"
      ]
    },
    {
      title: "How We Use Your Information",
      icon: Settings,
      content: [
        "Provide real-time traffic reporting and incident management services",
        "Verify and validate traffic reports for accuracy and reliability",
        "Send location-based notifications about nearby traffic incidents",
        "Calculate points, badges, and leaderboard rankings for gamification",
        "Improve platform features and user experience through analytics",
        "Communicate important updates, safety alerts, and service announcements"
      ]
    },
    {
      title: "Location Data Privacy",
      icon: MapPin,
      content: [
        "Location data is collected only when you actively report incidents or request location-based services",
        "Precise location coordinates are used for incident mapping and nearby user notifications",
        "Location history is not continuously tracked or stored beyond incident reporting",
        "You can disable location services at any time through your device settings",
        "Location data is anonymized for traffic pattern analysis and urban planning research"
      ]
    },
    {
      title: "Data Sharing and Disclosure",
      icon: Users,
      content: [
        "Traffic incident reports are shared with relevant authorities (police, municipal, emergency services)",
        "Aggregated and anonymized traffic data may be shared with urban planning researchers",
        "Personal information is never sold to third parties or used for commercial advertising",
        "We may disclose information if required by law or to protect user safety",
        "Authority users (police, municipal) have access to reports within their jurisdiction only"
      ]
    },
    {
      title: "Data Security Measures",
      icon: Lock,
      content: [
        "All data transmission is encrypted using industry-standard SSL/TLS protocols",
        "Personal information is stored on secure servers with access controls and monitoring",
        "Regular security audits and vulnerability assessments are conducted",
        "Employee access to personal data is limited and logged for accountability",
        "Data backups are encrypted and stored in secure, geographically distributed locations"
      ]
    },
    {
      title: "Your Privacy Rights",
      icon: Shield,
      content: [
        "Access: Request a copy of all personal data we have about you",
        "Correction: Update or correct inaccurate personal information",
        "Deletion: Request deletion of your account and associated data",
        "Portability: Export your data in a machine-readable format",
        "Opt-out: Disable notifications, location services, or data collection features",
        "Transparency: Understand how your data is used through this privacy policy"
      ]
    },
    {
      title: "Notifications and Communications",
      icon: Bell,
      content: [
        "Push notifications for nearby traffic incidents and safety alerts",
        "Email communications for account updates and important announcements",
        "SMS alerts for emergency situations and critical traffic updates (with consent)",
        "In-app notifications for report status updates and gamification achievements",
        "You can customize notification preferences in your account settings"
      ]
    },
    {
      title: "Data Retention and Deletion",
      icon: Eye,
      content: [
        "Active user accounts and data are retained as long as the account remains active",
        "Traffic incident reports are kept for historical analysis and pattern recognition",
        "Inactive accounts may be deleted after 2 years of no activity with prior notice",
        "You can request immediate account deletion at any time",
        "Some data may be retained in anonymized form for research and safety purposes",
        "Legal requirements may necessitate longer retention periods for certain data types"
      ]
    }
  ];

  const dataTypes = [
    { type: "Personal Information", description: "Name, email, phone number", retention: "Account lifetime", sharing: "Not shared" },
    { type: "Location Data", description: "GPS coordinates for reports", retention: "Report lifetime", sharing: "Authorities only" },
    { type: "Traffic Reports", description: "Incident descriptions and photos", retention: "Permanent (anonymized)", sharing: "Public (anonymized)" },
    { type: "Usage Analytics", description: "App interactions and performance", retention: "2 years", sharing: "Not shared" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Your privacy is important to us. Learn how we collect, use, and protect your information on Raasta Sathi.
          </p>
          <div className="mt-6 text-sm text-slate-500">
            Last updated: January 2024
          </div>
        </motion.div>

        {/* Privacy Commitment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-8 border border-green-200"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Our Privacy Commitment</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <Lock className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-slate-900">Secure by Design</h3>
              <p className="text-sm text-slate-600">End-to-end encryption and secure data handling</p>
            </div>
            <div className="text-center">
              <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-slate-900">Transparent</h3>
              <p className="text-sm text-slate-600">Clear information about data usage and sharing</p>
            </div>
            <div className="text-center">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-slate-900">User Control</h3>
              <p className="text-sm text-slate-600">You control your data and privacy settings</p>
            </div>
          </div>
        </motion.div>

        {/* Data Summary Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Data Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 font-medium text-slate-900">Data Type</th>
                  <th className="text-left py-3 font-medium text-slate-900">Description</th>
                  <th className="text-left py-3 font-medium text-slate-900">Retention</th>
                  <th className="text-left py-3 font-medium text-slate-900">Sharing</th>
                </tr>
              </thead>
              <tbody>
                {dataTypes.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100 last:border-b-0">
                    <td className="py-3 font-medium text-slate-900">{item.type}</td>
                    <td className="py-3 text-slate-600">{item.description}</td>
                    <td className="py-3 text-slate-600">{item.retention}</td>
                    <td className="py-3 text-slate-600">{item.sharing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Privacy Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
                </div>
                <div className="space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-slate-600 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Contact and Rights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-slate-900 rounded-2xl p-8 text-white mt-12 mb-8"
        >
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Exercise Your Rights</h2>
              <p className="text-slate-300 mb-4">
                You have the right to access, correct, or delete your personal data. Contact us to exercise these rights.
              </p>
              <a
                href="mailto:privacy@raastasathi.com"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Privacy Team
              </a>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Data Protection Officer</h2>
              <p className="text-slate-300 mb-4">
                For privacy-related questions or concerns, you can reach our Data Protection Officer directly.
              </p>
              <div className="space-y-2 text-sm text-slate-400">
                <p>Email: dpo@raastasathi.com</p>
                <p>Phone: +91-11-XXXX-XXXX</p>
                <p>Address: New Delhi, India</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}