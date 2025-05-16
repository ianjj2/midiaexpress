'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog } from '@headlessui/react';
import type { Banner, Device } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserRole } from '@/hooks/useUserRole';

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningDevice, setAssigningDevice] = useState<Device | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedBanners, setSelectedBanners] = useState<string[]>([]);
  const [savingAssign, setSavingAssign] = useState(false);
  const router = useRouter();
  const userRole = useUserRole();

  useEffect(() => {
    if (userRole !== 'admin' && userRole !== 'operador' && userRole !== 'visualizador') {
      router.push('/admin');
      return;
    }
    fetchDevices();
  }, [router, userRole]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDevices();
    }, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase.from('devices').select('*').order('name');
      if (error) throw error;
      setDevices(data || []);
    } catch (err) {
      setError('Erro ao carregar dispositivos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, status: 'active' | 'inactive') => {
    const newStatus = status === 'active' ? 'inactive' : 'active';
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;
    const { error } = await supabase
      .from('devices')
      .update({ status: newStatus })
      .eq('id', id);
    if (!error) {
      await supabase.from('logs').insert([
        {
          user_id: userId,
          device_id: id,
          action: newStatus === 'active' ? 'activate_device' : 'deactivate_device',
          details: { old_status: status, new_status: newStatus }
        }
      ]);
      fetchDevices();
    }
  };

  // Considera online se last_seen há menos de 30 segundos
  const isOnline = (lastSeen: string) => {
    const last = new Date(lastSeen).getTime();
    const now = Date.now();
    return now - last < 30 * 1000; // 30 segundos
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;
    const { data, error } = await supabase.from('devices').insert([
      { name: newDevice.name, status: newDevice.status, last_seen: new Date().toISOString() }
    ]).select();
    setSaving(false);
    if (error) {
      setError('Erro ao cadastrar dispositivo');
    } else {
      const device = data?.[0];
      await supabase.from('logs').insert([
        {
          user_id: userId,
          device_id: device?.id,
          action: 'add_device',
          details: { name: newDevice.name, status: newDevice.status }
        }
      ]);
      setShowModal(false);
      setNewDevice({ name: '', status: 'active' });
      fetchDevices();
    }
  };

  // Buscar banners ativos ao abrir modal
  const openAssignModal = async (device: Device) => {
    setAssigningDevice(device);
    setShowAssignModal(true);
    // Buscar banners ativos
    const { data } = await supabase.from('banners').select('*').eq('status', 'active');
    setBanners(data || []);
    // Buscar banners já atribuídos
    const { data: rels } = await supabase.from('device_banners').select('banner_id').eq('device_id', device.id);
    setSelectedBanners((rels || []).map((r: any) => r.banner_id));
  };

  const handleToggleBanner = (bannerId: string) => {
    setSelectedBanners((prev) =>
      prev.includes(bannerId)
        ? prev.filter((id) => id !== bannerId)
        : [...prev, bannerId]
    );
  };

  const handleSaveAssign = async () => {
    if (!assigningDevice) return;
    setSavingAssign(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;
    // Remove todas as relações antigas
    await supabase.from('device_banners').delete().eq('device_id', assigningDevice.id);
    // Adiciona as novas
    if (selectedBanners.length > 0) {
      await supabase.from('device_banners').insert(
        selectedBanners.map((bannerId) => ({ device_id: assigningDevice.id, banner_id: bannerId }))
      );
    }
    // Log de atribuição de banners
    await supabase.from('logs').insert([
      {
        user_id: userId,
        device_id: assigningDevice.id,
        action: 'assign_banners',
        details: { banners: selectedBanners }
      }
    ]);
    setSavingAssign(false);
    setShowAssignModal(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="glass-morphism p-6 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Dispositivos</h2>
        {(userRole === 'admin' || userRole === 'operador') && (
          <Link href="/admin/devices/add" className="btn btn-primary">
            Adicionar Dispositivo
          </Link>
        )}
      </div>
      {/* Modal de cadastro */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          <div className="relative bg-gray-900 rounded-xl p-8 w-full max-w-md mx-auto z-10">
            <Dialog.Title className="text-xl font-bold text-white mb-4">Novo Dispositivo</Dialog.Title>
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div>
                <label className="form-label">Nome do dispositivo</label>
                <input
                  type="text"
                  className="form-input"
                  value={newDevice.name}
                  onChange={e => setNewDevice({ ...newDevice, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={newDevice.status}
                  onChange={e => setNewDevice({ ...newDevice, status: e.target.value })}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>
      {error && (
        <div className="error-message mb-4">{error}</div>
      )}
      <div className="grid gap-6">
        {devices.length === 0 && (
          <div className="bg-gray-800 p-4 rounded-lg text-center text-gray-400">
            Nenhum dispositivo cadastrado.
          </div>
        )}
        {devices.map((device) => (
          <div key={device.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isOnline(device.last_seen) ? 'bg-green-500' : 'bg-gray-500'}`} title={isOnline(device.last_seen) ? 'Online' : 'Offline'} />
              <div>
                <div className="text-lg font-semibold text-white">{device.name}</div>
                <div className="text-xs text-gray-400">Última vez online: {new Date(device.last_seen).toLocaleString('pt-BR')}</div>
                <div className="text-xs text-gray-400">Status: <span className={device.status === 'active' ? 'text-green-400' : 'text-red-400'}>{device.status === 'active' ? 'Ativo' : 'Inativo'}</span></div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleToggleStatus(device.id, device.status)}
                className={`px-4 py-2 rounded-lg text-white transition-colors ${device.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {device.status === 'active' ? 'Desativar' : 'Ativar'}
              </button>
              <button
                onClick={() => openAssignModal(device)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Atribuir Banners
              </button>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={showAssignModal} onClose={() => setShowAssignModal(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          <div className="relative bg-gray-900 rounded-xl p-8 w-full max-w-lg mx-auto z-10">
            <Dialog.Title className="text-xl font-bold text-white mb-4">Atribuir Banners</Dialog.Title>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {banners.length === 0 && <div className="text-gray-400">Nenhum banner ativo disponível.</div>}
              {banners.map((banner) => (
                <label key={banner.id} className="flex items-center gap-3 bg-gray-800/50 p-3 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBanners.includes(banner.id)}
                    onChange={() => handleToggleBanner(banner.id)}
                  />
                  <span className="text-white font-medium">{banner.title}</span>
                  <span className="text-xs text-gray-400">({banner.company})</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setShowAssignModal(false)} className="btn">Cancelar</button>
              <button type="button" onClick={handleSaveAssign} className="btn btn-primary" disabled={savingAssign}>
                {savingAssign ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
} 