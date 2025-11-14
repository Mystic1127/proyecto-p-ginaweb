'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getAuth, type AuthData } from '@/lib/auth';
import { AlertCircle, ArrowLeft, Loader2, Save, User } from 'lucide-react';

type DuenoDetail = {
  id_dueno: number;
  id_usuario: number;
  dni?: string | null;
  nombres?: string | null;
  apellidos?: string | null;
  telefono?: string | null;
  email?: string | null;
  nombre_usuario?: string | null;
};

export default function EditarDuenoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [dueno, setDueno] = useState<DuenoDetail | null>(null);
  const [form, setForm] = useState({ dni: '', nombres: '', apellidos: '', telefono: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const a = getAuth();
    if (!a?.token) {
      router.replace('/login');
      return;
    }
    if (!['ADMIN', 'RECEPCIONISTA'].includes(a.rol)) {
      router.replace('/dashboard');
      return;
    }
    setAuth(a);
  }, [router]);

  useEffect(() => {
    if (!auth?.token || !params?.id) return;
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<DuenoDetail>(`/duenos/${params.id}`, { token: auth.token });
        if (mounted) {
          setDueno(data);
          setForm({
            dni: data.dni ?? '',
            nombres: data.nombres ?? '',
            apellidos: data.apellidos ?? '',
            telefono: data.telefono ?? '',
          });
        }
      } catch (err) {
        console.error(err);
        if (mounted) setError(err instanceof Error ? err.message : 'No se pudo cargar el dueño');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [auth, params]);

  const updateField = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth?.token || !params?.id) return;
    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      await apiFetch(`/duenos/${params.id}`, {
        method: 'PUT',
        token: auth.token,
        body: JSON.stringify({
          dni: form.dni || undefined,
          nombres: form.nombres || undefined,
          apellidos: form.apellidos || undefined,
          telefono: form.telefono || undefined,
        }),
      });
      setFeedback('Datos actualizados correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el registro');
    } finally {
      setSaving(false);
    }
  };

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <button
          onClick={() => router.push('/admin/duenos')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al directorio
        </button>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar dueño #{params.id}</h1>
            {dueno?.email && <p className="text-sm text-gray-600">Correo: {dueno.email}</p>}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-gray-500">Cargando información del dueño...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      ) : dueno ? (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">DNI</label>
              <input
                value={form.dni}
                onChange={updateField('dni')}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Teléfono</label>
              <input
                value={form.telefono}
                onChange={updateField('telefono')}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Nombres</label>
              <input
                required
                value={form.nombres}
                onChange={updateField('nombres')}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Apellidos</label>
              <input
                required
                value={form.apellidos}
                onChange={updateField('apellidos')}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {feedback && (
            <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {feedback}
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Guardar cambios
          </button>
        </form>
      ) : null}
    </div>
  );
}
