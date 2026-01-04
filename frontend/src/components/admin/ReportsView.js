import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReportsView = ({ businessId }) => {
    const [overview, setOverview] = useState(null);
    const [staffReport, setStaffReport] = useState([]);
    const [servicesReport, setServicesReport] = useState([]);

    useEffect(() => {
        loadReports();
    }, [businessId]);

    const loadReports = async () => {
        try {
            const [overviewRes, staffRes, servicesRes] = await Promise.all([
                axios.get(`${API}/reports/overview/${businessId}`),
                axios.get(`${API}/reports/staff/${businessId}`),
                axios.get(`${API}/reports/services/${businessId}`)
            ]);
            setOverview(overviewRes.data);
            setStaffReport(staffRes.data);
            setServicesReport(servicesRes.data);
        } catch (error) {
            console.error('Raporlar yüklenemedi:', error);
        }
    };

    if (!overview) return <div>Yükleniyor...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-semibold">Raporlar</h2>

            {/* GENEL İSTATİSTİKLER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <Calendar className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-sm text-slate-600">Bugün</p>
                            <p className="text-2xl font-bold">{overview.today_appointments}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <DollarSign className="h-8 w-8 text-green-600" />
                        <div>
                            <p className="text-sm text-slate-600">Bugün Gelir</p>
                            <p className="text-2xl font-bold">₺{overview.today_revenue.toFixed(0)}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-slate-600">Bu Ay</p>
                            <p className="text-2xl font-bold">{overview.month_appointments}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-purple-600" />
                        <div>
                            <p className="text-sm text-slate-600">Müşteri</p>
                            <p className="text-2xl font-bold">{overview.total_customers}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* PERSONEL PERFORMANSI */}
            <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Personel Performansı</h3>
                <div className="space-y-3">
                    {staffReport.map(staff => (
                        <div key={staff.staff_id} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                            <span className="font-medium">{staff.staff_name}</span>
                            <div className="text-right">
                                <p className="text-sm text-slate-600">{staff.appointment_count} randevu</p>
                                <p className="font-semibold text-green-600">₺{staff.total_revenue.toFixed(0)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* HİZMET DAĞILIMI */}
            <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Popüler Hizmetler</h3>
                <div className="space-y-3">
                    {servicesReport.map(service => (
                        <div key={service.service_id} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                            <span className="font-medium">{service.service_name}</span>
                            <div className="text-right">
                                <p className="text-sm text-slate-600">{service.count} kez</p>
                                <p className="font-semibold text-blue-600">₺{service.revenue.toFixed(0)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default ReportsView;