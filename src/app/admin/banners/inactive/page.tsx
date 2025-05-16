'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Banner } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dialog } from '@headlessui/react';

export default function InactiveBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const userRole = localStorage.getItem('userRole') || 'admin';
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bannerToEdit, setBannerToEdit] = useState<string | null>(null);

  useEffect(() => {
    if (userRole !== 'admin' && userRole !== 'operador' && userRole !== 'visualizador') {
      router.push('/admin');
      return;
    }
    fetchBanners();
  }, [router, userRole]);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('status', 'inactive')
        .order('order_num');

      if (error) throw error;
      setBanners(data || []);
    } catch (err) {
      console.error('Erro ao carregar banners:', err);
      setError('Erro ao carregar banners inativos');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    if (!confirm('Tem certeza que deseja reativar este banner?')) return;
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;
      const { error } = await supabase
        .from('banners')
        .update({ status: 'active' })
        .eq('id', id);

      if (error) throw error;
      await supabase.from('logs').insert([
        {
          user_id: userId,
          action: 'reactivate_banner',
          details: { banner_id: id }
        }
      ]);
      fetchBanners();
    } catch (err) {
      console.error('Erro ao ativar banner:', err);
      setError('Erro ao ativar banner');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este banner?')) return;
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await supabase.from('logs').insert([
        {
          user_id: userId,
          action: 'delete_banner',
          details: { banner_id: id }
        }
      ]);
      fetchBanners();
    } catch (err) {
      console.error('Erro ao deletar banner:', err);
      setError('Erro ao deletar banner');
    }
  };

  const handleEditClick = (id: string) => {
    setBannerToEdit(id);
    setShowConfirmModal(true);
  };

  const handleConfirmEdit = () => {
    if (bannerToEdit) {
      router.push(`/admin/banners/edit/${bannerToEdit}`);
    }
    setShowConfirmModal(false);
    setBannerToEdit(null);
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
        <h2 className="text-2xl font-bold text-white">Banners Inativos</h2>
      </div>
      {error && <div className="error-message mb-4">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white">{banner.title}</h3>
            <p className="text-gray-400">{banner.company}</p>
            {(userRole === 'admin' || userRole === 'operador') && (
              <div className="mt-4 flex space-x-2">
                <button onClick={() => handleEditClick(banner.id)} className="btn btn-secondary">
                  Editar
                </button>
                <button onClick={() => handleActivate(banner.id)} className="btn btn-success">
                  Reativar
                </button>
                <button onClick={() => handleDelete(banner.id)} className="btn btn-danger">
                  Excluir
                </button>
              </div>
            )}
          </div>
        ))}
        {banners.length === 0 && !loading && (
          <div className="col-span-full text-center text-gray-500">Nenhum banner inativo encontrado.</div>
        )}
      </div>

      <Dialog open={showConfirmModal} onClose={() => setShowConfirmModal(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          <div className="relative bg-gray-900 rounded-xl p-8 w-full max-w-md mx-auto z-10">
            <Dialog.Title className="text-xl font-bold text-white mb-4">Confirmar Edição</Dialog.Title>
            <p className="text-gray-300 mb-6">Tem certeza que deseja editar este banner?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConfirmModal(false)} className="btn">Cancelar</button>
              <button onClick={handleConfirmEdit} className="btn btn-primary">Confirmar</button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
} 