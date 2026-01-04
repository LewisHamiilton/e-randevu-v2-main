import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Users, Clock, CheckCircle2, ArrowRight, Search, MapPin, Menu, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Landing = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly'); // YENİ: Fiyatlandırma için

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const response = await axios.get(`${API}/businesses`);
      setBusinesses(response.data);
    } catch (error) {
      console.error('İşletmeler yüklenemedi:', error);
    }
  };

  const filteredBusinesses = businesses.filter(business => {
    const search = searchTerm.toLowerCase().trim();
    const name = business.name.toLowerCase();
    const desc = business.description?.toLowerCase() || '';
    const addr = business.address?.toLowerCase() || '';

    // Sadece isim BAŞLANGICI ile eşleşsin
    return name.startsWith(search) || desc.includes(search) || addr.includes(search);
  });

  const handleBusinessClick = (slug) => {
    navigate(`/book/${slug}`);
    setSearchTerm('');
    setShowResults(false);
  };

  // YENİ: Fiyatlandırma scroll fonksiyonu
  const scrollToPricing = () => {
    document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  // YENİ: Fiyatlandırma paketleri
  const pricingPlans = [
    {
      name: 'Başlangıç',
      staff: '1-3 Personel',
      monthlyPrice: 299,
      yearlyPrice: 2990,
      features: [
        'Sınırsız randevu',
        '500 SMS/ay dahil',
        'Mobil uyumlu',
        'Temel raporlar',
        'Email destek',
        'Tek şube'
      ],
      popular: false
    },
    {
      name: 'Profesyonel',
      staff: '4-7 Personel',
      monthlyPrice: 499,
      yearlyPrice: 4990,
      features: [
        'Sınırsız randevu',
        '1500 SMS/ay dahil',
        'Öncelikli destek',
        'Gelişmiş raporlar',
        'Dashboard istatistikleri',
        'Özelleştirilebilir ayarlar'
      ],
      popular: true
    },
    {
      name: 'İşletme',
      staff: '8-15 Personel',
      monthlyPrice: 799,
      yearlyPrice: 7990,
      features: [
        'Sınırsız randevu',
        '3000 SMS/ay dahil',
        'WhatsApp bildirimleri',
        'Çoklu şube desteği',
        '7/24 öncelikli destek',
        'Özel eğitim'
      ],
      popular: false
    },
    {
      name: 'Kurumsal',
      staff: '15+ Personel',
      monthlyPrice: 1499,
      yearlyPrice: 14990,
      features: [
        'Sınırsız her şey',
        'Sınırsız SMS',
        'API erişimi',
        'Özel entegrasyonlar',
        'Hesap yöneticisi',
        'SLA garantisi'
      ],
      popular: false
    }
  ];

  const getPrice = (plan) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getSavings = (plan) => {
    const yearlyTotal = plan.monthlyPrice * 12;
    const savings = yearlyTotal - plan.yearlyPrice;
    return savings;
  };

  return (
    <div className="min-h-screen">
      {/* NAVBAR */}
      <nav className="border-b border-border bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="E-Randevu" className="h-8 sm:h-10" />
            </div>

            {/* Desktop Navigation - YENİ: Fiyatlandırma butonu eklendi */}
            <div className="hidden sm:flex gap-3">
              <Button variant="ghost" onClick={scrollToPricing}>
                Fiyatlandırma
              </Button>
              <Link to="/login">
                <Button variant="ghost" data-testid="nav-login-btn">Giriş Yap</Button>
              </Link>
              <Link to="/register">
                <Button data-testid="nav-register-btn">Başla</Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu - YENİ: Fiyatlandırma butonu eklendi */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t border-border py-4 space-y-2">
              <Button
                variant="ghost"
                onClick={scrollToPricing}
                className="w-full justify-start"
              >
                Fiyatlandırma
              </Button>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" data-testid="nav-login-btn-mobile">
                  Giriş Yap
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full" data-testid="nav-register-btn-mobile">Başla</Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* HERO SECTION - DEĞİŞMEDİ ✅ */}
      <section className="relative py-12 sm:py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6 sm:space-y-8">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground" data-testid="hero-title">
              Randevu Yönetimi
              <span className="block text-primary mt-2">Artık Çok Kolay</span>
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-slate-600 leading-relaxed px-4" data-testid="hero-description">
              Berberler, kuaförler ve güzellik merkezleri için profesyonel randevu yönetim sistemi.
              7/24 online randevu alın, otomatik SMS bildirimleri gönderin.
            </p>

            {/* ARAMA KUTUSU - DEĞİŞMEDİ ✅ */}
            <div className="max-w-2xl mx-auto pt-4 relative px-4">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Berber veya kuaför ara..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowResults(e.target.value.length > 0);
                  }}
                  onFocus={() => searchTerm.length > 0 && setShowResults(true)}
                  className="pl-10 sm:pl-12 pr-4 py-4 sm:py-6 text-sm sm:text-lg rounded-xl shadow-lg border-2 focus:border-primary"
                  data-testid="search-input"
                />
              </div>

              {/* ARAMA SONUÇLARI - DEĞİŞMEDİ ✅ */}
              {showResults && searchTerm && (
                <Card className="absolute left-0 right-0 mt-2 max-h-[400px] overflow-y-scroll shadow-2xl rounded-xl z-[9999] border-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {filteredBusinesses.length > 0 ? (
                    <div className="divide-y">
                      {filteredBusinesses.slice(0, 5).map((business) => (
                        <div
                          key={business.id}
                          onClick={() => handleBusinessClick(business.slug)}
                          className="p-3 sm:p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                          data-testid={`search-result-${business.slug}`}
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm sm:text-lg text-foreground truncate">{business.name}</h3>
                              {business.description && (
                                <p className="text-xs sm:text-sm text-slate-600 truncate">{business.description}</p>
                              )}
                              {business.address && (
                                <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-500 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate">{business.address}</span>
                                </div>
                              )}
                            </div>
                            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 sm:p-8 text-center">
                      <p className="text-sm sm:text-base text-slate-600">Sonuç bulunamadı</p>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">Farklı bir arama deneyin</p>
                    </div>
                  )}
                </Card>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 px-4">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-sm sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-xl" data-testid="hero-cta-btn">
                  Ücretsiz Dene <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ÖZELLIKLER BÖLÜMÜ - DEĞİŞMEDİ ✅ */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">Neden E-Randevu?</h2>
            <p className="text-sm sm:text-lg text-slate-600">İhtiyacınız olan her şey bir arada</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="p-4 sm:p-6 space-y-3 sm:space-y-4 card-hover border-slate-100 rounded-xl" data-testid="feature-booking">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="text-base sm:text-xl font-medium tracking-tight">Kolay Randevu Alma</h3>
              <p className="text-xs sm:text-base text-slate-600 leading-relaxed">Müşterileriniz saniyeler içinde online randevu alabilir</p>
            </Card>

            <Card className="p-4 sm:p-6 space-y-3 sm:space-y-4 card-hover border-slate-100 rounded-xl" data-testid="feature-staff">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
              </div>
              <h3 className="text-base sm:text-xl font-medium tracking-tight">Personel Yönetimi</h3>
              <p className="text-xs sm:text-base text-slate-600 leading-relaxed">Birden fazla personel ve hizmet yönetimi kolayca</p>
            </Card>

            <Card className="p-4 sm:p-6 space-y-3 sm:space-y-4 card-hover border-slate-100 rounded-xl" data-testid="feature-prevent">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="text-base sm:text-xl font-medium tracking-tight">Zaman Tasarrufu</h3>
              <p className="text-xs sm:text-base text-slate-600 leading-relaxed">Otomatik çakışma önleme ile sorunsuz operasyon</p>
            </Card>

            <Card className="p-4 sm:p-6 space-y-3 sm:space-y-4 card-hover border-slate-100 rounded-xl" data-testid="feature-sms">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
              </div>
              <h3 className="text-base sm:text-xl font-medium tracking-tight">SMS Bildirimleri</h3>
              <p className="text-xs sm:text-base text-slate-600 leading-relaxed">Müşteri ve personele otomatik SMS hatırlatıcıları</p>
            </Card>
          </div>
        </div>
      </section>

      {/* YENİ: FİYATLANDIRMA BÖLÜMÜ ⭐ */}
      <section id="pricing-section" className="py-12 sm:py-20 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
              Size Uygun Paketi Seçin
            </h2>
            <p className="text-sm sm:text-lg text-slate-600 mb-6 sm:mb-8">
              Personel sayınıza göre esnek fiyatlandırma
            </p>

            {/* AYLIK/YILLIK TOGGLE */}
            <div className="inline-flex items-center gap-3 sm:gap-4 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition-all text-sm sm:text-base ${billingCycle === 'monthly'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Aylık
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition-all relative text-sm sm:text-base ${billingCycle === 'yearly'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Yıllık
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold">
                  %17
                </span>
              </button>
            </div>
          </div>

          {/* FİYATLANDIRMA KARTLARI */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`p-4 sm:p-6 rounded-2xl relative transition-all hover:shadow-xl ${plan.popular
                  ? 'border-2 border-primary shadow-xl'
                  : 'border border-slate-200'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium shadow-lg">
                    En Popüler
                  </div>
                )}

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">{plan.staff}</p>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-bold text-foreground">
                        ₺{getPrice(plan)}
                      </span>
                      <span className="text-sm sm:text-base text-slate-600">
                        /{billingCycle === 'monthly' ? 'ay' : 'yıl'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p className="text-xs sm:text-sm text-green-600 font-medium mt-2">
                        ₺{getSavings(plan)} tasarruf
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2 sm:space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600">
                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/register">
                    <Button
                      className={`w-full rounded-xl text-sm sm:text-base ${plan.popular
                        ? 'bg-primary hover:bg-primary/90'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                    >
                      Hemen Başla
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8 sm:mt-12">
            <p className="text-xs sm:text-sm text-slate-600">
              Tüm paketlerde 14 gün ücretsiz deneme. Kredi kartı gerekmez. ✨
            </p>
          </div>
        </div>
      </section>

      {/* CTA BÖLÜMÜ - DEĞİŞMEDİ ✅ */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Başlamaya Hazır mısınız?</h2>
          <p className="text-sm sm:text-lg text-slate-600">Yüzlerce işletme E-Randevu ile randevularını yönetiyor</p>
          <Link to="/register">
            <Button size="lg" className="w-full sm:w-auto text-sm sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-xl" data-testid="cta-bottom-btn">
              Hesap Oluştur <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FOOTER - DEĞİŞMEDİ ✅ */}
      <footer className="bg-white border-t border-border py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-xs sm:text-base text-slate-600">
            <p>&copy; 2025 E-Randevu. Profesyonel randevu yönetim platformu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;