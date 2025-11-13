'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { ChevronLeft, Save, AlertCircle, CheckCircle, FileText, Activity, Thermometer, Weight, Calendar, Pill, ClipboardList, Stethoscope } from 'lucide-react';

type Cita = {
  id_cita: number;
  id_mascota: number;
  mascota_nombre?: string;
  dueno_nombres?: string;
  dueno_apellidos?: string;
  fecha_hora: string;
};

export default function NuevoHistorialPage() {
  const router = useRouter();
  const params = useSearchParams();
  const idCita = params.get('cita');

  const [cita, setCita] = useState<Cita | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState('');
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

    if (!idCita) {
      setErr('No se especificó una cita');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const data = await apiFetch<Cita>(`/citas/${idCita}`, { token: auth.token });
        setCita(data);
      } catch {
        setErr('No se pudo cargar la información de la cita');
      } finally {
        setLoading(false);
      }
    })();
  }, [router, idCita]);

  const onChange = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setSuccess('');

    const auth = getAuth();
    if (!auth?.token || !cita) return;

    if (!form.diagnostico.trim()) {
      setErr('El diagnóstico es obligatorio');
      return;
    }

    setPosting(true);
    try {
      await apiFetch('/historial', {
        method: 'POST',
        token: auth.token,
        body: JSON.stringify({
          id_cita: cita.id_cita,
          id_mascota: cita.id_mascota,
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

      setSuccess('Historial clínico registrado exitosamente');
      setTimeout(() => router.push(`/vet/pacientes/${cita.id_mascota}`), 1200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo registrar el historial');
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

  if (!cita) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border rounded-xl p-8 text-center max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error al cargar</h3>
          <p className="text-gray-600 mb-6">{err || 'No se encontró la cita'}</p>
          <button onClick={() => router.push('/vet/citas')}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Volver a mis citas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <button onClick={() => router.push(`/vet/citas/${idCita}`)}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
            <ChevronLeft size={20} /> <span className="font-medium">Volver a la cita</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Registrar Historial Clínico</h1>
            <p className="text-sm text-gray-600">
              Paciente: <span className="font-semibold">{cita.mascota_nombre}</span> •
              Dueño: <span className="font-semibold">{cita.dueno_nombres} {cita.dueno_apellidos}</span>
            </p>
          </div>
        </div>

        {/* Alerts */}
        {err && (
          <div className="mb-6 rounded-lg bg-red-50 border px-4 py-3 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div className="text-sm text-red-700">{err}</div>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-lg bg-green-50 border px-4 py-3 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="text-sm text-green-700">{success}</div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold">Signos Vitales</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2"><Weight className="inline w-4 h-4 mr-1" />Peso (kg)</label>
                <input type="number" step="0.01" value={form.peso} onChange={e => onChange('peso', e.target.value)}
                       className="w-full px-4 py-2.5 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><Thermometer className="inline w-4 h-4 mr-1" />Temperatura (°C)</label>
                <input type="number" step="0.1" value={form.temperatura} onChange={e => onChange('temperatura', e.target.value)}
                       className="w-full px-4 py-2.5 border rounded-lg" />
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold">Diagnóstico *</h2>
            </div>
            <textarea required rows={4} value={form.diagnostico} onChange={e => onChange('diagnostico', e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg resize-none" />
          </div>

          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2"><Pill className="w-5 h-5 text-green-600" /><h2 className="text-lg font-semibold">Tratamiento</h2></div>
            <textarea rows={4} value={form.tratamiento} onChange={e => onChange('tratamiento', e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg resize-none" />
          </div>

          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2"><FileText className="w-5 h-5 text-green-600" /><h2 className="text-lg font-semibold">Receta Médica</h2></div>
            <textarea rows={5} value={form.receta_medica} onChange={e => onChange('receta_medica', e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg resize-none font-mono text-sm" />
          </div>

          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2"><ClipboardList className="w-5 h-5 text-green-600" /><h2 className="text-lg font-semibold">Exámenes Solicitados</h2></div>
            <textarea rows={3} value={form.examenes_solicitados} onChange={e => onChange('examenes_solicitados', e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg resize-none" />
          </div>

          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2"><Calendar className="w-5 h-5 text-green-600" /><h2 className="text-lg font-semibold">Próxima Cita</h2></div>
            <input type="date" value={form.proxima_cita} onChange={e => onChange('proxima_cita', e.target.value)}
                   min={new Date().toISOString().split('T')[0]}
                   className="w-full md:w-1/2 px-4 py-2.5 border rounded-lg" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="button" onClick={() => router.push(`/vet/citas/${idCita}`)}
                    className="flex-1 px-6 py-3 border rounded-lg bg-white">Cancelar</button>
            <button type="submit" disabled={posting || !form.diagnostico.trim()}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg disabled:opacity-50 inline-flex items-center justify-center">
              {posting ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              Guardar Historial Clínico
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
