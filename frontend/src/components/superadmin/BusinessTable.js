import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

const BusinessTable = ({ businesses, onSuspend, onUpdateSubscription, onDelete }) => {
    if (!businesses) {
        return (
            <Card className="overflow-hidden">
                <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-slate-600 mt-4">Yükleniyor...</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-white">
                <h2 className="text-lg font-semibold text-slate-900">Tüm İşletmeler</h2>
                <p className="text-sm text-slate-600 mt-1">
                    Sistemdeki tüm işletmeleri yönetin ({businesses.length} işletme)
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                İşletme
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Sahibi
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                İstatistikler
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Paket
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Süre
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Durum
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                İşlemler
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {businesses.map((business) => (
                            <tr key={business.id} className="hover:bg-slate-50 transition-colors">
                                {/* İŞLETME ADI */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">
                                                {business.name}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                ID: {business.id.slice(0, 8)}...
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* SAHİBİ */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-slate-900">{business.owner_email}</div>
                                    <div className="text-xs text-slate-500">
                                        Kayıt: {new Date(business.created_at).toLocaleDateString('tr-TR')}
                                    </div>
                                </td>

                                {/* İSTATİSTİKLER */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-xs text-slate-600 space-y-1">
                                        <div className="flex items-center gap-1">
                                            <span className="text-slate-400">👥</span>
                                            <span>{business.staff_count} personel</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-slate-400">✂️</span>
                                            <span>{business.service_count} hizmet</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-slate-400">📅</span>
                                            <span>{business.appointment_count} randevu</span>
                                        </div>
                                    </div>
                                </td>

                                {/* PAKET */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${business.subscription_plan === 'isletme'
                                            ? 'bg-purple-100 text-purple-800'
                                            : business.subscription_plan === 'profesyonel'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-slate-100 text-slate-800'
                                        }`}>
                                        {business.subscription_plan === 'baslangic' && '🥉 Başlangıç'}
                                        {business.subscription_plan === 'profesyonel' && '🥈 Profesyonel'}
                                        {business.subscription_plan === 'isletme' && '🥇 İşletme'}
                                    </span>
                                </td>

                                {/* SÜRE */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className={`text-sm font-semibold ${business.days_remaining < 7
                                            ? 'text-red-600'
                                            : business.days_remaining < 15
                                                ? 'text-amber-600'
                                                : 'text-green-600'
                                        }`}>
                                        {business.days_remaining > 0
                                            ? `${business.days_remaining} gün`
                                            : 'Süresi Doldu'}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {new Date(business.subscription_expires).toLocaleDateString('tr-TR')}
                                    </div>
                                    {business.days_remaining < 7 && business.days_remaining > 0 && (
                                        <div className="text-xs text-red-600 font-medium mt-1">
                                            ⚠️ Süre dolmak üzere!
                                        </div>
                                    )}
                                </td>

                                {/* DURUM */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${business.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                        {business.is_active ? '✓ Aktif' : '✕ Pasif'}
                                    </span>
                                </td>

                                {/* İŞLEMLER - 🆕 SİL BUTONU EKLENDİ */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button
                                            size="sm"
                                            variant={business.is_active ? 'destructive' : 'default'}
                                            onClick={() => onSuspend(business.id, business.is_active)}
                                            className="text-xs"
                                        >
                                            {business.is_active ? '🔒 Askıya Al' : '🔓 Aktifleştir'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onUpdateSubscription(business.id)}
                                            className="text-xs"
                                        >
                                            📦 Paket
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => onDelete(business.id, business.name)}
                                            className="text-xs bg-red-600 hover:bg-red-700"
                                        >
                                            🗑️ Sil
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* BOŞ DURUM */}
            {businesses.length === 0 && (
                <div className="text-center py-12">
                    <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Henüz işletme yok</p>
                    <p className="text-slate-500 text-sm mt-1">
                        Sistemde kayıtlı işletme bulunmuyor
                    </p>
                </div>
            )}
        </Card>
    );
};

export default BusinessTable;