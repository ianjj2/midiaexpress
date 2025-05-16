"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Banner } from "@/lib/supabase";

export default function EditBannerPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    company: "",
    duration: "",
    contract_start_date: "",
    contract_end_date: "",
  });

  useEffect(() => {
    if (!id) return;
    fetchBanner();
  }, [id]);

  const fetchBanner = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      setError("Erro ao buscar banner");
    } else {
      setBanner(data);
      setForm({
        title: data.title || "",
        company: data.company || "",
        duration: String(data.duration || ""),
        contract_start_date: data.contract_start_date?.slice(0, 10) || "",
        contract_end_date: data.contract_end_date?.slice(0, 10) || "",
      });
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;
    const { error } = await supabase
      .from("banners")
      .update({
        title: form.title,
        company: form.company,
        duration: Number(form.duration),
        contract_start_date: form.contract_start_date,
        contract_end_date: form.contract_end_date,
      })
      .eq("id", id);
    setLoading(false);
    if (error) {
      setError("Erro ao atualizar banner");
    } else {
      await supabase.from('logs').insert([
        {
          user_id: userId,
          action: 'edit_banner',
          details: { banner_id: id, ...form }
        }
      ]);
      router.push("/admin/banners/active");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="loading-spinner w-12 h-12" /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  if (!banner) {
    return <div className="text-gray-400 text-center mt-8">Banner não encontrado.</div>;
  }

  return (
    <div className="glass-morphism p-6 rounded-xl max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Editar Banner</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="form-label">Título do Banner</label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div>
            <label htmlFor="company" className="form-label">Empresa Contratante</label>
            <input
              id="company"
              name="company"
              type="text"
              value={form.company}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="duration" className="form-label">Duração (segundos)</label>
            <input
              id="duration"
              name="duration"
              type="number"
              value={form.duration}
              onChange={handleChange}
              className="form-input"
              min="1"
              required
            />
          </div>
          <div>
            <label htmlFor="contract_start_date" className="form-label">Início do Contrato</label>
            <input
              id="contract_start_date"
              name="contract_start_date"
              type="date"
              value={form.contract_start_date}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div>
            <label htmlFor="contract_end_date" className="form-label">Término do Contrato</label>
            <input
              id="contract_end_date"
              name="contract_end_date"
              type="date"
              value={form.contract_end_date}
              onChange={handleChange}
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
          {loading ? "Salvando..." : "Salvar Alterações"}
        </button>
      </form>
    </div>
  );
} 