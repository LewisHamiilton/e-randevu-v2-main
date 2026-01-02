import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Giriş başarılı!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-4 sm:space-y-6 rounded-xl border-slate-100" data-testid="login-card">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3 sm:mb-4">
            <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" data-testid="login-title">Hoş Geldiniz</h1>
          <p className="text-sm sm:text-base text-slate-600">Randevularınızı yönetmek için giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm sm:text-base">E-posta</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-lg bg-slate-50 h-10 sm:h-11 text-sm sm:text-base"
              data-testid="login-email-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm sm:text-base">Şifre</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-lg bg-slate-50 h-10 sm:h-11 text-sm sm:text-base"
              data-testid="login-password-input"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-lg h-10 sm:h-11 text-sm sm:text-base"
            disabled={loading}
            data-testid="login-submit-btn"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </Button>
        </form>

        <div className="text-center text-xs sm:text-sm text-slate-600">
          Hesabınız yok mu?{' '}
          <Link to="/register" className="text-primary hover:underline font-medium" data-testid="login-register-link">
            Kayıt olun
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;