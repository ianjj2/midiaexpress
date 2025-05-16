import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variáveis de ambiente não encontradas:', {
    url: supabaseUrl,
    key: supabaseAnonKey ? '[PRESENTE]' : '[AUSENTE]'
  });
  throw new Error(
    'As variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias'
  );
}

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
);

export type Banner = {
  id: string;
  title: string;
  company: string;
  file_url: string;
  duration: number;
  order_num: number;
  contract_start_date: string;
  contract_end_date: string;
  created_at: string;
  file_type: 'image' | 'video';
  status: 'active' | 'inactive';
}; 