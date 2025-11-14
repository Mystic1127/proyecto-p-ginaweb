'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { clearAuth, getAuth, type AuthData } from '@/lib/auth';
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  PawPrint,
  PlusCircle,
  Search,
  Stethoscope,
} from 'lucide-react';

type Mascota = {
  id_mascota: number;
  nombre: string;
  especie?: string | null;
  dueno?: string;
  dueno_ap?: string;
};

type Cita = {
  id_mascota: number;
  mascota_nombre?: string;
  mascota_especie?: string;
  dueno_nombres?: string;
  dueno_apellidos?: string;
  estado: string;
};

export default function NuevaOrdenLabPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ id_mascota: '', tipo_examen: '', observaciones: '' });
  const [submitState, setSubmitState] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });
  const [search, setSearch] = useState('');

  useEffect(() => {
    const a = getAuth();
    if (!a?.token) {
      router.replace('/login');
      return;
    }
    if (!['DUENO', 'VETERINARIO'].includes(a.rol)) {
      router.replace('/lab');
      return;
    }
    setAuth(a);
  }, [router]);

  useEffect(() => {
    if (!auth?.token) return;

    const loadMascotas = async () => {
      setLoading(true);
      setError(null);
      try {
        if (auth.rol === 'DUENO') {
          const data = await apiFetch<Mascota[]>('/mascotas', { token: auth.token });
          const mapped = (Array.isArray(data) ? data : []).map((pet) => ({
            id_mascota: pet.id_mascota,
            nombre: pet.nombre,
            especie: pet.especie,
          }));
          setMascotas(mapped);
        } else {
          const citas = await apiFetch<Cita[]>('/citas', { token: auth.token });
          const unique = new Map<number, Mascota>();
          (Array.isArray(citas) ? citas : [])
            .filter((cita) => ['CONFIRMADA', 'PROGRAMADA', 'ATENDIDA'].includes(cita.estado))
            .forEach((cita) => {
              if (!unique.has(cita.id_mascota)) {
                unique.set(cita.id_mascota, {
                  id_mascota: cita.id_mascota,
                  nombre: cita.mascota_nombre ?? 'Paciente sin nombre',
                  especie: cita.mascota_especie ?? '—',
                  dueno: cita.dueno_nombres,
                  dueno_ap: cita.dueno_apellidos,
                });
              }
            });
          setMascotas(Array.from(unique.values()));
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'No se pudo cargar la información de mascotas');
      } finally {
        setLoading(false);
      }
    };

    loadMascotas();
  }, [auth]);

  const filteredMascotas = useMemo(() => {
    if (!search.trim()) return mascotas;
    const query = search.trim().toLowerCase();
    return mascotas.filter((m) =>
      m.nombre.toLowerCase().includes(query) ||
      (m.especie ?? '').toLowerCase().includes(query) ||
      (m.dueno ?? '').toLowerCase().includes(query) ||
      (m.dueno_ap ?? '').toLowerCase().includes(query)
    );
  }, [mascotas, search]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth?.token) return;

    setSubmitState({ loading: true, error: null });
    try {
      const payload = {
        id_mascota: Number(form.id_mascota),
        tipo_examen: form.tipo_examen,
        observaciones: form.observaciones,
      };

      const result = await apiFetch<{ id_orden: number }>('/lab/orden', {
        token: auth.token,
        method: 'POST',
        body: JSON.stringify(payload),
      });

      router.replace(`/lab/${result.id_orden}`);
    } catch (err) {
      console.error(err);
      setSubmitState({
        loading: false,
        error: err instanceof Error ? err.message : 'No se pudo crear la orden',
      });
    }
  };

  if (!auth) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
              aria-label="Volver"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nueva orden de laboratorio</h1>
              <p className="text-sm text-gray-600">
                Selecciona la mascota y define el examen que realizará el técnico
              </p>
            </div>
          </div>
          <button
            onClick={() => { clearAuth(); router.push('/login'); }}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Datos de la orden</h2>
              <p className="text-sm text-gray-500">
                El laboratorio recibirá esta información para coordinar con el técnico asignado
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-500 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando pacientes disponibles...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-semibold">No se pudieron cargar las mascotas</p>
                <p>{error}</p>
              </div>
            </div>
          ) : mascotas.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-semibold">Aún no hay mascotas disponibles</p>
                <p>
                  Agenda o registra una cita confirmada antes de crear la orden, o verifica que la mascota esté asociada a tu
                  cuenta.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                  Mascota
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={search}
                      onChange={(ev) => setSearch(ev.target.value)}
                      placeholder="Buscar por nombre, especie o dueño"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    required
                    value={form.id_mascota}
                    onChange={(ev) => setForm((prev) => ({ ...prev, id_mascota: ev.target.value }))}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>
                      Selecciona una mascota
                    </option>
                    {filteredMascotas.map((m) => (
                      <option key={m.id_mascota} value={m.id_mascota}>
                        #{m.id_mascota} · {m.nombre} ({m.especie ?? '—'})
                        {m.dueno ? ` – ${m.dueno} ${m.dueno_ap ?? ''}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="text-sm font-medium text-gray-700 flex flex-col gap-1">
                Tipo de examen requerido
                <input
                  required
                  value={form.tipo_examen}
                  onChange={(ev) => setForm((prev) => ({ ...prev, tipo_examen: ev.target.value }))}
                  placeholder="Hemograma completo, perfil bioquímico, coproparasitológico..."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="text-sm font-medium text-gray-700 flex flex-col gap-1">
                Observaciones para el técnico (opcional)
                <textarea
                  value={form.observaciones}
                  onChange={(ev) => setForm((prev) => ({ ...prev, observaciones: ev.target.value }))}
                  placeholder="Instrucciones especiales, ayuno del paciente, precauciones..."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </label>

              {submitState.error && <p className="text-sm text-red-600">{submitState.error}</p>}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitState.loading || !form.id_mascota}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitState.loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Crear orden
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-3 text-blue-800">
          <PawPrint className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-semibold">¿Cómo continúa el flujo?</p>
            <ul className="text-sm list-disc ml-4 space-y-1">
              <li>El técnico verá la orden en su panel y registrará la toma de muestra.</li>
              <li>Luego cargará los resultados y, cuando estén listos, el veterinario validará el informe.</li>
              <li>Una vez validado, el dueño recibirá el PDF con QR y se generará la factura correspondiente.</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
