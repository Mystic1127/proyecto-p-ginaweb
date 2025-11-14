'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ClipboardList,
  FileText,
  Pill,
  Save,
  Activity,
  Thermometer,
  Weight,
  Calendar,
} from 'lucide-react';

type HistorialDetalle = {
  id_historial: number;
  id_cita: number;
  id_mascota: number;
  diagnostico: string;
  tratamiento?: string | null;
  observaciones?: string | null;
  receta_medica?: string | null;
  examenes_solicitados?: string | null;
  proxima_cita?: string | null;
  peso?: number | null;
  temperatura?: number | null;
  mascota_nombre?: string | null;
  dueno_nombres?: string | null;
  dueno_apellidos?: string | null;
  fecha_cita?: string | null;
};

export default function EditarHistorialPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const mascotaParam = search.get('mascota');

  const [historial, setHistorial] = useState<HistorialDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    diagnostico: '',
    tratamiento: '',
    observaciones: '',
    receta_medica: '',
    examenes_solicitados: '',
    proxima_cita: '',
    peso: '',
    temperatura: '',
  });

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token || auth.rol !== 'VETERINARIO') {
      router.replace('/login');
      return;
    }

    (async () => {
      try {
        const data = await apiFetch<HistorialDetalle>(`/historial/${params.id}`, { token: auth.token });
        setHistorial(data);
        const proxima = data.proxima_cita
          ? (data.proxima_cita.includes('T')
            ? data.proxima_cita.split('T')[0]
            : data.proxima_cita.split(' ')[0])
          : '';

        setForm({
          diagnostico: data.diagnostico ?? '',
          tratamiento: data.tratamiento ?? '',
          observaciones: data.observaciones ?? '',
          receta_medica: data.receta_medica ?? '',
          examenes_solicitados: data.examenes_solicitados ?? '',
          proxima_cita: proxima,
          peso: data.peso != null ? String(data.peso) : '',
          temperatura: data.temperatura != null ? String(data.temperatura) : '',
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo cargar el historial');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, router]);

  const onChange = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const auth = getAuth();
    if (!auth?.token) return;

    if (!form.diagnostico.trim()) {
      setError('El diagnóstico es obligatorio');
      return;
    }

    setPosting(true);
    try {
      await apiFetch(`/historial/${params.id}`, {
        method: 'PUT',
        token: auth.token,
        body: JSON.stringify({
          diagnostico: form.diagnostico,
          tratamiento: form.tratamiento || null,
          observaciones: form.observaciones || null,
          receta_medica: form.receta_medica || null,
          examenes_solicitados: form.examenes_solicitados || null,
          proxima_cita: form.proxima_cita || null,
          peso: form.peso ? parseFloat(form.peso) : null,
          temperatura: form.temperatura ? parseFloat(form.temperatura) : null,
        }),
      });

      setSuccess('Historial actualizado correctamente');
      setTimeout(() => {
        const mascotaDestino = mascotaParam || historial?.id_mascota;
        if (mascotaDestino) {
          router.replace(`/vet/pacientes/${mascotaDestino}`);
        } else {
          router.replace('/vet/pacientes');
        }
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el historial');
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!historial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border rounded-xl p-8 text-center max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Historial no disponible</h3>
          <p className="text-gray-600 mb-6">{error || 'No encontramos la información solicitada.'}</p>
          <button
            onClick={() => router.push('/vet/pacientes')}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Volver a pacientes
          </button>
        </div>
      </div>
    );
  }

  const destino = mascotaParam || historial.id_mascota;
  const fechaCita = historial.fecha_cita ? new Date(historial.fecha_cita.replace(' ', 'T')).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => router.push(destino ? `/vet/pacientes/${destino}` : '/vet/pacientes')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <ChevronLeft size={20} /> <span className="font-medium">Volver al historial</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Editar historial clínico</h1>
            <p className="text-sm text-gray-600">
              Paciente: <span className="font-semibold">{historial.mascota_nombre ?? 'Mascota'}</span>
              {historial.dueno_nombres && (
                <>
                  {' '}• Dueño: <span className="font-semibold">{historial.dueno_nombres} {historial.dueno_apellidos}</span>
                </>
              )}
              {fechaCita && (
                <>
                  {' '}• Consulta del {fechaCita}
                </>
              )}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border px-4 py-3 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-lg bg-green-50 border px-4 py-3 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="text-sm text-green-700">{success}</div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <section className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold">Signos Vitales</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Weight className="inline w-4 h-4 mr-1" />Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.peso}
                  onChange={(e) => onChange('peso', e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Thermometer className="inline w-4 h-4 mr-1" />Temperatura (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.temperatura}
                  onChange={(e) => onChange('temperatura', e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg"
                />
              </div>
            </div>
          </section>

          <section className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold">Diagnóstico *</h2>
            </div>
            <textarea
              required
              rows={4}
              value={form.diagnostico}
              onChange={(e) => onChange('diagnostico', e.target.value)}
              className="w-full px-4 py-3 border rounded-lg resize-none"
            />
          </section>

          <section className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Pill className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold">Tratamiento</h2>
            </div>
            <textarea
              rows={4}
              value={form.tratamiento}
              onChange={(e) => onChange('tratamiento', e.target.value)}
              className="w-full px-4 py-3 border rounded-lg resize-none"
            />
          </section>

          <section className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold">Observaciones</h2>
            </div>
            <textarea
              rows={4}
              value={form.observaciones}
              onChange={(e) => onChange('observaciones', e.target.value)}
              className="w-full px-4 py-3 border rounded-lg resize-none"
            />
          </section>

          <section className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold">Receta médica</h2>
            </div>
            <textarea
              rows={5}
              value={form.receta_medica}
              onChange={(e) => onChange('receta_medica', e.target.value)}
              className="w-full px-4 py-3 border rounded-lg resize-none font-mono text-sm"
            />
          </section>

          <section className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold">Exámenes solicitados</h2>
            </div>
            <textarea
              rows={3}
              value={form.examenes_solicitados}
              onChange={(e) => onChange('examenes_solicitados', e.target.value)}
              className="w-full px-4 py-3 border rounded-lg resize-none"
            />
          </section>

          <section className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold">Próxima cita</h2>
            </div>
            <input
              type="date"
              value={form.proxima_cita}
              onChange={(e) => onChange('proxima_cita', e.target.value)}
              className="w-full md:w-1/2 px-4 py-2.5 border rounded-lg"
            />
          </section>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push(destino ? `/vet/pacientes/${destino}` : '/vet/pacientes')}
              className="flex-1 px-6 py-3 border rounded-lg bg-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={posting || !form.diagnostico.trim()}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {posting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Guardar cambios
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
