'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuth, clearAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { Calendar, ChevronLeft, Check, Loader2 } from 'lucide-react';

type Cita = {
  id_cita: number;
  fecha_hora: string;
  motivo?: string | null;
};

export default function ReprogramarCitaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [cita, setCita] = useState<Cita | null>(null);
  const [fechaLocal, setFechaLocal] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const auth = getAuth();
      if (!auth?.token) { router.replace('/login'); return; }
      try {
        const data = await apiFetch<Cita>(`/citas/${params.id}`, { token: auth.token });
        setCita(data);
        setMotivo(data.motivo ?? '');
        const dt = data.fecha_hora.replace(' ', 'T').slice(0, 16);
        setFechaLocal(dt);
      } catch {
        clearAuth();
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const auth = getAuth();
    if (!auth?.token || !fechaLocal) return;

    setErr(null); setOk(null); setSaving(true);
    try {
      const iso = new Date(fechaLocal).toISOString();
      const ymdhms = iso.slice(0,19).replace('T',' ');

      await apiFetch(`/citas/${params.id}`, {
        method: 'PUT',
        token: auth.token,
        body: JSON.stringify({ fecha_hora: ymdhms, motivo: motivo || null }),
      });

      setOk('Cita reprogramada correctamente');
      setTimeout(() => router.push(`/citas/${params.id}`), 800);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErr(e?.message ?? 'No se pudo reprogramar');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !cita) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/citas/${cita.id_cita}`)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
            >
              <ChevronLeft size={20} />
              <span className="font-medium">Volver</span>
            </button>
            <div />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-blue-600" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reprogramar cita</h1>
              <p className="text-sm text-gray-600">Actualiza la fecha y el motivo de la cita</p>
            </div>
          </div>
        </div>

        {err && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 shadow-sm">
            {err}
          </div>
        )}
        {ok && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 shadow-sm">
            {ok}
          </div>
        )}

        <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Nueva fecha y hora</label>
            <input
              type="datetime-local"
              value={fechaLocal}
              onChange={(e) => setFechaLocal(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Debe estar libre de conflictos para esta mascota.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Motivo (opcional)</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder="Motivo de la consulta"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center rounded-lg bg-green-500 text-white px-4 py-2 hover:bg-green-600 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Check size={16} className="mr-2" />}
            Guardar cambios
          </button>
        </form>
      </main>
    </div>
  );
}
