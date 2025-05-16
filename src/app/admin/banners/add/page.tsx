'use client';

import AddBannerForm from '@/components/AddBannerForm';
import { useRouter } from 'next/navigation';

export default function AddBannerPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/admin/banners/active');
  };

  return (
    <div className="glass-morphism p-6 rounded-xl">
      <h2 className="text-2xl font-bold text-white mb-6">Adicionar Novo Banner</h2>
      <AddBannerForm onBannerAdded={handleSuccess} />
    </div>
  );
} 