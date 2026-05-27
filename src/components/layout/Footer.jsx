import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-[#1ab2a6] transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-[#1ab2a6] transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-[#1ab2a6] transition-colors">Security</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-[#1ab2a6] transition-colors">About</a></li>
              <li><a href="#" className="hover:text-[#1ab2a6] transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-[#1ab2a6] transition-colors">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-[#1ab2a6] transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-[#1ab2a6] transition-colors">Support</a></li>
              <li><a href="#" className="hover:text-[#1ab2a6] transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-[#1ab2a6] transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-[#1ab2a6] transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-[#1ab2a6] transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 flex justify-between items-center">
          <p className="text-sm">&copy; 2024 Hospl. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#1ab2a6] transition-colors">Twitter</a>
            <a href="#" className="hover:text-[#1ab2a6] transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-[#1ab2a6] transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
