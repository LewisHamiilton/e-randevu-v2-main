import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Scissors, Settings, LogOut, Menu, X } from 'lucide-react';
import AppointmentsView from '@/components/admin/AppointmentsView';
import ServicesManager from '@/components/admin/ServicesManager';
import StaffManager from '@/components/admin/StaffManager';
import BusinessSetup from '@/components/admin/BusinessSetup';
import NotificationBell from '@/components/admin/NotificationBell'; // 🆕 IMPORT
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    if (user?.business_id) {
      loadBusiness();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadBusiness = async () => {
    try {
      const businesses = await axios.get(`${API}/businesses`);
      const userBusiness = businesses.data.find(b => b.id === user.business_id);
      setBusiness(userBusiness);
    } catch (error) {
      console.error('Failed to load business:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Çıkış başarılı!');
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Randevular', icon: Calendar },
    { path: '/admin/services', label: 'Hizmetler', icon: Scissors },
    { path: '/admin/staff', label: 'Personel', icon: Users },
    { path: '/admin/settings', label: 'Ayarlar', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* SIDEBAR */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="h-full flex flex-col">
          {/* LOGO */}
          <div className="p-4 sm:p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <img src="/icon.png" alt="E-Randevu" className="h-8 sm:h-10" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate" data-testid="dashboard-title">
                  E-Randevu
                </h1>
                {business && <p className="text-xs sm:text-sm text-slate-600 truncate">{business.name}</p>}
              </div>
            </div>
          </div>

          {/* NAV MENU */}
          <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 sm:gap-3 hover:bg-primary/10 hover:text-primary text-sm sm:text-base h-10 sm:h-11"
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Button>
              </Link>
            ))}
          </nav>

          {/* USER INFO + LOGOUT */}
          <div className="p-3 sm:p-4 border-t border-border space-y-2">
            <div className="px-2 sm:px-3 py-2 text-xs sm:text-sm">
              <p className="font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-slate-600 truncate">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 sm:gap-3 text-red-600 hover:bg-red-50 hover:text-red-700 text-sm sm:text-base h-10 sm:h-11"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              Çıkış
            </Button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-h-screen w-full lg:w-auto">
        {/* MOBILE HEADER */}
        <header className="bg-white border-b border-border lg:hidden sticky top-0 z-40">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Panel</h1>

            {/* 🆕 NOTIFICATION BELL + MENU */}
            <div className="flex items-center gap-2">
              {user?.business_id && <NotificationBell businessId={user.business_id} />}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="h-9 w-9 p-0"
                data-testid="mobile-menu-btn"
              >
                {sidebarOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
              </Button>
            </div>
          </div>
        </header>

        {/* 🆕 DESKTOP HEADER (sadece bildirim için) */}
        <header className="hidden lg:flex bg-white border-b border-border sticky top-0 z-40">
          <div className="flex items-center justify-end p-4 w-full">
            {user?.business_id && <NotificationBell businessId={user.business_id} />}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {!user?.business_id ? (
            <BusinessSetup />
          ) : (
            <Routes>
              <Route path="dashboard" element={<AppointmentsView businessId={user.business_id} />} />
              <Route path="services" element={<ServicesManager businessId={user.business_id} />} />
              <Route path="staff" element={<StaffManager businessId={user.business_id} />} />
              <Route path="settings" element={<BusinessSetup />} />
              <Route path="*" element={<AppointmentsView businessId={user.business_id} />} />
            </Routes>
          )}
        </main>
      </div>

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}
    </div>
  );
};

export default AdminDashboard;