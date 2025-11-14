'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getAuth, type AuthData } from '@/lib/auth';
import { AlertCircle, Loader2, Search, User } from 'lucide-react';

type Dueno = {
  id_dueno: number;
  dni?: string | null;
  nombres?: string | null;
  apellidos?: string | null;
  telefono?: string | null;
  id_usuario: number;
  nombre_usuario?: string | null;
  email?: string | null;
  creado_en?: string;
};

export default function DuenosListPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [rows, setRows] = useState<Dueno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

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
    if (!auth?.token) return;
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<Dueno[]>('/duenos', { token: auth.token });
        if (mounted) setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        if (mounted) {
          const msg = err instanceof Error ? err.message : 'No se pudieron cargar los dueños';
          setError(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [auth]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return rows;
    return rows.filter((row) => {
      const haystack = [
        row.dni ?? '',
        row.nombres ?? '',
        row.apellidos ?? '',
        row.telefono ?? '',
        row.email ?? '',
        row.nombre_usuario ?? '',
        String(row.id_dueno),
        String(row.id_usuario),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [rows, query]);

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 flex items-center gap-2">
            <User className="h-4 w-4" />
            Dueños
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Directorio de propietarios</h1>
          <p className="text-sm text-gray-600 mt-2">
            Administra la información de contacto de los clientes y mantén sus datos actualizados para una mejor atención.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push('/admin/duenos/nuevo')}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            + Registrar dueño
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Volver al panel
          </button>
        </div>
      </header>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, DNI, correo o teléfono"
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
          <span className="text-sm text-gray-500">{filtered.length} registros</span>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Dueño</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Usuario asociado</th>
                <th className="px-4 py-3">Creado</th>
                <th className="px-4 py-3" aria-label="acciones" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <span>Cargando dueños...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-gray-500">
                    <p className="font-medium text-gray-600">No encontramos resultados para tu búsqueda.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id_dueno} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      <div>{row.nombres} {row.apellidos}</div>
                      <p className="text-xs text-gray-500">DNI: {row.dni || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{row.telefono || '—'}</div>
                      <div className="text-xs text-gray-500">{row.email || 'Sin correo'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>ID usuario: {row.id_usuario}</div>
                      <div className="text-xs text-gray-500">{row.nombre_usuario || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {row.creado_en ? new Date(row.creado_en).toLocaleDateString('es-PE') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/duenos/${row.id_dueno}`}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
