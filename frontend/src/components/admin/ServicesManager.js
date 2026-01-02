import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Scissors, Plus, Trash2, Clock, DollarSign, Edit, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ServicesManager = ({ businessId }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    price: 0
  });

  useEffect(() => {
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const loadServices = async () => {
    try {
      const response = await axios.get(`${API}/services/${businessId}`);
      setServices(response.data);
    } catch (error) {
      toast.error('Hizmetler yüklenemedi');
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
        await axios.put(`${API}/services/${editingServiceId}`, payload);
        toast.success('Hizmet başarıyla güncellendi');
      } else {
        await axios.post(`${API}/services`, payload);
        toast.success('Hizmet başarıyla oluşturuldu');
      }

      closeModal();
      loadServices();
    } catch (error) {
      toast.error(editMode ? 'Hizmet güncellenemedi' : 'Hizmet oluşturulamadı');
      console.error('Submit error:', error.response?.data || error.message);
    }
  };

  const handleEdit = (service) => {
    setEditMode(true);
    setEditingServiceId(service.id);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      duration: service.duration || 30,
      price: service.price || 0
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setEditingServiceId(null);
    setFormData({ name: '', description: '', duration: 30, price: 0 });
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Bu hizmeti silmek istediğinizden emin misiniz?')) return;

    try {
      await axios.delete(`${API}/services/${serviceId}`);
      toast.success('Hizmet silindi');
      loadServices();
    } catch (error) {
      toast.error('Hizmet silinemedi');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Hizmetler</h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Hizmet tekliflerinizi yönetin</p>
        </div>

        {/* BASİT BUTON - Kesinlikle çalışır */}
        <button
          onClick={() => {
            console.log('HİZMET EKLE BUTONU TIKLANDI!');
            setShowModal(true);
          }}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 font-medium"
          style={{ zIndex: 10 }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Hizmet Ekle
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
              {editMode ? 'Hizmeti Düzenle' : 'Yeni Hizmet Ekle'}
            </h2>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Hizmet Adı *</Label>
                <Input
                  id="name"
                  placeholder="Saç Kesimi"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="rounded-lg bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  placeholder="Profesyonel saç kesimi ve şekillendirme"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-lg bg-slate-50"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Süre (dakika) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    step="5"
                    placeholder="30"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    required
                    className="rounded-lg bg-slate-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Fiyat (₺) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="100"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                    className="rounded-lg bg-slate-50"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full rounded-lg">
                {editMode ? 'Hizmeti Güncelle' : 'Hizmet Oluştur'}
              </Button>
            </form>
          </div>
        </>
      )}

      {/* SERVICES LIST */}
      {services.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center space-y-4 rounded-xl">
          <div className="flex justify-center">
            <div className="h-12 w-12 sm:h-16 sm:w-16 bg-slate-100 rounded-full flex items-center justify-center">
              <Scissors className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
            </div>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Henüz Hizmet Yok</h3>
            <p className="text-sm sm:text-base text-slate-600">İlk hizmetinizi ekleyerek başlayın</p>
          </div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {services.map((service) => (
            <Card key={service.id} className="p-4 sm:p-6 space-y-3 sm:space-y-4 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Scissors className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg truncate">{service.name}</h3>
                  </div>
                </div>
                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(service)}
                    className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center hover:bg-slate-100 rounded"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center hover:bg-red-50 rounded text-red-600"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>

              {service.description && (
                <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">{service.description}</p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-600">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{service.duration} dk</span>
                </div>
                <div className="flex items-center gap-1 text-base sm:text-lg font-semibold text-primary">
                  <span>₺{service.price}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesManager;