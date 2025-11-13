'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Check, Loader, AlertCircle, Info, PawPrint } from 'lucide-react';
import { getAuth, clearAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

type Pet = {
  id_mascota: number;
  nombre: string;
  especie: string;
  raza?: string | null;
  edad?: number | null;
  sexo: 'MACHO' | 'HEMBRA' | 'INDETERMINADO';
  alergias?: string | null;
  vacunas?: string | null;
};

export default function EditPetPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [form, setForm] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      const auth = getAuth();
      if (!auth?.token) {
        router.replace('/login');
        return;
      }
      try {
        const data = await apiFetch<Pet>(`/mascotas/${params.id}`, { token: auth.token });
        setForm(data);
      } catch (e) {
        console.error(e);
        clearAuth();
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const auth = getAuth();
    if (!auth?.token) return;

    setSaving(true);
    setErr('');
    setMsg('');

    try {
      await apiFetch(`/mascotas/${params.id}`, {
        method: 'PUT',
        token: auth.token,
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          especie: form.especie,
          raza: form.raza || null,
          edad: form.edad ?? null,
          sexo: form.sexo,
          alergias: form.alergias || null,
          vacunas: form.vacunas || null,
        }),
      });

      setMsg('¡Cambios guardados exitosamente!');
      setTimeout(() => router.push(`/mascotas/${params.id}`), 900);
    } catch (e) {
      console.error(e);
      setErr('No se pudieron guardar los cambios. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  const handleChange = (field: keyof Pet, value: unknown) => {
    if (!form) return;
    setForm({ ...form, [field]: value });
  };

  if (loading || !form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/mascotas/${form.id_mascota}`)}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft size={20} />
              <span>Volver al detalle</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <PawPrint size={24} color="white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">Editar Mascota</h1>
                <p className="text-xs text-gray-500">Actualiza la información</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Editando: {form.nombre}</h1>
            <p className="text-sm text-gray-600">Modifica los campos que desees actualizar.</p>
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

          <div className="space-y-6">
            {/* Información Básica */}
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
                    value={form.raza ?? ''}
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
                    value={form.edad ?? ''}
                    onChange={(e) => handleChange('edad', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Ej: 3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Sexo *</label>
                  <select
                    value={form.sexo}
                    onChange={(e) => handleChange('sexo', e.target.value as Pet['sexo'])}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="MACHO">Macho</option>
                    <option value="HEMBRA">Hembra</option>
                    <option value="INDETERMINADO">No especificado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Historial Médico */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial Médico</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Alergias</label>
                  <textarea
                    value={form.alergias ?? ''}
                    onChange={(e) => handleChange('alergias', e.target.value)}
                    placeholder="Describe cualquier alergia conocida (alimentos, medicamentos, etc.)"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ejemplo: Alérgico al pollo, reacción al ibuprofeno
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Vacunas</label>
                  <textarea
                    value={form.vacunas ?? ''}
                    onChange={(e) => handleChange('vacunas', e.target.value)}
                    placeholder="Lista las vacunas que ha recibido"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ejemplo: Rabia (2024), Séxtuple (2023), Antirrábica
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push(`/mascotas/${form.id_mascota}`)}
                className="flex-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <Loader size={16} className="mr-2 animate-spin" />
                    Guardando cambios...
                  </>
                ) : (
                  <>
                    <Check size={16} className="mr-2" />
                    Guardar cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Info size={20} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Recuerda</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Los cambios se guardarán inmediatamente en el sistema</li>
                <li>• Mantén actualizada la información médica para mejores consultas</li>
                <li>• Puedes editar esta información cuantas veces necesites</li>
                <li>• Si tienes dudas, consulta con tu veterinario de confianza</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}