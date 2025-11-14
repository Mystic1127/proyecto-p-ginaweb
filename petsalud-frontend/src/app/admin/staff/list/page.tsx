'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import {
  BriefcaseBusiness,
  Plus,
  Search,
  Users,
  Stethoscope,
  FlaskConical,
  ClipboardList,
  AlertCircle,
} from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<StaffRow['rol'] | 'TODOS'>('TODOS');
  const [search, setSearch] = useState('');

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
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const stats = useMemo(() => {
    const base = {
      VETERINARIO: 0,
      TECNICO: 0,
      RECEPCIONISTA: 0,
    } as Record<'VETERINARIO' | 'TECNICO' | 'RECEPCIONISTA', number>;

    return rows.reduce((acc, row) => {
      if (row.rol !== 'ADMIN') {
        acc[row.rol] = (acc[row.rol] || 0) + 1;
      }
      return acc;
    }, base);
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (roleFilter !== 'TODOS' && row.rol !== roleFilter) return false;
      if (!search.trim()) return true;
      const term = search.trim().toLowerCase();
      return (
        row.nombre_usuario.toLowerCase().includes(term) ||
        row.email.toLowerCase().includes(term) ||
        (row.especialidad?.toLowerCase().includes(term) ?? false)
      );
    });
  }, [rows, roleFilter, search]);

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 lg:px-0">
        <div className="flex flex-col gap-4 mb-8">
          <div>
            <p className="text-sm font-medium text-green-600 uppercase tracking-wide">Panel de administración</p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-7 h-7 text-green-600" /> Gestión de personal
              </h1>
              <button
                onClick={() => router.push('/admin/staff/new')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold shadow-sm hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Registrar nuevo
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Consulta el equipo activo de la clínica, filtra por rol y encuentra rápidamente a cada colaborador.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              title="Veterinarios"
              icon={<Stethoscope className="w-5 h-5 text-green-600" />}
              value={stats.VETERINARIO}
              description="Especialistas registrados"
            />
            <SummaryCard
              title="Técnicos"
              icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
              value={stats.TECNICO}
              description="Soporte laboratorio"
            />
            <SummaryCard
              title="Recepcionistas"
              icon={<ClipboardList className="w-5 h-5 text-amber-600" />}
              value={stats.RECEPCIONISTA}
              description="Equipo de atención"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-100 p-6 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <BriefcaseBusiness className="w-5 h-5 text-gray-500" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Listado de colaboradores</h2>
                <p className="text-sm text-gray-500">{filtered.length} de {rows.length} integrantes mostrados</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="flex rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm items-center">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, correo o especialidad"
                  className="ml-2 text-sm flex-1 outline-none"
                />
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1 text-sm font-medium">
                {(['TODOS', 'VETERINARIO', 'TECNICO', 'RECEPCIONISTA'] as const).map((rol) => (
                  <button
                    key={rol}
                    onClick={() => setRoleFilter(rol)}
                    className={`px-3 py-1.5 rounded-md transition-colors ${roleFilter === rol ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {rol === 'TODOS' ? 'Todos' : rol.charAt(0) + rol.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 mb-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-3 px-6 border-b bg-gray-50">Colaborador</th>
                  <th className="py-3 px-6 border-b bg-gray-50">Correo</th>
                  <th className="py-3 px-6 border-b bg-gray-50">Rol</th>
                  <th className="py-3 px-6 border-b bg-gray-50">Especialidad</th>
                  <th className="py-3 px-6 border-b bg-gray-50">Teléfono</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="inline-flex items-center gap-3 text-gray-500 text-sm">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-green-500" />
                        Cargando personal…
                      </div>
                    </td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((r) => (
                    <tr key={`${r.rol}-${r.id_usuario}`} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-4 px-6 border-b">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{r.nombre_usuario}</span>
                          {r.id_veterinario && (
                            <span className="text-xs text-gray-500">ID Vet #{r.id_veterinario}</span>
                          )}
                          {r.id_tecnico && (
                            <span className="text-xs text-gray-500">ID Técnico #{r.id_tecnico}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 border-b text-gray-700">{r.email}</td>
                      <td className="py-4 px-6 border-b">
                        <RoleBadge rol={r.rol} />
                      </td>
                      <td className="py-4 px-6 border-b text-gray-700">{r.especialidad || '—'}</td>
                      <td className="py-4 px-6 border-b text-gray-700">{r.telefono || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-12 px-6 text-center text-gray-500" colSpan={5}>
                      No se encontraron colaboradores con ese criterio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ rol }: { rol: StaffRow['rol'] }) {
  const config: Record<StaffRow['rol'], { label: string; className: string }> = {
    ADMIN: { label: 'Admin', className: 'bg-gray-100 text-gray-700 border border-gray-200' },
    VETERINARIO: { label: 'Veterinario', className: 'bg-green-100 text-green-700 border border-green-200' },
    TECNICO: { label: 'Técnico', className: 'bg-blue-100 text-blue-700 border border-blue-200' },
    RECEPCIONISTA: { label: 'Recepcionista', className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  };

  const { label, className } = config[rol];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}
