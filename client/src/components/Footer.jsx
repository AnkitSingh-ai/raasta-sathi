import React from 'react';
import { Link } from 'react-router-dom';
import { Navigation, MapPin, Mail, Phone, Facebook, Twitter, Instagram, Github } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative">
                <Navigation className="h-8 w-8 text-blue-400" />
                <MapPin className="h-4 w-4 text-green-400 absolute -bottom-1 -right-1" />
              </div>
              <span className="text-xl font-bold">Raasta Sathi</span>
            </div>
            <p className="text-slate-300 mb-4 max-w-md">
              Collaborative traffic reporting system connecting citizens, police, and authorities 
              for safer and smarter roads across India.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-slate-300 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/map" className="text-slate-300 hover:text-white transition-colors">Live Map</Link></li>
              <li><Link to="/leaderboard" className="text-slate-300 hover:text-white transition-colors">Leaderboard</Link></li>
              <li><Link to="/login" className="text-slate-300 hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-slate-300 hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="text-slate-300 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Disclaimer</a></li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-slate-800 mt-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-blue-400" />
              <span className="text-slate-300">support@raastasathi.com</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-green-400" />
              <span className="text-slate-300">+91-11-XXXX-XXXX</span>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-orange-400" />
              <span className="text-slate-300">New Delhi, India</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-800 mt-8 pt-8 text-center">
          <p className="text-slate-400">
            © {currentYear} Raasta Sathi. All rights reserved. Made with ❤️ for safer roads.
          </p>
        </div>
      </div>
    </footer>
  );
}