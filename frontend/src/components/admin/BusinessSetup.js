import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BusinessSetup = () => {
  const { user, refreshUser } = useAuth(); // 🆕 refreshUser eklendi
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingBusiness, setLoadingBusiness] = useState(true);

  useEffect(() => {
    loadBusiness();
    // eslint-disable-next-line
  }, [user]);

  const loadBusiness = async () => {
    if (!user?.business_id) {
      setLoadingBusiness(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/businesses`);
      const userBusiness = response.data.find(b => b.id === user.business_id);

      if (userBusiness) {
        setBusiness(userBusiness);
        setFormData({
          name: userBusiness.name || '',
          slug: userBusiness.slug || '',
          description: userBusiness.description || '',
          phone: userBusiness.phone || '',
          address: userBusiness.address || ''
        });
      }
    } catch (error) {
      console.error('İşletme yüklenemedi:', error);
    } finally {
      setLoadingBusiness(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (business) {
        // Güncelleme
        await axios.put(`${API}/businesses/${business.id}`, formData);
        toast.success('İşletme başarıyla güncellendi!');
        loadBusiness();
      } else {
        // 🆕 Yeni oluşturma - Kullanıcı bilgisini yenile ve yönlendir
        await axios.post(`${API}/businesses`, formData);
        toast.success('İşletme başarıyla oluşturuldu!');

        // Kullanıcı bilgisini yenile (business_id güncellensin)
        await refreshUser();

        // 1 saniye bekle (kullanıcı mesajı görsün)
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1000);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name) => {
    setFormData({ ...formData, name, slug: generateSlug(name) });
  };

  if (loadingBusiness) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6 sm:p-8 space-y-4 sm:space-y-6 rounded-xl">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight" data-testid="business-setup-title">
            {business ? 'İşletme Ayarları' : 'İşletmenizi Oluşturun'}
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            {business ? 'İşletme bilgilerinizi güncelleyin' : 'İşletme bilgilerinizi girin ve platformumuza katılın'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm sm:text-base">İşletme Adı *</Label>
            <Input
              id="name"
              placeholder="Örnek Kuaför"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="rounded-lg bg-slate-50 text-sm sm:text-base h-10 sm:h-11"
              data-testid="business-name-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="text-sm sm:text-base">URL Adresi *</Label>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs sm:text-sm">/book/</span>
              <Input
                id="slug"
                placeholder="ornek-kuafor"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                className="rounded-lg bg-slate-50 text-sm sm:text-base h-10 sm:h-11"
                data-testid="business-slug-input"
              />
            </div>
            <p className="text-xs text-slate-500">Müşterileriniz bu adresten randevu alacak</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm sm:text-base">Açıklama</Label>
            <Textarea
              id="description"
              placeholder="İşletmeniz hakkında kısa bir açıklama"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="rounded-lg bg-slate-50 text-sm sm:text-base min-h-[80px]"
              data-testid="business-description-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm sm:text-base">Telefon</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+90 555 123 45 67"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="rounded-lg bg-slate-50 text-sm sm:text-base h-10 sm:h-11"
              data-testid="business-phone-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm sm:text-base">Adres</Label>
            <Input
              id="address"
              placeholder="Örnek Mahallesi, No:123 Merkez/Şehir"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="rounded-lg bg-slate-50 text-sm sm:text-base h-10 sm:h-11"
              data-testid="business-address-input"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-lg text-sm sm:text-base h-10 sm:h-11"
            disabled={loading}
            data-testid="business-submit-btn"
          >
            {loading ? (business ? 'Güncelleniyor...' : 'Oluşturuluyor...') : (business ? 'İşletmeyi Güncelle' : 'İşletme Oluştur')}
          </Button>
        </form>

        {business && (
          <div className="pt-4 border-t">
            <p className="text-xs sm:text-sm text-slate-600 text-center">
              Randevu sayfanız: <a href={`/book/${business.slug}`} className="text-primary hover:underline font-medium">/book/{business.slug}</a>
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default BusinessSetup;