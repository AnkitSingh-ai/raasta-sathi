import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, AlertTriangle, CheckCircle, FileText, Scale } from 'lucide-react';

export function TermsPage() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: [
        "By accessing and using Raasta Sathi, you accept and agree to be bound by the terms and provision of this agreement.",
        "If you do not agree to abide by the above, please do not use this service.",
        "These terms apply to all users including citizens, traffic police, municipal authorities, and emergency services."
      ]
    },
    {
      title: "2. User Responsibilities",
      content: [
        "Users must provide accurate and truthful information when reporting traffic incidents.",
        "False reporting or misuse of the platform may result in account suspension or termination.",
        "Users are responsible for maintaining the confidentiality of their account credentials.",
        "Report only genuine traffic incidents and road conditions that you have personally observed."
      ]
    },
    {
      title: "3. Traffic Reporting Guidelines",
      content: [
        "Reports should be made safely and not while driving or operating a vehicle.",
        "Include accurate location information and clear descriptions of incidents.",
        "Respect privacy and do not include personal information of individuals involved in incidents.",
        "Photos should not include license plates, faces, or other identifying information without consent."
      ]
    },
    {
      title: "4. Authority User Obligations",
      content: [
        "Traffic police and municipal authorities must verify their identity during registration.",
        "Authority users are responsible for timely verification and response to citizen reports.",
        "Official actions taken based on platform reports must follow proper departmental procedures.",
        "Misuse of authority privileges will result in immediate account termination."
      ]
    },
    {
      title: "5. Data Usage and Privacy",
      content: [
        "Location data is used solely for traffic management and incident reporting purposes.",
        "Personal information is protected according to our Privacy Policy.",
        "Aggregated traffic data may be used for research and urban planning purposes.",
        "Users can request deletion of their data at any time."
      ]
    },
    {
      title: "6. Gamification and Rewards",
      content: [
        "Points and badges are awarded for verified and helpful reports.",
        "Gaming the system or creating fake reports to earn points is prohibited.",
        "Rewards and recognition are subject to verification and may be revoked for violations.",
        "Leaderboard rankings are based on quality and accuracy of contributions."
      ]
    },
    {
      title: "7. Limitation of Liability",
      content: [
        "Raasta Sathi is a community-driven platform and information accuracy depends on user contributions.",
        "We are not liable for decisions made based on information from the platform.",
        "Users should always follow official traffic rules and emergency procedures.",
        "The platform supplements but does not replace official traffic management systems."
      ]
    },
    {
      title: "8. Prohibited Activities",
      content: [
        "Submitting false, misleading, or spam reports.",
        "Using the platform for commercial advertising or promotion.",
        "Attempting to hack, disrupt, or compromise platform security.",
        "Harassment, abuse, or inappropriate behavior towards other users."
      ]
    },
    {
      title: "9. Content and Intellectual Property",
      content: [
        "Users retain rights to content they submit but grant us license to use it for platform purposes.",
        "The Raasta Sathi platform, design, and features are protected by intellectual property laws.",
        "Users may not copy, modify, or distribute platform content without permission.",
        "Third-party content and trademarks remain property of their respective owners."
      ]
    },
    {
      title: "10. Modifications and Termination",
      content: [
        "We reserve the right to modify these terms at any time with notice to users.",
        "Continued use of the platform after changes constitutes acceptance of new terms.",
        "We may suspend or terminate accounts for violations of these terms.",
        "Users may delete their accounts and discontinue use at any time."
      ]
    }
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
            <div className="p-3 bg-blue-100 rounded-xl">
              <Scale className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Terms and Conditions</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Please read these terms carefully before using Raasta Sathi traffic reporting platform
          </p>
          <div className="mt-6 text-sm text-slate-500">
            Last updated: January 2024
          </div>
        </motion.div>

        {/* Key Points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 mb-8 border border-blue-200"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Key Points</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-slate-900">Community Safety</h3>
                <p className="text-sm text-slate-600">Report responsibly to help keep roads safe</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-slate-900">Data Protection</h3>
                <p className="text-sm text-slate-600">Your privacy and data security are protected</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-slate-900">Fair Usage</h3>
                <p className="text-sm text-slate-600">Use the platform ethically and honestly</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-slate-900">Accurate Reporting</h3>
                <p className="text-sm text-slate-600">Provide truthful and verified information</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Terms Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8"
            >
              <h2 className="text-xl font-semibold text-slate-900 mb-4">{section.title}</h2>
              <div className="space-y-3">
                {section.content.map((paragraph, pIndex) => (
                  <p key={pIndex} className="text-slate-600 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-slate-900 rounded-2xl p-8 text-white mt-12 mb-8"
        >
          <div className="text-center">
            <FileText className="h-8 w-8 text-blue-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-4">Questions About These Terms?</h2>
            <p className="text-slate-300 mb-6">
              If you have any questions about these Terms and Conditions, please contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:legal@raastasathi.com"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Email Legal Team
              </a>
              <a
                href="/privacy"
                className="px-6 py-3 bg-transparent border border-slate-600 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                View Privacy Policy
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}