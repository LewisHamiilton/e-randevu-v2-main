import React from 'react';
import { Card } from '@/components/ui/card';
import {
    Building2,
    Users,
    Calendar,
    DollarSign
} from 'lucide-react';

const Dashboard = ({ stats }) => {
    if (!stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-6 animate-pulse">
                        <div className="h-20 bg-slate-200 rounded"></div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* TOPLAM İŞLETME */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-600">Toplam İşletme</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">
                            {stats.total_businesses || 0}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                            ✓ {stats.active_businesses || 0} aktif
                        </p>
                        {stats.inactive_businesses > 0 && (
                            <p className="text-xs text-red-600">
                                ✕ {stats.inactive_businesses} pasif
                            </p>
                        )}
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
            </Card>

            {/* TOPLAM KULLANICI */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-600">Toplam Kullanıcı</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">
                            {stats.total_users || 0}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Kayıtlı üye</p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-purple-600" />
                    </div>
                </div>
            </Card>

            {/* TOPLAM RANDEVU */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-600">Toplam Randevu</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">
                            {stats.total_appointments || 0}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            Bugün: {stats.today_appointments || 0}
                        </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                </div>
            </Card>

            {/* AYLIK GELİR */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-600">Aylık Gelir</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">
                            ₺{stats.monthly_revenue?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Bu ay</p>
                    </div>
                    <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-amber-600" />
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;