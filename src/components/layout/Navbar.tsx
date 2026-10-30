import React, { useState } from 'react';
import { Menu as MenuIcon, X, ShoppingBag, Shield } from 'lucide-react';
import { AlamalaEmblem } from '../common/AlamalaLogo';

interface NavbarProps {
  onOpenOrderModal: () => void;
  currentRoute?: string;
  onNavigate: (route: string) => void;
  ownerSession?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenOrderModal, 
  currentRoute = '/', 
  onNavigate,
  ownerSession
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Menu & Paket', href: '#menu' },
    { label: 'Cara Pesan', href: '#cara-pesan' },
    { label: 'Ulasan Pelanggan', href: '#ulasan' },
    { label: 'Lokasi & Kontak', href: '#kontak' },
  ];

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (currentRoute !== '/') {
      onNavigate('/');
      setTimeout(() => {
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80 transition-colors">
      <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark with Official Alamala Floral Emblem */}
        <a 
          href="#beranda"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('/');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group cursor-pointer"
        >
          <AlamalaEmblem size={34} color="#C3282E" className="group-hover:scale-105 transition-transform" />
          <div className="flex flex-col min-w-0">
            <span className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-[#1C1917] group-hover:text-[#C3282E] transition-colors leading-none truncate">
              Dapur Alamala
            </span>
            <span className="text-[9px] sm:text-[10px] font-medium tracking-wider text-stone-500 uppercase leading-tight mt-0.5 truncate hidden min-[340px]:block">
              Puding, Cake &amp; Catering
            </span>
          </div>
        </a>

        {/* Zone 2: Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className="hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {ownerSession && (
            <button
              onClick={() => onNavigate('/admin')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
              title="Sesi Pemilik Aktif - Buka Dashboard Admin"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Dashboard Owner</span>
            </button>
          )}

          <button
            onClick={onOpenOrderModal}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#1E3A2F] hover:bg-[#162C23] rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-sm active:scale-95"
          >
            <ShoppingBag className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            <span className="hidden min-[380px]:inline">Pesan Catering</span>
            <span className="min-[380px]:hidden">Pesan</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-stone-600 hover:text-stone-900 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF8F5] border-b border-stone-200 px-5 py-4 space-y-3">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="py-2 text-sm font-medium text-stone-800 hover:text-[#C3282E] border-b border-stone-100"
              >
                {link.label}
              </a>
            ))}
            {ownerSession && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('/admin');
                }}
                className="py-2 text-left text-xs font-semibold text-emerald-800 flex items-center gap-2"
              >
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Buka Dashboard Owner</span>
              </button>
            )}
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenOrderModal();
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-[#1E3A2F] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Mulai Pesan Catering</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
