'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Dialog } from '@headlessui/react';

interface User {
  id: string;
  email: string | undefined;
  role: string;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [userRole, setUserRole] = useState('admin');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'visualizador' });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole') || 'admin';
      setUserRole(role);
      if (role !== 'admin') {
        router.push('/admin');
        return;
      }
    }
    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      // Primeiro, deletar o usuário no Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      if (authError) throw authError;

      // Depois, deletar o registro na tabela users
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;
      fetchUsers();
    } catch (err) {
      console.error('Erro ao deletar usuário:', err);
      setError('Erro ao deletar usuário');
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', id);

      if (error) throw error;
      fetchUsers();
    } catch (err) {
      console.error('Erro ao atualizar papel do usuário:', err);
      setError('Erro ao atualizar papel do usuário');
    }
  };

  const handleCreateUser = async () => {
    try {
      // Verificar se o usuário atual é admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Não autorizado');
        return;
      }

      console.log('User metadata:', user.user_metadata);
      console.log('User app metadata:', user.app_metadata);

      // Verificar se o usuário é admin pelos metadados
      if (user.app_metadata?.role !== 'admin') {
        setError('Apenas administradores podem criar usuários');
        return;
      }

      // Criar o usuário usando a API
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário');
      }

      setShowCreateModal(false);
      setNewUser({ email: '', password: '', role: 'visualizador' });
      fetchUsers();
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar usuário');
    }
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
        <h2 className="text-2xl font-bold text-white">Usuários</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          Criar Usuário
        </button>
      </div>
      {error && <div className="error-message mb-4">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th className="pb-3 text-gray-300">Email</th>
              <th className="pb-3 text-gray-300">Papel</th>
              <th className="pb-3 text-gray-300">Data de Criação</th>
              <th className="pb-3 text-gray-300">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-700">
                <td className="py-4 text-gray-300">{user.email}</td>
                <td className="py-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="bg-gray-800 text-white rounded px-2 py-1"
                  >
                    <option value="admin">Admin</option>
                    <option value="operador">Operador</option>
                    <option value="visualizador">Visualizador</option>
                  </select>
                </td>
                <td className="py-4 text-gray-300">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="py-4">
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          <div className="relative bg-gray-900 rounded-xl p-8 w-full max-w-md mx-auto z-10">
            <Dialog.Title className="text-xl font-bold text-white mb-4">Criar Novo Usuário</Dialog.Title>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-gray-800 text-white rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Senha</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-gray-800 text-white rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Papel</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-gray-800 text-white rounded px-3 py-2"
                >
                  <option value="admin">Admin</option>
                  <option value="operador">Operador</option>
                  <option value="visualizador">Visualizador</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="btn">Cancelar</button>
              <button onClick={handleCreateUser} className="btn btn-primary">Criar</button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
} 