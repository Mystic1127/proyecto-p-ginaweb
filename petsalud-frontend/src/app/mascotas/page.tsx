'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, PawPrint, Plus, Search, Filter, Edit, Trash2, Eye, AlertCircle } from 'lucide-react';
import { getAuth, clearAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

type Pet = {
  id_mascota: number;
  nombre: string;
  especie: string;
  raza?: string | null;
  edad?: number | null;
  sexo: 'MACHO' | 'HEMBRA' | 'INDETERMINADO';
};

export default function ListaMascotasPage() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEspecie, setFilterEspecie] = useState('');

  useEffect(() => {
    (async () => {
      const auth = getAuth();
      if (!auth?.token) {
        router.replace('/login');
        return;
      }
      try {
        const data = await apiFetch<Pet[]>('/mascotas', { token: auth.token });
        setPets(data ?? []);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e: unknown) {
        clearAuth();
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function handleDelete(id: number) {
    if (!confirm('¿Estás seguro de eliminar esta mascota?')) return;
    const auth = getAuth();
    if (!auth?.token) return;

    try {
      await apiFetch(`/mascotas/${id}`, { method: 'DELETE', token: auth.token });
      setPets((prev) => prev.filter((p) => p.id_mascota !== id));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      alert('No se pudo eliminar la mascota');
    }
  }

  const filteredPets = pets.filter((pet) => {
    const matchesSearch =
      pet.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pet.raza && pet.raza.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = !filterEspecie || pet.especie === filterEspecie;
    return matchesSearch && matchesFilter;
  });

  const especies = Array.from(new Set(pets.map((p) => p.especie)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mascotas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft size={20} />
              <span>Volver al Menú</span>
            </button>

            <button
              onClick={() => router.push('/mascotas/nueva')}
              className="inline-flex items-center px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} className="mr-2" />
              Nueva Mascota
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o raza..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filterEspecie}
                onChange={(e) => setFilterEspecie(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Todas las especies</option>
                {especies.map((esp) => (
                  <option key={esp} value={esp}>
                    {esp}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredPets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPets.map((pet) => (
              <div key={pet.id_mascota} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="bg-linear-to-br from-blue-100 to-blue-200 p-6 flex items-center justify-center">
                  <PawPrint size={48} className="text-blue-600" />
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{pet.nombre}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                        {pet.especie}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Raza:</span>
                      <span className="font-medium text-gray-900">{pet.raza || 'No especificada'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Edad:</span>
                      <span className="font-medium text-gray-900">{pet.edad ? `${pet.edad} años` : 'No especificada'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sexo:</span>
                      <span className="font-medium text-gray-900">
                        {pet.sexo === 'MACHO' ? 'Macho' : pet.sexo === 'HEMBRA' ? 'Hembra' : 'No especificado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/mascotas/${pet.id_mascota}`)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center justify-center"
                    >
                      <Eye size={14} className="mr-1" />
                      Ver
                    </button>
                    <button
                      onClick={() => router.push(`/mascotas/${pet.id_mascota}/editar`)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center justify-center"
                    >
                      <Edit size={14} className="mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(pet.id_mascota)}
                      className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            {searchTerm || filterEspecie ? (
              <>
                <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron mascotas</h3>
                <p className="text-gray-600 mb-4">Intenta con otros términos de búsqueda</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterEspecie('');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                <PawPrint size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tienes mascotas registradas</h3>
                <p className="text-gray-600 mb-4">Comienza agregando tu primera mascota</p>
                <button
                  onClick={() => router.push('/mascotas/nueva')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} className="mr-2" />
                  Agregar Mascota
                </button>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
