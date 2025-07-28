import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * @typedef {'en' | 'hi'} Language
 */

/**
 * @typedef {Object} LanguageContextType
 * @property {'en' | 'hi'} language
 * @property {(lang: 'en' | 'hi') => void} setLanguage
 * @property {(key: string) => string} t
 */

const translations = {
  en: {
    'nav.home': 'Home',
    'nav.map': 'Live Map',
    'nav.report': 'Report Issue',
    'nav.dashboard': 'Dashboard',
    'nav.leaderboard': 'Leaderboard',
    'nav.analytics': 'Analytics',
    'hero.title': 'Real-time Traffic Intelligence',
    'hero.subtitle': 'Collaborative platform for citizens, police, and authorities to share live traffic data',
    'hero.cta': 'Start Reporting',
    'features.citizen': 'Citizen Reporting',
    'features.realtime': 'Real-time Updates',
    'features.authority': 'Authority Dashboard',
    'features.gamification': 'Gamification',
    'report.accident': 'Accident',
    'report.police': 'Police Checkpoint',
    'report.pothole': 'Pothole',
    'report.construction': 'Construction',
    'report.congestion': 'Traffic Jam',
    'report.closure': 'Road Closure',
    'report.weather': 'Weather Hazard',
    'report.vip': 'VIP Movement',
    'dashboard.welcome': 'Welcome to Authority Dashboard',
    'dashboard.reports': 'Active Reports',
    'dashboard.verified': 'Verified',
    'dashboard.pending': 'Pending',
    'leaderboard.title': 'Community Leaders',
    'leaderboard.points': 'Points',
    'leaderboard.reports': 'Reports',
    'analytics.title': 'Traffic Analytics',
    'analytics.insights': 'Data Insights'
  },
  hi: {
    'nav.home': 'होम',
    'nav.map': 'लाइव मैप',
    'nav.report': 'रिपोर्ट करें',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.leaderboard': 'लीडरबोर्ड',
    'nav.analytics': 'एनालिटिक्स',
    'hero.title': 'रियल-टाइम ट्रैफिक इंटेलिजेंस',
    'hero.subtitle': 'नागरिकों, पुलिस और अधिकारियों के लिए सहयोगी प्लेटफॉर्म',
    'hero.cta': 'रिपोर्ट शुरू करें',
    'features.citizen': 'नागरिक रिपोर्टिंग',
    'features.realtime': 'रियल-टाइम अपडेट',
    'features.authority': 'अथॉरिटी डैशबोर्ड',
    'features.gamification': 'गेमिफिकेशन',
    'report.accident': 'दुर्घटना',
    'report.police': 'पुलिस चेकपॉइंट',
    'report.pothole': 'गड्ढा',
    'report.construction': 'निर्माण',
    'report.congestion': 'ट्रैफिक जाम',
    'report.closure': 'सड़क बंद',
    'report.weather': 'मौसम खतरा',
    'report.vip': 'वीआईपी मूवमेंट',
    'dashboard.welcome': 'अथॉरिटी डैशबोर्ड में स्वागत',
    'dashboard.reports': 'सक्रिय रिपोर्ट',
    'dashboard.verified': 'सत्यापित',
    'dashboard.pending': 'लंबित',
    'leaderboard.title': 'समुदायिक नेता',
    'leaderboard.points': 'अंक',
    'leaderboard.reports': 'रिपोर्ट',
    'analytics.title': 'ट्रैफिक एनालिटिक्स',
    'analytics.insights': 'डेटा इनसाइट्स'
  }
};

const LanguageContext = React.createContext(undefined);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}