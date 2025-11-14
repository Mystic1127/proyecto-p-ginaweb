'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, API_URL } from '@/lib/api';
import { clearAuth, getAuth, type AuthData } from '@/lib/auth';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  Microscope,
  TestTube,
} from 'lucide-react';

type LabOrderDetail = {
  id_orden: number;
  id_mascota: number;
  id_veterinario?: number | null;
  tipo_examen: string;
  observaciones?: string | null;
  estado: 'EMITIDA' | 'MUESTRA_TOMADA' | 'RESULTADO_REGISTRADO' | 'VALIDADA' | 'ANULADA';
  creado_en: string;
  nombre_mascota?: string;
};

type ActionState = {
  loading: boolean;
  success: string | null;
  error: string | null;
};

const INITIAL_ACTION_STATE: ActionState = { loading: false, success: null, error: null };

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('es-PE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

function parseValores(raw: string) {
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const entries: Array<[string, string]> = [];

  lines.forEach((line, index) => {
    const separator = line.includes(':') ? ':' : line.includes('=') ? '=' : null;
    if (!separator) {
      entries.push([`Dato ${index + 1}`, line]);
      return;
    }
    const [key, ...rest] = line.split(separator);
    const value = rest.join(separator).trim();
    const cleanKey = key.trim() || `Dato ${index + 1}`;
    entries.push([cleanKey, value]);
  });

  return Object.fromEntries(entries);
}

export default function LabOrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [order, setOrder] = useState<LabOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sampleState, setSampleState] = useState<ActionState>(INITIAL_ACTION_STATE);
  const [resultState, setResultState] = useState<ActionState>(INITIAL_ACTION_STATE);
  const [validateState, setValidateState] = useState<ActionState>(INITIAL_ACTION_STATE);

  const [sampleForm, setSampleForm] = useState({ tipo_muestra: '', fecha_hora: '', notas: '' });
  const [resultForm, setResultForm] = useState({ descripcion: '', valores: '', conclusiones: '' });

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

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<LabOrderDetail>(`/lab/ordenes/${params.id}`, { token: auth.token });
        setOrder(data);
        if (!sampleForm.fecha_hora) {
          const now = new Date().toISOString().slice(0, 16);
          setSampleForm((prev) => ({ ...prev, fecha_hora: now }));
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'No se pudo obtener la orden');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token, params?.id]);

  const refreshOrder = async () => {
    if (!auth?.token || !params?.id) return;
    try {
      const data = await apiFetch<LabOrderDetail>(`/lab/ordenes/${params.id}`, { token: auth.token });
      setOrder(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la orden');
    }
  };

  const isTecnico = auth?.rol === 'TECNICO';
  const isVeterinario = auth?.rol === 'VETERINARIO';
  const isAdmin = auth?.rol === 'ADMIN';
  const canValidate = (isVeterinario || isAdmin) && order?.estado === 'RESULTADO_REGISTRADO';
  const canTakeSample = isTecnico || isVeterinario || isAdmin;
  const canUploadResult = (isTecnico || isAdmin) && order?.estado !== 'VALIDADA' && order?.estado !== 'ANULADA';

  const timeline = useMemo(() => {
    if (!order) return [];
    const steps = [
      {
        key: 'EMITIDA',
        title: 'Orden emitida',
        description: 'Solicitada por el veterinario o el dueño',
      },
      {
        key: 'MUESTRA_TOMADA',
        title: 'Muestra tomada',
        description: 'El técnico registra la toma y datos de la muestra',
      },
      {
        key: 'RESULTADO_REGISTRADO',
        title: 'Resultado cargado',
        description: 'Análisis completado y listo para validación',
      },
      {
        key: 'VALIDADA',
        title: 'Informe validado',
        description: 'El veterinario confirma y se notifica al dueño',
      },
    ];

    return steps.map((step) => ({
      ...step,
      active: step.key === order.estado,
      completed: ['MUESTRA_TOMADA', 'RESULTADO_REGISTRADO', 'VALIDADA'].includes(order.estado)
        ? steps.findIndex((s) => s.key === step.key) <= steps.findIndex((s) => s.key === order.estado)
        : order.estado === 'ANULADA'
          ? false
          : order.estado === 'EMITIDA'
            ? step.key === 'EMITIDA'
            : false,
    }));
  }, [order]);

  const handleSample = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth?.token || !order) return;

    setSampleState({ loading: true, success: null, error: null });
    try {
      const payload = {
        id_orden: order.id_orden,
        tipo_muestra: sampleForm.tipo_muestra,
        fecha_hora: sampleForm.fecha_hora,
        notas: sampleForm.notas,
      };

      await apiFetch('/lab/toma', {
        token: auth.token,
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSampleState({ loading: false, success: 'Toma de muestra registrada correctamente.', error: null });
      await refreshOrder();
    } catch (err) {
      console.error(err);
      setSampleState({
        loading: false,
        success: null,
        error: err instanceof Error ? err.message : 'No se pudo registrar la toma',
      });
    }
  };

  const handleResult = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth?.token || !order) return;

    setResultState({ loading: true, success: null, error: null });
    try {
      const payload = {
        id_orden: order.id_orden,
        descripcion: resultForm.descripcion,
        valores: parseValores(resultForm.valores),
        conclusiones: resultForm.conclusiones,
      };

      await apiFetch('/lab/resultado', {
        token: auth.token,
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setResultState({ loading: false, success: 'Resultado cargado correctamente.', error: null });
      await refreshOrder();
    } catch (err) {
      console.error(err);
      setResultState({
        loading: false,
        success: null,
        error: err instanceof Error ? err.message : 'No se pudo registrar el resultado',
      });
    }
  };

  const handleValidate = async () => {
    if (!auth?.token || !order) return;

    setValidateState({ loading: true, success: null, error: null });
    try {
      await apiFetch('/lab/validar', {
        token: auth.token,
        method: 'POST',
        body: JSON.stringify({ id_orden: order.id_orden }),
      });

      setValidateState({ loading: false, success: 'Informe validado y enviado al dueño.', error: null });
      await refreshOrder();
    } catch (err) {
      console.error(err);
      setValidateState({
        loading: false,
        success: null,
        error: err instanceof Error ? err.message : 'No se pudo validar el informe',
      });
    }
  };

  if (!auth) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/lab')}
              className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
              aria-label="Volver"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Orden #{params?.id}</p>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de laboratorio</h1>
              <p className="text-sm text-gray-600">Coordina la toma de muestra, resultados y validación clínica</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Ir al panel
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 flex items-center justify-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando información de la orden...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold">No fue posible cargar la orden</p>
              <p>{error}</p>
              <button
                onClick={refreshOrder}
                className="mt-3 inline-flex items-center px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : order ? (
          <div className="space-y-6">
            <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Resumen de la orden</h2>
                  <p className="text-sm text-gray-500">{formatDate(order.creado_en)}</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${
                  order.estado === 'EMITIDA'
                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                    : order.estado === 'MUESTRA_TOMADA'
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : order.estado === 'RESULTADO_REGISTRADO'
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : order.estado === 'VALIDADA'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}>
                  Estado: {order.estado.replace('_', ' ')}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Mascota</p>
                  <p className="text-base font-semibold text-gray-900">{order.nombre_mascota ?? 'Sin nombre'}</p>
                  <p className="mt-1 text-sm text-gray-600">ID mascota: {order.id_mascota}</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Examen solicitado</p>
                  <p className="text-base font-semibold text-gray-900">{order.tipo_examen}</p>
                  {order.observaciones && (
                    <p className="mt-1 text-sm text-gray-600">Observaciones: {order.observaciones}</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Estado del flujo</h3>
                <div className="flex flex-col gap-3">
                  {timeline.map((step, index) => (
                    <div key={step.key} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                            step.active
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : step.completed
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                                : 'border-gray-200 bg-white text-gray-400'
                          }`}
                        >
                          {step.key === 'EMITIDA' && <Clock className="w-4 h-4" />}
                          {step.key === 'MUESTRA_TOMADA' && <TestTube className="w-4 h-4" />}
                          {step.key === 'RESULTADO_REGISTRADO' && <Microscope className="w-4 h-4" />}
                          {step.key === 'VALIDADA' && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        {index !== timeline.length - 1 && (
                          <div className="flex-1 w-px bg-gray-200 mt-1" aria-hidden />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                        <p className="text-xs text-gray-500">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {canTakeSample && order.estado === 'EMITIDA' && (
              <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <TestTube className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Registrar toma de muestra</h2>
                    <p className="text-sm text-gray-500">Completa los datos de la muestra asignada al técnico</p>
                  </div>
                </div>
                <form onSubmit={handleSample} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="text-sm font-medium text-gray-700 flex flex-col gap-1">
                      Tipo de muestra
                      <input
                        required
                        value={sampleForm.tipo_muestra}
                        onChange={(ev) => setSampleForm((prev) => ({ ...prev, tipo_muestra: ev.target.value }))}
                        placeholder="Sangre, orina, tejido..."
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                    <label className="text-sm font-medium text-gray-700 flex flex-col gap-1">
                      Fecha y hora de la toma
                      <input
                        required
                        type="datetime-local"
                        value={sampleForm.fecha_hora}
                        onChange={(ev) => setSampleForm((prev) => ({ ...prev, fecha_hora: ev.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                  <label className="text-sm font-medium text-gray-700 flex flex-col gap-1">
                    Notas internas
                    <textarea
                      value={sampleForm.notas}
                      onChange={(ev) => setSampleForm((prev) => ({ ...prev, notas: ev.target.value }))}
                      placeholder="Condiciones de la muestra, contenedores utilizados, observaciones del paciente..."
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </label>
                  {sampleState.error && (
                    <p className="text-sm text-red-600">{sampleState.error}</p>
                  )}
                  {sampleState.success && (
                    <p className="text-sm text-emerald-600">{sampleState.success}</p>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={sampleState.loading}
                      className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                    >
                      {sampleState.loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Guardar toma
                    </button>
                  </div>
                </form>
              </section>
            )}

            {canUploadResult && ['MUESTRA_TOMADA', 'RESULTADO_REGISTRADO'].includes(order.estado) && (
              <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Microscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Cargar resultado</h2>
                    <p className="text-sm text-gray-500">Ingresa los parámetros medidos y la conclusión del análisis</p>
                  </div>
                </div>
                <form onSubmit={handleResult} className="space-y-4">
                  <label className="text-sm font-medium text-gray-700 flex flex-col gap-1">
                    Descripción del procedimiento
                    <textarea
                      required
                      value={resultForm.descripcion}
                      onChange={(ev) => setResultForm((prev) => ({ ...prev, descripcion: ev.target.value }))}
                      placeholder="Resumen del proceso de análisis realizado"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700 flex flex-col gap-1">
                    Valores obtenidos
                    <textarea
                      required
                      value={resultForm.valores}
                      onChange={(ev) => setResultForm((prev) => ({ ...prev, valores: ev.target.value }))}
                      placeholder={`Una línea por parámetro. Ejemplo:\nGlucosa: 95 mg/dL\nHemoglobina: 14 g/dL`}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={4}
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700 flex flex-col gap-1">
                    Conclusiones
                    <textarea
                      required
                      value={resultForm.conclusiones}
                      onChange={(ev) => setResultForm((prev) => ({ ...prev, conclusiones: ev.target.value }))}
                      placeholder="Interpretación clínica y recomendaciones"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                    />
                  </label>
                  {resultState.error && <p className="text-sm text-red-600">{resultState.error}</p>}
                  {resultState.success && <p className="text-sm text-emerald-600">{resultState.success}</p>}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={resultState.loading}
                      className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-60"
                    >
                      {resultState.loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Guardar resultado
                    </button>
                  </div>
                </form>
              </section>
            )}

            {canValidate && (
              <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">Validar resultado</h2>
                    <p className="text-sm text-gray-500">
                      Confirma que el informe está correcto. Automáticamente se notificará al dueño y se generará la factura.
                    </p>
                    {validateState.error && <p className="mt-3 text-sm text-red-600">{validateState.error}</p>}
                    {validateState.success && <p className="mt-3 text-sm text-emerald-600">{validateState.success}</p>}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={handleValidate}
                        disabled={validateState.loading}
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {validateState.loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Validar informe
                      </button>
                      <a
                        href={`${API_URL}/lab/informe/${order.id_orden}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Descargar PDF preliminar
                      </a>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {order.estado === 'VALIDADA' && (
              <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-3 text-emerald-800">
                <CheckCircle2 className="w-5 h-5" />
                <div>
                  <p className="font-semibold">La orden está validada.</p>
                  <p className="text-sm">Puedes descargar el informe con firma digital y QR desde el siguiente enlace.</p>
                  <a
                    href={`${API_URL}/lab/informe/${order.id_orden}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Descargar informe validado
                  </a>
                </div>
              </section>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
