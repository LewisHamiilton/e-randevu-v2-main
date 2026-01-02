import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Clock, User, CheckCircle2, ArrowLeft, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
];

const BookingPage = () => {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    loadBusinessData();
  }, [slug]);

  useEffect(() => {
    if (selectedStaff && selectedDate) {
      checkBookedSlots();
    }
  }, [selectedStaff, selectedDate]);

  const loadBusinessData = async () => {
    try {
      const [businessRes, servicesRes, staffRes] = await Promise.all([
        axios.get(`${API}/businesses/${slug}`),
        axios.get(`${API}/businesses/${slug}`).then(res =>
          axios.get(`${API}/services/${res.data.id}`)
        ),
        axios.get(`${API}/businesses/${slug}`).then(res =>
          axios.get(`${API}/staff/${res.data.id}`)
        )
      ]);

      setBusiness(businessRes.data);
      setServices(servicesRes.data);
      setStaff(staffRes.data);
    } catch (error) {
      toast.error('İşletme bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const checkBookedSlots = async () => {
    if (!selectedStaff || !selectedDate) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await axios.get(`${API}/appointments/${business.id}`);

      const staffBookings = response.data.filter(apt =>
        apt.staff_id === selectedStaff.id &&
        apt.appointment_date === dateStr &&
        apt.status !== 'cancelled'
      );

      const booked = staffBookings.map(apt => apt.time_slot);
      setBookedSlots(booked);
    } catch (error) {
      console.error('Dolu saatler kontrol edilemedi:', error);
    }
  };

  const generateAvailableDates = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      dates.push(addDays(new Date(), i));
    }
    return dates;
  };

  const getAvailableStaff = () => {
    if (!selectedDate) return [];

    const dayOfWeek = selectedDate.getDay();

    return staff.filter(member =>
      member.working_days && member.working_days.includes(dayOfWeek)
    );
  };

  const isTimeSlotPast = (timeSlot) => {
    if (!selectedDate) return false;

    const now = new Date();
    const isToday = isSameDay(selectedDate, now);

    if (!isToday) return false;

    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotTime = new Date();
    slotTime.setHours(hours, minutes, 0, 0);

    return slotTime <= now;
  };

  const handleBookAppointment = async () => {
    if (!customerName || !customerPhone) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(
        `${API}/appointments/${business.id}`,
        {
          customer_name: customerName,
          customer_phone: customerPhone,
          service_id: selectedService.id,
          staff_id: selectedStaff?.id,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          time_slot: selectedTime,
          notes
        }
      );

      setConfirmed(true);
      toast.success('Randevu başarıyla oluşturuldu!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Randevu oluşturulamadı');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 sm:p-8 text-center space-y-4 max-w-md w-full">
          <h2 className="text-xl sm:text-2xl font-semibold">İşletme Bulunamadı</h2>
          <p className="text-sm sm:text-base text-slate-600">Aradığınız işletme mevcut değil.</p>
          <Link to="/">
            <Button className="w-full sm:w-auto">Ana Sayfaya Dön</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Card className="max-w-lg w-full p-6 sm:p-8 space-y-4 sm:space-y-6 text-center rounded-xl" data-testid="booking-confirmation">
          <div className="flex justify-center">
            <div className="h-12 w-12 sm:h-16 sm:w-16 bg-accent/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Randevu Onaylandı!</h2>
            <p className="text-sm sm:text-base text-slate-600">Randevunuz başarıyla oluşturuldu</p>
          </div>
          <Card className="p-4 sm:p-6 space-y-2 sm:space-y-3 text-left bg-slate-50 border-slate-200 rounded-xl text-sm sm:text-base">
            <div className="flex justify-between">
              <span className="text-slate-600">Hizmet:</span>
              <span className="font-medium">{selectedService.name}</span>
            </div>
            {selectedStaff && (
              <div className="flex justify-between">
                <span className="text-slate-600">Personel:</span>
                <span className="font-medium">{selectedStaff.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600">Tarih:</span>
              <span className="font-medium">{format(selectedDate, 'dd MMMM yyyy, EEEE', { locale: tr })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Saat:</span>
              <span className="font-medium">{selectedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Süre:</span>
              <span className="font-medium">{selectedService.duration} dakika</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Ücret:</span>
              <span className="font-medium">₺{selectedService.price}</span>
            </div>
          </Card>
          <p className="text-xs sm:text-sm text-slate-600">{customerPhone} numarasına onay SMS'i gönderildi</p>
          <Link to="/">
            <Button className="w-full rounded-lg" data-testid="booking-home-btn">Ana Sayfaya Dön</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <nav className="border-b border-border bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {business.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex-shrink-0" />
              ) : (
                <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
              )}
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-semibold tracking-tight truncate" data-testid="business-name">{business.name}</h1>
                {business.phone && <p className="text-xs sm:text-sm text-slate-600 truncate">{business.phone}</p>}
              </div>
            </div>
            <Link to="/" className="flex-shrink-0">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Geri
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center flex-shrink-0">
                <div
                  className={`h-7 w-7 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-xs sm:text-base font-medium transition-all ${step >= s ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  data-testid={`step-indicator-${s}`}
                >
                  {s}
                </div>
                {s < 5 && <div className={`w-8 sm:w-12 h-1 mx-1 sm:mx-2 ${step > s ? 'bg-primary' : 'bg-slate-200'}`}></div>}
              </div>
            ))}
          </div>
          <div className="text-center mt-3 sm:mt-4">
            <p className="text-sm sm:text-lg font-medium text-slate-700">
              {step === 1 && 'Hizmet Seçin'}
              {step === 2 && 'Tarih Seçin'}
              {step === 3 && 'Personel Seçin'}
              {step === 4 && 'Saat Seçin'}
              {step === 5 && 'Bilgileriniz'}
            </p>
          </div>
        </div>

        <div className="booking-wizard-step">
          {/* STEP 1: HİZMET SEÇİMİ */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mb-4 sm:mb-6" data-testid="services-title">Hizmetlerimiz</h2>
              {services.length === 0 ? (
                <Card className="p-6 sm:p-8 text-center">
                  <p className="text-sm sm:text-base text-slate-600">Şu anda hizmet bulunmuyor.</p>
                </Card>
              ) : (
                <div className="grid gap-3 sm:gap-4">
                  {services.map((service) => (
                    <Card
                      key={service.id}
                      className={`p-4 sm:p-6 cursor-pointer card-hover rounded-xl transition-all ${selectedService?.id === service.id
                        ? 'border-primary border-2 bg-primary/5'
                        : 'border-slate-100 hover:border-primary/50'
                        }`}
                      onClick={() => setSelectedService(service)}
                      data-testid={`service-card-${service.id}`}
                    >
                      <div className="space-y-2">
                        <h3 className="text-base sm:text-lg font-medium">{service.name}</h3>
                        {service.description && <p className="text-xs sm:text-sm text-slate-600">{service.description}</p>}
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-xs sm:text-sm text-slate-600 flex items-center gap-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" /> {service.duration} dk
                          </span>
                          <span className="text-base sm:text-lg font-semibold text-primary">₺{service.price}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedService}
                  className="w-full sm:w-auto rounded-lg"
                  data-testid="step1-next-btn"
                >
                  Sonraki: Tarih Seçin
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: TARİH SEÇİMİ */}
          {step === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight" data-testid="date-selection-title">Tarih Seçin</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                  {generateAvailableDates().map((date) => (
                    <Button
                      key={date.toISOString()}
                      variant={selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') ? 'default' : 'outline'}
                      className="h-auto py-2 sm:py-3 flex flex-col rounded-lg text-xs sm:text-sm"
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedStaff(null);
                        setSelectedTime(null);
                      }}
                      data-testid={`date-btn-${format(date, 'yyyy-MM-dd')}`}
                    >
                      <span className="text-xs sm:text-sm">{format(date, 'EEE', { locale: tr })}</span>
                      <span className="text-base sm:text-lg font-semibold">{format(date, 'd')}</span>
                      <span className="text-xs">{format(date, 'MMM', { locale: tr })}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 pt-4">
                <Button variant="outline" onClick={() => setStep(1)} className="w-full sm:w-auto rounded-lg" data-testid="step2-back-btn">
                  Geri
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!selectedDate}
                  className="w-full sm:w-auto rounded-lg"
                  data-testid="step2-next-btn"
                >
                  Sonraki: Personel Seçin
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: PERSONEL SEÇİMİ */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mb-2" data-testid="staff-selection-title">Personel Seçin</h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  {selectedDate && `${format(selectedDate, 'd MMMM yyyy, EEEE', { locale: tr })} günü çalışan personeller`}
                </p>
              </div>
              {getAvailableStaff().length === 0 ? (
                <Card className="p-6 sm:p-8 text-center">
                  <User className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Bu Gün Çalışan Personel Yok</h3>
                  <p className="text-sm sm:text-base text-slate-600">Lütfen başka bir tarih seçin</p>
                </Card>
              ) : (
                <div className="grid gap-3 sm:gap-4">
                  {getAvailableStaff().map((member) => (
                    <Card
                      key={member.id}
                      className={`p-4 sm:p-6 cursor-pointer card-hover rounded-xl transition-all ${selectedStaff?.id === member.id
                        ? 'border-primary border-2 bg-primary/5'
                        : 'border-slate-100 hover:border-primary/50'
                        }`}
                      onClick={() => setSelectedStaff(member)}
                      data-testid={`staff-card-${member.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 sm:h-16 sm:w-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-medium truncate">{member.name}</h3>
                          {member.phone && <p className="text-xs sm:text-sm text-slate-600 truncate">{member.phone}</p>}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 pt-4">
                <Button variant="outline" onClick={() => setStep(2)} className="w-full sm:w-auto rounded-lg" data-testid="step3-back-btn">
                  Geri
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  disabled={!selectedStaff}
                  className="w-full sm:w-auto rounded-lg"
                  data-testid="step3-next-btn"
                >
                  Sonraki: Saat Seçin
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: SAAT SEÇİMİ */}
          {step === 4 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight" data-testid="time-selection-title">Saat Seçin</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
                  {TIME_SLOTS.map((time) => {
                    const isBooked = bookedSlots.includes(time);
                    const isPast = isTimeSlotPast(time);
                    const isDisabled = isBooked || isPast;

                    return (
                      <Button
                        key={time}
                        variant={selectedTime === time ? 'default' : isBooked ? 'destructive' : isPast ? 'outline' : 'outline'}
                        className={`time-slot-button rounded-lg text-xs sm:text-sm py-2 sm:py-3 ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''
                          } ${isPast && !isBooked ? 'line-through' : ''}`}
                        onClick={() => !isDisabled && setSelectedTime(time)}
                        disabled={isDisabled}
                        data-testid={`time-slot-${time}`}
                      >
                        {time}
                      </Button>
                    );
                  })}
                </div>
                <div className="text-xs sm:text-sm space-y-1">
                  {bookedSlots.length > 0 && (
                    <p className="text-slate-600">
                      🔴 Kırmızı saatler {selectedStaff.name} için dolu
                    </p>
                  )}
                  {isSameDay(selectedDate, new Date()) && (
                    <p className="text-slate-600">
                      ⏰ Geçmiş saatler seçilemez
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 pt-4">
                <Button variant="outline" onClick={() => setStep(3)} className="w-full sm:w-auto rounded-lg" data-testid="step4-back-btn">
                  Geri
                </Button>
                <Button
                  onClick={() => setStep(5)}
                  disabled={!selectedTime}
                  className="w-full sm:w-auto rounded-lg"
                  data-testid="step4-next-btn"
                >
                  Sonraki: Bilgileriniz
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: BİLGİLER */}
          {step === 5 && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight" data-testid="contact-info-title">İletişim Bilgileriniz</h2>
              <Card className="p-4 sm:p-6 space-y-4 rounded-xl">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm sm:text-base">Ad Soyad *</Label>
                  <Input
                    id="name"
                    placeholder="Ahmet Yılmaz"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="rounded-lg bg-slate-50 text-sm sm:text-base h-10 sm:h-11"
                    data-testid="customer-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm sm:text-base">Telefon Numarası *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0555 555 5555"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="rounded-lg bg-slate-50 text-sm sm:text-base h-10 sm:h-11"
                    data-testid="customer-phone-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm sm:text-base">Ek Notlar (İsteğe Bağlı)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Özel istekleriniz varsa..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded-lg bg-slate-50 text-sm sm:text-base"
                    rows={3}
                    data-testid="customer-notes-input"
                  />
                </div>
              </Card>

              <Card className="p-4 sm:p-6 space-y-2 sm:space-y-3 bg-slate-50 border-slate-200 rounded-xl">
                <h3 className="font-medium text-base sm:text-lg">Randevu Özeti</h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Hizmet:</span>
                    <span className="font-medium">{selectedService.name}</span>
                  </div>
                  {selectedStaff && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Personel:</span>
                      <span className="font-medium">{selectedStaff.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tarih:</span>
                    <span className="font-medium">{format(selectedDate, 'dd MMM yyyy', { locale: tr })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Saat:</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-300">
                    <span className="font-medium">Toplam:</span>
                    <span className="font-semibold text-base sm:text-lg text-primary">₺{selectedService.price}</span>
                  </div>
                </div>
              </Card>

              <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 pt-4">
                <Button variant="outline" onClick={() => setStep(4)} className="w-full sm:w-auto rounded-lg" data-testid="step5-back-btn">
                  Geri
                </Button>
                <Button
                  onClick={handleBookAppointment}
                  disabled={submitting || !customerName || !customerPhone}
                  className="w-full sm:w-auto rounded-lg"
                  data-testid="confirm-booking-btn"
                >
                  {submitting ? 'Randevu Oluşturuluyor...' : 'Randevuyu Onayla'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;