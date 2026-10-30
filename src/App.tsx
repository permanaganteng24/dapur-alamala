import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingHero } from './components/sections/LandingHero';
import { ServicesSection } from './components/sections/ServicesSection';
import { HowToOrderSection } from './components/sections/HowToOrderSection';
import { TestimonialsSection } from './components/sections/TestimonialsSection';
import { FaqSection } from './components/sections/FaqSection';
import { ContactSection } from './components/sections/ContactSection';
import { SimpleOrderModal } from './components/modals/SimpleOrderModal';
import { OwnerSecretAccessModal } from './components/modals/OwnerSecretAccessModal';
import { OfficialInvoiceModal } from './components/modals/OfficialInvoiceModal';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLogin } from './pages/AdminLogin';
import { ClientProposalPage } from './pages/ClientProposalPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { fetchMenus, getAdminSession, logoutAdmin, subscribeToMenuUpdates } from './lib/supabase';
import { touchAdminSession, verifyOwnerGatewayKey, SECRET_GATEWAY_PATH, SECRET_GATEWAY_KEY } from './lib/auth';
import { CateringRequest, Menu } from './types';
import { MessageCircle, Shield, LogOut } from 'lucide-react';
import { OWNER_WHATSAPP_NUMBER } from './constants';

const routeVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.18,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<CateringRequest | null>(null);
  const [selectedMenuForOrder, setSelectedMenuForOrder] = useState<Menu | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [ownerSession, setOwnerSession] = useState<string | null>(null);

  useEffect(() => {
    const session = getAdminSession();
    if (session) {
      setOwnerSession(session.email);
    } else {
      setOwnerSession(null);
    }
    fetchMenus().then(setMenus);

    // Realtime subscription for instant synchronization across tabs and state
    const unsubscribe = subscribeToMenuUpdates((updatedMenus) => {
      setMenus(updatedMenus);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Inactivity & user activity listener to refresh session lastActive
  useEffect(() => {
    const handleActivity = () => {
      touchAdminSession();
    };
    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('click', handleActivity, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, []);

  // Secret keyboard shortcut listener for Owner (Ctrl+Shift+A or Cmd+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        const session = getAdminSession();
        if (session) {
          navigateTo('/admin');
        } else {
          setIsOwnerModalOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Hash & Path router listener with strict stealth protection
  useEffect(() => {
    const handleLocationChange = () => {
      const rawHash = window.location.hash.replace(/^#/, '');
      const pathWithQuery = rawHash || window.location.pathname || '/';
      const [path, queryString] = pathWithQuery.split('?');
      const params = new URLSearchParams(queryString || '');
      const keyParam = params.get('key');

      // Verify session validity
      const session = getAdminSession();
      if (session) {
        setOwnerSession(session.email);
      } else {
        setOwnerSession(null);
      }

      if (path === '/admin') {
        if (!session) {
          // STRICT SECURITY: Unauthorized customers visiting /admin see a realistic 404 page!
          // They cannot access the dashboard or see the login form.
          setCurrentRoute('404');
        } else {
          setCurrentRoute('/admin');
        }
      } else if (path === '/admin/login') {
        // STRICT SECURITY: Disallow direct /admin/login without secret key.
        if (session) {
          setCurrentRoute('/admin');
        } else if (verifyOwnerGatewayKey(keyParam) || keyParam === SECRET_GATEWAY_KEY) {
          setCurrentRoute('secret-portal');
        } else {
          // Unauthorized customer -> 404 Not Found
          setCurrentRoute('404');
        }
      } else if (path === `/${SECRET_GATEWAY_PATH}` || path === '/owner-secret-portal') {
        // Dedicated stealth owner portal
        if (session) {
          setCurrentRoute('/admin');
        } else {
          setCurrentRoute('secret-portal');
        }
      } else if (path.startsWith('/menu/')) {
        setCurrentRoute(path);
      } else if (path === '/' || path === '') {
        setCurrentRoute('/');
      } else {
        setCurrentRoute('404');
      }
    };
    window.addEventListener('hashchange', handleLocationChange);
    handleLocationChange();
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (route: string) => {
    if (route.startsWith('/menu/')) {
      window.location.hash = route;
      setCurrentRoute(route);
    } else if (route === '/admin') {
      const session = getAdminSession();
      if (session) {
        window.location.hash = '/admin';
        setCurrentRoute('/admin');
      } else {
        setCurrentRoute('404');
      }
    } else if (route === '/admin/login' || route === 'secret-portal') {
      window.location.hash = `/${SECRET_GATEWAY_PATH}?key=${SECRET_GATEWAY_KEY}`;
      setCurrentRoute('secret-portal');
    } else {
      window.location.hash = '/';
      setCurrentRoute('/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenOrderModal = (menu?: Menu) => {
    if (menu) {
      setSelectedMenuForOrder(menu);
    } else if (menus.length > 0) {
      setSelectedMenuForOrder(menus[0]);
    }
    setIsOrderModalOpen(true);
  };

  const handleOwnerLoginSuccess = (email: string) => {
    setOwnerSession(email);
    navigateTo('/admin');
  };

  const handleOwnerLogout = async () => {
    await logoutAdmin();
    setOwnerSession(null);
    navigateTo('/');
  };

  const getRouteKey = () => {
    if (currentRoute.startsWith('/menu/')) return `proposal-${currentRoute}`;
    if (currentRoute === '/admin') return ownerSession ? 'admin-dashboard' : 'not-found';
    if (currentRoute === 'secret-portal') return 'admin-secret-portal';
    if (currentRoute === '404') return 'page-not-found';
    return 'home-landing';
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col font-sans overflow-x-hidden">
      <AnimatePresence mode="wait">
        {currentRoute.startsWith('/menu/') ? (
          <motion.div
            key={getRouteKey()}
            variants={routeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full flex-1 flex flex-col"
          >
            <ClientProposalPage
              requestId={currentRoute.replace('/menu/', '')}
              onNavigateBack={() => navigateTo('/')}
            />
          </motion.div>
        ) : currentRoute === '/admin' && ownerSession ? (
          <motion.div
            key="admin-dashboard"
            variants={routeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full flex-1 flex flex-col"
          >
            <AdminDashboard
              onLogout={handleOwnerLogout}
              onNavigateHome={() => navigateTo('/')}
              onOpenProposalPreview={(id) => navigateTo(`/menu/${id}`)}
              onMenusUpdated={(updated) => setMenus(updated)}
            />
          </motion.div>
        ) : currentRoute === 'secret-portal' ? (
          <motion.div
            key="admin-secret-portal"
            variants={routeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full flex-1 flex flex-col"
          >
            <AdminLogin
              onLoginSuccess={handleOwnerLoginSuccess}
              onNavigateHome={() => navigateTo('/')}
            />
          </motion.div>
        ) : currentRoute === '404' ? (
          <motion.div
            key="not-found"
            variants={routeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full flex-1 flex flex-col"
          >
            <NotFoundPage
              onNavigateHome={() => navigateTo('/')}
            />
          </motion.div>
        ) : (
          <motion.div
            key="home-landing"
            variants={routeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full flex-1 flex flex-col"
          >
            {/* Discreet owner banner shown ONLY when owner is currently authenticated on this browser */}
            {ownerSession && (
              <div className="bg-[#1E3A2F] text-white text-xs py-2 px-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#162C23]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                  <span className="font-medium text-emerald-100">
                    Sesi Pemilik Sedang Aktif ({ownerSession})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateTo('/admin')}
                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Shield className="w-3 h-3 text-emerald-300" />
                    <span>Masuk Dashboard</span>
                  </button>
                  <button
                    onClick={handleOwnerLogout}
                    className="px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800 text-white font-semibold text-[11px] flex items-center gap-1 cursor-pointer border border-red-700/60 transition-colors"
                    title="Keluar dari sesi agar browser kembali terkunci ke mode pelanggan umum"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Kunci &amp; Keluar</span>
                  </button>
                </div>
              </div>
            )}

            <Navbar
              currentRoute={currentRoute}
              onOpenOrderModal={() => handleOpenOrderModal()}
              onNavigate={navigateTo}
              ownerSession={ownerSession}
            />

            <main className="flex-1">
              <LandingHero
                onOpenOrderModal={() => handleOpenOrderModal()}
              />
              <ServicesSection
                menus={menus}
                onSelectMenuForOrder={(m) => handleOpenOrderModal(m)}
              />
              <HowToOrderSection
                onOpenOrderModal={() => handleOpenOrderModal()}
              />
              <TestimonialsSection />
              <FaqSection />
              <ContactSection />
            </main>

            <Footer 
              onNavigate={navigateTo} 
              onOpenOwnerModal={() => setIsOwnerModalOpen(true)}
              ownerSession={ownerSession}
            />

            {/* Discreet, non-intrusive floating WhatsApp action */}
            <aside className="fixed bottom-5 right-5 z-30">
              <a
                href={`https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=Halo%20Dapur%20Alamala%2C%20saya%20ingin%20konsultasi%20paket%20catering...`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1E3A2F] text-white text-xs font-semibold shadow-lg hover:bg-[#162C23] active:scale-95 transition-all"
                aria-label="Chat WhatsApp Dapur Alamala"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp Dapur</span>
              </a>
            </aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Order Modal */}
      <SimpleOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        initialMenu={selectedMenuForOrder}
        menus={menus}
      />

      {/* Official Invoice / Surat Penawaran Modal */}
      <OfficialInvoiceModal
        isOpen={!!selectedInvoiceForModal}
        onClose={() => setSelectedInvoiceForModal(null)}
        request={selectedInvoiceForModal}
      />

      {/* Secret Owner Access Modal (Protected) */}
      <OwnerSecretAccessModal
        isOpen={isOwnerModalOpen}
        onClose={() => setIsOwnerModalOpen(false)}
        onLoginSuccess={handleOwnerLoginSuccess}
      />
    </div>
  );
}
