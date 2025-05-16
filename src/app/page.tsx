'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Banner } from '@/lib/supabase';

export default function Home() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loginName, setLoginName] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    const storedId = localStorage.getItem('device_id');
    if (storedId) {
      setDeviceId(storedId);
    }
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    const fetchBanners = async () => {
      // Buscar banners atribuídos ao dispositivo
      const { data, error } = await supabase
        .from('device_banners')
        .select('banner_id, banners(*)')
        .eq('device_id', deviceId);
      if (error) {
        setBanners([]);
        return;
      }
      const bannersList = (data || []).map((row: any) => row.banners).filter(Boolean);
      setBanners(bannersList);
    };
    fetchBanners();
  }, [deviceId]);

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, banners[currentIndex]?.duration * 1000 || 5000);
    return () => clearInterval(timer);
  }, [banners, currentIndex]);

  useEffect(() => {
    if (!deviceId) return;
    const interval = setInterval(async () => {
      await supabase
        .from('devices')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', deviceId);
    }, 30000); // a cada 30 segundos

    // Atualiza imediatamente ao logar
    supabase
      .from('devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', deviceId);

    return () => clearInterval(interval);
  }, [deviceId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    // Buscar dispositivo pelo nome
    const { data, error } = await supabase
      .from('devices')
      .select('id, status')
      .eq('name', loginName)
      .single();
    setLoggingIn(false);
    if (error || !data) {
      setLoginError('Dispositivo não encontrado ou inativo.');
      return;
    }
    if (data.status !== 'active') {
      setLoginError('Dispositivo inativo.');
      return;
    }
    localStorage.setItem('device_id', data.id);
    setDeviceId(data.id);
  };

  if (!deviceId) {
    return (
      <main className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-gray-900 to-purple-900">
        <form onSubmit={handleLogin} className="bg-white/10 backdrop-blur-lg p-8 rounded-xl shadow-xl flex flex-col gap-6 min-w-[320px]">
          <h2 className="text-2xl font-bold text-center text-white mb-2">Login do Dispositivo</h2>
          <input
            type="text"
            className="form-input"
            placeholder="Nome do dispositivo"
            value={loginName}
            onChange={e => setLoginName(e.target.value)}
            required
          />
          {loginError && <div className="error-message">{loginError}</div>}
          <button type="submit" className="btn btn-primary w-full" disabled={loggingIn}>
            {loggingIn ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </main>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <main className="w-screen h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {currentBanner && (
          <motion.div
            key={currentBanner.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full flex items-center justify-center"
          >
            {currentBanner.file_type === 'video' ? (
              <video
                src={currentBanner.file_url}
                autoPlay
                muted
                loop
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={currentBanner.file_url}
                alt={currentBanner.title}
                className="w-full h-full object-contain"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
} 