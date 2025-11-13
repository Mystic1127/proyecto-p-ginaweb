'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, AlertCircle, Check, Loader, Info, PawPrint } from 'lucide-react';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

export default function NuevaMascotaPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: '',
    especie: '',
    raza: '',
    edad: '',
    sexo: '',
    alergias: '',
    vacunas: '',
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token) router.replace('/login');
  }, [router]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault?.();
    setErr('');
    setMsg('');

    const auth = getAuth();
    if (!auth?.token) {
      setErr('No estás autenticado');
      return;
    }

    try {
      setLoading(true);

      await apiFetch('/mascotas', {
        method: 'POST',
        token: auth.token,
        body: JSON.stringify({
          nombre: form.nombre,
          especie: form.especie,
          raza: form.raza || null,
          edad: form.edad ? parseInt(form.edad) : null,
          sexo: form.sexo,
          alergias: form.alergias || null,
          vacunas: form.vacunas || null,
        }),
      });

      setMsg('¡Mascota registrada exitosamente!');
      setTimeout(() => router.push('/mascotas'), 800);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'No se pudo registrar la mascota';
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft size={20} />
              <span>Volver</span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#22C55E] rounded-lg flex items-center justify-center">
                <PawPrint size={24} color="white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">Nueva Mascota</h1>
                <p className="text-xs text-gray-500">Registra tu mascota</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Información de la Mascota</h1>
            <p className="text-sm text-gray-600">
              Completa los datos de tu mascota para poder agendar citas y llevar su historial médico.
            </p>
          </div>

          {err && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4 flex items-center">
              <AlertCircle size={16} className="mr-2" />
              {err}
            </div>
          )}
          {msg && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg mb-4 flex items-center">
              <Check size={16} className="mr-2" />
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Nombre de la Mascota *</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => handleChange('nombre', e.target.value)}
                    placeholder="Ej: Max, Luna, Rocky"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Especie *</label>
                  <select
                    value={form.especie}
                    onChange={(e) => handleChange('especie', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar especie</option>
                    <option value="Perro">Perro</option>
                    <option value="Gato">Gato</option>
                    <option value="Ave">Ave</option>
                    <option value="Conejo">Conejo</option>
                    <option value="Hamster">Hamster</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Raza (opcional)</label>
                  <input
                    type="text"
                    value={form.raza}
                    onChange={(e) => handleChange('raza', e.target.value)}
                    placeholder="Ej: Golden Retriever, Siamés"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Edad (años)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={form.edad}
                    onChange={(e) => handleChange('edad', e.target.value)}
                    placeholder="Ej: 3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Sexo *</label>
                  <select
                    value={form.sexo}
                    onChange={(e) => handleChange('sexo', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar sexo</option>
                    <option value="MACHO">Macho</option>
                    <option value="HEMBRA">Hembra</option>
                    <option value="INDETERMINADO">No especificado</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial Médico (Opcional)</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Alergias</label>
                  <textarea
                    value={form.alergias}
                    onChange={(e) => handleChange('alergias', e.target.value)}
                    placeholder="Describe cualquier alergia conocida (alimentos, medicamentos, etc.)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ejemplo: Alérgico al pollo, reacción al ibuprofeno
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Vacunas</label>
                  <textarea
                    value={form.vacunas}
                    onChange={(e) => handleChange('vacunas', e.target.value)}
                    placeholder="Lista las vacunas que ha recibido"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ejemplo: Rabia (2024), Séxtuple (2023), Antirrábica
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader size={16} className="mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Check size={16} className="mr-2" />
                    Registrar Mascota
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Info size={20} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Consejos para el registro</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Proporciona la información más completa posible para un mejor seguimiento</li>
                <li>• Las alergias y vacunas son importantes para el tratamiento veterinario</li>
                <li>• Podrás editar esta información en cualquier momento</li>
                <li>• Después del registro podrás agendar citas médicas para tu mascota</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
