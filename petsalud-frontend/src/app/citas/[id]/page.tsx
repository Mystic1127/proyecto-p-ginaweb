'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuth, clearAuth, type AuthData } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { ChevronLeft, Calendar, AlertCircle, XCircle, User, Stethoscope, FileText, Clock, CalendarClock, Receipt, Loader2 } from 'lucide-react';

type Cita = {
  id_cita: number;
  fecha_hora: string;
  estado: 'PROGRAMADA' | 'CONFIRMADA' | 'ATENDIDA' | 'CANCELADA';
  motivo?: string | null;
  mascota_nombre?: string;
  veterinario_usuario?: string;
};

type ActionState = {
  loading: boolean;
  message: string | null;
  error: string | null;
};

export default function CitaDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [cita, setCita] = useState<Cita | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [invoiceState, setInvoiceState] = useState<ActionState>({ loading: false, message: null, error: null });

  const fmt = (s: string) =>
    new Date(s.replace(' ', 'T')).toLocaleString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  async function load(token: string) {
    try {
      const data = await apiFetch<Cita>(`/citas/${params.id}`, { token });
      setCita(data);
    } catch (e) {
      console.error(e);
      clearAuth();
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const stored = getAuth();
    if (!stored?.token) {
      router.replace('/login');
      return;
    }
    setAuth(stored);
  }, [router]);

  useEffect(() => {
    if (!auth?.token) return;
    setLoading(true);
    load(auth.token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token, params.id]);

  async function cancelar() {
    if (!confirm('¿Deseas cancelar esta cita?')) return;
    if (!auth?.token) return;

    setPosting(true);
    setErr(null);
    try {
      await apiFetch(`/citas/${params.id}/cancelar`, {
        method: 'PATCH',
        token: auth.token,
        body: JSON.stringify({ nota: 'Cancelada por el usuario desde la app' }),
      });
      await load(auth.token);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo cancelar la cita';
      setErr(message);
    } finally {
      setPosting(false);
    }
  }

  const handleInvoice = async () => {
    if (!auth?.token) return;
    setInvoiceState({ loading: true, message: null, error: null });
    try {
      await apiFetch(`/facturas/hook/cita/${params.id}`, {
        method: 'POST',
        token: auth.token,
      });
      setInvoiceState({ loading: false, message: 'Factura generada correctamente.', error: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo generar la factura';
      setInvoiceState({ loading: false, message: null, error: message });
    }
  };

  const getStatusStyles = (estado: Cita['estado']) => {
    const map: Record<Cita['estado'], { bg: string; text: string; border: string; icon: string }> = {
      PROGRAMADA: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-600' },
      CONFIRMADA: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: 'text-green-600' },
      ATENDIDA: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: 'text-gray-600' },
      CANCELADA: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-600' },
    };
    return map[estado];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Cargando cita...</p>
        </div>
      </div>
    );
  }

  if (!cita) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center max-w-md w-full shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cita no encontrada</h3>
          <p className="text-gray-600 mb-6">No se pudo encontrar la información de esta cita.</p>
          <button
            onClick={() => router.push('/citas')}
            className="w-full rounded-lg bg-gray-900 text-white px-4 py-2.5 hover:bg-gray-800 transition-colors duration-200"
          >
            Volver a mis citas
          </button>
        </div>
      </div>
    );
  }

  const cancelable = ['PROGRAMADA', 'CONFIRMADA'].includes(cita.estado);
  const isBillingRole = auth?.rol === 'ADMIN' || auth?.rol === 'RECEPCIONISTA';
  const statusStyle = getStatusStyles(cita.estado);

  return (
    <div className="min-h-screen bg-gray-50">
      
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => router.push('/citas')}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
          >
            <ChevronLeft size={20} />
            <span className="font-medium">Volver a mis citas</span>
          </button>

          {cancelable && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/citas/${params.id}/reprogramar`)}
                className="inline-flex items-center rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                <CalendarClock className="w-4 h-4 mr-2" />
                Reprogramar
              </button>

              <button
                onClick={cancelar}
                disabled={posting}
                className="inline-flex items-center rounded-lg bg-red-600 text-white px-4 py-2 hover:bg-red-700 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {posting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Cancelar cita
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {err && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Error al cancelar</p>
              <p className="text-sm text-red-700 mt-1">{err}</p>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-linear-to-r from-blue-50 to-white">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl ${statusStyle.bg} flex items-center justify-center shrink-0`}>
                <Calendar className={`w-7 h-7 ${statusStyle.icon}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">Detalle de Cita</h1>
                  <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} whitespace-nowrap`}>
                    {cita.estado}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={16} />
                  <p className="text-sm font-medium">{fmt(cita.fecha_hora)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mascota</p>
                </div>
                <p className="text-base font-semibold text-gray-900">{cita.mascota_nombre ?? '—'}</p>
              </div>

              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="w-4 h-4 text-gray-500" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Veterinario</p>
                </div>
                <p className="text-base font-semibold text-gray-900">{cita.veterinario_usuario ?? '—'}</p>
              </div>
            </div>

            {cita.motivo && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Motivo de Consulta</p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{cita.motivo}</p>
              </div>
            )}
        </div>

        {!cancelable && (
          <div className="px-6 pb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900">Cita no cancelable</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Esta cita ya no puede ser cancelada debido a su estado actual: <span className="font-semibold">{cita.estado}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {cita.estado === 'ATENDIDA' && isBillingRole && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-900">Generar factura</p>
                <p className="text-xs text-emerald-700">
                  Esta cita fue atendida. Puedes crear la factura desde aquí para registrar el cobro.
                </p>
              </div>
              <button
                onClick={handleInvoice}
                disabled={invoiceState.loading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {invoiceState.loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Receipt className="h-4 w-4" />
                Generar factura
              </button>
            </div>
            {invoiceState.error && (
              <p className="mt-2 text-xs text-red-600">{invoiceState.error}</p>
            )}
            {invoiceState.message && (
              <p className="mt-2 text-xs text-emerald-700">{invoiceState.message}</p>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Calendar className="text-blue-600 shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Información importante</p>
              <p className="text-blue-700">
                Si necesitas realizar cambios en tu cita, por favor contacta con la clínica o gestiona desde la lista de citas.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}