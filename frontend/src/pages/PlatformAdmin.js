import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Calendar, Users, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PlatformAdmin = () => {
  const { logout } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const response = await axios.get(`${API}/businesses`);
      setBusinesses(response.data);
    } catch (error) {
      console.error('Failed to load businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              <span className="text-2xl font-semibold tracking-tight">Platform Admin</span>
            </div>
            <div className="flex gap-3">
              <Link to="/admin/dashboard">
                <Button variant="outline">My Dashboard</Button>
              </Link>
              <Button variant="ghost" onClick={logout}>Logout</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-2" data-testid="platform-admin-title">All Businesses</h1>
          <p className="text-slate-600">Manage all businesses on the platform</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <Card key={business.id} className="p-6 space-y-4 card-hover rounded-xl" data-testid={`business-card-${business.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {business.logo_url ? (
                    <img src={business.logo_url} alt={business.name} className="h-12 w-12 rounded-lg" />
                  ) : (
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{business.name}</h3>
                    <p className="text-sm text-slate-600">/{business.slug}</p>
                  </div>
                </div>
              </div>

              {business.description && (
                <p className="text-sm text-slate-600">{business.description}</p>
              )}

              <div className="space-y-2 text-sm">
                {business.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <span>📞</span>
                    <span>{business.phone}</span>
                  </div>
                )}
                {business.address && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <span>📍</span>
                    <span>{business.address}</span>
                  </div>
                )}
              </div>

              <Link to={`/book/${business.slug}`} target="_blank">
                <Button variant="outline" className="w-full rounded-lg" data-testid={`view-booking-${business.id}`}>
                  View Booking Page
                </Button>
              </Link>
            </Card>
          ))}
        </div>

        {businesses.length === 0 && (
          <Card className="p-12 text-center">
            <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Businesses Yet</h3>
            <p className="text-slate-600">Businesses will appear here once they're created</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PlatformAdmin;