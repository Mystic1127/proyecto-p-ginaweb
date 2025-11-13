'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

type StaffRow = {
  id_usuario: number;
  nombre_usuario: string;
  email: string;
  rol: 'RECEPCIONISTA' | 'VETERINARIO' | 'TECNICO' | 'ADMIN';
  id_veterinario?: number | null;
  id_tecnico?: number | null;
  especialidad?: string | null;
  telefono?: string | null;
};

export default function StaffListPage() {
  const router = useRouter();
  const auth = getAuth();
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!auth?.token) { router.replace('/login'); return; }
        if (auth.rol !== 'ADMIN') { router.replace('/dashboard'); return; }

        const [vets, tecs, recs] = await Promise.all([
          apiFetch<StaffRow[]>('/staff/veterinarios',   { token: auth.token }),
          apiFetch<StaffRow[]>('/staff/tecnicos',       { token: auth.token }),
          apiFetch<StaffRow[]>('/staff/recepcionistas', { token: auth.token }), // ✅
        ]);

        setRows([
          ...vets.map(v => ({ ...v, rol: 'VETERINARIO' as const })),
          ...tecs.map(t => ({ ...t, rol: 'TECNICO' as const })),
          ...recs.map(r => ({ ...r, rol: 'RECEPCIONISTA' as const })), // ✅
        ]);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'No se pudo cargar el personal';
        setError(msg);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return (
    <main className="bg-white shadow rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Personal</h1>
        <button
          onClick={() => router.push('/admin/staff/new')}
          className="rounded-lg bg-gray-900 text-white px-3 py-1.5 hover:opacity-90"
        >
          + Crear personal
        </button>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2 border-b">Usuario</th>
              <th className="py-2 border-b">Correo</th>
              <th className="py-2 border-b">Rol</th>
              <th className="py-2 border-b">Especialidad</th>
              <th className="py-2 border-b">Teléfono</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.rol}-${r.id_usuario}`}>
                <td className="py-2 border-b">{r.nombre_usuario}</td>
                <td className="py-2 border-b">{r.email}</td>
                <td className="py-2 border-b">{r.rol}</td>
                <td className="py-2 border-b">{r.especialidad || '—'}</td>
                <td className="py-2 border-b">{r.telefono || '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="py-6 text-center text-gray-500" colSpan={5}>
                  Sin registros aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
