'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getAuth, type AuthData } from '@/lib/auth';
import {
  Activity,
  AlertCircle,
  BarChart3,
  CalendarRange,
  LineChart,
  Loader2,
  TrendingUp,
} from 'lucide-react';

type Ingreso = { ym: string; total: number };

type CitasStats = {
  total: number;
  atendidas: number;
  canceladas: number;
  pct_atendidas: string;
  pct_canceladas: string;
  promedio_minutos_atencion: number;
};

type ServicioTop = { servicio: string; veces: number };

type VentaExamen = { tipo_examen: string; total: number };

export default function ReportesPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [meses, setMeses] = useState(6);
  const [desde, setDesde] = useState('');
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [citas, setCitas] = useState<CitasStats | null>(null);
  const [servicios, setServicios] = useState<ServicioTop[]>([]);
  const [ventas, setVentas] = useState<VentaExamen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const a = getAuth();
    if (!a?.token) {
      router.replace('/login');
      return;
    }
    if (!['ADMIN', 'RECEPCIONISTA', 'VETERINARIO'].includes(a.rol)) {
      router.replace('/dashboard');
      return;
    }
    setAuth(a);
  }, [router]);

  useEffect(() => {
    if (!auth?.token) return;
    (async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (desde) params.set('desde', desde);
      if (meses) params.set('meses', String(meses));
      const query = params.toString() ? `?${params.toString()}` : '';
      try {
        const [ing, cit, top, ven] = await Promise.all([
          apiFetch<Ingreso[]>(`/reportes/ingresos${query}`, { token: auth.token }),
          apiFetch<CitasStats>(`/reportes/citas${query}`, { token: auth.token }),
          apiFetch<ServicioTop[]>(`/reportes/servicios-top${query}`, { token: auth.token }),
          apiFetch<VentaExamen[]>(`/reportes/ventas-examen${query}`, { token: auth.token }),
        ]);
        setIngresos(Array.isArray(ing) ? ing : []);
        setCitas(cit);
        setServicios(Array.isArray(top) ? top : []);
        setVentas(Array.isArray(ven) ? ven : []);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los reportes');
      } finally {
        setLoading(false);
      }
    })();
  }, [auth, meses, desde]);

  const totalIngresos = useMemo(
    () => ingresos.reduce((sum, item) => sum + Number(item.total ?? 0), 0),
    [ingresos]
  );

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Reportes operativos
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Visión de negocio</h1>
            <p className="text-sm text-gray-600 mt-2">
              Analiza el rendimiento de la clínica con datos de ingresos, atención de citas y demanda de servicios.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Volver al panel
          </button>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Meses a analizar</label>
              <select
                value={meses}
                onChange={(event) => setMeses(Number(event.target.value))}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={3}>Últimos 3 meses</option>
                <option value={6}>Últimos 6 meses</option>
                <option value={12}>Últimos 12 meses</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Desde (opcional)</label>
              <input
                type="month"
                value={desde}
                onChange={(event) => setDesde(event.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-500">Si se indica una fecha, se tomará como inicio del periodo.</span>
            </div>
            <div className="flex flex-col justify-end">
              <p className="text-xs uppercase tracking-wide text-gray-500">Ingresos acumulados</p>
              <p className="text-2xl font-semibold text-gray-900">S/ {totalIngresos.toLocaleString('es-PE')}</p>
              <p className="text-xs text-gray-500">Facturas pagadas en el rango seleccionado</p>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-3 text-sm text-gray-500">Generando reportes...</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <header className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-900">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Ingresos mensuales</h2>
                </div>
                <span className="text-sm text-gray-500">{ingresos.length} registros</span>
              </header>
              <div className="mt-4 space-y-3">
                {ingresos.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay facturas pagadas en el periodo seleccionado.</p>
                ) : (
                  ingresos.map((item) => (
                    <div key={item.ym} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.ym}</p>
                        <p className="text-xs text-gray-500">Facturas liquidadas</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">S/ {Number(item.total).toLocaleString('es-PE')}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <header className="flex items-center gap-2 text-gray-900">
                <Activity className="h-5 w-5 text-emerald-500" />
                <h2 className="text-lg font-semibold">Rendimiento de citas</h2>
              </header>
              {citas ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-emerald-800">Atendidas</p>
                    <p className="text-2xl font-semibold text-emerald-900">{citas.atendidas}</p>
                    <p className="text-xs text-emerald-700">{citas.pct_atendidas}% del total</p>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-rose-800">Canceladas</p>
                    <p className="text-2xl font-semibold text-rose-900">{citas.canceladas}</p>
                    <p className="text-xs text-rose-700">{citas.pct_canceladas}% del total</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Total citas</p>
                    <p className="text-2xl font-semibold text-gray-900">{citas.total}</p>
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-blue-800">Promedio de atención</p>
                    <p className="text-2xl font-semibold text-blue-900">{citas.promedio_minutos_atencion} min</p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">No se pudo obtener información de citas.</p>
              )}
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <header className="flex items-center gap-2 text-gray-900">
                <LineChart className="h-5 w-5 text-purple-500" />
                <h2 className="text-lg font-semibold">Servicios más solicitados</h2>
              </header>
              <div className="mt-4 space-y-3">
                {servicios.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay datos para el rango seleccionado.</p>
                ) : (
                  servicios.map((item) => (
                    <div key={item.servicio} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{item.servicio}</p>
                      <span className="text-xs font-semibold text-gray-600">{item.veces} citas</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <header className="flex items-center gap-2 text-gray-900">
                <CalendarRange className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-semibold">Ventas por examen</h2>
              </header>
              <div className="mt-4 space-y-3">
                {ventas.length === 0 ? (
                  <p className="text-sm text-gray-500">No se registraron facturas de análisis en este periodo.</p>
                ) : (
                  ventas.map((item) => (
                    <div key={item.tipo_examen} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{item.tipo_examen}</p>
                      <span className="text-xs font-semibold text-gray-600">S/ {Number(item.total).toLocaleString('es-PE')}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
