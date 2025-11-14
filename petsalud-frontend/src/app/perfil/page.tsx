'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { clearAuth, getAuth, type AuthData } from '@/lib/auth';
import { AlertCircle, Loader2, Settings, UserCog } from 'lucide-react';

type DuenoProfile = {
  dni?: string | null;
  nombres?: string | null;
  apellidos?: string | null;
  telefono?: string | null;
  email?: string | null;
};

type StaffProfile = {
  nombre_usuario?: string | null;
  email?: string | null;
  especialidad?: string | null;
  telefono?: string | null;
};

type ActionState = {
  loading: boolean;
  error: string | null;
  message: string | null;
};

const INITIAL_ACTION: ActionState = { loading: false, error: null, message: null };

export default function PerfilPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [duenoProfile, setDuenoProfile] = useState<DuenoProfile | null>(null);
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [action, setAction] = useState<ActionState>(INITIAL_ACTION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const a = getAuth();
    if (!a?.token) {
      router.replace('/login');
      return;
    }
    setAuth(a);
  }, [router]);

  useEffect(() => {
    if (!auth?.token) return;
    (async () => {
      try {
        setLoading(true);
        if (auth.rol === 'DUENO') {
          const data = await apiFetch<DuenoProfile>('/duenos/me', { token: auth.token });
          setDuenoProfile(data);
        } else if (auth.rol === 'VETERINARIO' || auth.rol === 'TECNICO') {
          const data = await apiFetch<StaffProfile>('/staff/me', { token: auth.token });
          setStaffProfile(data);
        }
      } catch (err) {
        console.error(err);
        clearAuth();
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [auth, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth?.token) return;

    setAction({ loading: true, error: null, message: null });
    try {
      if (auth.rol === 'DUENO' && duenoProfile) {
        await apiFetch('/duenos/me', {
          method: 'PUT',
          token: auth.token,
          body: JSON.stringify({
            dni: duenoProfile.dni || undefined,
            nombres: duenoProfile.nombres || undefined,
            apellidos: duenoProfile.apellidos || undefined,
            telefono: duenoProfile.telefono || undefined,
          }),
        });
      } else if ((auth.rol === 'VETERINARIO' || auth.rol === 'TECNICO') && staffProfile) {
        await apiFetch('/staff/me', {
          method: 'PUT',
          token: auth.token,
          body: JSON.stringify({
            especialidad: staffProfile.especialidad || undefined,
            telefono: staffProfile.telefono || undefined,
          }),
        });
      }
      setAction({ loading: false, error: null, message: 'Perfil actualizado correctamente.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo actualizar el perfil';
      setAction({ loading: false, error: message, message: null });
    }
  };

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isDueno = auth.rol === 'DUENO';
  const isStaff = auth.rol === 'VETERINARIO' || auth.rol === 'TECNICO';

  if (!isDueno && !isStaff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center text-gray-600">
        <Settings className="h-10 w-10 text-gray-400" />
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">Perfil sin opciones editables</h1>
        <p className="mt-2 max-w-md text-sm">
          Actualmente sólo el personal veterinario/técnico y los dueños cuentan con edición de datos desde la aplicación.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Volver al panel
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
            <UserCog className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Mi perfil</p>
            <h1 className="text-3xl font-bold text-gray-900">Actualiza tu información</h1>
            <p className="mt-2 text-sm text-gray-600">
              Mantén tus datos al día para que el equipo pueda contactarte y personalizar la atención.
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {isDueno && duenoProfile && (
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Nombres</label>
                <input
                  required
                  value={duenoProfile.nombres ?? ''}
                  onChange={(event) => setDuenoProfile((prev) => ({ ...(prev ?? {}), nombres: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Apellidos</label>
                <input
                  required
                  value={duenoProfile.apellidos ?? ''}
                  onChange={(event) => setDuenoProfile((prev) => ({ ...(prev ?? {}), apellidos: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">DNI</label>
                <input
                  value={duenoProfile.dni ?? ''}
                  onChange={(event) => setDuenoProfile((prev) => ({ ...(prev ?? {}), dni: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  value={duenoProfile.telefono ?? ''}
                  onChange={(event) => setDuenoProfile((prev) => ({ ...(prev ?? {}), telefono: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {isStaff && staffProfile && (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Nombre de usuario</label>
                <input
                  value={staffProfile.nombre_usuario ?? ''}
                  disabled
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Correo</label>
                <input
                  value={staffProfile.email ?? ''}
                  disabled
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Especialidad</label>
                <input
                  value={staffProfile.especialidad ?? ''}
                  onChange={(event) => setStaffProfile((prev) => ({ ...(prev ?? {}), especialidad: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  value={staffProfile.telefono ?? ''}
                  onChange={(event) => setStaffProfile((prev) => ({ ...(prev ?? {}), telefono: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {action.error && (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{action.error}</span>
            </div>
          )}

          {action.message && (
            <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {action.message}
            </div>
          )}

          <button
            type="submit"
            disabled={action.loading}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {action.loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar cambios
          </button>
        </form>
      </div>
    </div>
  );
}
