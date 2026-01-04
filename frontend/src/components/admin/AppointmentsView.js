import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Phone, DollarSign, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AppointmentsView = ({ businessId }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadAppointments();
  }, [businessId]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadAppointments(true);
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [businessId]);

  const loadAppointments = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const response = await axios.get(`${API}/appointments/${businessId}`);
      setAppointments(response.data);
    } catch (error) {
      if (!silent) toast.error('Randevular yüklenemedi');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const updateStatus = async (appointmentId, newStatus) => {
    try {
      await axios.patch(`${API}/appointments/${appointmentId}/status?status=${newStatus}`);
      toast.success('Randevu durumu güncellendi');
      loadAppointments();
    } catch (error) {
      toast.error('Durum güncellenemedi');
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'confirmed': return 'Onaylandı';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      case 'no-show': return 'Gelmedi';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER + FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Randevular</h2>
          <p className="text-sm text-slate-600 mt-1">
            Son güncelleme: {format(lastRefresh, 'HH:mm', { locale: tr })}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadAppointments()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Yenile
        </Button>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled', 'no-show'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
            className="text-xs sm:text-sm"
          >
            {status === 'all' ? 'Tümü' : getStatusText(status)}
            {status !== 'all' && (
              <Badge variant="secondary" className="ml-2">
                {appointments.filter(a => a.status === status).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* APPOINTMENTS LIST */}
      {filteredAppointments.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Henüz randevu yok</h3>
          <p className="text-slate-600">
            {filter === 'all'
              ? 'Müşterileriniz randevu aldığında burada göreceksiniz.'
              : `${getStatusText(filter)} durumunda randevu bulunmuyor.`
            }
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAppointments.map((appointment) => (
            <Card key={appointment.id} className="p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* LEFT SIDE - INFO */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900">{appointment.customer_name}</h3>
                    </div>
                    <Badge className={`${getStatusColor(appointment.status)} text-xs`}>
                      {getStatusText(appointment.status)}
                    </Badge>
                  </div>

                  {/* DETAILS GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{format(new Date(appointment.appointment_date), 'dd MMMM yyyy, EEEE', { locale: tr })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>{appointment.time_slot} ({appointment.duration} dk)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="font-medium truncate">₺{appointment.price} - {appointment.service_name}</span>
                    </div>
                    {appointment.staff_name && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{appointment.staff_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>{appointment.customer_phone}</span>
                    </div>
                  </div>

                  {/* NOTES */}
                  {appointment.notes && (
                    <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-2 sm:p-3 rounded-lg">
                      <span className="font-medium">Not:</span> {appointment.notes}
                    </p>
                  )}
                </div>

                {/* RIGHT SIDE - ACTIONS */}
                <div className="flex sm:flex-row lg:flex-col gap-2 w-full sm:w-auto lg:w-auto">
                  {appointment.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(appointment.id, 'confirmed')}
                        className="flex-1 sm:flex-none"
                      >
                        Onayla
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(appointment.id, 'cancelled')}
                        className="text-red-600 hover:bg-red-50 flex-1 sm:flex-none"
                      >
                        Reddet
                      </Button>
                    </>
                  )}

                  {appointment.status === 'confirmed' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(appointment.id, 'completed')}
                        className="flex-1 sm:flex-none"
                      >
                        Tamamla
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(appointment.id, 'no-show')}
                        className="text-gray-600 hover:bg-gray-50 flex-1 sm:flex-none"
                      >
                        Gelmedi
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(appointment.id, 'cancelled')}
                        className="text-red-600 hover:bg-red-50 flex-1 sm:flex-none"
                      >
                        İptal
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentsView;