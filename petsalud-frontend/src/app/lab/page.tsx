'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { clearAuth, getAuth } from '@/lib/auth';
import {
  AlertCircle,
  Beaker,
  Filter,
  FlaskConical,
  Loader2,
  Microscope,
  Search,
  TestTube,
} from 'lucide-react';

const ESTADO_LABELS: Record<string, { text: string; color: string; description: string }> = {
  EMITIDA: {
    text: 'Emitida',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    description: 'Pendiente de toma de muestra',
  },
  MUESTRA_TOMADA: {
    text: 'Muestra tomada',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Esperando resultados del laboratorio',
  },
  RESULTADO_REGISTRADO: {
    text: 'Resultado registrado',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    description: 'En revisión por el veterinario',
  },
  VALIDADA: {
    text: 'Validada',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    description: 'Informe aprobado y enviado al dueño',
  },
  ANULADA: {
    text: 'Anulada',
    color: 'bg-red-100 text-red-700 border-red-200',
    description: 'Orden cancelada',
  },
};

const FILTERS: Array<{ value: string; label: string }> = [
  { value: 'todas', label: 'Todas' },
  { value: 'pendientes', label: 'Pendientes' },
  { value: 'muestras', label: 'Muestra tomada' },
  { value: 'resultados', label: 'Resultado cargado' },
  { value: 'validadas', label: 'Validadas' },
];

type LabOrder = {
  id_orden: number;
  id_mascota: number;
  id_veterinario?: number | null;
  id_veterinario_usuario?: number | null;
  tipo_examen: string;
  observaciones?: string | null;
  estado: string;
  creado_en: string;
  nombre_mascota?: string;
  dueno?: string;
  dueno_ap?: string;
};

function useAuthGuard() {
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    if (!auth?.token) {
      router.replace('/login');
    }
  }, [auth?.token, router]);

  return auth;
}

export default function LabOrdersPage() {
  const router = useRouter();
  const auth = useAuthGuard();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [filter, setFilter] = useState(searchParams.get('f') ?? 'todas');

  useEffect(() => {
    if (!auth?.token) return;

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<LabOrder[]>('/lab/ordenes', { token: auth.token });
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'No se pudo cargar la información');
        if (err instanceof Error && /token/i.test(err.message)) {
          clearAuth();
          router.replace('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [auth?.token, router]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        !normalizedSearch ||
        order.tipo_examen.toLowerCase().includes(normalizedSearch) ||
        (order.nombre_mascota?.toLowerCase().includes(normalizedSearch) ?? false) ||
        (order.dueno?.toLowerCase().includes(normalizedSearch) ?? false) ||
        (order.dueno_ap?.toLowerCase().includes(normalizedSearch) ?? false) ||
        String(order.id_orden).includes(normalizedSearch);

      if (!matchesSearch) return false;

      switch (filter) {
        case 'pendientes':
          return ['EMITIDA'].includes(order.estado);
        case 'muestras':
          return order.estado === 'MUESTRA_TOMADA';
        case 'resultados':
          return order.estado === 'RESULTADO_REGISTRADO';
        case 'validadas':
          return order.estado === 'VALIDADA';
        default:
          return true;
      }
    });
  }, [orders, search, filter]);

  const stats = useMemo(() => {
    const base = {
      total: orders.length,
      pendientes: orders.filter((o) => o.estado === 'EMITIDA').length,
      muestras: orders.filter((o) => o.estado === 'MUESTRA_TOMADA').length,
      resultados: orders.filter((o) => o.estado === 'RESULTADO_REGISTRADO').length,
      validadas: orders.filter((o) => o.estado === 'VALIDADA').length,
    };
    return base;
  }, [orders]);

  if (!auth) {
    return null;
  }

  const isCreator = auth.rol === 'DUENO' || auth.rol === 'VETERINARIO';
  const isStaff = ['ADMIN', 'RECEPCIONISTA', 'VETERINARIO', 'TECNICO'].includes(auth.rol);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-linear-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Órdenes de laboratorio</h1>
              <p className="text-sm text-gray-600">Gestiona el circuito de muestras, resultados y validaciones</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Volver al panel
            </button>
            <button
              onClick={() => { clearAuth(); router.push('/login'); }}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <article className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p>
              </div>
              <Beaker className="w-8 h-8 text-blue-500" />
            </div>
          </article>
          <article className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Pendientes</p>
                <p className="mt-2 text-3xl font-semibold text-amber-600">{stats.pendientes}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
          </article>
          <article className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Muestras tomadas</p>
                <p className="mt-2 text-3xl font-semibold text-blue-600">{stats.muestras}</p>
              </div>
              <TestTube className="w-8 h-8 text-blue-500" />
            </div>
          </article>
          <article className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Validadas</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.validadas}</p>
              </div>
              <Microscope className="w-8 h-8 text-emerald-500" />
            </div>
          </article>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-5 border-b border-gray-200 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Explorar órdenes</h2>
                <p className="text-sm text-gray-500">Filtra por estado, paciente o tipo de examen</p>
              </div>
            </div>
            {isCreator && (
              <button
                onClick={() => router.push('/lab/nueva')}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Crear orden
              </button>
            )}
          </div>

          <div className="px-5 py-4 border-b border-gray-200 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_16rem] gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(ev) => setSearch(ev.target.value)}
                placeholder="Buscar por mascota, dueño, tipo de examen o ID"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                type="search"
              />
            </div>
            <div className="flex items-center gap-2 overflow-auto">
              <Filter className="w-4 h-4 text-gray-400" />
              {FILTERS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    filter === opt.value
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="px-5 py-4">
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold">No se pudo cargar las órdenes</p>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando órdenes...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-500 text-sm">
                No encontramos órdenes con los criterios seleccionados.
              </div>
            ) : (
              filtered.map((order) => {
                const badge = ESTADO_LABELS[order.estado] ?? {
                  text: order.estado,
                  color: 'bg-gray-100 text-gray-700 border-gray-200',
                  description: '',
                };

                return (
                  <article
                    key={order.id_orden}
                    className="px-5 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">Orden #{order.id_orden}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${badge.color}`}>
                          {badge.text}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700">
                        {order.tipo_examen} · {order.nombre_mascota ?? 'Mascota sin nombre'}
                      </p>
                      {order.observaciones && (
                        <p className="mt-1 text-xs text-gray-500 line-clamp-1">
                          Observaciones: {order.observaciones}
                        </p>
                      )}
                      {isStaff && (
                        <p className="mt-1 text-xs text-gray-400">
                          {order.dueno ? `Dueño: ${order.dueno} ${order.dueno_ap ?? ''}`.trim() : 'Creada por dueño'}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <div className="text-xs text-gray-500">
                        Registrada el{' '}
                        {new Date(order.creado_en).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <Link
                        href={`/lab/${order.id_orden}`}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
