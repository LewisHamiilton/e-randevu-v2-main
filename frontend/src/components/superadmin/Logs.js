import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, User, AlertCircle, Shield, Info } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, admin, info, error

    useEffect(() => {
        loadLogs();
    }, [filter]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = filter !== 'all' ? `?log_type=${filter}` : '';
            const response = await axios.get(`${API}/superadmin/logs${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(response.data);
        } catch (error) {
            console.error('Log yükleme hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'admin':
                return <Shield className="h-4 w-4 text-red-600" />;
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-600" />;
            case 'warning':
                return <AlertCircle className="h-4 w-4 text-amber-600" />;
            default:
                return <Info className="h-4 w-4 text-blue-600" />;
        }
    };

    const getTypeBadge = (type) => {
        const badges = {
            admin: 'bg-red-100 text-red-800',
            error: 'bg-red-100 text-red-800',
            warning: 'bg-amber-100 text-amber-800',
            info: 'bg-blue-100 text-blue-800'
        };
        return badges[type] || badges.info;
    };

    const getActionText = (action) => {
        const actions = {
            login: 'Giriş Yaptı',
            create_business: 'İşletme Oluşturdu',
            delete_business: 'İşletme Sildi',
            suspend_business: 'İşletmeyi Askıya Aldı',
            activate_business: 'İşletmeyi Aktifleştirdi',
            update_subscription: 'Paket Güncelledi'
        };
        return actions[action] || action;
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat('tr-TR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* FILTER BUTTONS */}
            <div className="flex gap-2 flex-wrap">
                <Button
                    size="sm"
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                >
                    Tümü ({logs.length})
                </Button>
                <Button
                    size="sm"
                    variant={filter === 'admin' ? 'default' : 'outline'}
                    onClick={() => setFilter('admin')}
                >
                    <Shield className="h-4 w-4 mr-1" />
                    Admin İşlemleri
                </Button>
                <Button
                    size="sm"
                    variant={filter === 'info' ? 'default' : 'outline'}
                    onClick={() => setFilter('info')}
                >
                    <Info className="h-4 w-4 mr-1" />
                    Bilgi
                </Button>
            </div>

            {/* LOGS TABLE */}
            <Card className="overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-white">
                    <h2 className="text-lg font-semibold text-slate-900">Sistem Logları</h2>
                    <p className="text-sm text-slate-600 mt-1">Son {logs.length} işlem kaydı</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                                    Tarih/Saat
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                                    Kullanıcı
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                                    İşlem
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                                    Detay
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                                    Tip
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Clock className="h-4 w-4" />
                                            {formatDate(log.timestamp)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm text-slate-900">
                                                {log.user_email || 'Sistem'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-slate-900">
                                            {getActionText(log.action)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-slate-600 max-w-md">
                                            {Object.entries(log.details || {}).map(([key, value]) => (
                                                <div key={key}>
                                                    <span className="font-medium">{key}:</span> {String(value)}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(log.type)}`}>
                                            {getTypeIcon(log.type)}
                                            {log.type}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* EMPTY STATE */}
                {logs.length === 0 && (
                    <div className="text-center py-12">
                        <Info className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600 font-medium">Henüz log kaydı yok</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Logs;