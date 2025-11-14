'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuth, type AuthData, clearAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Loader2,
  Receipt,
  Search,
} from 'lucide-react';

type Factura = {
  id_factura: number;
  id_dueno: number;
  id_mascota?: number | null;
  id_cita?: number | null;
  id_orden?: number | null;
  fecha_emision: string;
  monto_total?: number | null;
  estado: 'PENDIENTE' | 'PAGADA' | 'ANULADA';
  metodo_pago?: string | null;
  observaciones?: string | null;
};

type StatusFilter = 'TODAS' | Factura['estado'];

function formatCurrency(value?: number | null) {
  if (value == null) return 'S/ 0.00';
  return value.toLocaleString('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  });
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

const estadoStyles: Record<Factura['estado'], string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700 border border-amber-200',
  PAGADA: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  ANULADA: 'bg-rose-100 text-rose-700 border border-rose-200',
};

export default function FacturasPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [status, setStatus] = useState<StatusFilter>('TODAS');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<Factura[]>('/facturas', { token: auth.token });
        if (mounted) {
          setFacturas(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          const message = err instanceof Error ? err.message : 'No se pudieron cargar las facturas';
          setError(message);
          if (/token/i.test(message)) {
            clearAuth();
            router.replace('/login');
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [auth, router]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return facturas.filter((fac) => {
      if (status !== 'TODAS' && fac.estado !== status) return false;
      if (!search) return true;
      const haystack = [
        `#${fac.id_factura}`,
        fac.fecha_emision,
        fac.metodo_pago ?? '',
        fac.observaciones ?? '',
        String(fac.id_cita ?? ''),
        String(fac.id_orden ?? ''),
        String(fac.id_dueno ?? ''),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [facturas, status, query]);

  const resumen = useMemo(() => {
    return facturas.reduce(
      (acc, fac) => {
        acc.total += 1;
        acc.monto += Number(fac.monto_total ?? 0);
        acc[fac.estado] += 1;
        if (fac.estado === 'PENDIENTE') {
          acc.pendienteMonto += Number(fac.monto_total ?? 0);
        }
        return acc;
      },
      {
        total: 0,
        monto: 0,
        PENDIENTE: 0,
        PAGADA: 0,
        ANULADA: 0,
        pendienteMonto: 0,
      }
    );
  }, [facturas]);

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  const isDueno = auth.rol === 'DUENO';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Facturación
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">
              {isDueno ? 'Mis facturas' : 'Gestión de facturas'}
            </h1>
            <p className="text-gray-600 mt-2 max-w-2xl">
              {isDueno
                ? 'Consulta el historial de pagos por tus citas y análisis de laboratorio.'
                : 'Revisa el estado de cobros, genera comprobantes desde citas u órdenes y mantén tu caja al día.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isDueno && (
              <Link
                href="/admin/reportes"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <ArrowRight className="w-4 h-4" />
                Ir a reportes
              </Link>
            )}
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Volver al panel
            </button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Facturas</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{resumen.total}</p>
            <p className="mt-1 text-xs text-gray-500">Registros totales</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Pendientes</p>
            <p className="mt-2 text-2xl font-bold text-amber-900">{resumen.PENDIENTE}</p>
            <p className="mt-1 text-xs text-amber-700">{formatCurrency(resumen.pendienteMonto)}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Pagadas</p>
            <p className="mt-2 text-2xl font-bold text-emerald-900">{resumen.PAGADA}</p>
            <p className="mt-1 text-xs text-emerald-700">Caja acumulada</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-800">Anuladas</p>
            <p className="mt-2 text-2xl font-bold text-rose-900">{resumen.ANULADA}</p>
            <p className="mt-1 text-xs text-rose-700">Registros descartados</p>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por número, notas, método o referencia"
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as StatusFilter)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODAS">Todas</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="PAGADA">Pagadas</option>
                <option value="ANULADA">Anuladas</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Factura</th>
                  <th className="px-4 py-3">Fecha</th>
                  {!isDueno && <th className="px-4 py-3">Dueño</th>}
                  <th className="px-4 py-3">Origen</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3" aria-label="acciones" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={isDueno ? 5 : 6} className="px-4 py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <span>Cargando facturas...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isDueno ? 5 : 6} className="px-4 py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <Calendar className="h-8 w-8 text-gray-400" />
                        <p className="font-medium text-gray-600">No encontramos facturas con esos criterios.</p>
                        {!isDueno && (
                          <p className="text-sm text-gray-500">
                            Verifica si la cita fue atendida o la orden de laboratorio validada para poder generar su comprobante.
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((fac) => (
                    <tr key={fac.id_factura} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">#{fac.id_factura}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(fac.fecha_emision)}</td>
                      {!isDueno && (
                        <td className="px-4 py-3 text-gray-600">ID {fac.id_dueno}</td>
                      )}
                      <td className="px-4 py-3 text-gray-600">
                        {fac.id_cita ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Cita #{fac.id_cita}
                          </span>
                        ) : fac.id_orden ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                            Orden #{fac.id_orden}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            Manual
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${estadoStyles[fac.estado]}`}>
                          <span className="h-2 w-2 rounded-full bg-current" />
                          {fac.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(Number(fac.monto_total ?? 0))}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/facturas/${fac.id_factura}`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          Ver detalle
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
