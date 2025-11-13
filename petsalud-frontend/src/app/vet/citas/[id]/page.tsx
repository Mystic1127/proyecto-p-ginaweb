'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuth, clearAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { 
  ChevronLeft, 
  Calendar, 
  AlertCircle, 
  User, 
  FileText, 
  Clock,
  PawPrint,
  CheckCircle,
  XCircle,
  Activity,
  Phone,
  Mail,
  AlertTriangle
} from 'lucide-react';

type Cita = {
  id_cita: number;
  fecha_hora: string;
  estado: 'PROGRAMADA' | 'CONFIRMADA' | 'ATENDIDA' | 'CANCELADA';
  motivo?: string | null;
  nota_cancel?: string | null;
  mascota_nombre?: string;
  dueno_nombres?: string;
  dueno_apellidos?: string;
  veterinario_usuario?: string;
  fecha_confirmada?: string | null;
  fecha_atendida?: string | null;
  fecha_cancelada?: string | null;
};

export default function VetCitaDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [cita, setCita] = useState<Cita | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fmt = (s: string) =>
    new Date(s.replace(' ', 'T')).toLocaleString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  async function load() {
    const auth = getAuth();
    if (!auth?.token || auth.rol !== 'VETERINARIO') {
      router.replace('/login');
      return;
    }
    try {
      const data = await apiFetch<Cita>(`/citas/${params.id}`, { token: auth.token });
      setCita(data);

      if (data.estado === 'ATENDIDA') {
        const ex = await apiFetch<{exists:boolean}>(`/historial/cita/${params.id}/existe`, { token: auth.token });
        if (!ex.exists) {
          router.replace(`/vet/historial/nuevo?cita=${params.id}`);
        }
      }
    } catch (e) {
      console.error(e);
      clearAuth();
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function confirmarCita() {
    if (!confirm('¿Confirmar esta cita?')) return;
    const auth = getAuth();
    if (!auth?.token) return;

    setPosting(true);
    setErr(null);
    setSuccess(null);
    try {
      await apiFetch(`/citas/${params.id}/confirmar`, {
        method: 'PATCH',
        token: auth.token,
      });
      setSuccess('Cita confirmada exitosamente');
      await load();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'No se pudo confirmar la cita';
      setErr(message);
    } finally {
      setPosting(false);
    }
  }

  async function atenderCita() {
    if (!confirm('¿Marcar esta cita como atendida? Se generará una factura automáticamente.')) return;
    const auth = getAuth();
    if (!auth?.token) return;

    setPosting(true);
    setErr(null);
    setSuccess(null);
    try {
      await apiFetch(`/citas/${params.id}/atender`, { method: 'PATCH', token: auth.token });

      // Redirige directo a registrar historial
      router.replace(`/vet/historial/nuevo?cita=${params.id}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'No se pudo atender la cita';
      setErr(message);
    } finally {
      setPosting(false);
    }
  }

  async function cancelarCita() {
    const nota = prompt('¿Por qué se cancela esta cita? (opcional)');
    if (nota === null) return;
    
    const auth = getAuth();
    if (!auth?.token) return;

    setPosting(true);
    setErr(null);
    setSuccess(null);
    try {
      await apiFetch(`/citas/${params.id}/cancelar`, {
        method: 'PATCH',
        token: auth.token,
        body: JSON.stringify({ nota: nota || 'Cancelada por el veterinario' }),
      });
      setSuccess('Cita cancelada exitosamente');
      await load();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'No se pudo cancelar la cita';
      setErr(message);
    } finally {
      setPosting(false);
    }
  }

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Cargando cita...</p>
        </div>
      </div>
    );
  }

  if (!cita) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center max-w-md w-full shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cita no encontrada</h3>
          <p className="text-gray-600 mb-6">No se pudo encontrar la información de esta cita.</p>
          <button
            onClick={() => router.push('/vet/citas')}
            className="w-full rounded-lg bg-green-600 text-white px-4 py-2.5 hover:bg-green-700 transition-colors"
          >
            Volver a mis citas
          </button>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusStyles(cita.estado);
  const canConfirm = cita.estado === 'PROGRAMADA';
  const canAttend = ['CONFIRMADA', 'PROGRAMADA'].includes(cita.estado);
  const canCancel = ['PROGRAMADA', 'CONFIRMADA'].includes(cita.estado);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => router.push('/vet/citas')}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="font-medium">Volver a mis citas</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {err && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{err}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Éxito</p>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-linear-to-r from-green-50 to-white">
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 rounded-xl ${statusStyle.bg} flex items-center justify-center shrink-0`}>
                <Calendar className={`w-8 h-8 ${statusStyle.icon}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">Consulta Veterinaria</h1>
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
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <PawPrint className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Paciente</p>
                    <h3 className="text-lg font-bold text-gray-900">{cita.mascota_nombre ?? '—'}</h3>
                  </div>
                </div>
                <button 
                  onClick={() => router.push(`/vet/pacientes?buscar=${cita.mascota_nombre}`)}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Ver historial completo →
                </button>
              </div>

              <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Dueño</p>
                    <h3 className="text-lg font-bold text-gray-900">
                      {cita.dueno_nombres} {cita.dueno_apellidos}
                    </h3>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    Contactar por teléfono
                  </p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar correo
                  </p>
                </div>
              </div>
            </div>

            {cita.motivo && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Motivo de Consulta</p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{cita.motivo}</p>
              </div>
            )}

            {cita.estado === 'ATENDIDA' && (
              <div className="px-6 pb-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm text-green-800 mb-3">
                    Esta cita está atendida. Registra el historial clínico.
                  </p>
                  <button
                    onClick={() => router.push(`/vet/historial/nuevo?cita=${params.id}`)}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Registrar historial clínico
                  </button>
                </div>
              </div>
            )}

            {cita.estado === 'CANCELADA' && cita.nota_cancel && (
              <div className="bg-red-50 rounded-xl border border-red-200 p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">Motivo de Cancelación</p>
                </div>
                <p className="text-sm text-red-700">{cita.nota_cancel}</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Timeline de la Cita</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Programada:</span> {fmt(cita.fecha_hora)}
                  </p>
                </div>
                {cita.fecha_confirmada && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Confirmada:</span> {fmt(cita.fecha_confirmada)}
                    </p>
                  </div>
                )}
                {cita.fecha_atendida && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Atendida:</span> {fmt(cita.fecha_atendida)}
                    </p>
                  </div>
                )}
                {cita.fecha_cancelada && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Cancelada:</span> {fmt(cita.fecha_cancelada)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(canConfirm || canAttend || canCancel) && (
            <div className="px-6 pb-6">
              <div className="bg-linear-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-5">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Acciones Disponibles</p>
                <div className="flex flex-wrap gap-3">
                  {canConfirm && (
                    <button
                      onClick={confirmarCita}
                      disabled={posting}
                      className="inline-flex items-center px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {posting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Confirmar Cita
                    </button>
                  )}

                  {canAttend && (
                    <button
                      onClick={atenderCita}
                      disabled={posting}
                      className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {posting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      ) : (
                        <Activity className="w-4 h-4 mr-2" />
                      )}
                      Atender Paciente
                    </button>
                  )}

                  {canCancel && (
                    <button
                      onClick={cancelarCita}
                      disabled={posting}
                      className="inline-flex items-center px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {posting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Cancelar Cita
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {!canConfirm && !canAttend && !canCancel && (
            <div className="px-6 pb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900">No hay acciones disponibles</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Esta cita ya fue {cita.estado.toLowerCase()} y no puede ser modificada.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}