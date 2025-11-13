'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, clearAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { ChevronLeft, Calendar, PawPrint, Check, Loader, AlertCircle, User, Clock, FileText } from 'lucide-react';

type Pet = {
  id_mascota: number;
  nombre: string;
};

type Vet = {
  id_veterinario: number;
  nombre_usuario: string;
  especialidad?: string | null;
  email?: string;
  telefono?: string | null;
};

export default function NuevaCitaPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [pets, setPets] = useState<Pet[]>([]);
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const initialMascota = params.get('mascota');
  const [form, setForm] = useState({
    id_mascota: initialMascota ? Number(initialMascota) : 0,
    id_veterinario: 0,
    fecha: '',
    hora: '',
    motivo: '',
  });

  const fechaHoraISO = useMemo(() => {
    if (!form.fecha || !form.hora) return null;
    const local = new Date(`${form.fecha}T${form.hora}:00`);
    const iso = new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace('T', ' ');
    return iso;
  }, [form.fecha, form.hora]);

  useEffect(() => {
    (async () => {
      const auth = getAuth();
      if (!auth?.token) {
        router.replace('/login');
        return;
      }
      try {
        const myPets = await apiFetch<Pet[]>('/mascotas', { token: auth.token });
        setPets(myPets ?? []);

        const vetList = await apiFetch<Vet[]>('/staff/vets-public', { token: auth.token });
        setVets(vetList ?? []);
      } catch (e) {
        console.error(e);
        clearAuth();
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const auth = getAuth();
    if (!auth?.token) {
      router.replace('/login');
      return;
    }

    if (!form.id_mascota || !form.id_veterinario || !fechaHoraISO) {
      setErr('Completa mascota, veterinario, fecha y hora.');
      return;
    }

    setPosting(true);
    try {
      await apiFetch('/citas', {
        method: 'POST',
        token: auth.token,
        body: JSON.stringify({
          id_mascota: form.id_mascota,
          id_veterinario: form.id_veterinario,
          fecha_hora: fechaHoraISO,
          motivo: form.motivo || null,
        }),
      });
      setMsg('¡Cita creada correctamente!');
      setTimeout(() => router.push('/citas'), 900);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErr(e?.message ?? 'No se pudo crear la cita');
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Cargando formulario...</p>
        </div>
      </div>
    );
  }

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

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Calendar size={20} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg text-gray-900">Nueva Cita</h1>
                <p className="text-xs text-gray-600">Agenda una atención</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 sm:hidden">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Nueva Cita</h1>
          <p className="text-sm text-gray-600">Agenda una atención para tu mascota</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            {err && (
              <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">Error</p>
                  <p className="text-sm text-red-700 mt-1">{err}</p>
                </div>
              </div>
            )}
            {msg && (
              <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">¡Éxito!</p>
                  <p className="text-sm text-green-700 mt-1">{msg}</p>
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Información Básica</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mascota <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.id_mascota || ''}
                      onChange={(e) => setForm((f) => ({ ...f, id_mascota: Number(e.target.value) }))}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 bg-white text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    >
                      <option value="" disabled>Selecciona una mascota</option>
                      {pets.map((p) => (
                        <option key={p.id_mascota} value={p.id_mascota}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Veterinario <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.id_veterinario || ''}
                      onChange={(e) => setForm((f) => ({ ...f, id_veterinario: Number(e.target.value) }))}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 bg-white text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    >
                      <option value="" disabled>Selecciona un veterinario</option>
                      {vets.map((v) => (
                        <option key={v.id_veterinario} value={v.id_veterinario}>
                          {v.nombre_usuario}{v.especialidad ? ` — ${v.especialidad}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Fecha y Hora</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.fecha}
                      onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={form.hora}
                      onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Motivo de Consulta</h2>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo (opcional)
                  </label>
                  <textarea
                    rows={4}
                    value={form.motivo}
                    onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
                    placeholder="Describe brevemente el motivo de la consulta..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push('/citas')}
                  className="w-full sm:w-auto order-2 sm:order-1 rounded-lg border border-gray-300 px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={posting}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
                >
                  {posting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Creando cita...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Crear cita</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <PawPrint className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Información importante</p>
              <p className="text-blue-700">
                Recibirás confirmación de la cita cuando la clínica la valide. Te notificaremos por correo electrónico.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}