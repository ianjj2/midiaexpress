"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
  const [banners, setBanners] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: bannersData } = await supabase.from('banners').select('*');
    const { data: devicesData } = await supabase.from('devices').select('*');
    setBanners(bannersData || []);
    setDevices(devicesData || []);
    setLoading(false);
  };

  // Cálculos
  const bannersAtivos = banners.filter((b: any) => b.status === 'active').length;
  const bannersInativos = banners.filter((b: any) => b.status === 'inactive').length;
  const now = Date.now();
  const dispositivosOnline = devices.filter((d: any) => now - new Date(d.last_seen).getTime() < 30 * 1000).length;
  const dispositivosOffline = devices.length - dispositivosOnline;

  // Dados para gráficos
  const bannersPorEmpresa = banners.reduce((acc: any, b: any) => {
    acc[b.company] = (acc[b.company] || 0) + 1;
    return acc;
  }, {});

  const pieData = {
    labels: ['Ativos', 'Inativos'],
    datasets: [
      {
        data: [bannersAtivos, bannersInativos],
        backgroundColor: ['#22c55e', '#f59e42'],
      },
    ],
  };

  const barData = {
    labels: Object.keys(bannersPorEmpresa),
    datasets: [
      {
        label: 'Banners por Empresa',
        data: Object.values(bannersPorEmpresa),
        backgroundColor: '#3b82f6',
      },
    ],
  };

  return (
    <div className="glass-morphism p-6 rounded-xl">
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>
      {loading ? (
        <div className="text-gray-400">Carregando...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-400">{bannersAtivos}</div>
              <div className="text-gray-300 mt-2">Banners Ativos</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-orange-400">{bannersInativos}</div>
              <div className="text-gray-300 mt-2">Banners Inativos</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-400">{dispositivosOnline}</div>
              <div className="text-gray-300 mt-2">Dispositivos Online</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-gray-400">{dispositivosOffline}</div>
              <div className="text-gray-300 mt-2">Dispositivos Offline</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Distribuição de Banners</h3>
              <Pie data={pieData} />
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Banners por Empresa</h3>
              <Bar data={barData} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}