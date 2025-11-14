'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { clearAuth, getAuth, type AuthData } from '@/lib/auth';
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  ClipboardList,
  Loader2,
  Printer,
  Receipt,
  Undo2,
} from 'lucide-react';

type FacturaItem = {
  id_detalle?: number;
  descripcion_servicio: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

type FacturaDetail = {
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
  items: FacturaItem[];
};

type ActionState = {
  loading: boolean;
  message: string | null;
  error: string | null;
};

const INITIAL_ACTION: ActionState = { loading: false, message: null, error: null };

const estadoStyles: Record<FacturaDetail['estado'], string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700 border border-amber-200',
  PAGADA: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  ANULADA: 'bg-rose-100 text-rose-700 border border-rose-200',
};

function formatCurrency(value?: number | null) {
  if (value == null) return 'S/ 0.00';
  return Number(value).toLocaleString('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  });
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export default function FacturaDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [factura, setFactura] = useState<FacturaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payState, setPayState] = useState<ActionState>(INITIAL_ACTION);
  const [voidState, setVoidState] = useState<ActionState>(INITIAL_ACTION);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const canManage = auth?.rol === 'ADMIN' || auth?.rol === 'RECEPCIONISTA';

  useEffect(() => {
    const a = getAuth();
    if (!a?.token) {
      router.replace('/login');
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
        const data = await apiFetch<FacturaDetail>(`/facturas/${params.id}`, { token: auth.token });
        if (mounted) setFactura(data);
      } catch (err) {
        console.error(err);
        if (mounted) {
          const message = err instanceof Error ? err.message : 'No se pudo cargar la factura';
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
  }, [auth, params, router]);

  const refresh = async () => {
    if (!auth?.token || !params?.id) return;
    try {
      const data = await apiFetch<FacturaDetail>(`/facturas/${params.id}`, { token: auth.token });
      setFactura(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePay = async (event: FormEvent) => {
    event.preventDefault();
    if (!auth?.token || !params?.id) return;
    setPayState({ loading: true, message: null, error: null });
    try {
      await apiFetch(`/facturas/${params.id}/pagar`, {
        method: 'POST',
        token: auth.token,
        body: JSON.stringify({ metodo_pago: metodoPago }),
      });
      setPayState({ loading: false, message: 'Factura marcada como pagada correctamente.', error: null });
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo marcar como pagada';
      setPayState({ loading: false, message: null, error: message });
    }
  };

  const handleAnnul = async (event: FormEvent) => {
    event.preventDefault();
    if (!auth?.token || !params?.id) return;
    if (!confirm('¿Deseas anular esta factura?')) return;
    setVoidState({ loading: true, message: null, error: null });
    try {
      await apiFetch(`/facturas/${params.id}/anular`, {
        method: 'POST',
        token: auth.token,
        body: JSON.stringify({ observaciones: motivoAnulacion || undefined }),
      });
      setVoidState({ loading: false, message: 'Factura anulada correctamente.', error: null });
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo anular la factura';
      setVoidState({ loading: false, message: null, error: message });
    }
  };

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <Link href="/facturas" className="mb-2 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Regresar
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Factura #{params.id}</h1>
            {factura && (
              <p className="mt-1 text-sm text-gray-600">Emitida el {formatDate(factura.fecha_emision)}</p>
            )}
          </div>
          <Receipt className="h-10 w-10 text-blue-500" />
        </header>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-3 text-sm text-gray-500">Cargando información de la factura...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">No se pudo cargar la factura</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        ) : factura ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Estado actual</p>
                  <span className={`mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${estadoStyles[factura.estado]}`}>
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {factura.estado}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Importe total</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(factura.monto_total)}</p>
                  {factura.metodo_pago && (
                    <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">Método: {factura.metodo_pago}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Referencia</p>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <p>ID dueño: <span className="font-semibold text-gray-900">{factura.id_dueno}</span></p>
                    {factura.id_mascota && <p>ID mascota: <span className="font-semibold text-gray-900">{factura.id_mascota}</span></p>}
                    {factura.id_cita && (
                      <p>Cita asociada: <span className="font-semibold text-gray-900">#{factura.id_cita}</span></p>
                    )}
                    {factura.id_orden && (
                      <p>Orden de laboratorio: <span className="font-semibold text-gray-900">#{factura.id_orden}</span></p>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Observaciones</p>
                  <p className="mt-2 text-sm text-gray-700">
                    {factura.observaciones ? factura.observaciones : '—'}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3 text-gray-900">
                  <ClipboardList className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Detalle de servicios</h2>
                </div>
                <span className="text-sm text-gray-500">{factura.items.length} conceptos</span>
              </header>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-6 py-3">Descripción</th>
                      <th className="px-6 py-3 text-right">Cantidad</th>
                      <th className="px-6 py-3 text-right">Precio unitario</th>
                      <th className="px-6 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {factura.items.map((item, index) => (
                      <tr key={item.id_detalle ?? index} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-900">{item.descripcion_servicio}</td>
                        <td className="px-6 py-3 text-right text-gray-600">{item.cantidad}</td>
                        <td className="px-6 py-3 text-right text-gray-600">{formatCurrency(item.precio_unitario)}</td>
                        <td className="px-6 py-3 text-right font-semibold text-gray-900">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {canManage && factura.estado === 'PENDIENTE' && (
              <section className="grid gap-6 md:grid-cols-2">
                <form onSubmit={handlePay} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                  <div className="flex items-center gap-3 text-emerald-900">
                    <Banknote className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Registrar pago</h3>
                  </div>
                  <p className="mt-2 text-sm text-emerald-800">
                    Confirma el método recibido para cerrar la factura y actualizar los reportes.
                  </p>

                  <label className="mt-4 block text-sm font-medium text-emerald-900" htmlFor="metodo-pago">
                    Método de pago
                  </label>
                  <select
                    id="metodo-pago"
                    value={metodoPago}
                    onChange={(event) => setMetodoPago(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA">Tarjeta</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="YAPE">Yape/Plin</option>
                  </select>

                  {payState.error && <p className="mt-3 text-sm text-emerald-900">{payState.error}</p>}
                  {payState.message && <p className="mt-3 text-sm font-semibold text-emerald-900">{payState.message}</p>}

                  <button
                    type="submit"
                    disabled={payState.loading}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {payState.loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirmar pago
                  </button>
                </form>

                <form onSubmit={handleAnnul} className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
                  <div className="flex items-center gap-3 text-rose-900">
                    <Undo2 className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Anular factura</h3>
                  </div>
                  <p className="mt-2 text-sm text-rose-800">
                    Usa esta opción sólo si hubo un error en la emisión. Se mantendrá un registro con la observación ingresada.
                  </p>

                  <label className="mt-4 block text-sm font-medium text-rose-900" htmlFor="motivo-anulacion">
                    Motivo (opcional)
                  </label>
                  <textarea
                    id="motivo-anulacion"
                    value={motivoAnulacion}
                    onChange={(event) => setMotivoAnulacion(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    rows={3}
                  />

                  {voidState.error && <p className="mt-3 text-sm text-rose-900">{voidState.error}</p>}
                  {voidState.message && <p className="mt-3 text-sm font-semibold text-rose-900">{voidState.message}</p>}

                  <button
                    type="submit"
                    disabled={voidState.loading}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    {voidState.loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Anular factura
                  </button>
                </form>
              </section>
            )}

            {factura.estado === 'PAGADA' && (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="h-5 w-5" />
                  <div>
                    <h3 className="text-lg font-semibold">Factura pagada</h3>
                    <p className="text-sm">Este comprobante ya se encuentra conciliado en la caja.</p>
                  </div>
                </div>
              </section>
            )}

            {factura.estado === 'ANULADA' && (
              <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <h3 className="text-lg font-semibold">Factura anulada</h3>
                    <p className="text-sm">No será considerada en los reportes financieros.</p>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-gray-900">
                  <Printer className="h-5 w-5 text-gray-500" />
                  <h3 className="text-lg font-semibold">Opciones adicionales</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {factura.id_cita && (
                    <Link
                      href={`/citas/${factura.id_cita}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Ver cita
                    </Link>
                  )}
                  {factura.id_orden && (
                    <Link
                      href={`/lab/${factura.id_orden}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Ver orden de laboratorio
                    </Link>
                  )}
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
