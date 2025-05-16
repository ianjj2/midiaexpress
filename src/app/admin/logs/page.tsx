"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Log {
  id: string;
  user_id: string | null;
  device_id: string | null;
  action: string;
  details: any;
  created_at: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole') || 'admin';
    if (userRole !== 'admin' && userRole !== 'operador') {
      router.push('/admin');
      return;
    }
    fetchLogs();
  }, [router]);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase.from('logs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      setError('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-morphism p-6 rounded-xl">
      <h2 className="text-2xl font-bold text-white mb-6">Logs / Auditoria</h2>
      {loading && <div className="text-gray-400">Carregando...</div>}
      {error && <div className="error-message mb-4">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="text-gray-300 border-b border-gray-700">
              <th className="py-2 px-4">Data</th>
              <th className="py-2 px-4">Ação</th>
              <th className="py-2 px-4">Usuário</th>
              <th className="py-2 px-4">Dispositivo</th>
              <th className="py-2 px-4">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                <td className="py-2 px-4 text-gray-400">{new Date(log.created_at).toLocaleString("pt-BR")}</td>
                <td className="py-2 px-4 text-white font-medium">{log.action}</td>
                <td className="py-2 px-4 text-gray-300">{log.user_id || '-'}</td>
                <td className="py-2 px-4 text-gray-300">{log.device_id || '-'}</td>
                <td className="py-2 px-4 text-gray-400">
                  <pre className="whitespace-pre-wrap break-all">{log.details ? JSON.stringify(log.details, null, 2) : '-'}</pre>
                </td>
              </tr>
            ))}
            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">Nenhum log encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 