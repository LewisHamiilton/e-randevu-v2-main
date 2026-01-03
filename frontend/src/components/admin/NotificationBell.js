import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NotificationBell = ({ businessId }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (businessId) {
            loadNotifications();

            // Her 30 saniyede yenile
            const interval = setInterval(loadNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [businessId]);

    // Dışarı tıklamayı dinle
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API}/appointments/${businessId}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(response.data);
            setUnreadCount(response.data.length);
        } catch (error) {
            console.error('Bildirim yüklenemedi:', error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* BELL BUTTON */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
                <Bell className="h-5 w-5 text-slate-600" />

                {/* BADGE */}
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* DROPDOWN */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                    {/* HEADER */}
                    <div className="p-4 border-b border-slate-200">
                        <h3 className="font-semibold text-slate-900">Yeni Randevular</h3>
                        <p className="text-xs text-slate-600 mt-1">Son 24 saat</p>
                    </div>

                    {/* NOTIFICATIONS LIST */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-600">Yeni bildirim yok</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-slate-900 truncate">
                                                    {notif.customer_name}
                                                </p>
                                                <p className="text-xs text-slate-600 mt-1">
                                                    {notif.service_name} • {notif.time_slot}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {formatDistanceToNow(new Date(notif.created_at), {
                                                        addSuffix: true,
                                                        locale: tr
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* FOOTER */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-slate-200 text-center">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    // Randevular sayfasına git
                                }}
                                className="text-sm text-primary hover:underline font-medium"
                            >
                                Tümünü Gör
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;