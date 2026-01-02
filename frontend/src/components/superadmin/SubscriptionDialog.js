import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

const SubscriptionDialog = ({ isOpen, onClose, onSave, business }) => {
    const [plan, setPlan] = useState(business?.subscription_plan || 'baslangic');
    const [days, setDays] = useState(30);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(business.id, plan, days);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
                {/* HEADER */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Paket Güncelle
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* İŞLETME BİLGİSİ */}
                <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">İşletme</p>
                    <p className="font-semibold text-slate-900">{business?.name}</p>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* PAKET SEÇİMİ */}
                    <div>
                        <Label htmlFor="plan" className="mb-2 block">Paket</Label>
                        <select
                            id="plan"
                            value={plan}
                            onChange={(e) => setPlan(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                            <option value="baslangic">🥉 Başlangıç</option>
                            <option value="profesyonel">🥈 Profesyonel</option>
                            <option value="isletme">🥇 İşletme</option>
                        </select>
                    </div>

                    {/* GÜN UZATMA */}
                    <div>
                        <Label htmlFor="days" className="mb-2 block">Kaç Gün Uzat</Label>
                        <Input
                            id="days"
                            type="number"
                            min="1"
                            max="365"
                            value={days}
                            onChange={(e) => setDays(parseInt(e.target.value))}
                            placeholder="30"
                            className="w-full"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Mevcut süreye eklenecek gün sayısı
                        </p>
                    </div>

                    {/* ÖN İZLEME */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900">
                            <strong>Yeni Paket:</strong> {
                                plan === 'baslangic' ? 'Başlangıç' :
                                    plan === 'profesyonel' ? 'Profesyonel' : 'İşletme'
                            }
                        </p>
                        <p className="text-sm text-blue-900">
                            <strong>Ek Süre:</strong> +{days} gün
                        </p>
                    </div>

                    {/* BUTONLAR */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            İptal
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                        >
                            Güncelle
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubscriptionDialog;