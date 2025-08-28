import React from 'react';
import { Link } from 'react-router-dom';
import { Navigation, MapPin, Mail, Phone, Facebook, Twitter, Instagram, Github } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
              <div className="relative">
                <Navigation className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 absolute -bottom-1 -right-1" />
              </div>
              <span className="text-lg sm:text-xl font-bold">Raasta Sathi</span>
            </div>
            <p className="text-slate-300 mb-3 sm:mb-4 max-w-md text-sm sm:text-base">
              Collaborative traffic reporting system connecting citizens, police, and authorities 
              for safer and smarter roads across India.
            </p>
            <div className="flex space-x-3 sm:space-x-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Github className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Links</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li><Link to="/" className="text-slate-300 hover:text-white transition-colors text-sm sm:text-base">Home</Link></li>
              <li><Link to="/map" className="text-slate-300 hover:text-white transition-colors text-sm sm:text-base">Live Map</Link></li>
              <li><Link to="/leaderboard" className="text-slate-300 hover:text-white transition-colors text-sm sm:text-base">Leaderboard</Link></li>
              <li><Link to="/login" className="text-slate-300 hover:text-white transition-colors text-sm sm:text-base">Sign In</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Legal</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li><Link to="/terms" className="text-slate-300 hover:text-white transition-colors text-sm sm:text-base">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="text-slate-300 hover:text-white transition-colors text-sm sm:text-base">Privacy Policy</Link></li>
              <li><a href="#" className="text-slate-300 hover:text-white transition-colors text-sm sm:text-base">Cookie Policy</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white transition-colors text-sm sm:text-base">Disclaimer</a></li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-slate-800 mt-6 sm:mt-8 pt-6 sm:pt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
              <span className="text-slate-300 text-sm sm:text-base">support@raastasathi.com</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
              <span className="text-slate-300 text-sm sm:text-base">+91-11-XXXX-XXXX</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 sm:col-span-2 lg:col-span-1">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
              <span className="text-slate-300 text-sm sm:text-base">New Delhi, India</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
          <p className="text-slate-400 text-sm sm:text-base">
            © {currentYear} Raasta Sathi. All rights reserved. Made with ❤️ for safer roads.
          </p>
        </div>
      </div>
    </footer>
  );
}