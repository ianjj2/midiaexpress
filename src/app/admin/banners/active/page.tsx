'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Banner } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserRole } from '@/hooks/useUserRole';

export default function ActiveBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const userRole = useUserRole();

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
        .eq('status', 'active')
        .order('order_num');

      if (error) throw error;
      setBanners(data || []);
    } catch (err) {
      console.error('Erro ao carregar banners:', err);
      setError('Erro ao carregar banners ativos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;
      const { error } = await supabase
        .from('banners')
        .update({ status: 'inactive' })
        .eq('id', id);

      if (error) throw error;
      await supabase.from('logs').insert([
        {
          user_id: userId,
          action: 'deactivate_banner',
          details: { banner_id: id }
        }
      ]);
      fetchBanners();
    } catch (err) {
      console.error('Erro ao desativar banner:', err);
      setError('Erro ao desativar banner');
    }
  };

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para calcular dias restantes
  const getDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
        <h2 className="text-2xl font-bold text-white">Banners Ativos</h2>
        {(userRole === 'admin' || userRole === 'operador') && (
          <Link href="/admin/banners/add" className="btn btn-primary">
            Adicionar Banner
          </Link>
        )}
      </div>
      {error && (
        <div className="error-message mb-4">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <div className="grid gap-6">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="flex items-center justify-between p-6 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:bg-gray-800/70 transition-colors"
          >
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 relative rounded-lg overflow-hidden">
                {banner.file_type === 'video' ? (
                  <video
                    src={banner.file_url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={banner.file_url}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-medium text-white">{banner.title}</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Empresa: </span>
                    <span className="text-gray-200">{banner.company}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Duração: </span>
                    <span className="text-gray-200">{banner.duration}s</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Início: </span>
                    <span className="text-gray-200">{formatDate(banner.contract_start_date)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Término: </span>
                    <span className="text-gray-200">{formatDate(banner.contract_end_date)}</span>
                  </div>
                </div>
                {getDaysRemaining(banner.contract_end_date) <= 30 && (
                  <div className="mt-2">
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-300 rounded-full">
                      {getDaysRemaining(banner.contract_end_date)} dias restantes
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <div className="flex space-x-2">
                {(userRole === 'admin' || userRole === 'operador') && (
                  <>
                    <Link
                      href={`/admin/banners/edit/${banner.id}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDeactivate(banner.id)}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                    >
                      Desativar
                    </button>
                  </>
                )}
              </div>
              <span className="text-xs text-gray-400">
                Ordem: #{banner.order_num}
              </span>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <p className="text-gray-400 text-center py-4">
            Nenhum banner ativo no momento
          </p>
        )}
      </div>
    </div>
  );
} 