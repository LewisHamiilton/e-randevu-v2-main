import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import Dashboard from '@/components/superadmin/Dashboard';
import BusinessTable from '@/components/superadmin/BusinessTable';
import SubscriptionDialog from '@/components/superadmin/SubscriptionDialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SuperAdmin = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🆕 Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState(null);

    useEffect(() => {
        checkSuperAdminAccess();
        loadData();
    }, []);

    const checkSuperAdminAccess = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.get(`${API}/superadmin/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            toast.error('Super admin erişiminiz yok!');
            navigate('/admin/dashboard');
        }
    };

    const loadData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [statsRes, businessesRes] = await Promise.all([
                axios.get(`${API}/superadmin/stats`, { headers }),
                axios.get(`${API}/superadmin/businesses`, { headers })
            ]);

            setStats(statsRes.data);
            setBusinesses(businessesRes.data);
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            toast.error('Veriler yüklenemedi!');
        } finally {
            setLoading(false);
        }
    };

    // 🔧 DÜZELTİLMİŞ: Suspend fonksiyonu
    const handleSuspend = async (businessId, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(
                `${API}/superadmin/business/${businessId}/suspend?suspend=${currentStatus}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success(currentStatus ? 'İşletme askıya alındı!' : 'İşletme aktifleştirildi!');
            loadData();
        } catch (error) {
            console.error('Suspend hatası:', error.response?.data);
            toast.error('İşlem başarısız!');
        }
    };

    // 🆕 Dialog Aç
    const handleUpdateSubscription = (businessId) => {
        const business = businesses.find(b => b.id === businessId);
        setSelectedBusiness(business);
        setDialogOpen(true);
    };

    // 🆕 Gerçek Güncelleme
    const handleSaveSubscription = async (businessId, plan, days) => {
        try {
            const token = localStorage.getItem('token');
            const newExpires = new Date();
            newExpires.setDate(newExpires.getDate() + parseInt(days));

            await axios.put(
                `${API}/superadmin/business/${businessId}/subscription`,
                {
                    subscription_plan: plan,
                    subscription_expires: newExpires.toISOString()
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Abonelik güncellendi!');
            loadData();
        } catch (error) {
            console.error('Güncelleme hatası:', error.response?.data);
            toast.error('Güncelleme başarısız!');
        }
    };

    // 🆕 Silme Fonksiyonu
    const handleDelete = async (businessId, businessName) => {
        const confirm = window.confirm(
            `"${businessName}" işletmesini silmek istediğinize emin misiniz?\n\n` +
            `Bu işlem geri alınamaz ve şunları silecek:\n` +
            `• Tüm personeller\n` +
            `• Tüm hizmetler\n` +
            `• Tüm randevular`
        );

        if (!confirm) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${API}/superadmin/business/${businessId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('İşletme başarıyla silindi!');
            loadData();
        } catch (error) {
            console.error('Silme hatası:', error.response?.data);
            toast.error('Silme işlemi başarısız!');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
        toast.success('Çıkış başarılı!');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-slate-600">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* HEADER */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <Shield className="h-8 w-8 text-red-600" />
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">Super Admin Panel</h1>
                                <p className="text-xs text-slate-500">{user?.email}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/admin/dashboard')}
                                className="hidden sm:flex"
                            >
                                Normal Panel
                            </Button>
                            <Button variant="ghost" onClick={handleLogout}>
                                <LogOut className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Çıkış</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* MAIN CONTENT */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Dashboard stats={stats} />

                <BusinessTable
                    businesses={businesses}
                    onSuspend={handleSuspend}
                    onUpdateSubscription={handleUpdateSubscription}
                    onDelete={handleDelete}
                />
            </div>

            {/* 🆕 SUBSCRIPTION DIALOG */}
            <SubscriptionDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={handleSaveSubscription}
                business={selectedBusiness}
            />
        </div>
    );
};

export default SuperAdmin;