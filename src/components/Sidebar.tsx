'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { HomeIcon, DeviceTabletIcon, PhotoIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline';

interface NavItem {
  label: string;
  href: string;
  icon: JSX.Element;
  badge?: JSX.Element;
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  // Contadores de dispositivos online/offline
  const [onlineCount, setOnlineCount] = useState(0);
  const [offlineCount, setOfflineCount] = useState(0);

  const [userRole, setUserRole] = useState('admin');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('userRole') || 'admin');
    }
  }, []);

  useEffect(() => {
    const fetchDeviceStatus = async () => {
      const { data } = await supabase.from('devices').select('last_seen');
      if (!data) return;
      const now = Date.now();
      const online = data.filter((d: any) => now - new Date(d.last_seen).getTime() < 30 * 1000).length;
      setOnlineCount(online);
      setOfflineCount(data.length - online);
    };
    fetchDeviceStatus();
    const interval = setInterval(fetchDeviceStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: HomeIcon },
    { href: '/admin/devices', label: 'Dispositivos', icon: DeviceTabletIcon },
    { href: '/admin/banners/active', label: 'Banners', icon: PhotoIcon },
    { href: '/admin/logs', label: 'Logs', icon: ClockIcon },
    { href: '/admin/users', label: 'Usuários', icon: UsersIcon },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (userRole === 'admin') return true;
    if (userRole === 'operador') return ['/admin', '/admin/devices', '/admin/banners/active', '/admin/logs'].includes(item.href);
    if (userRole === 'visualizador') return ['/admin', '/admin/devices', '/admin/banners/active'].includes(item.href);
    return false;
  });

  return (
    <div className={`h-screen bg-gray-900 text-white transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {isOpen && <h2 className="text-xl font-bold">Dashboard</h2>}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <svg
            className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-2" />
                  {isOpen && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
} 