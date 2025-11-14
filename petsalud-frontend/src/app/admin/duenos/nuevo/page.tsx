'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getAuth, type AuthData } from '@/lib/auth';
import { AlertCircle, ArrowLeft, Loader2, UserPlus } from 'lucide-react';

type FormState = {
  id_usuario: string;
  dni: string;
  nombres: string;
  apellidos: string;
  telefono: string;
};

const INITIAL_FORM: FormState = {
  id_usuario: '',
  dni: '',
  nombres: '',
  apellidos: '',
  telefono: '',
};

export default function CrearDuenoPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const updateField = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth?.token) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch('/duenos', {
        method: 'POST',
        token: auth.token,
        body: JSON.stringify({
          id_usuario: Number(form.id_usuario),
          dni: form.dni || undefined,
          nombres: form.nombres || undefined,
          apellidos: form.apellidos || undefined,
          telefono: form.telefono || undefined,
        }),
      });
      setSuccess('Perfil de dueño creado correctamente.');
      setForm(INITIAL_FORM);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear el dueño';
      setError(message);
    } finally {
      setLoading(false);
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
      <header>
        <button
          onClick={() => router.push('/admin/duenos')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al directorio
        </button>
        <div className="mt-4 flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Registrar nuevo dueño</h1>
            <p className="mt-1 text-sm text-gray-600">
              Vincula un usuario existente con rol DUENO para habilitar la gestión de mascotas y citas.
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="id-usuario">
              ID de usuario (rol DUENO)
            </label>
            <input
              id="id-usuario"
              type="number"
              required
              value={form.id_usuario}
              onChange={updateField('id_usuario')}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Puedes obtenerlo desde el listado de usuarios o solicitándolo al propio cliente.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="dni">
              DNI
            </label>
            <input
              id="dni"
              value={form.dni}
              onChange={updateField('dni')}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="telefono">
              Teléfono
            </label>
            <input
              id="telefono"
              value={form.telefono}
              onChange={updateField('telefono')}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="nombres">
              Nombres
            </label>
            <input
              id="nombres"
              required
              value={form.nombres}
              onChange={updateField('nombres')}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="apellidos">
              Apellidos
            </label>
            <input
              id="apellidos"
              required
              value={form.apellidos}
              onChange={updateField('apellidos')}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar
        </button>
      </form>
    </div>
  );
}
