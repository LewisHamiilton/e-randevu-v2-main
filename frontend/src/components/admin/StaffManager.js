import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Plus, Trash2, Mail, Phone, Edit, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DAYS = [
  { id: 1, label: 'Pazartesi' },
  { id: 2, label: 'Salı' },
  { id: 3, label: 'Çarşamba' },
  { id: 4, label: 'Perşembe' },
  { id: 5, label: 'Cuma' },
  { id: 6, label: 'Cumartesi' },
  { id: 0, label: 'Pazar' }
];

const StaffManager = ({ businessId }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    working_days: [1, 2, 3, 4, 5]
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const loadData = async () => {
    try {
      const staffRes = await axios.get(`${API}/staff/${businessId}`);
      setStaff(staffRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = { ...formData };

      if (editMode) {
        await axios.put(`${API}/staff/${editingStaffId}`, payload);
        toast.success('Personel başarıyla güncellendi');
      } else {
        await axios.post(`${API}/staff`, payload);
        toast.success('Personel başarıyla eklendi');
      }

      closeModal();
      loadData();
    } catch (error) {
      toast.error(editMode ? 'Personel güncellenemedi' : 'Personel eklenemedi');
      console.error('Submit error:', error.response?.data || error.message);
    }
  };

  const handleEdit = (member) => {
    setEditMode(true);
    setEditingStaffId(member.id);
    setFormData({
      name: member.name || '',
      phone: member.phone || '',
      email: member.email || '',
      working_days: member.working_days || [1, 2, 3, 4, 5]
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setEditingStaffId(null);
    setFormData({ name: '', phone: '', email: '', working_days: [1, 2, 3, 4, 5] });
  };

  const handleDelete = async (staffId) => {
    if (!window.confirm('Bu personeli silmek istediğinizden emin misiniz?')) return;

    try {
      await axios.delete(`${API}/staff/${staffId}`);
      toast.success('Personel silindi');
      loadData();
    } catch (error) {
      toast.error('Personel silinemedi');
    }
  };

  const toggleWorkingDay = (dayId) => {
    setFormData(prev => ({
      ...prev,
      working_days: prev.working_days.includes(dayId)
        ? prev.working_days.filter(d => d !== dayId)
        : [...prev.working_days, dayId]
    }));
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Personel</h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Ekibinizi yönetin</p>
        </div>

        {/* BASİT BUTON - Kesinlikle çalışır */}
        <button
          onClick={() => {
            console.log('BUTON TIKLANDI!');
            setShowModal(true);
          }}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 font-medium"
          style={{ zIndex: 10 }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Personel Ekle
        </button>
      </div>

      {/* MODAL - Basit, kendi yazdım */}
      {showModal && (
        <>
          {/* BACKDROP */}
          <div
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={closeModal}
          ></div>

          {/* MODAL CONTENT */}
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[calc(100vw-2rem)] sm:w-full sm:max-w-lg bg-white rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            {/* CLOSE BUTTON */}
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>

            {/* HEADER */}
            <h2 className="text-lg font-semibold mb-6">
              {editMode ? 'Personeli Düzenle' : 'Personel Ekle'}
            </h2>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ad Soyad *</Label>
                <Input
                  id="name"
                  placeholder="Ahmet Yılmaz"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="rounded-lg bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0555 555 5555"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="rounded-lg bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ahmet@ornek.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="rounded-lg bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label>Çalışma Günleri</Label>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS.map((day) => (
                    <div key={day.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.id}`}
                        checked={formData.working_days.includes(day.id)}
                        onCheckedChange={() => toggleWorkingDay(day.id)}
                      />
                      <Label htmlFor={`day-${day.id}`} className="cursor-pointer text-sm">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full rounded-lg">
                {editMode ? 'Personeli Güncelle' : 'Personel Ekle'}
              </Button>
            </form>
          </div>
        </>
      )}

      {/* STAFF LIST */}
      {staff.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center space-y-4 rounded-xl">
          <div className="flex justify-center">
            <div className="h-12 w-12 sm:h-16 sm:w-16 bg-slate-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
            </div>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Henüz Personel Yok</h3>
            <p className="text-sm sm:text-base text-slate-600">İlk personel üyenizi ekleyerek başlayın</p>
          </div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {staff.map((member) => (
            <Card key={member.id} className="p-4 sm:p-6 space-y-3 sm:space-y-4 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg truncate">{member.name}</h3>
                  </div>
                </div>
                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(member)}
                    className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center hover:bg-slate-100 rounded"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center hover:bg-red-50 rounded text-red-600"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>

              {member.phone && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{member.phone}</span>
                </div>
              )}

              {member.email && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2">Çalışma Günleri:</p>
                <div className="flex flex-wrap gap-1">
                  {member.working_days?.sort((a, b) => a - b).map((dayId) => {
                    const day = DAYS.find(d => d.id === dayId);
                    return day ? (
                      <span key={dayId} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {day.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffManager;