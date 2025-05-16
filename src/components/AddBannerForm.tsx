'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AddBannerFormProps {
  onBannerAdded: () => void;
}

export default function AddBannerForm({ onBannerAdded }: AddBannerFormProps) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState('');
  const [contractStartDate, setContractStartDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Limpa a URL do preview quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Revoga a URL anterior do preview se existir
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!file) {
      setError('Por favor, selecione um arquivo de mídia.');
      return;
    }

    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      setError('Por favor, insira uma duração válida em segundos.');
      return;
    }

    if (!contractStartDate || !contractEndDate) {
      setError('Por favor, preencha as datas do contrato.');
      return;
    }

    if (new Date(contractEndDate) <= new Date(contractStartDate)) {
      setError('A data de término deve ser posterior à data de início.');
      return;
    }

    setLoading(true);

    try {
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}.${fileExt}`;
      const filePath = `${fileName}`;

      // Buscar o maior order_num atual
      const { data: lastBanner } = await supabase
        .from('banners')
        .select('order_num')
        .order('order_num', { ascending: false })
        .limit(1);

      const nextOrder = (lastBanner?.[0]?.order_num || 0) + 1;

      const { error: uploadError, data } = await supabase.storage
        .from('banners')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;

      const { data: bannerData, error: dbError } = await supabase
        .from('banners')
        .insert([
          {
            title,
            company,
            file_url: publicUrl,
            duration: parseInt(duration),
            file_type: file.type.startsWith('video/') ? 'video' : 'image',
            status: 'active',
            order_num: nextOrder,
            contract_start_date: contractStartDate,
            contract_end_date: contractEndDate
          }
        ])
        .select();

      if (dbError) {
        throw dbError;
      }

      // Log de criação de banner
      const banner = bannerData?.[0];
      await supabase.from('logs').insert([
        {
          user_id: userId,
          action: 'add_banner',
          details: { banner_id: banner?.id, title, company }
        }
      ]);

      // Limpa o formulário
      setTitle('');
      setCompany('');
      setFile(null);
      setDuration('');
      setContractStartDate('');
      setContractEndDate('');
      setPreview(null);
      onBannerAdded();

    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload do banner.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fadeIn space-y-6">
      {error && (
        <div className="error-message mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="title" className="form-label">
            Título do Banner
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            placeholder="Digite o título do banner"
            required
          />
        </div>

        <div>
          <label htmlFor="company" className="form-label">
            Empresa Contratante
          </label>
          <input
            id="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="form-input"
            placeholder="Nome da empresa"
            required
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="file" className="form-label">
          Arquivo de Mídia
        </label>
        <div className="file-input-wrapper">
          <label className="file-input-button">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {file ? 'Trocar arquivo' : 'Escolher arquivo'}
            <input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
            />
          </label>
          {file && (
            <p className="mt-2 text-sm text-gray-400">
              Arquivo selecionado: {file.name}
            </p>
          )}
        </div>
      </div>

      {preview && (
        <div className="preview-container mb-4">
          {file?.type.startsWith('video/') ? (
            <video src={preview} className="preview-media" controls />
          ) : (
            <img src={preview} alt="Preview" className="preview-media" />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="duration" className="form-label">
            Duração (segundos)
          </label>
          <input
            id="duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="form-input"
            placeholder="Duração em segundos"
            min="1"
            required
          />
        </div>

        <div>
          <label htmlFor="contractStartDate" className="form-label">
            Início do Contrato
          </label>
          <input
            id="contractStartDate"
            type="date"
            value={contractStartDate}
            onChange={(e) => setContractStartDate(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div>
          <label htmlFor="contractEndDate" className="form-label">
            Término do Contrato
          </label>
          <input
            id="contractEndDate"
            type="date"
            value={contractEndDate}
            onChange={(e) => setContractEndDate(e.target.value)}
            className="form-input"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full mt-6"
      >
        {loading ? (
          <>
            <svg className="loading-spinner" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Enviando...
          </>
        ) : (
          'Adicionar Banner'
        )}
      </button>
    </form>
  );
} 